export const INSTRUCTION_EXAMPLE_OUTPUT = `
{
  "id": "plan_abc123",
  "title": "Refactor authentication logic to use JWT",
  "summary": "Migrate user session management from local storage tokens to standard JWT implementation using an HTTPOnly cookie.",
  "thoughtProcess": [
    "Analyze current authService.ts for session storage implementation.",
    "Implement token generation/validation logic in backend (assumed external).",
    "Update useAuth.ts hook to read JWT from cookie.",
    "Update LoginPage.tsx to handle token storage/removal."
  ],
  "assumptions": [
    "A JWT generation endpoint exists on the backend.",
    "The backend will set an HTTPOnly cookie upon successful login."
  ],
  "confidence": 0.95,
  "estimatedEffortMinutes": 120,
  "documentation": "# Auth Refactor Plan\n\nThis plan details the steps required to transition from local storage session management to using JWTs stored in secure HTTPOnly cookies. This enhances security by mitigating XSS risks associated with client-side token storage.\n\n## Security Impact\nMoving tokens to HTTPOnly cookies prevents JavaScript from accessing the token, significantly reducing the attack surface against token theft via XSS attacks.",
  "buildScripts": {
    "install": "pnpm install",
    "build": "pnpm run build"
  },
  "changes": [
    {
      "index": 0,
      "action": "MODIFY",
      "filePath": "src/stores/authStore.ts",
      "reason": "Update store to read token from cookies instead of local storage.",
      "oldContent": "// Existing content for demonstration",
      "newContent": "// Updated content for demonstration",
      "testsAdded": ["test:authStore.test.ts - Verify cookie reading logic."],
      "estimatedMinutes": 30
    },
    {
      "index": 1,
      "action": "MODIFY",
      "filePath": "src/api/authService.ts",
      "reason": "Ensure login response includes necessary setup headers for cookie handling.",
      "oldContent": "// Existing content for demonstration",
      "newContent": "// Updated content for demonstration",
      "estimatedMinutes": 45
    },
    {
      "index": 2,
      "action": "ADD",
      "filePath": "src/utils/jwtUtils.ts",
      "reason": "Utility for token decoding/validation if needed client-side.",
      "oldContent": null,
      "newContent": "// New utility file content",
      "testsAdded": null,
      "estimatedMinutes": 45
    }
  ],
  "tests": {
    "add": [
      "test:authStore.test.ts - Verify cookie reading logic."
    ],
    "modify": []
  },
  "gitInstructions": {
    "branchName": "feat/migrate-jwt-auth",
    "commitMessage": "Refactor: Migrate authentication flow to use JWT and HTTPOnly cookies",
    "commands": [
      "git checkout -b feat/migrate-jwt-auth",
      "git add ."
    ]
  },
  "error": null
}
`
