// Import MonacoEditor
import * as path from 'path-browserify';

export const getMonacoLanguage = (filePath: string): string => {
  if (!filePath) return 'plaintext';
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case '.ts':
    case '.tsx':
      return 'typescript';
    case '.js':
    case '.jsx':
      return 'javascript';
    case '.json':
      return 'json';
    case '.css':
      return 'css';
    case '.scss':
      return 'scss';
    case '.less':
      return 'less';
    case '.html':
    case '.htm':
      return 'html';
    case '.xml':
      return 'xml';
    case '.md':
    case '.markdown':
      return 'markdown';
    case '.py':
      return 'python';
    case '.java':
      return 'java';
    case '.c':
    case '.cpp':
      return 'cpp';
    case '.cs':
      return 'csharp';
    case '.go':
      return 'go';
    case '.php':
      return 'php';
    case '.rb':
      return 'ruby';
    case '.rs':
      return 'rust';
    case '.sql':
      return 'sql';
    case '.sh':
    case '.bash':
      return 'shell';
    case '.yml':
    case '.yaml':
      return 'yaml';
    case '.env':
      return 'plaintext'; // .env files are typically plaintext
    case '.dockerfile':
      return 'dockerfile';
    case '.gitignore':
      return 'plaintext';
    default:
      return 'plaintext';
  }
};
