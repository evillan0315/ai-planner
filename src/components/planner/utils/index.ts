
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

/**
 * Truncates a file path to show start/end segments for display.
 * @param filePath The full file path.
 * @param maxLength Maximum allowed length before truncation.
 */
export const truncatePathDisplay = (filePath: string, maxLength = 60): string => {
    if (!filePath || filePath.length <= maxLength) return filePath;

    //const parts = filePath.split(/[/\]/);
    const parts = filePath.split(/[/\\]/);
    const fileName = parts[parts.length - 1];
    
    // Reserve space for filename and ellipsis/separator
    const remainingSpace = maxLength - fileName.length - 3; // -3 for '.../'

    if (remainingSpace <= 0) {
        return `...${fileName.slice(-maxLength + 3)}`;
    }
    
    const start = filePath.slice(0, remainingSpace);
    const lastSeparatorIndex = Math.max(start.lastIndexOf('/'), start.lastIndexOf('\\'));
    const finalStart = lastSeparatorIndex > 0 ? start.slice(0, lastSeparatorIndex) : start;
    
    return `${finalStart}/.../${fileName}`;
};
