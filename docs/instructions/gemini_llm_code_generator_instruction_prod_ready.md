Produce a complete, production-grade **React + TypeScript** project (multi-file) that implements client and optional server proxy support for the Google Gemini *content generation* API. The implementation must support both the non-streaming REST `generateContent` endpoint and the SSE streaming `streamGenerateContent` endpoint, and must provide clear, typed developer APIs for the following content types:

* **Text** (content/text generation)
* **Imagen** (image generation)
* **Veo** (video generation)
* **Lyria** (music generation) — optional, include stubs and docs if implementation is partial

Deliverables must be immediately buildable and testable. Follow these constraints, file layout, and behavior requirements exactly.

### High-level goals

1. Provide a typed, ergonomic client library for browser use (hooks + low-level client class) that supports:

   * Making synchronous REST generation requests (waits for full result).
   * Receiving streaming partial results via SSE (server-sent events) and exposing them incrementally to React UI.
   * Automatic retry/backoff for transient errors (network failures, HTTP 5xx, 429).
   * Secure usage patterns (do **not** embed API keys in client bundles — show proxy/SSR options).
2. Provide an **optional** small Node/Express proxy example that safely stores the API key server-side and forwards client requests to Google Gemini endpoints.
3. Include robust parsing logic for all content types and for common response shapes; implement helpers to decode image/video/music bytes, detect mime types, and optionally prompt downloads in the browser.
4. Include unit tests (Jest + React Testing Library), a demo page (App.tsx), and clear README docs including environment variables and security guidance.

### Hard requirements (must be enforced)

* Language: **TypeScript**. React must use function components + hooks. No use of `any` except in narrow, documented escape hatches.
* Networking:

  * Browser client must use the native `fetch` API and the browser EventSource or a thin SSE parser for streaming.
  * Server proxy (Node) example may use `node-fetch` or `axios` consistently.
* Retry/backoff:

  * Implement `retryWithBackoff` shared utility using **exponential backoff + jitter**. Default env-configurable values:

    * `REACT_APP_GEMINI_RETRY_MAX_ATTEMPTS` (default 4)
    * `REACT_APP_GEMINI_RETRY_BASE_MS` (default 500)
    * `REACT_APP_GEMINI_RETRY_JITTER_FACTOR` (default 0.2)
  * For server environment use non-`REACT_APP_` names (`GEMINI_RETRY_MAX_ATTEMPTS`, etc.).
  * Retry on network errors, HTTP 5xx, and 429. Do **not** retry on 4xx other than 429.
  * Backoff formula: `delay = baseDelayMs * 2^(attempt-1)` then add jitter in range `[-jitterFactor*delay, +jitterFactor*delay]` (document chosen jitter variant).
  * Log each attempt with attempt number, computed delay, and outcome.
* Auth:

  * Server: accept `GOOGLE_GEMINI_API_KEY` environment variable and forward it as `x-goog-api-key`.
  * Client: default to `proxy` mode and show how to configure `mode: "proxy" | "server" | "direct"`. Warn strongly in README to **never** ship API keys in client bundles.
* API endpoints:

  * REST generate: `POST ${GOOGLE_GEMINI_ENDPOINT || 'https://generativelanguage.googleapis.com/v1beta'}/models/${model}:predict` or the documented content endpoint for your chosen model family; include proper `Content-Type: application/json`.
  * Streaming SSE: `POST` (or appropriate SSE URL) to the streaming endpoint, and parse SSE frames into structured partial events that the hook returns.
* Parsing:

  * Implement `parseContentResponse` that robustly traverses multiple possible response shapes for each content type:

    * Text: `outputText`, `candidates[]`, `content`, etc.
    * Imagen: `generatedImages[].image.imageBytes`, `predictions[].imageBytes`, `outputs[].content` (base64), etc.
    * Veo: `outputs[].videoBytes` or references/URLs — support base64 and signed URLs.
    * Lyria: `audioBytes`, `outputs[].content`.
  * Auto-detect MIME types via leading base64 signatures: PNG (`iVBOR`), JPEG (`/9j/`), MP4 signature if available, audio signatures (if feasible). Return normalized array of `{ kind: 'text'|'image'|'video'|'audio', base64?: string, mime?: string, url?: string, partial?: boolean, sourcePath: string }`.
* Public API:

  * Provide a low-level `GeminiClient` class with methods:

    * `generateContent(request: GenerateRequest): Promise<GenerateResponse>`
    * `streamGenerateContent(request: GenerateRequest, onEvent: (event) => void, options?): AbortController`
    * `postWithRetry(url, init, opts)`
    * `parseContentResponse(raw)`
  * Provide a high-level React hook `useGeminiContent()` that exposes:

    * `generate(request)` returns a Promise of full response
    * `stream(request)` starts streaming and returns `{ controller, events }` or exposes events through a callback and state
    * `status` union: `idle | loading | streaming | success | error`
    * `events` array for streaming partial events
    * `error`
* Demo UI:

  * `GeminiForm` component supporting selecting content type (text/image/video/audio), entering prompt, sampleCount, and streaming toggle. Display incremental streaming results in the UI.
  * `ContentPreview` component that renders text progressively, shows image thumbnails as they arrive, and shows a playable video or audio element when media is available.
* Testing:

  * Unit tests (Jest) for `retryWithBackoff`, `parseContentResponse` for multiple shapes, `GeminiClient.generateContent` retry behavior (mock `fetch`), and the hook streaming behavior (use `msw` or mock EventSource).
  * React Testing Library tests for the demo form (simulate streaming partial events).
* Documentation:

  * `README.md` with quickstart, env vars, security guidance (explicitly state “do not embed API keys in client bundles”), sample requests/responses, and how streaming works (SSE frame format).
  * Provide `EXAMPLE_PROXY.md` showing how to deploy the Express proxy to a small Node host (Heroku/Vercel serverless function example).
* File metadata header:

  * Every generated source file must begin with a metadata comment block at the very top with this exact format:

    ```
    FilePath: <src/... or server/...>
    Title: <short description>
    Reason: <why this file exists>
    ```
  * The code generator must output each file as a separate code block and include that header inside each block. Do not output extra explanatory text outside the code blocks for files.

### Required project file layout (generate these exact files unless you provide a reasoned alternative)

**Client / React app**

* `src/api/geminiClient.ts` — `GeminiClient` low-level class, `postWithRetry`, SSE parsing logic, `parseContentResponse`, `decodeBase64ToBlob`, `downloadContent`.
* `src/hooks/useGeminiContent.ts` — high-level hook implementing generate + streaming, state management for events, abort handling.
* `src/components/GeminiForm.tsx` — demo form for prompt, sampleCount, contentType, streaming toggle.
* `src/components/ContentPreview.tsx` — renders progressive text, image grid, video/audio players, download buttons.
* `src/types/gemini.d.ts` — typed request/response DTOs and union types for events.
* `src/utils/retry.ts` — `retryWithBackoff` utility used by both client and server proxy.
* `src/App.tsx` — demo wiring showing the form and preview.
* `src/index.tsx` — bootstrap.
* `public/index.html`
* `package.json`, `tsconfig.json`, `.eslintrc`, `.gitignore`, `README.md`

**Server proxy (example, required)**

* `server/src/proxy.ts` — Express app with `POST /api/gemini/generate` and `POST /api/gemini/stream` that forwards requests to Gemini with `x-goog-api-key`, applying the same retry/backoff logic server-side. For streaming proxy, stream SSE frames to the client transparently.
* `server/package.json`, `server/tsconfig.json`, `server/README.md`

**Tests**

* `src/__tests__/retry.spec.ts` — test jitter/backoff arithmetic.
* `src/__tests__/parseContentResponse.spec.ts` — feed multiple hypothetical Gemini responses, assert normalized outputs.
* `src/__tests__/geminiClient.spec.ts` — mock `fetch` to fail then succeed; assert retries and final output.
* `src/__tests__/useGeminiContent.spec.tsx` — test streaming flow and hook state updates.

### Behavioral details & expectations (do not skip)

* **SSE Streaming**:

  * Provide a robust SSE parser that tolerates partial frames and recovers from malformed lines.
  * The hook `stream` must expose incremental events and the final consolidated result.
  * Support AbortController to cancel streaming requests.
* **Logging**:

  * Client side: structured `console` logs for retries and errors.
  * Server side: structured console logs; example uses `winston` or structured `console.log` objects.
* **Error handling**:

  * Return typed error objects with `code`, `message`, and `transient: boolean`.
  * Hook must surface errors and allow retries via `generate` or `stream` method calls.
* **Security**:

  * README must show how to configure proxy and why it is required (example env var names).
  * Include inline code comments stressing not to expose API keys.
* **Performance & UX**:

  * When streaming text, append fragments into a coherent buffer and expose tokens/offsets so the UI can highlight incremental progress.
  * For media (image/video/audio) support progressive display as base64 parts arrive; if only a URL is returned, show it and provide a download button.
* **Extensibility**:

  * Keep content-type specific parsing modular so new model outputs can be added with minimal changes.
* **Code style**:

  * Provide ESLint + Prettier config. Keep exports and imports consistent and relative.

### Output format required from the code generator

* Output every file as a separate code block. Each code block must start with the metadata header exactly:

  ```
  FilePath: <path/to/file>
  Title: <one-line description>
  Reason: <why this file exists>
  ```

  Then the file contents.
* Do not provide additional narrative text outside the file code blocks.
* Make sure tests run with `npm test` in the generated `package.json`. Use `ts-jest` for TypeScript tests or provide equivalent config.
* Ensure all imports resolve within the project and there are no missing dependencies in `package.json`.

### Dynamic placeholders (for reusability)

Allow these placeholders in the generator instruction so the prompt can be reused:

* `{{PROJECT_NAME}}` — project root name (e.g., gemini-client)
* `{{GEMINI_ENDPOINT}}` — default endpoint
* `{{DEFAULT_MODEL_TEXT}}` — default text model id
* `{{DEFAULT_MODEL_IMAGE}}` — default imagen model id
* `{{INCLUDE_LYRIA}}` — boolean toggle to include music generation scaffolding
* `{{USE_REACT_QUERY}}` — boolean toggle: if true, the hook should use `react-query`; otherwise, implement small internal caching

When invoking the generator, replace placeholders or let the code generator fill them sensibly.

### Example short one-line wrap you can append to the prompt

> "Generate the full React + TypeScript project now — return each file as a separate code block prefixed by the required metadata header."
