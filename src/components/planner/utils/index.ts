
import type { ILlmInput } from '../types'; 
import  { getMonacoLanguage } from '@/utils/editorUtils'; 

export async function buildLLMPrompt(
  llmInput: ILlmInput,
  scannedFiles: [],
  projectStructure: string
): Promise<string> {
  const formattedRelevantFiles = scannedFiles
    .map((file) => {
      const filePath = llmInput.projectRoot
        ? `${llmInput.projectRoot}/${file.relativePath}`
        : file.relativePath;

      const language = getMonacoLanguage(file.relativePath);

      return [
        '```' + language,
        `// File: ${filePath}`,
        file.content,
        '```',
      ].join('\n');
    })
    .join('\n\n');

  const prompt = `
# User Request - AI Code Generation Request
${llmInput.userPrompt}

## Project Context
${projectStructure}

### Relevant Files (for analysis)
${formattedRelevantFiles}
`;

  return prompt.trim();
}


export async function extractJsonFromMarkdown(text: string): string {
    const jsonBlockRegex = /```json\n([\s\S]*?)\n```/;
    const match = text.match(jsonBlockRegex);
    if (match && match[1]) {
      return match[1].trim();
    }
    return text.trim();
  }
