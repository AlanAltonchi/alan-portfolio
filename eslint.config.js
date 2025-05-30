import js from "@eslint/js";
import svelte from 'eslint-plugin-svelte';
import { defineConfig } from "eslint/config";
import globals from "globals";
import tseslint from "typescript-eslint";
import svelteConfig from './svelte.config.js';

export default defineConfig([
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...svelte.configs['flat/recommended'],
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node
      }
    }
  },
  {
    files: ['**/*.svelte'],
    languageOptions: {
      parserOptions: {
        parser: tseslint.parser,
        extraFileExtensions: ['.svelte'],
        svelteConfig
      }
    }
  },
  {
    files: ['**/*.svelte.ts'],
    languageOptions: {
      parser: tseslint.parser,
      globals: {
        ...globals.browser,
        ...globals.node
      }
    }
  },
  {
    files: ['**/*.{js,mjs,cjs,ts,mts,cts}'],
    languageOptions: {
      globals: globals.browser
    }
  },
  {
    ignores: [
      '.svelte-kit/**',
      'build/**',
      'dist/**',
      'node_modules/**'
    ]
  },
  {
    rules: {
      // Disable @html warnings - we use it intentionally for:
      // - Markdown rendering (which is sanitized by marked library)
      // - Hardcoded HTML in auth pages (not user input)
      // - Simple text replacements (mentions)
      'svelte/no-at-html-tags': 'off',
      // Allow empty interfaces for extending base types
      '@typescript-eslint/no-empty-object-type': 'warn',
      // Allow underscore-prefixed unused variables
      '@typescript-eslint/no-unused-vars': ['error', { 
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_'
      }]
    }
  }
]);
