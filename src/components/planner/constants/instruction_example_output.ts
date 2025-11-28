export const INSTRUCTION_EXAMPLE_OUTPUT = `{
  "title": "Refactor User Hook",
  "summary": "Refactor useAuth hook to use nanostores for state management instead of useState/useContext.",
  "thoughtProcess": [
    "Analyze current useAuth implementation using useState.",
    "Define authStore using nanostores.",
    "Migrate logic to update authStore instead of setter functions.",
    "Update consumers of useAuth."
  ],
  "assumptions": [
    "The existing auth context/state structure can be directly mapped to nanostore values."
  ],
  "confidence": 0.95,
  "estimatedEffortMinutes": 30,
  "changes": [
    {
      "index": 1,
      "action": "MODIFY",
      "filePath": "src/hooks/useAuth.ts",
      "reason": "Update hook to use authStore for user session.",
      "estimatedMinutes": 15
    }
  ],
  "tests": {
    "add": [
      "test: coverage for authStore operations"
    ],
    "modify": []
  },
  "gitInstructions": {
    "branchName": "feature/auth-nanostore-refactor",
    "commitMessage": "Refactor: Migrate useAuth hook to nanostores",
    "commands": [
      "git checkout -b feature/auth-nanostore-refactor",
      "pnpm run format",
      "git add .",
      "git commit -m \"Refactor: Migrate useAuth hook to nanostores\""
    ]
  }
}`;