import { atom } from 'nanostores';
import type { IPromptGeneratorInputs, IPromptGeneratorOutput } from '../types';

/**
 * Interface for the state of the Prompt Generator store.
 */
interface PromptGeneratorState {
  inputs: IPromptGeneratorInputs;
  output: IPromptGeneratorOutput | null;
  isLoading: boolean;
  error: string | null;
}

// Default values for the instruction generator's input fields
const defaultInputs: IPromptGeneratorInputs = {
  rolePersona: 'You are an expert TypeScript developer.',
  taskGoal: 'Generate a React functional component for user profiles.',
  contextInputData: 'The user profile component should display user name, email, and optionally a profile picture.',
  formatOutputConstraints: 'The output must be a single JSON object with two fields: `fileName` (string) and `content` (string), where `content` is the full React component code.',
  negativeConstraints: 'Do not use `any` types. Ensure all Material UI imports are correct. Do not include boilerplate comments.',
  example: 'Input: User profile component. Output: ```json { "fileName": "UserProfile.tsx", "content": "// React component code here" }```',
  expectedOutputSchema: JSON.stringify(
    {
      type: 'object',
      properties: {
        fileName: { type: 'string', description: 'The suggested file path and name for the component' },
        content: { type: 'string', description: 'The full TypeScript React functional component code' },
      },
      required: ['fileName', 'content'],
      additionalProperties: false,
    },
    null,
    2,
  ),
};

/**
 * Nanostore atom for managing the global state of the LLM Prompt Generator.
 */
export const promptGeneratorStore = atom<PromptGeneratorState>({
  inputs: defaultInputs,
  output: null,
  isLoading: false,
  error: null,
});

/**
 * Action to update a specific input field in the generator form.
 * @param key - The key of the input field to update.
 * @param value - The new value for the input field.
 */
export const setInput = <K extends keyof IPromptGeneratorInputs>(
  key: K,
  value: IPromptGeneratorInputs[K],
) => {
  promptGeneratorStore.set({
    ...promptGeneratorStore.get(),
    inputs: {
      ...promptGeneratorStore.get().inputs,
      [key]: value,
    },
  });
};

/**
 * Action to generate the complete LLM system prompt and JSON schema output
 * based on the current input fields.
 */
export const generatePromptOutput = () => {
  promptGeneratorStore.set({ ...promptGeneratorStore.get(), isLoading: true, error: null });
  try {
    const { inputs } = promptGeneratorStore.get();
    const {
      rolePersona,
      taskGoal,
      contextInputData,
      formatOutputConstraints,
      negativeConstraints,
      example,
      expectedOutputSchema,
    } = inputs;

    let systemPromptParts: string[] = [];
    if (rolePersona) systemPromptParts.push(`## Role / Persona\n\n${rolePersona}`);
    if (taskGoal) systemPromptParts.push(`## Task / Goal\n\n${taskGoal}`);
    if (contextInputData) systemPromptParts.push(`## Context / Input Data\n\n${contextInputData}`);
    if (formatOutputConstraints) systemPromptParts.push(`## Format / Output Constraints\n\n${formatOutputConstraints}`);
    if (negativeConstraints) systemPromptParts.push(`## Negative Constraints\n\n${negativeConstraints}`);
    if (example) systemPromptParts.push(`## Example\n\n${example}`);

    const generatedSystemPrompt = systemPromptParts.join('\n\n---\n\n');
    const generatedJsonSchema = expectedOutputSchema; // Directly use user's input for schema

    promptGeneratorStore.set({
      ...promptGeneratorStore.get(),
      output: {
        generatedSystemPrompt,
        generatedJsonSchema,
      },
      isLoading: false,
    });
  } catch (err) {
    promptGeneratorStore.set({
      ...promptGeneratorStore.get(),
      error: (err as Error).message || 'Failed to generate prompt output.',
      isLoading: false,
    });
  }
};

/**
 * Action to reset all input fields and the generated output to their default values.
 */
export const resetGenerator = () => {
  promptGeneratorStore.set({
    inputs: defaultInputs,
    output: null,
    isLoading: false,
    error: null,
  });
};

/**
 * Action to clear any active error message.
 */
export const clearError = () => {
  promptGeneratorStore.set({ ...promptGeneratorStore.get(), error: null });
};