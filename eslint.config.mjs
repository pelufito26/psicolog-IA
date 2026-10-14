import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import hooks from 'eslint-plugin-react-hooks';
import refresh from 'eslint-plugin-react-refresh';
import globals from 'globals';
import prettier from 'eslint-config-prettier';

export default [
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/coverage/**',
      'docs/metodologia/referencia/**',
    ],
  },
  { ...js.configs.recommended, files: ['**/*.{js,mjs,ts,tsx}'] },
  ...tseslint.configs.recommended,
  {
    files: ['*.{js,mjs}', 'apps/api/**/*.ts', 'apps/web/vite.config.ts'],
    languageOptions: { globals: globals.node },
  },
  { files: ['apps/web/src/**/*.{ts,tsx}'], languageOptions: { globals: globals.browser } },
  {
    files: ['apps/web/src/**/*.{ts,tsx}'],
    plugins: { 'react-hooks': hooks },
    rules: { 'react-hooks/rules-of-hooks': 'error', 'react-hooks/exhaustive-deps': 'error' },
  },
  {
    files: ['apps/web/src/**/*.{ts,tsx}'],
    ignores: ['**/*.test.{ts,tsx}'],
    plugins: { 'react-refresh': refresh },
    rules: { 'react-refresh/only-export-components': ['error', { allowConstantExport: true }] },
  },
  prettier,
];
