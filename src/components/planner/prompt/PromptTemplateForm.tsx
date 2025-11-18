import React, { useState } from "react";
import {
  Box,
  TextField,
  Button,
  Chip,
  Stack,
  Typography,
  IconButton,
  FormControlLabel,
  Switch,
  InputAdornment,
} from "@mui/material";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import ClearIcon from "@mui/icons-material/Clear";
import type { ILlmInput, LlmOutputFormat, RequestType } from "../types";

type Props = {
  initial?: Partial<ILlmInput>;
  onSubmit: (payload: ILlmInput) => void;
  className?: string;
};

export default function PromptTemplateForm({ initial = {}, onSubmit, className = "" }: Props) {
  const [userPrompt, setUserPrompt] = useState<string>(initial.userPrompt ?? "");
  const [projectRoot, setProjectRoot] = useState<string>(initial.projectRoot ?? "");
  const [scanPathInput, setScanPathInput] = useState<string>("");
  const [scanPaths, setScanPaths] = useState<string[]>(initial.scanPaths ?? ["src", "tests"]);
  const [additionalInstructions, setAdditionalInstructions] = useState<string>(initial.additionalInstructions ?? "");
  const [expectedOutputFormat, setExpectedOutputFormat] = useState<string>(initial.expectedOutputFormat ?? "JSON");
  const [requestType, setRequestType] = useState<RequestType>(initial.requestType ?? ("LLM_GENERATION" as RequestType));
  const [outputFormat, setOutputFormat] = useState<LlmOutputFormat | undefined>(initial.output);
  const [fileData, setFileData] = useState<string | undefined>(initial.fileData);
  const [fileMimeType, setFileMimeType] = useState<string | undefined>(initial.fileMimeType);
  const [applyDirectly, setApplyDirectly] = useState<boolean>(false);
  // Small extra parameter that will be appended to additionalInstructions when sending
  const [maxThoughtBullets, setMaxThoughtBullets] = useState<number>(4);

  const addScanPath = () => {
    const path = scanPathInput.trim();
    if (!path) return;
    if (!scanPaths.includes(path)) setScanPaths((s) => [...s, path]);
    setScanPathInput("");
  };

  const removeScanPath = (p: string) => setScanPaths((s) => s.filter((x) => x !== p));

  const canSubmit = userPrompt.trim().length > 5 && projectRoot.trim().length > 0;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setFileData(undefined);
      setFileMimeType(undefined);
      return;
    }
    setFileMimeType(file.type || undefined);
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = typeof reader.result === "string" ? reader.result.split(",")[1] : undefined;
      setFileData(base64);
    };
    reader.readAsDataURL(file);
  };
  const schema = `
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
          "diff": {
            "anyOf": [
              { "type": "string", "minLength": 1 },
              { "type": "null" }
            ]
          },
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
              "required": ["diff"],
              "properties": {
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
      "required": ["planId", "tokensUsed"],
      "properties": {
        "planId": { "anyOf": [{ "type": "string" }, { "type": "null" }] },
        "tokensUsed": { "anyOf": [{ "type": "integer" }, { "type": "null" }] }
      }
    },
    "error": { "anyOf": [{ "type": "string" }, { "type": "null" }] }
  }
}
  `
  const add_instructions = `
    You are an expert code-change planner: given ${userPrompt.trim()}, ${projectRoot.trim()}, and ${scanPaths}, produce one single valid JSON object matching the strict schema:
    \`${schema}\`
    with minimal safe changes, unified diffs for modifications, full content for adds, tests, git commands, a concise 1–6 bullet thoughtProcess, assumptions, confidence (0.0–1.0), and estimated effort in minutes; if more info is needed return only { "error": "..." }.
  `
  const handleSubmit = () => {
    if (!canSubmit) return;

    // Append UI-only settings to additionalInstructions to avoid changing ILlmInput shape
    const extra = `\n\nUI_HINT: applyDirectly=${applyDirectly}, maxThoughtBullets=${maxThoughtBullets}`;
    const payload: ILlmInput = {
      userPrompt: userPrompt.trim(),
      projectRoot: projectRoot.trim(),
      projectStructure: undefined,
      relevantFiles: undefined,
      additionalInstructions: (add_instructions?.trim() || "") + extra,
      expectedOutputFormat: expectedOutputFormat || "JSON",
      scanPaths,
      requestType: requestType,
      output: outputFormat ?? ("JSON" as LlmOutputFormat),
      fileData: fileData ?? undefined,
      fileMimeType: fileMimeType ?? undefined,
    };

    onSubmit(payload);
  };

  return (
    <Box className={`p-4 bg-white dark:bg-gray-800 rounded-lg shadow ${className}`}>
      <Stack spacing={2}>
        <Typography variant="h6">AI Plan Request</Typography>

        <TextField
          label="Instruction / Developer Request"
          value={userPrompt}
          onChange={(e) => setUserPrompt(e.target.value)}
          placeholder='e.g. "Add validation to signup endpoint and return 422 on invalid payload"'
          multiline
          minRows={3}
          fullWidth
        />

        <div className="grid md:grid-cols-2 gap-4">
          <TextField
            label="Project Root (absolute)"
            value={projectRoot}
            onChange={(e) => setProjectRoot(e.target.value)}
            placeholder="/absolute/path/to/project"
            fullWidth
          />

          <TextField
            label="Expected Output Format"
            value={expectedOutputFormat}
            onChange={(e) => setExpectedOutputFormat(e.target.value)}
            helperText="Usually JSON (controls top-level format expectation for the LLM)"
            fullWidth
          />
        </div>

        <div>
          <Typography variant="subtitle2" className="mb-2">Scan Paths</Typography>
          <div className="flex items-center gap-2 mb-2">
            <TextField
              size="small"
              value={scanPathInput}
              onChange={(e) => setScanPathInput(e.target.value)}
              placeholder="e.g. src/controllers"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addScanPath();
                }
              }}
            />
            <IconButton aria-label="add-scan-path" onClick={addScanPath} color="primary" size="large">
              <AddCircleOutlineIcon />
            </IconButton>
            <Button variant="outlined" size="small" onClick={() => setScanPaths(["src", "tests"])}>
              Reset Paths
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {scanPaths.map((p) => (
              <Chip
                key={p}
                label={p}
                onDelete={() => removeScanPath(p)}
                className="bg-gray-100 dark:bg-gray-700"
                deleteIcon={<ClearIcon />}
              />
            ))}
          </div>
        </div>

        <TextField
          label="Additional Instructions (optional)"
          value={additionalInstructions}
          onChange={(e) => setAdditionalInstructions(e.target.value)}
          placeholder="Prefer existing validation libs; provide unified diffs; include tests"
          multiline
          minRows={2}
          fullWidth
        />

        <div className="grid md:grid-cols-3 gap-4 items-center">
          <TextField
            label="Request Type"
            value={requestType}
            onChange={(e) => setRequestType(e.target.value as RequestType)}
            helperText="LLM request type (defaults to LLM_GENERATION)"
            fullWidth
          />

          <TextField
            label="LLM Output (optional)"
            value={outputFormat ?? ""}
            onChange={(e) => setOutputFormat((e.target.value || undefined) as any)}
            helperText="Set the preferred language/format like JSON, DIFF, MARKDOWN"
            fullWidth
          />

          <TextField
            label="Max thought bullets"
            type="number"
            value={maxThoughtBullets}
            onChange={(e) => setMaxThoughtBullets(Math.max(1, Math.min(6, Number(e.target.value) || 1)))}
            InputProps={{
              endAdornment: <InputAdornment position="end">bullets</InputAdornment>,
            }}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <FormControlLabel
              control={<Switch checked={applyDirectly} onChange={(e) => setApplyDirectly(e.target.checked)} />}
              label="Apply patches automatically"
            />
            <label className="text-sm text-gray-500 dark:text-gray-400">File upload (optional)</label>
            <input type="file" onChange={handleFileChange} />
          </div>
        </div>

        <Stack direction="row" spacing={2} className="justify-end">
          <Button
            variant="outlined"
            color="inherit"
            onClick={() => {
              setUserPrompt("");
              setProjectRoot("");
              setScanPaths([]);
              setAdditionalInstructions("");
              setScanPathInput("");
              setExpectedOutputFormat("JSON");
              setMaxThoughtBullets(4);
              setApplyDirectly(false);
              setFileData(undefined);
              setFileMimeType(undefined);
            }}
          >
            Reset
          </Button>
          <Button variant="contained" color="primary" disabled={!canSubmit} onClick={handleSubmit}>
            Generate Plan
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}
