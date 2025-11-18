// FilePath: src/types/gemini-rest.d.ts
// Title: Full TypeScript types for Google Gemini (GenerateContent / GenAI REST)
// Reason: Provide a comprehensive, strongly-typed TypeScript surface for the Gemini/Vertex AI REST API
//
// Notes:
// - These types are intended to match the public REST API shapes for generateContent, streamGenerateContent,
//   function-calling, structured output (JSON Schema), embeddings, and common metadata.
// - The exact optional/required status may vary by model/version; treat many fields as optional to remain forward-compatible.
// - See official docs for model-specific fields and latest additions. :contentReference[oaicite:1]{index=1}

/** -------------------------
 *  Basic primitives & helpers
 *  ------------------------- */
export type Role = 'system' | 'user' | 'assistant' | string;

export interface KeyValue {
  [key: string]: any;
}

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonObject
  | JsonValue[];
export interface JsonObject {
  [k: string]: JsonValue;
}

/** -------------------------
 *  JSON Schema subset (structured outputs)
 *  ------------------------- */
/** A compact representation of JSON Schema subset used by Gemini for structured outputs */
export interface JsonSchema {
  $id?: string;
  $ref?: string;
  $defs?: Record<string, JsonSchema>;
  $anchor?: string;

  // Core
  type?:
    | 'object'
    | 'array'
    | 'string'
    | 'number'
    | 'integer'
    | 'boolean'
    | 'null';
  title?: string;
  description?: string;
  format?: string;
  enum?: (string | number | boolean | null)[];
  default?: any;

  // Object specific
  properties?: Record<string, JsonSchema>;
  required?: string[];
  additionalProperties?: boolean | JsonSchema;
  propertyOrdering?: string[]; // non-standard but used in examples/docs

  // Array specific
  items?: JsonSchema | JsonSchema[];
  prefixItems?: JsonSchema[];
  minItems?: number;
  maxItems?: number;

  // Number constraints
  minimum?: number;
  maximum?: number;
  exclusiveMinimum?: number;
  exclusiveMaximum?: number;

  // Composition
  anyOf?: JsonSchema[];
  oneOf?: JsonSchema[];
  allOf?: JsonSchema[];

  // Custom / vendor extensions allowed
  [vendorExt: string]: any;
}

/** -------------------------
 *  Content & Input types
 *  ------------------------- */
/** A single "part" within a Content turn (text, image, file, function invocation, etc.) */
export interface Part {
  // Exactly one of these should be used typically (union-like)
  text?: string;

  // Inline binary data (base64) with mime type
  inlineData?: {
    mimeType: string;
    data: string; // base64
  };

  // Reference to a hosted file or cloud storage path
  fileUri?: {
    mimeType?: string;
    uri: string; // e.g. "gs://bucket/obj" or "https://..."
  };

  // Function call results (system-supplied or assistant predicted)
  functionCall?: FunctionCall;

  // Function response provided by the developer (after executing)
  functionResponse?: FunctionResponse;

  // Optional metadata like confidence / annotations
  annotations?: any;
}

/** High-level content turn (role + list of parts). Used inside request.contents[] */
export interface Content {
  role?: Role;
  parts: Part[];
  // Optional metadata for the turn
  metadata?: {
    name?: string;
    timestamp?: string; // RFC3339
    [k: string]: any;
  };
}

/** -------------------------
 *  Function calling / tools
 *  ------------------------- */
/** A function/tool declaration you register in the request so the model can call it */
export interface ToolDeclaration {
  name: string; // unique name
  title?: string;
  description?: string;
  // Parameter schema (JSON Schema subset)
  parameters?: JsonSchema;
  // Optional response schema (JSON Schema subset)
  response?: JsonSchema;
  // Developer-supplied metadata
  metadata?: Record<string, any>;
}

/** Model-predicted function call */
export interface FunctionCall {
  name: string;
  // Model often emits stringified JSON; we allow both parsed and raw strings
  arguments?: string | JsonObject;
}

/** Developer/system-provided function output that maps to a ToolDeclaration.response */
export interface FunctionResponse {
  name: string;
  arguments: JsonObject | string;
  // Optional status or metadata
  status?: {
    code?: number;
    message?: string;
  };
}

/** -------------------------
 *  Generation / Sampling config
 *  ------------------------- */
export interface ThinkingConfig {
  // Placeholder for any "thinking" intermediate reasoning controls
  // The API/SDKs expose model-specific fields here — keep flexible.
  [k: string]: any;
}

export interface GenerationConfig {
  // Response format hints
  responseMimeType?: string; // e.g. "text/plain" | "application/json"

  // Token / length controls
  maxOutputTokens?: number;
  maxDecodeSteps?: number; // vendor-specific alias sometimes present

  // Sampling
  temperature?: number;
  topP?: number;
  topK?: number;
  typicalP?: number;

  // Deterministic beam or best-of
  beamWidth?: number;
  bestOf?: number;

  // Stop sequences
  stopSequences?: string[];

  // Penalization
  presencePenalty?: number;
  frequencyPenalty?: number;

  // Structured output
  responseSchema?: JsonSchema;

  // Function-calling / tool controls
  tools?: ToolDeclaration[];

  // Safety hints (free-form or structured)
  safetySettings?: any[];

  // Thinking / multi-step reasoning
  thinkingConfig?: ThinkingConfig;

  // Additional vendor-specific generation config passthrough
  [k: string]: any;
}

/** -------------------------
 *  Request shapes
 *  ------------------------- */
/** Base request fields common to generateContent (model-level) */
export interface GenerateContentBase {
  model: string; // resource name or model id (e.g. "models/gemini-1.5-pro")
  contents?: Content[]; // the prompt / conversation
  // Optional tools/functions the model can call
  tools?: ToolDeclaration[];
  // Top-level generation config
  generationConfig?: GenerationConfig;
  // Alternative way to set JSON structured output schema (legacy/alias)
  responseSchema?: JsonSchema;
  // Optional project/location/resource hints (Vertex style)
  // e.g. for Vertex AI endpoints one may use `model` path form: projects/.../models/...
  [k: string]: any;
}

/** Standard (non-streaming) GenerateContent request */
export interface GenerateContentRequest extends GenerateContentBase {
  // Optionally provide user id / session
  userId?: string;
  // Optional cached content resource name
  cachedContent?: string;
}

/** Embeddings request (if using embedding endpoint) */
export interface GenerateEmbeddingsRequest {
  model: string;
  input: string | string[]; // single input or batch
  // optional parameters (e.g. normalize, pooling)
  [k: string]: any;
}

/** -------------------------
 *  Response shapes
 *  ------------------------- */
/** Candidate content from the model — one possible output */
export interface Candidate {
  // The content is structured like input 'Content' — role + parts
  content: Content;
  // Why generation stopped, e.g. "stop_sequence", "length", "eos_token"
  finishReason?: string;
  // Resource-level token/usage counters (if provided)
  tokenUsage?: {
    inputTokens?: number;
    outputTokens?: number;
    totalTokens?: number;
    [k: string]: number | undefined;
  };
  // Optional safety/citation metadata
  safety?: SafetyFeedback | null;
  citationMetadata?: CitationMetadata | null;
  // Optional function call output (if model decided to call)
  functionCall?: FunctionCall | null;
}

/** Top-level GenerateContent response */
export interface GenerateContentResponse {
  requestId?: string;
  model?: string;
  candidates: Candidate[];
  // Optionally includes the chosen (best) content id / index
  chosen?: {
    index?: number;
    candidate?: Candidate;
  };
  // Usage / billing info if available
  usage?: {
    inputTokens?: number;
    outputTokens?: number;
    totalTokens?: number;
    [k: string]: number | undefined;
  };
  // Raw metadata
  metadata?: any;
}

/** Embeddings response */
export interface GenerateEmbeddingsResponse {
  model?: string;
  embeddings: number[][];
  // Optional ids, usage, etc.
  ids?: string[];
  usage?: any;
  metadata?: any;
}

/** -------------------------
 *  Safety / citation metadata
 *  ------------------------- */
/** Safety rating structure — vendor-specific, included in docs as part of candidate metadata */
export interface SafetyFeedback {
  // Safety categories e.g. "hate", "sexual", "medical", etc.
  categories?: Array<{
    name: string;
    severity?: number; // relative severity
    score?: number; // confidence
  }>;
  // Overall allowed / blocked flag
  safe?: boolean;
  // Additional details
  [k: string]: any;
}

/** Citation / provenance metadata for facts / assertions */
export interface CitationMetadata {
  citations?: Array<{
    uri?: string;
    title?: string;
    excerpt?: string;
    startIndex?: number;
    endIndex?: number;
    // Optional: document id / index in a collection or search result
    documentId?: string;
    /** any other info */
    [k: string]: any;
  }>;
  // Confidence or aggregate score
  confidence?: number;
  [k: string]: any;
}

/** -------------------------
 *  Streaming types (SSE / streamGenerateContent)
 *  ------------------------- */
/**
 * The SSE stream messages are typically JSON objects with a top-level `type` field.
 * Below is a typed union for commonly-seen SSE events. Implementation may add vendor-specific ones.
 */
export type StreamEvent =
  | StreamEventTypeChunk
  | StreamEventTypeCandidate
  | StreamEventTypeFunctionCall
  | StreamEventTypeEnd
  | StreamEventTypeHeartbeat
  | StreamEventTypeError;

export interface StreamEventBase {
  eventId?: string;
  // RFC3339 timestamp
  timestamp?: string;
  [k: string]: any;
}

export interface StreamEventTypeChunk extends StreamEventBase {
  type: 'chunk';
  // Partial content piece
  chunk: {
    // May include text delta or partial parts array
    delta?: string;
    partialParts?: Part[];
  };
  // interim candidate id or index
  candidateIndex?: number;
}

export interface StreamEventTypeCandidate extends StreamEventBase {
  type: 'candidate';
  candidate: Candidate;
  index?: number;
}

export interface StreamEventTypeFunctionCall extends StreamEventBase {
  type: 'function_call';
  functionCall: FunctionCall;
  // indication to the client to execute the call
  shouldExecute?: boolean;
}

export interface StreamEventTypeEnd extends StreamEventBase {
  type: 'end';
  reason?: string;
  chosen?: { index?: number; candidate?: Candidate };
}

export interface StreamEventTypeHeartbeat extends StreamEventBase {
  type: 'heartbeat';
}

export interface StreamEventTypeError extends StreamEventBase {
  type: 'error';
  error: {
    code?: string | number;
    message: string;
    details?: any;
  };
}

/** -------------------------
 *  Model metadata / listing
 *  ------------------------- */
export interface ModelInfo {
  name: string; // resource name or id
  displayName?: string;
  description?: string;
  modalities?: string[]; // e.g. ['text','image','audio']
  parameters?: {
    contextWindowTokens?: number;
    maxOutputTokens?: number;
    [k: string]: any;
  };
  available?: boolean;
  // Vendor-specific fields
  [k: string]: any;
}

/** -------------------------
 *  HTTP error shape (common)
 *  ------------------------- */
export interface ApiError {
  code?: number;
  message: string;
  details?: any;
}

/** -------------------------
 *  Convenience client helper types
 *  ------------------------- */
export interface GenerateOptions {
  // If true, open an SSE stream for streaming; otherwise standard request.
  stream?: boolean;
  // Abort signal for fetch
  signal?: AbortSignal;
  // Low-level fetch/transport hook
  fetch?: typeof fetch;
  // Extra request headers
  headers?: Record<string, string>;
  // Project / location for Vertex AI endpoints
  projectLocation?: string;
  [k: string]: any;
}

/** -------------------------
 *  Example exported namespace for convenience
 *  ------------------------- */
export namespace GeminiREST {
  export type JsonSchema = JsonSchema;
  export type Content = Content;
  export type Part = Part;
  export type FunctionCall = FunctionCall;
  export type ToolDeclaration = ToolDeclaration;
  export type GenerationConfig = GenerationConfig;
  export type GenerateContentRequest = GenerateContentRequest;
  export type GenerateContentResponse = GenerateContentResponse;
  export type StreamEvent = StreamEvent;
  export type Candidate = Candidate;
  export type SafetyFeedback = SafetyFeedback;
  export type CitationMetadata = CitationMetadata;
  export type ModelInfo = ModelInfo;
  export type ApiError = ApiError;
}
