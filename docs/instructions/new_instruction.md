

Below is a reusable LLM instruction (system prompt) plus an exact JSON output schema and a ready-to-send example ILlmInput request you can use with the backend described in the README. Use the system prompt as the LLM/system instruction for generation and send the ILlmInput body to POST /api/plan. I describe what I did and what you can do next.

What I produced
- A concise system prompt that instructs the model how to analyze the project and produce a structured plan.
- A strict JSON schema the model must follow (fields and types).
- An example ILlmInput request body you can submit to the backend (replace placeholders).

System prompt (use this as the model/system instruction)

```markdown
You are an expert software engineer and code-change planner. Given a project's source files and a developer instruction, produce a clear, actionable, reviewable code-change plan intended to be applied to the project's repository. Always output a single valid JSON object that exactly matches the required schema below. Do not include any extra text, commentary, or markdown; output must be strictly parseable JSON.

Goals
- Find minimal safe changes to implement the developer's instruction while preserving existing behavior where possible.
- Prefer small, testable changes with clear rationale.
- Provide unified diffs for modifications and exact file content for adds or replacements.
- Include tests to validate behavior changes when appropriate and provide git commands to apply/rollback.

Requirements
1. Only output one JSON object that strictly conforms to the schema below.
2. Include both an overall plan summary and per-file changes in order.
3. For modified files include a unified diff under "patch" (applyable by git apply) and the minimal context needed.
4. For added files include full content under "newContent".
5. For deleted files set "action": "delete" and include the current file path and a short reason.
6. Provide an estimated effort (minutes) per change and total.
7. Include "thoughtProcess" with concise bullet reasoning (max 6 bullets).
8. Provide "gitInstructions" with exact git commands (branch creation, commit message, and how to revert).
9. Provide "confidence" (0.0–1.0) and list any assumptions.
10. If you cannot complete without more information, return a JSON object with "error" explaining required inputs and no plan.

```

Required output JSON schema

```json
{
  "title": string,
  "summary": string,
  "thoughtProcess": string[],                      // short bullets
  "assumptions": string[],                         // things you assumed about the repo or instruction
  "confidence": number,                            // 0.0 - 1.0
  "estimatedEffortMinutes": number,
  "changes": [                                     // ordered list of file changes
    {
      "index": number,
      "action": "add" | "modify" | "delete" | "repair" | "analyze",
      "path": string,                              // relative path in repo
      "reason": string,
      "patch": string|null,                        // unified diff for modify/repair (null when not applicable)
      "oldContentSample": string|null,             // small sample of existing content for context, not full file
      "newContent": string|null,                   // full content for new files or replacement
      "testsAdded": string[]|null,                 // relative paths of tests added or updated
      "estimatedMinutes": number
    }
  ],
  "tests": {                                       // top-level tests summary
    "add": string[],                               // paths to tests added
    "modify": string[]                             // test files modified
  },
  "gitInstructions": {
    "branchName": string,
    "commitMessage": string,
    "commands": string[]                            // safe commands: create branch, stage files, commit, push
  },
  "metadata": {                                    // optional developer-facing metadata
    "planId": string|null,
    "tokensUsed": number|null
  },
  "error": string|null                              // present only when plan cannot be produced
}
```
Example ILlmInput request body
(Replace placeholders with your instruction, projectRoot, and scan paths.)
```json
{
  "userPrompt": "Refactor the signup endpoint to add strict input validation (name, email, password). On invalid input return HTTP 422 with a JSON body { error: string, details?: object }. Add unit tests for validation and update docs. Keep behavior unchanged for valid requests.",
  "projectRoot": "/absolute/path/to/your-project",
  "scanPaths": ["src/controllers", "src/services", "src/routes", "tests"],
  "additionalInstructions": "Prefer using existing validation libraries already in the repo; if none exist, add a lightweight validation util. Keep changes minimal and add tests. Provide unified diffs for modifications.",
  "expectedOutputFormat": "JSON",
  "requestType": "LLM_GENERATION",
  "output": "JSON",
  "fileData": null,
  "fileMimeType": null
}
```
Example model response (structure only — the model must produce valid JSON following the schema)
```json
{
  "title": "Add request validation to signup endpoint and return 422 on invalid payload",
  "summary": "Introduce input validation for the signup endpoint, return 422 for invalid payloads, and add unit tests. Changes are small and isolated to controller, validation util, and tests.",
  "thoughtProcess": [
    "Identify signup route and controller file from scanPaths",
    "Create a lightweight validator util or use existing library",
    "Validate required fields and email format before service call",
    "Return 422 with { error, details } for validation errors",
    "Add unit tests covering valid/invalid payloads",
    "Keep service layer unchanged; only precondition checks and response changes"
  ],
  "assumptions": [
    "Project uses express-like controllers returning HTTP responses",
    "No existing global validation middleware is present"
  ],
  "confidence": 0.85,
  "estimatedEffortMinutes": 45,
  "changes": [
    {
      "index": 0,
      "action": "add",
      "path": "src/utils/validatePayload.ts",
      "reason": "Add a small reusable validation util for signup and future endpoints.",
      "patch": null,
      "oldContentSample": null,
      "newContent": "export function validateSignup(payload) { /* code */ }",
      "testsAdded": ["tests/validatePayload.spec.ts"],
      "estimatedMinutes": 15
    },
    {
      "index": 1,
      "action": "modify",
      "path": "src/controllers/signupController.ts",
      "reason": "Run validation before calling the signup service and return 422 when invalid.",
      "patch": "+++ unified diff content here +++",
      "oldContentSample": "const { name, email, password } = req.body;",
      "newContent": null,
      "testsAdded": ["tests/controllers/signupController.spec.ts"],
      "estimatedMinutes": 20
    },
    {
      "index": 2,
      "action": "modify",
      "path": "README.md",
      "reason": "Update docs to mention validation and response contract.",
      "patch": "+++ unified diff content here +++",
      "oldContentSample": "Signup endpoint description",
      "newContent": null,
      "testsAdded": [],
      "estimatedMinutes": 10
    }
  ],
  "tests": {
    "add": ["tests/validatePayload.spec.ts", "tests/controllers/signupController.spec.ts"],
    "modify": []
  },
  "gitInstructions": {
    "branchName": "ai-planner/add-signup-validation",
    "commitMessage": "feat(auth): add validation for signup endpoint and tests",
    "commands": [
      "git checkout -b ai-planner/add-signup-validation",
      "git add src/utils/validatePayload.ts src/controllers/signupController.ts tests/validatePayload.spec.ts tests/controllers/signupController.spec.ts README.md",
      "git commit -m \"feat(auth): add validation for signup endpoint and tests\"",
      "git push -u origin ai-planner/add-signup-validation"
    ]
  },
  "metadata": {
    "planId": null,
    "tokensUsed": null
  },
  "error": null
}
```
What to do next
- Use the System prompt above as your model/system instruction when calling the LLM (through your backend).
- Replace fields in the example ILlmInput and POST to POST /api/plan.
- The backend should return a plan matching the schema; validate JSON and show the patches in the UI for review before applying.

If you want, I can:
- Produce a shorter or stricter schema (JSON Schema format) for automated validation.
- Create a ready-to-send curl command for POST /api/plan with the example ILlmInput.
- Convert the system prompt into a single-line "developer instruction" or a prompt template with placeholders for your UI.

Which of these would you like next?