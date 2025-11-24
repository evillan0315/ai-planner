# AI Planner API and Data Structures

This document details the core TypeScript definitions (`types.ts`) and the client service (`plannerService.ts`) used by the AI Planner frontend to communicate with the NestJS backend.

## 1. Planner Service (`api/plannerService.ts`)

`plannerService.ts` is an Axios wrapper responsible for all network interactions related to generating, retrieving, and applying AI plans.

| Method | Endpoint | Description | Payload Type | Response Type |
| :--- | :--- | :--- | :--- | :--- |
| `generatePlan` | `POST /plan/generate` | Requests the LLM backend to generate a structured plan based on input context. | `ILlmInput` | `string` (raw JSON) |
| `createPlan` | `POST /plan/create` | Persists a generated plan (parsed from LLM output) to the database. | `IPlan` | `{ planId: string, plan: IPlan }` |
| `getPlan` | `GET /plan/:planId` | Retrieves a stored plan by ID. | `string` (planId) | `{ plan: IPlan }` |
| `getPaginatedPlans`| `GET /planner/paginated` | Fetches a history list of plans for the authenticated user. | `number`, `number` (page, pageSize) | `IPaginatedPlansResponse` |
| `applyPlan` | `POST /plan/apply` | Attempts to apply all changes within a stored plan to the local filesystem. | `IPlan`, `string` (projectRoot) | `IApplyPlanResult` |
| `applyFileChange`| `POST /plan/:planId/apply-chunk/:changeIndex` | Applies a single file modification chunk from a stored plan. | `string`, `number`, `string` (planId, index, projectRoot) | `IApplyPlanResult` |

---

## 2. Core Types (`types.ts`)

The data contracts are defined in `src/components/planner/types.ts` to ensure strict type safety across the application boundary.

### `IPlan` (The Core Plan Entity)

Represents the complete output structure from the LLM, containing all proposed changes, metadata, and execution instructions.

```typescript
export interface IPlan {
  id: string; // Database ID
  title: string;
  summary?: string;
  thoughtProcess?: string[] | string;
  assumptions?: string[]; 
  confidence?: number; // 0.0 - 1.0
  estimatedEffortMinutes?: number; 
  documentation?: string; 
  buildScripts?: Record<string, string>; 
  gitInstructions?: IGitInstructions;
  changes: IFileChange[];
  tests?: ITests;
  metadata?: IMetadata;
  error?: string | null;
  // ... contextual fields (llmInput, createdAt, projectRoot)
}
```

### `IFileChange` (A Single Code Modification)

Defines a single executable action against the filesystem.

```typescript
export type FileAction = 'ADD' | 'MODIFY' | 'DELETE' | 'REPAIR' | 'ANALYZE' | 'INSTALL' | 'RUN';

export interface IFileChange {
  filePath: string;
  action: FileAction;
  newContent?: string | null; // Full content for ADD/REPAIR
  diff?: string | null;        // Unified diff for MODIFY/REPAIR
  reason?: string | null;
  index?: number;
  oldContent?: string | null; // Sample of content before modification
  testsAdded?: string[] | null;
  estimatedMinutes?: number;
}
```

### `ILlmInput` (Request Payload)

The structure used to send context and instructions to the backend generation endpoint.

```typescript
export interface ILlmInput {
  userPrompt: string;
  projectRoot?: string;
  scanPaths?: string[];
  additionalInstructions?: string;
  expectedOutputFormat: string; // JSON Schema or formatting instructions
  requestType: RequestType;
  // ... multimodal inputs (fileData, fileMimeType)
}
```
