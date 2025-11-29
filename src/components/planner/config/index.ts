import REF_CONFIG from '/system_instruction_reference.json';

// Utility for deep merging objects, required for safe runtime configuration updates
const safeDeepMerge = (target: any, source: any): any => {
    if (!source || typeof source !== 'object') return target;
    if (!target || typeof target !== 'object') return source;

    const output = Array.isArray(target) ? [...target] : { ...target };

    Object.keys(source).forEach((key) => {
        if (source[key] === Object(source[key]) && target[key] === Object(target[key])) {
            output[key] = safeDeepMerge(target[key], source[key]);
        } else {
            output[key] = source[key];
        }
    });

    return output;
};

export const DEFAULT_SYSTEM_CONFIG = {
  json: {
    system_instruction: {
      name: "AI-Code-Change-Planner-Optimized",
      version: "2.0.0",
      description: "Highly optimized agent configuration enforcing structured output based on production-grade standards. Supports Markdown and JSON output.",
      instruction_source: "production-grade-markdown-schema-instruction-optimized.md",
      behavior: {
        tone: "Strictly professional, deterministic, and objective",
        adaptivity: "Low to medium; prioritize adherence to schema/format over conversational nuance",
        clarity: true,
        reasoning: "Explicit Chain-of-Thought required before outputting structured sections",
        structured_output: true,
        enforce_output_sections: true,
        avoid: [
          "Speculation without explicit assumption tagging",
          "Non-markdown or JSON output outside specified structure",
          "Use of deprecated syntax or non-production features"
        ]
      },
      interaction_rules: {
        max_response_length: 16384,
        reply_format: "Structured output based on selected output_type",
        output_type: "Markdown", // <--- NEW: Selects the primary output format
        user_context_awareness: true,
        question_handling: {
          clarify_if_ambiguous: false,
          assume_minimal_prior_knowledge_if_unspecified: true
        },
        error_handling: {
          state_assumptions: true,
          provide_corrections: true
        }
      },
      output_format: {
        // MARKDOWN CONFIGURATION
        markdown_enabled: true,
        code_block_usage: true,
        enforce_plan_structure: true,
        required_sections: [
          "1. Executive Summary",
          "2. Assumptions, Constraints, and Risks",
          "3. Production Implementation Plan",
          "4. Final Code",
          "5. Automated Tests",
          "6. Commit Message",
          "7. Pull Request Description",
          "8. Validation & QA Checklist",
          "9. Observability & Monitoring",
          "10. Backward Compatibility & Migration",
          "11. Security Considerations",
          "12. Effort & Scope Estimate"
        ],
        // JSON CONFIGURATION <--- NEW: Added JSON output structure
        json_output: {
          enabled: true,
          root_key: "ai_code_plan",
          required_fields: [
            "executive_summary",
            "implementation_plan",
            "final_code",
            "automated_tests"
          ],
          schema_validation_required: true
        },
        // COMMON OUTPUT RULES
        json_schema_compliance: true,
        vite_react_ts_tailwind: true,
        metadata_block_required: true
      },
      knowledge_management: {
        retain_session_context: true,
        reference_prior_messages: true,
        cite_sources_if_available: false
      },
      code_generation_rules: {
        language: "TypeScript",
        framework: "React 18",
        bundler: "Vite 5",
        styling: "Tailwind CSS v4",
        file_extensions: [".ts", ".tsx"],
        strict_typing: true,
        use_functional_components: true,
        hooks_required: true,
        component_size_guideline: "Small, composable, single-responsibility components",
        project_structure_required: true
      }
    }
  },
  schema: {
    "$schema": "http://json-schema.org/draft-07/schema#",
    "title": "Optimized Production System Instruction Configuration",
    "description": "Schema for validating the high-adherence production-grade AI assistant configuration, including code-generation metadata.",
    "type": "object",
    "properties": {
      "system_instruction": {
        "type": "object",
        "properties": {
          "name": { "type": "string" },
          "version": { "type": "string", "pattern": "^\\d+\\.\\d+\\.\\d+$" },
          "description": { "type": "string" },
          "instruction_source": { "type": "string" },
          "behavior": {
            "type": "object",
            "properties": {
              "tone": { "type": "string" },
              "adaptivity": { "type": "string" },
              "clarity": { "type": "boolean" },
              "reasoning": { "type": "string" },
              "structured_output": { "type": "boolean" },
              "enforce_output_sections": { "type": "boolean" },
              "avoid": { "type": "array", "items": { "type": "string" } }
            },
            "required": ["tone", "avoid", "structured_output", "enforce_output_sections"]
          },
          "interaction_rules": {
            "type": "object",
            "properties": {
              "max_response_length": { "type": "integer" },
              "reply_format": { "type": "string" },
              "output_type": { "type": "string", "enum": ["Markdown", "JSON"] }, // <--- UPDATED
              "user_context_awareness": { "type": "boolean" },
              "question_handling": {
                "type": "object",
                "properties": {
                  "clarify_if_ambiguous": { "type": "boolean" },
                  "assume_minimal_prior_knowledge_if_unspecified": { "type": "boolean" }
                }
              },
              "error_handling": {
                "type": "object",
                "properties": {
                  "state_assumptions": { "type": "boolean" },
                  "provide_corrections": { "type": "boolean" }
                }
              }
            },
            "required": ["reply_format", "output_type"] // <--- UPDATED
          },
          "output_format": {
            "type": "object",
            "properties": {
              "markdown_enabled": { "type": "boolean" },
              "code_block_usage": { "type": "boolean" },
              "enforce_plan_structure": { "type": "boolean" },
              "required_sections": { "type": "array", "items": { "type": "string" } },
              // JSON OUTPUT SCHEMA <--- NEW
              "json_output": {
                "type": "object",
                "properties": {
                  "enabled": { "type": "boolean" },
                  "root_key": { "type": "string" },
                  "required_fields": { "type": "array", "items": { "type": "string" } },
                  "schema_validation_required": { "type": "boolean" }
                },
                "required": ["enabled", "root_key", "required_fields", "schema_validation_required"]
              },
              // END JSON OUTPUT SCHEMA
              "json_schema_compliance": { "type": "boolean" },
              "vite_react_ts_tailwind": { "type": "boolean" },
              "metadata_block_required": { "type": "boolean" }
            },
            "required": [
              "markdown_enabled",
              "enforce_plan_structure",
              "required_sections",
              "json_output", // <--- UPDATED
              "json_schema_compliance",
              "vite_react_ts_tailwind",
              "metadata_block_required"
            ]
          },
          "knowledge_management": {
            "type": "object",
            "properties": {
              "retain_session_context": { "type": "boolean" },
              "reference_prior_messages": { "type": "boolean" },
              "cite_sources_if_available": { "type": "boolean" }
            }
          },
          "code_generation_rules": {
            "type": "object",
            "properties": {
              "language": { "type": "string", "enum": ["TypeScript"] },
              "framework": { "type": "string", "enum": ["React 18"] },
              "bundler": { "type": "string", "enum": ["Vite 5"] },
              "styling": { "type": "string", "enum": ["Tailwind CSS v4"] },
              "file_extensions": { "type": "array", "items": { "type": "string" } },
              "strict_typing": { "type": "boolean" },
              "use_functional_components": { "type": "boolean" },
              "hooks_required": { "type": "boolean" },
              "component_size_guideline": { "type": "string" },
              "project_structure_required": { "type": "boolean" }
            },
            "required": [
              "language",
              "framework",
              "bundler",
              "styling",
              "file_extensions",
              "strict_typing",
              "use_functional_components",
              "hooks_required",
              "component_size_guideline",
              "project_structure_required"
            ]
          }
        },
        "required": [
          "name",
          "version",
          "description",
          "behavior",
          "interaction_rules",
          "output_format",
          "code_generation_rules"
        ]
      }
    },
    "required": ["system_instruction"]
  }
} as const;

export interface ISystemInstructionOverride {
  system_instruction?: {
    name?: string;
    version?: string;
    description?: string;
    instruction_source?: string;
    behavior?: any;
    interaction_rules?: { // <--- UPDATED INTERFACE
      output_type?: "Markdown" | "JSON";
      [key: string]: any;
    };
    output_format?: { // <--- UPDATED INTERFACE
      json_output?: {
        enabled?: boolean;
        root_key?: string;
        required_fields?: string[];
        schema_validation_required?: boolean;
      };
      [key: string]: any;
    };
    knowledge_management?: any;
    code_generation_rules?: any;
  };
}

export type TAIInstructionConfig = typeof DEFAULT_SYSTEM_CONFIG;

/**
 * Retrieves the default AI system instruction configuration, optionally merging runtime overrides.
 * @param overrides Configuration fragments to merge into the default structure.
 * @returns The resulting validated configuration object.
 */
export const getAIInstructionConfig = (overrides?: ISystemInstructionOverride) => {
  if (!overrides || !overrides.system_instruction) {
    return DEFAULT_SYSTEM_CONFIG;
  }

  const mergedJson = safeDeepMerge(DEFAULT_SYSTEM_CONFIG.json, overrides);

  return {
    ...DEFAULT_SYSTEM_CONFIG,
    json: mergedJson
  } as TAIInstructionConfig;
};