Below is a curated set of **high-quality example prompts** tailored for your LLM system configuration (TypeScript/React/Vite/Tailwind) **AND** directly aligned with the strategic initiatives described in the SLS Instant Messaging AI roadmap.

These examples are designed to be dropped into your prompt library for **Ollama**, **OpenAI**, and **Google Gemini** code-generation workloads.

They follow your system’s preferred conventions:

* Business-grade clarity
* Deterministic intent
* Code-oriented phrasing
* Full-file generation where applicable
* Consistent with a React 18 + TypeScript + Vite 5 + Tailwind v4 tech stack

# 1. **Member Experience & Content (MXC) Prompts**

---

### **MXC–1: IM Polish Component (Real-Time Text Enhancer UI)**

“Generate a complete React 18 + TypeScript component that provides an Instant Message Polish UI. It must include: a textarea, tone selector, and a ‘Polish’ button. It must call an `/ai/polish` endpoint and update the polished output in real time. Use Tailwind v4 for layout. Return the file in the required metadata format.”

---

### **MXC–2: Kik Profile Analyzer Panel**

“Create a dedicated `KikProfileAnalyzer.tsx` component that accepts a block of profile text, sends it to `/ai/kik/analyze`, and renders guideline compliance results and optimization suggestions. Include a minimal type definition file for the API contract. Output both files fully with the required metadata blocks.”

---

### **MXC–3: Suggestive Profile Text Generator UI**

“Build a UI module that collects style preferences (e.g., flirty, adventurous, professional) and calls `/ai/profile/generate` to produce three suggested profile text options. Use React hooks, Tailwind v4, TypeScript strict typing, and Vite-compatible imports. Provide complete file outputs.”

---

### **MXC–4: Hot Date Polish Tool**

“Produce a standalone `HotDatePolish.tsx` component that shortens, sharpens, and optimizes date-invitation text using `/ai/date/refine`. Must enforce a <150-character output. Include validation, error handling, and a responsive mobile layout using Tailwind v4.”

---

### **MXC–5: Profile Picture Analyzer (Alfredo) Upload Module**

“Generate a React file-upload component integrated with `/ai/profile-picture/analyze` that highlights detected face area bounding boxes. Use a canvas overlay and ensure TypeScript safety for image operations. Tailwind styling only.”

---

### **MXC–6: AI Search Query Bar**

“Implement an `AISearchBar.tsx` that sends natural-language queries to `/ai/search`. Include autocomplete, loading states, and result ranking indicators. The code must assume a vector-DB-backed AI contextual search service. Provide a complete React component with strict typing.”

---

# 2. **Customer Service & Administration (CSA) Prompts**

---

### **CSA–1: Customer Service FAQ Viewer & Editor**

“Generate the full set of React components required for a FAQ viewer/editor (list view, detail view, add/edit modal). Integrate with `/admin/faq` CRUD endpoints. Use TypeScript, React hooks, Vite imports, and Tailwind v4. Return each file with metadata blocks.”

---

### **CSA–2: Admin Profile Review Dashboard (Admin2)**

“Create an administrative dashboard page for profile review queues. Include: filter controls, profile card preview, AI-generated compliance scoring (provided by `/admin/profile/score`), and approval/reject actions. Use deterministic TypeScript types. Output all required files.”

---

### **CSA–3: Admin2 Event Context Body Generator Panel**

“Produce a complete UI module that displays summarized event context for a flagged user. It should call `/admin/events/context`, display the structured result, and provide collapsible sections for logs, messages, and timeline items. Use Tailwind v4 for layout.”

---

# 3. **Safety & Monitoring (SM) Prompts**

---

### **SM–1: AI Post Monitoring Log Viewer**

“Generate a React module that displays flagged content in real time using SSE/websocket subscription to `/monitor/posts/stream`. Include message previews, violation type badges, and filtering by severity. Must adhere to the project’s React-TypeScript conventions.”

---

### **SM–2: Behavioral Activity Analyzer Visualization**

“Create a dashboard page that renders anomaly-detection insights for member activity (login frequency, messaging volume, connection patterns). Use an existing chart library compatible with Vite. Integrate with `/monitor/activity/analyze`. Provide full files in required metadata format.”

---

### **SM–3: Safety Flag Criteria Management UI**

“Produce a small admin tool that allows adjusting AI safety flag parameters, thresholds, and patterns. UI must read/write to `/monitor/flags`. Only Tailwind styling. Provide complete TypeScript and React files.”

---

# 4. **Architecture, API, and Integration Prompts**

---

### **ARCH–1: AI Processing Service Contract Definitions**

“Generate TypeScript interface definitions for all AI service endpoints described in the roadmap: IM Polish, Kik Analyzer, Profile Generator, Hot Date, Picture Analyzer, AI Search, FAQ CMS, Admin Profile Review, Event Context, Post Monitoring, and Activity Analysis. Return one `api.types.ts` file.”

---

### **ARCH–2: Client SDK Wrapper for AI Service**

“Build a `aiClient.ts` SDK wrapper providing typed functions for each AI endpoint. Use Fetch API, strict TypeScript, error handling, and Vite-compatible ESM. Output a full file with metadata.”

---

### **ARCH–3: High-Level Architecture Diagram (Text-Only / Mermaid)**

“Produce a mermaid diagram representing the architecture described in the roadmap, including Vite Frontend, Core API, AI Processing Service, Vector DB, and CV/NLP workers. No code files—return diagram only.”

---

### **ARCH–4: Acceptance Criteria for AI Post Monitoring**

“Write complete acceptance criteria for the AI Post Monitoring system using BDD (Given/When/Then). Focus on compliance requirements for safety flags.”

---

# 5. **Documentation & Setup Prompts**

---

### **DOCS–1: Project Directory Scaffolding**

“Generate the entire recommended project directory structure for a Vite 5 + React 18 + TypeScript + Tailwind v4 application implementing all MXC/CSA/SM features. Output a tree structure plus any required config files with full content.”

---

### **DOCS–2: README for AI Tools Integration**

“Write a complete README describing how the frontend interfaces with the AI Processing Service, including examples for IM Polish, Profile Analyzer, and Post Monitoring. Use formal business tone.”

---

### **DOCS–3: Onboarding One-Pager**

“Generate an onboarding one-pager for engineers joining the AI initiative, summarizing the roadmap pillars (MXC, CSA, SM), key APIs, and delivery expectations.”

---

---

If you want, I can also generate:

* **A full catalog of 50+ prompts**
* **Separate prompt lists for OpenAI, Ollama, and Gemini**
* **Pre-bundled prompt packs grouped by phase (Phase 1/2/3)**
* **A prompt injection-safe version for production containers**

Just tell me what you want next.
