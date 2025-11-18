/**
 * Interfaces for the LLM Prompt Generator feature.
 */

/**
 * Represents the input fields for generating an LLM prompt.
 */
export interface IPromptGeneratorInputs {
  rolePersona: string;
  taskGoal: string;
  contextInputData: string;
  formatOutputConstraints: string; // Natural language or simplified schema spec
  negativeConstraints: string;
  example: string;
  expectedOutputSchema: string; // User-provided JSON schema string
}

/**
 * Represents the generated LLM system prompt and its expected JSON schema.
 */
export interface IPromptGeneratorOutput {
  generatedSystemPrompt: string;
  generatedJsonSchema: string;
}