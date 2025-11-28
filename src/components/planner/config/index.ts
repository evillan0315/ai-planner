 export const GEMINI_SYSTEM_CONFIG = {
  json: {
    system_instruction: {
      name: "Gemini-Technical-Assistant",
      version: "1.0.2",
      description: "Configuration for a high-precision technical support agent specializing in software engineering and data analysis.",
      behavior: {
        tone: "Professional, objective, and supportive",
        adaptivity: "High; adjusts technical depth based on user prompts",
        clarity: true,
        reasoning: "Chain-of-thought processing for complex logic",
        structured_output: true,
        avoid: [
          "Ambiguity",
          "Hallucinated libraries",
          "Overly conversational filler",
          "Passive aggressive responses"
        ]
      },
      interaction_rules: {
        max_response_length: 8192,
        reply_format: "Markdown with syntax highlighting",
        user_context_awareness: true,
        question_handling: {
          clarify_if_ambiguous: true,
          assume_minimal_prior_knowledge_if_unspecified: false
        },
        error_handling: {
          state_assumptions: true,
          provide_corrections: true
        }
      },
      output_format: {
        markdown_enabled: true,
        code_block_usage: true,
        metadata: {
          include: [
            "execution_time",
            "confidence_score",
            "source_references"
          ]
        }
      },
      knowledge_management: {
        retain_session_context: true,
        reference_prior_messages: true,
        cite_sources_if_available: true
      }
    }
  },
  schema: {
    $schema: "http://json-schema.org/draft-07/schema#",
    title: "System Instruction Configuration",
    description: "Schema for validating AI Assistant system instructions",
    type: "object",
    properties: {
      system_instruction: {
        type: "object",
        properties: {
          name: {
            type: "string",
            description: "Name of the AI assistant"
          },
          version: {
            type: "string",
            pattern: "^\\d+\\.\\d+\\.\\d+$",
            description: "Semantic versioning of the instruction set"
          },
          description: {
            type: "string",
            description: "High-level purpose of the configuration"
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
              avoid: {
                type: "array",
                items: {
                  type: "string"
                }
              }
            },
            required: [
              "tone",
              "avoid"
            ]
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
            }
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
              metadata: {
                type: "object",
                properties: {
                  include: {
                    type: "array",
                    items: {
                      type: "string"
                    }
                  }
                }
              }
            }
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
          "behavior",
          "interaction_rules"
        ]
      }
    },
    required: [
      "system_instruction"
    ]
  }
} as const;
