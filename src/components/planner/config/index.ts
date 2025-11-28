import { deepMerge } from "@/components/planner/utils/objectUtils"; // Assuming a deepMerge utility exists or needs to be defined/imported for safety
// Importing default config structure reference for context, even if not directly used in DEFAULT_SYSTEM_CONFIG initialization
import REF_CONFIG from './system_instruction_reference.json';

// Since we don't see objectUtils.ts, we must define a minimal deep merge or stick to shallow merge if overrides are simple.
// For this scope, I will define a very basic object merge capable of handling the structure, assuming we only need to overwrite top-level/known nested structures if provided in overrides.

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
      description: "Highly optimized agent configuration enforcing structured markdown output based on production-grade standards.",
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
        max_response_length: 16384, // Increased capacity for comprehensive plans
        reply_format: "Markdown, strictly adhering to the 12-section plan structure",
        user_context_awareness: true,
        question_handling: {
          clarify_if_ambiguous: false, // Must adhere to provided constraints strictly
          assume_minimal_prior_knowledge_if_unspecified: true
        },
        error_handling: {
          state_assumptions: true,
          provide_corrections: true
        }
      },
      output_format: {
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
        ]
      },
      knowledge_management: {
        retain_session_context: true,
        reference_prior_messages: true,
        cite_sources_if_available: false // Focus solely on generated output quality
      }
    }
  },
  schema: {
    $schema: "http://json-schema.org/draft-07/schema#",
    title: "Optimized Production System Instruction Configuration",
    description: "Schema for validating the high-adherence production-grade AI assistant configuration.",
    type: "object",
    properties: {
      system_instruction: {
        type: "object",
        properties: {
          name: {
            type: "string"
          },
          version: {
            type: "string",
            pattern: "^\\d+\\.\\d+\\.\\d+$"
          },
          description: {
            type: "string"
          },
          instruction_source: {
            type: "string"
          },
          behavior: {
            type: "object",
            properties: {
              tone: {
                type: "string"
              },
              adaptivity: {
                type: "string"
              },
              clarity: {
                type: "boolean"
              },
              reasoning: {
                type: "string"
              },
              structured_output: {
                type: "boolean"
              },
              enforce_output_sections: {
                type: "boolean"
              },
              avoid: {
                type: "array",
                items: { type: "string" }
              }
            },
            required: ["tone", "avoid", "structured_output", "enforce_output_sections"]
          },
          interaction_rules: {
            type: "object",
            properties: {
              max_response_length: {
                type: "integer"
              },
              reply_format: {
                type: "string"
              },
              user_context_awareness: {
                type: "boolean"
              },
              question_handling: {
                type: "object",
                properties: {
                  clarify_if_ambiguous: {
                    type: "boolean"
                  },
                  assume_minimal_prior_knowledge_if_unspecified: {
                    type: "boolean"
                  }
                }
              },
              error_handling: {
                type: "object",
                properties: {
                  state_assumptions: {
                    type: "boolean"
                  },
                  provide_corrections: {
                    type: "boolean"
                  }
                }
              }
            },
            required: ["reply_format"]
          },
          output_format: {
            type: "object",
            properties: {
              markdown_enabled: {
                type: "boolean"
              },
              code_block_usage: {
                type: "boolean"
              },
              enforce_plan_structure: {
                type: "boolean"
              },
              required_sections: {
                type: "array",
                items: { type: "string" }
              }
            },
            required: ["markdown_enabled", "enforce_plan_structure", "required_sections"]
          },
          knowledge_management: {
            type: "object",
            properties: {
              retain_session_context: {
                type: "boolean"
              },
              reference_prior_messages: {
                type: "boolean"
              },
              cite_sources_if_available: {
                type: "boolean"
              }
            }
          }
        },
        required: [
          "name",
          "version",
          "description",
          "behavior",
          "interaction_rules",
          "output_format"
        ]
      }
    },
    required: [
      "system_instruction"
    ]
  }
} as const;

interface ISystemInstructionOverride {
    system_instruction?: {
        name?: string;
        version?: string;
        description?: string;
        instruction_source?: string;
        behavior?: any;
        interaction_rules?: any;
        output_format?: any;
        knowledge_management?: any;
    };
  }

export type TAIInstructionConfig = typeof DEFAULT_SYSTEM_CONFIG;

/**
 * Retrieves the default AI system instruction configuration, optionally merging runtime overrides.
 * This allows modifying system instructions or adding new instruction sets dynamically.
 * 
 * @param overrides Configuration fragments to merge into the default structure.
 * @returns The resulting validated configuration object.
 */
export const getAIInstructionConfig = (overrides?: ISystemInstructionOverride) => {
    if (!overrides || !overrides.system_instruction) {
        return DEFAULT_SYSTEM_CONFIG;
    }

    const mergedJson = safeDeepMerge(DEFAULT_SYSTEM_CONFIG.json, overrides);

    // Since the schema validation relies on the structure being present, we merge the JSON part
    // and keep the schema definition static as it describes the structure itself.
    return {
        ...DEFAULT_SYSTEM_CONFIG,
        json: mergedJson,
    } as TAIInstructionConfig;
};
