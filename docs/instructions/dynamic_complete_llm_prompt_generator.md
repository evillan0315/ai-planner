Produce a complete, production-grade project for **prompt and instruction generation with JSON schema outputs**. The target stack should be dynamically configurable as one of:

* `react-ts` — React + TypeScript frontend
* `node-ts` — Node.js + TypeScript backend
* `python-fastapi` — Python 3 + FastAPI backend
* `python-flask` — Python 3 + Flask backend
* `vanilla-js` — Plain JavaScript + HTML frontend

The generated project must allow defining prompts and instructions, generating structured JSON schema outputs, and optionally validating inputs against schemas. The implementation should be modular, fully typed where applicable, and include low-level APIs, high-level hooks or client endpoints, and demo usage. Unit tests and README documentation are required.

### New Vanilla JS / HTML requirements

* Provide **single-page HTML version** option (`singleFile: true`) or CDN-linked version (`singleFile: false`) with `<script>` tags.
* Use **TailwindCSS v4** for styling UI elements (form, buttons, preview areas).
* Implement prompt/instruction generation in a modular JavaScript module, optionally exposing a global `PromptGenerator` object.
* Include demo UI components for entering prompt text, instruction parameters, and displaying JSON schema outputs.
* Include retry/backoff utility implemented in plain JS.

### High-level goals

1. **Core functionality** (all stacks):

   * Define prompts and instruction sets.
   * Generate JSON schema representations of prompts and expected outputs.
   * Validate input/output against JSON schema.
   * Provide retry/backoff for transient operations.

2. **Frontend (React + TypeScript or Vanilla JS)**:

   * Low-level client class or JS module `PromptGeneratorClient`.
   * High-level hook (`usePromptGenerator()`) for React or global JS object for Vanilla JS.
   * Demo UI components / HTML elements for input and preview.
   * TailwindCSS v4 utility classes for styling.

3. **Backend (Node.js + TypeScript / Python)**:

   * API endpoints: `/generatePrompt`, `/generateInstruction`.
   * Retry/backoff utility.
   * Schema validation.
   * Unit tests.

### Hard requirements

* Retry/backoff:

   * Implement `retryWithBackoff` / `retry_with_backoff` with exponential backoff + jitter.
   * Configurable via environment variables:

     * `RETRY_MAX_ATTEMPTS` (default 4)
     * `RETRY_BASE_MS` (default 500)
     * `RETRY_JITTER_FACTOR` (default 0.2)

* JSON Schema outputs:

   * All prompt and instruction responses must include:

     ```json
     {
       "schema": {...},
       "data": {...},
       "generatedAt": "ISO8601 string",
       "valid": true/false,
       "errors": ["optional errors"]
     }
     ```

* Vanilla JS / HTML output options:

   * `singleFile: true` → generate a single HTML file with embedded JS and TailwindCSS via CDN.
   * `singleFile: false` → generate HTML + JS files separately, with TailwindCSS via CDN.

### Dynamic placeholders

* `{{PROJECT_NAME}}` — project root name
* `{{STACK}}` — `react-ts`, `node-ts`, `python-fastapi`, `python-flask`, `vanilla-js`
* `{{SINGLE_FILE}}` — boolean for Vanilla JS: output full HTML with embedded scripts or separate files
* `{{INCLUDE_ADVANCED_VALIDATION}}` — toggle for schema validation
* `{{USE_REACT_QUERY}}` — toggle caching for React hooks

### Output format

* Generate each source file as a **separate code block**.
* Each code block **must** begin with metadata header:



FilePath: <path/to/file>
Title: <one-line description>
Reason: <why this file exists>



* Include all required files for the chosen stack:

#### React + TypeScript
* `src/types/promptGenerator.d.ts`
* `src/utils/retry.ts`
* `src/api/promptGeneratorClient.ts`
* `src/hooks/usePromptGenerator.ts`
* `src/components/PromptForm.tsx`
* `src/components/SchemaPreview.tsx`
* `src/App.tsx`
* `src/index.tsx`
* `public/index.html`
* `package.json`, `tsconfig.json`, `.eslintrc`, `.gitignore`, `README.md`
* `src/__tests__/*.spec.ts`

#### Node.js + TypeScript
* `src/index.ts`
* `src/routes/promptRoutes.ts`
* `src/services/promptService.ts`
* `src/utils/retry.ts`
* `src/types/promptGenerator.d.ts`
* `package.json`, `tsconfig.json`, `.eslintrc`, `.gitignore`, `README.md`
* `tests/*.spec.ts`

#### Python 3 + FastAPI / Flask
* `main.py` (FastAPI/Flask app)
* `models.py` (Pydantic models)
* `services/prompt_service.py`
* `utils/retry.py`
* `tests/test_prompt_service.py`
* `requirements.txt`, `.gitignore`, `README.md`

#### Vanilla JS + HTML
* `index.html` — main HTML file with embedded or linked JS
* `promptGenerator.js` — low-level module for prompt generation
* `utils/retry.js` — retry/backoff utility
* `README.md`

### Behavioral expectations

* Strong typing / Pydantic models where applicable.
* Structured logging for retries and errors.
* TailwindCSS v4 utility classes for all frontend elements.
* Demo UI or endpoints to showcase JSON schema outputs.
* Unit tests for retry, schema generation, and validation.
* Clear README with usage instructions, environment variables, and CDN/script setup for Vanilla JS.

> "Generate the full {{STACK}} project now — return each file as a separate code block prefixed by the required metadata header. For `vanilla-js`, honor `{{SINGLE_FILE}}` to output either a full HTML with embedded JS and TailwindCDN or separate HTML + JS files."



