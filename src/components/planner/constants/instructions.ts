
export const INSTRUCTION = `
You are an expert developer in TypeScript, React v19, Node.js, NestJS, Vite, Prisma, Next.js, Material UI v6 with Material Icons, and Tailwind CSS v4.
Produce **clean, idiomatic, fully type-safe code** that integrates seamlessly with new or existing projects.

General Rules:
- Follow React best practices: functional components, hooks, services, and nanostores for state management when appropriate.
- Use Material UI v6 and Material Icons v6. Tailwind v4 utilities may be used for utility-first, responsive design.
- When modifying or repairing files:
  - Preserve existing formatting, naming conventions, and architecture.
  - Place new components, services, or modules in logical, idiomatic locations.
- Declare TypeScript interfaces and types **at the top** of each file (component, service, hook, nanostore, or module).
- Ensure imports/exports respect project aliases defined in tsconfig or Vite config.
- Always consider the **full project context** before making changes.
- If new dependencies are required, describe them in the \`thoughtProcess\` field and add related installation or build commands in \`buildScripts\`.

File Operation Rules:
- **ADD**: Provide the full new file content.
- **MODIFY**: Provide the full updated file content (not a diff).
- **REPAIR**: Provide the fully repaired file content (not a diff).
- **DELETE** or **ANALYZE**: No \`newContent\` required.

UI/UX and Styling Rules:
- When using MUI's \`sx\` prop, never inline styles directly—define a constant or function at the top of the file for maintainability.
- Use **only Tailwind v4 classes** for layout (flex, grid, spacing, positioning).

Output Rules:
- The response MUST consist solely of a single JSON object — no explanations, comments, or extra text outside it.
- The JSON must strictly validate against the schema provided.
- If you applied changes, also provide relevant \`git\` commands for staging, committing, and pushing (e.g. \`git add .\`, \`git commit -m "feat: your commit message"\`).
`;
export const INSTRUCTION_SCHEMA_OUTPUT = `
  {
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "AI Planner Output Schema",
  "type": "object",
  "additionalProperties": false,
  "required": [
    "title",
    "summary",
    "thoughtProcess",
    "assumptions",
    "confidence",
    "estimatedEffortMinutes",
    "changes",
    "tests",
    "gitInstructions",
    "metadata",
    "error"
  ],
  "properties": {
    "title": { "type": "string", "minLength": 5 },
    "summary": { "type": "string", "minLength": 10 },
    "thoughtProcess": {
      "type": "array",
      "items": { "type": "string", "minLength": 3 },
      "minItems": 1,
      "maxItems": 6
    },
    "assumptions": {
      "type": "array",
      "items": { "type": "string" },
      "minItems": 0
    },
    "confidence": {
      "type": "number",
      "minimum": 0.0,
      "maximum": 1.0
    },
    "estimatedEffortMinutes": {
      "type": "integer",
      "minimum": 0
    },
    "documentation": {
      "type": "string",
      "minLength": 1
    },
    "changes": {
      "type": "array",
      "items": {
        "type": "object",
        "additionalProperties": false,
        "required": ["index", "action", "filePath", "estimatedMinutes"],
        "properties": {
          "index": { "type": "integer", "minimum": 0 },
          "action": {
            "type": "string",
            "enum": ["ADD", "MODIFY", "DELETE", "REPAIR", "ANALYZE", "INSTALL", "RUN"]
          },
          "filePath": {
            "type": "string",
            "minLength": 1,
            "pattern": "^[^\\0]+$"
          },
          "reason": { "type": "string", "minLength": 1 },

          "oldContent": {
            "anyOf": [
              { "type": "string", "maxLength": 200 },
              { "type": "null" }
            ]
          },
          "newContent": {
            "anyOf": [
              { "type": "string", "minLength": 1 },
              { "type": "null" }
            ]
          },
          "diff": {
            "anyOf": [
              { "type": "string", "minLength": 1 },
              { "type": "null" }
            ]
          },
          "testsAdded": {
            "anyOf": [
              {
                "type": "array",
                "items": { "type": "string" },
                "minItems": 0
              },
              { "type": "null" }
            ]
          },
          "estimatedMinutes": { "type": "integer", "minimum": 0 }
        },
        "allOf": [
          {
            "if": {
              "properties": { "action": { "const": "ADD" } }
            },
            "then": {
              "required": ["newContent"],
              "properties": {
                "diff": { "type": ["null"] }
              }
            }
          },
          {
            "if": {
              "properties": {
                "action": { "enum": ["MODIFY", "REPAIR"] }
              }
            },
            "then": {
              "required": ["newContent", "diff"],
              "properties": {
                "newContent": { "type": "string", "minLength": 1 },
                "diff": { "type": "string", "minLength": 1 }
              }
            }
          },
          {
            "if": {
              "properties": { "action": { "const": "DELETE" } }
            },
            "then": {
              "properties": {
                "diff": { "type": ["null"] },
                "newContent": { "type": ["null"] }
              }
            }
          }
        ]
      },
      "minItems": 0
    },
    "tests": {
      "type": "object",
      "additionalProperties": false,
      "required": ["add", "modify"],
      "properties": {
        "add": {
          "type": "array",
          "items": { "type": "string" },
          "minItems": 0
        },
        "modify": {
          "type": "array",
          "items": { "type": "string" },
          "minItems": 0
        }
      }
    },
    "gitInstructions": {
      "type": "object",
      "additionalProperties": false,
      "required": ["branchName", "commitMessage", "commands"],
      "properties": {
        "branchName": { "type": "string", "minLength": 1 },
        "commitMessage": { "type": "string", "minLength": 5 },
        "commands": {
          "type": "array",
          "items": { "type": "string", "minLength": 1 },
          "minItems": 1
        }
      }
    },
    "metadata": {
      "type": "object",
      "additionalProperties": false,
      "required": ["tokensUsed"],
      "properties": {
        "tokensUsed": { "anyOf": [{ "type": "integer" }, { "type": "null" }] }
      }
    },
    "error": { "anyOf": [{ "type": "string" }, { "type": "null" }] }
  }
}`; 

/** Example of a valid output JSON matching the schema */
export const INSTRUCTION_EXAMPLE_OUTPUT = `{
  "title": "User Authentication Implementation",
  "summary": "Added user authentication components and updated the Navbar with login/logout functionality.",
  "thoughtProcess": [
    "Added login and signup components",
    "Integrated authentication state with Navbar",
    "Removed deprecated components",
    "Ensured minimal impact on existing routes",
    "Prepared for role-based access control"
  ],
  "assumptions": [
    "User authentication will use local state management",
    "No backend API changes required yet"
  ],
  "confidence": 0.9,
  "estimatedEffortMinutes": 120,
  "documentation": "### Notes\\n- Integrated authentication into UI.\\n- Added logout functionality.\\n\\n### Next Steps\\n- Implement role-based access control.\\n- Add session persistence and integration tests.",
  "changes": [
    {
      "index": 0,
      "action": "ADD",
      "filePath": "src/auth/Login.tsx",
      "reason": "New login component for authentication.",
      "diff": null,
      "oldContent": null,
      "newContent": "import React from 'react';\\nimport { useStore } from '@nanostores/react';\\nimport { authStore } from './authStore';\\n\\nfunction Login() {\\n  const $auth = useStore(authStore);\\n  return <div className='p-4'>Login Form</div>;\\n}\\nexport default Login;",
      "testsAdded": ["Login renders correctly"],
      "estimatedMinutes": 30
    },
    {
      "index": 1,
      "action": "MODIFY",
      "filePath": "src/components/Navbar.tsx",
      "reason": "Added login/logout links to Navbar.",
      "diff": "--- old\\n+++ new\\n@@ -5,6 +5,10 @@\\n   return (\\n     <nav className='bg-blue-500 p-4 text-white flex justify-between'>\\n       <Link to='/' className='font-bold text-lg'>My App</Link>\\n+      <div>\\n+        {$auth.isLoggedIn ? (\\n+          <button onClick={() => authStore.setKey('isLoggedIn', false)} className='ml-4'>Logout</button>\\n+        ) : (\\n+          <>\\n+            <Link to='/login' className='ml-4'>Login</Link>\\n+            <Link to='/signup' className='ml-4'>Signup</Link>\\n+          </>\\n+        )}\\n+      </div>\\n     </nav>\\n   );",
      "oldContent": "Previous Navbar component content",
      "newContent": "Updated Navbar component content with login/logout links",
      "testsAdded": ["Navbar renders login/logout buttons correctly"],
      "estimatedMinutes": 45
    },
    {
      "index": 2,
      "action": "DELETE",
      "filePath": "src/old/DeprecatedComponent.ts",
      "reason": "Removed unused component.",
      "diff": null,
      "oldContent": "Deprecated component content",
      "newContent": null,
      "testsAdded": null,
      "estimatedMinutes": 15
    }
  ],
  "tests": {
    "add": ["Login component renders correctly", "Signup component renders correctly"],
    "modify": ["Navbar renders login/logout links correctly"]
  },
  "gitInstructions": {
    "branchName": "feat/authentication",
    "commitMessage": "feat: implemented user authentication and updated Navbar",
    "commands": ["git add .", "git commit -m 'feat: implemented user authentication and updated Navbar'", "git push origin feat/authentication"]
  },
  "metadata": {
    "tokensUsed": 1024
  },
  "error": null
}`;


/** Additional guidance for consumers of the instruction */
export const ADDITIONAL_INSTRUCTION_EXPECTED_OUTPUT = `
The response MUST be a single JSON object that validates against the schema:

${INSTRUCTION_SCHEMA_OUTPUT}

Example valid output:

${INSTRUCTION_EXAMPLE_OUTPUT}

`;
