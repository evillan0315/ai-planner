import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';
import { defineConfig, globalIgnores } from 'eslint/config';

export default defineConfig([
    globalIgnores(['dist']),
    {
        files: ['**/*.{ts,tsx}'],
        extends: [
            js.configs.recommended,
            tseslint.configs.recommended,
            reactHooks.configs['recommended-latest'],
            reactRefresh.configs.vite,
        ],
        languageOptions: {
            ecmaVersion: 2020,
            globals: globals.browser,
        },
        rules: {
            // Override the default @typescript-eslint/no-unused-vars rule to suppress specific false positives
            // and explicitly ignore reported variables.
            '@typescript-eslint/no-unused-vars': [
                'warn', // Keep as warn, but apply specific ignore patterns
                {
                    // Include '_' for typical unused arguments, and the specific destructured props
                    // that ESLint reports as 'args' in PlanInputForm.tsx
                    argsIgnorePattern: '^(?:_|scanPathsInput|additionalInstructions|expectedOutputFormat|fileData|fileMimeType)$',
                    // Variables that are false positives or genuinely unused, not from argument destructuring
                    varsIgnorePattern: '^(CloseIcon|IFileChange|theme|drawerErrorContentSx|IconButton|Tooltip|BugReportIcon)$',
                    caughtErrorsIgnorePattern: '^_',
                    ignoreRestSiblings: true,
                },
            ],
        },
    },
]);
