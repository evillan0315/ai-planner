// FilePath: src/api/geminiService.ts
// Title: GeminiService - fetch-based wrapper for generateContent + SSE streaming (optimized)
// Reason: Add convenience streamContent() that targets model-specific :streamGenerateContent?alt=sse endpoint (matches curl example)
//         Fix streaming parser: extract incremental text from Gemini JSON payloads and emit normalized 'chunk' events.

import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { getApiKey } from '@/stores/geminiStore'; // uncomment if you have a store helper to fetch keys
import { getAuthToken, getProviderToken } from '@/stores/authStore'; // optional bearer token helper

import type {
  GenerateContentRequest,
  GenerateContentResponse,
  StreamEvent,
  GenerateOptions,
  ApiError,
} from '@/types/gemini';

type Logger = (message: string, meta?: any) => void;

const API_KEY = `${import.meta.env?.VITE_GEMINI_API_KEY}` || undefined;
const DEFAULT_RETRY = 2;
const DEFAULT_TIMEOUT_MS = 60_000; // 60s

function safeJsonParse<T = any>(text: string): T | null {
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

/** exponential backoff (ms) */
function backoffDelay(attempt: number, base = 300): number {
  return Math.round(base * Math.pow(2, attempt));
}

export interface GeminiServiceConfig {
  baseUrl?: string;
  apiKey?: string;
  axiosInstance?: AxiosInstance;
  defaultTimeoutMs?: number;
  defaultRetries?: number;
  logger?: Logger;
}

/**
 * Small, optimized Gemini/Vertex AI client:
 * - generateContent: axios-based call with retries + timeout
 * - streamGenerateContent: fetch-based SSE stream parsed into typed StreamEvent objects (async generator)
 * - streamContent: convenience wrapper to call model-specific :streamGenerateContent?alt=sse endpoint (matches curl)
 */
export class GeminiService {
  private apiKey?: string;
  private baseUrl: string;
  private axios: AxiosInstance;
  private defaultTimeoutMs: number;
  private defaultRetries: number;
  private logger?: Logger;

  constructor(config: GeminiServiceConfig = {}) {
    // Prefer explicit config, then env hints, then store fallback
    const envBase =
      import.meta.env?.VITE_GEMINI_API_URL &&
      import.meta.env?.VITE_GEMINI_API_MODEL
        ? `${import.meta.env.VITE_GEMINI_API_URL}/${import.meta.env.VITE_GEMINI_API_MODEL}`
        : (import.meta.env?.VITE_GEMINI_API_URL ??
          `/gemini/${import.meta.env.VITE_GEMINI_API_MODEL}`);

    this.baseUrl = (config.baseUrl ?? envBase).replace(/\/$/, '');
    // Key priority: Config > Store > ENV constant
    this.apiKey = config.apiKey ?? getApiKey() ?? API_KEY;
    this.defaultTimeoutMs = config.defaultTimeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.defaultRetries = config.defaultRetries ?? DEFAULT_RETRY;
    this.logger = config.logger;

    this.axios =
      config.axiosInstance ??
      axios.create({
        baseURL: this.baseUrl,
        timeout: this.defaultTimeoutMs,
        headers: {
          'Content-Type': 'application/json',
        },
      });
  }

  private log(msg: string, meta?: any) {
    this.logger?.(msg, meta);
  }

  private buildHeaders(
    extra?: Record<string, string | undefined>,
  ): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };

    // 1. Determine API Key (Preference: extra > instance config > store getter)
    const effectiveApiKey =
      extra?.['x-goog-api-key'] ?? this.apiKey ?? getApiKey();
    if (effectiveApiKey) {
      headers['x-goog-api-key'] = effectiveApiKey;
    }

    // Copy any other extras
    if (extra) {
      for (const [k, v] of Object.entries(extra)) {
        if (!v) continue;
        const lowerK = k.toLowerCase();
        if (
          lowerK === 'authorization' ||
          lowerK === 'x-goog-api-key' ||
          lowerK === 'content-type' ||
          lowerK === 'accept'
        )
          continue;
        headers[k] = v;
      }
    }

    return headers;
  }

  /** Generic typed wrapper for non-streaming POST with retries/backoff using axios */
  public async generateContent(
    endpointPath: string,
    body: GenerateContentRequest,
    options?: GenerateOptions & { retries?: number; timeoutMs?: number },
  ): Promise<GenerateContentResponse> {
    const retries = options?.retries ?? this.defaultRetries;
    const timeoutMs = options?.timeoutMs ?? this.defaultTimeoutMs;
    const headers = this.buildHeaders(options?.headers);

    const fullUrl = endpointPath.startsWith('http')
      ? endpointPath
      : `${this.baseUrl.replace(/\/$/, '')}${endpointPath.replace(/^\//, '')}`;
    console.log(fullUrl, body);
    let lastError: any = null;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const axiosConfig: AxiosRequestConfig = {
          method: 'POST',
          url: fullUrl,
          headers,
          timeout: timeoutMs,
          data: body,
          signal: options?.signal as any, // axios v1 supports AbortSignal
        };

        this.log('generateContent: request', { url: fullUrl, attempt });

        const resp = await this.axios.request(axiosConfig);

        // Successful response
        const data = resp.data as GenerateContentResponse;
        return data;
      } catch (err: any) {
        lastError = err;
        // If abort, rethrow immediately
        if (
          err?.name === 'CanceledError' ||
          err?.code === 'ERR_CANCELED' ||
          (err?.message && /aborted/i.test(err.message))
        ) {
          this.log('generateContent: aborted', { attempt });
          throw {
            code: 499,
            message: 'Request aborted',
            details: err,
          } as ApiError;
        }

        // If last attempt, throw detailed ApiError
        if (attempt === retries) {
          const status = err?.response?.status ?? err?.status ?? 500;
          const text = err?.response?.data ?? err?.message ?? String(err);
          let parsed = safeJsonParse(text as string) ?? text;
          const apiErr: ApiError = {
            code: status,
            message:
              parsed?.message ??
              (typeof parsed === 'string' ? parsed : 'Unknown error'),
            details: parsed,
          };
          this.log('generateContent: failed', { apiErr, attempt });
          throw apiErr;
        }

        // else wait and retry
        const delay = backoffDelay(attempt);
        this.log('generateContent: transient error, retrying', {
          attempt,
          delay,
          err: String(err?.message ?? err),
        });
        await new Promise((res) => setTimeout(res, delay));
      }
    }

    // unreachable but typed
    throw lastError ?? { message: 'Unexpected error' };
  }

  /**
   * Attempt to extract incremental text from known Gemini/Vertex response shapes.
   * Returns concatenated string if any text fragments are found, otherwise null.
   */
  private extractTextFromPayload(parsed: any): string | null {
    try {
      // 1) Common shape: { candidates: [{ content: { parts: [{ text: '...' }] } }] }
      if (parsed?.candidates && Array.isArray(parsed.candidates)) {
        const texts: string[] = [];
        for (const cand of parsed.candidates) {
          const content = cand?.content ?? cand;
          const parts =
            content?.parts ?? (Array.isArray(content) ? content : undefined);
          if (Array.isArray(parts)) {
            for (const p of parts) {
              if (typeof p?.text === 'string' && p.text) texts.push(p.text);
            }
          } else if (typeof content?.text === 'string' && content.text) {
            texts.push(content.text);
          }
        }
        if (texts.length) return texts.join('');
      }

      // 2) variant: { response: { candidates: [...] } }
      if (
        parsed?.response?.candidates &&
        Array.isArray(parsed.response.candidates)
      ) {
        const texts: string[] = [];
        for (const cand of parsed.response.candidates) {
          const parts = cand?.content?.parts ?? cand?.content;
          if (Array.isArray(parts)) {
            for (const p of parts) {
              if (typeof p?.text === 'string' && p.text) texts.push(p.text);
            }
          }
        }
        if (texts.length) return texts.join('');
      }

      // 3) Vertex-like: { output: [{ content: [{ parts: [{ text: '...' }] }] }] }
      if (Array.isArray(parsed?.output)) {
        const texts: string[] = [];
        for (const out of parsed.output) {
          const contentArr = out?.content;
          if (Array.isArray(contentArr)) {
            for (const c of contentArr) {
              const parts = c?.parts;
              if (Array.isArray(parts)) {
                for (const p of parts) {
                  if (typeof p?.text === 'string' && p.text) texts.push(p.text);
                }
              }
            }
          }
        }
        if (texts.length) return texts.join('');
      }

      // 4) direct text field
      if (typeof parsed?.text === 'string' && parsed.text.trim()) {
        return parsed.text;
      }

      return null;
    } catch {
      return null;
    }
  }

  /**
   * Stream generateContent: returns an async generator yielding parsed StreamEvent objects.
   *
   * Implementation notes:
   * - Uses native fetch for streaming (SSE / text/event-stream).
   * - Accepts AbortSignal via options.signal. Cancelling the signal will stop the generator.
   *
   * This implementation normalizes Gemini JSON payloads into 'chunk' events when text can be extracted.
   */
  public async *streamGenerateContent(
    endpointPath: string,
    body: GenerateContentRequest,
    options?: GenerateOptions & { timeoutMs?: number; fetch?: typeof fetch },
  ): AsyncGenerator<StreamEvent, void, unknown> {
    const service = this; // Capture 'this' for use in nested generator

    const headers = this.buildHeaders({
      ...(options?.headers as Record<string, string> | undefined),
      Accept: 'text/event-stream',
    });

    const fullUrl = endpointPath.startsWith('http')
      ? endpointPath
      : `${this.baseUrl.replace(/\/$/, '')}${endpointPath.replace(/^\//, '')}`;

    const controller = new AbortController();
    const userSignal = options?.signal;
    const onAbort = () => controller.abort();

    let resp: Response;
    try {
      resp = await (options?.fetch ?? fetch)(fullUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
        signal: controller.signal,
      });
    } catch (err: any) {
      if (controller.signal.aborted)
        throw {
          code: 499,
          message: 'Stream aborted by caller',
          details: err,
        } as ApiError;
      throw {
        code: 0,
        message: 'Network error opening stream',
        details: err,
      } as ApiError;
    } finally {
      if (userSignal) {
        try {
          userSignal.removeEventListener('abort', onAbort);
        } catch {}
      }
    }

    if (!resp.ok) {
      const text = await resp.text().catch(() => '');
      const parsed = safeJsonParse(text) ?? text;
      throw {
        code: resp.status,
        message: parsed?.message ?? resp.statusText,
        details: parsed,
      } as ApiError;
    }

    if (!resp.body) return;

    const reader = resp.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    const consumeBuffer = async function* () {
      while (true) {
        const idx = buffer.indexOf('\n\n');
        if (idx === -1) break;
        const rawEvent = buffer.slice(0, idx);
        buffer = buffer.slice(idx + 2);
        const lines = rawEvent.split(/\n/);
        let dataLines: string[] = [];
        let eventType: string | undefined;
        let id: string | undefined;

        for (const rawLine of lines) {
          const line = rawLine.replace(/\r$/, '');
          if (line.startsWith('data:')) dataLines.push(line.slice(5));
          else if (line.startsWith('event:')) eventType = line.slice(6).trim();
          else if (line.startsWith('id:')) id = line.slice(3).trim();
        }

        const dataStr = dataLines.join('\n').trim();
        if (!dataStr) continue;

        if (dataStr === '[DONE]') {
          yield { type: 'end' } as StreamEvent;
          continue;
        }

        const parsed = safeJsonParse<any>(dataStr);

        if (parsed && typeof parsed === 'object') {
          const extractedText = service.extractTextFromPayload(parsed); // FIXED: Used captured service instance 'service'
          // Emit as normalized chunk if text exists
          if (extractedText) {
            yield {
              type: 'chunk',
              chunk: { delta: extractedText },
              eventId: id,
            } as StreamEvent;
          } else {
            // If no text, it might be a function call, usage metadata, or an error.
            // Yield the raw parsed object if it's not empty, ensuring eventId linkage.
            if (id && !parsed.eventId) parsed.eventId = id;
            if (Object.keys(parsed).length > 0) {
              yield parsed as StreamEvent;
            }
          }
        } else {
          // fallback: non-JSON chunk
          yield {
            type: (eventType as any) ?? 'chunk',
            chunk: { delta: dataStr },
            eventId: id,
          } as StreamEvent;
        }
      }
    };

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          for await (const ev of consumeBuffer()) yield ev;
          break;
        }

        buffer += decoder.decode(value, { stream: true });

        for await (const ev of consumeBuffer()) yield ev;
      }
    } finally {
      try {
        reader.cancel?.();
      } catch {}
    }
  }

  /**
   * Convenience wrapper to stream content generation for the configured model.
   * Uses the standard endpoint path `:streamGenerateContent?alt=sse`.
   */
  public async *streamContent(
    body: GenerateContentRequest,
    options?: GenerateOptions,
  ): AsyncGenerator<StreamEvent, void, unknown> {
    const endpointPath = `:streamGenerateContent?alt=sse`;
    yield* this.streamGenerateContent(endpointPath, body, options);
  }
}
/**
 * Singleton instance of the GeminiService initialized with global settings.
 * Consumers should import and use this instance directly.
 */
export const geminiService = new GeminiService({});
