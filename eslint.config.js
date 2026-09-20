import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  // `.worktrees/*` holds git worktrees of this same repo: linting from the
  // root would walk them, and a per-file override like the one below would
  // not match their copies (the paths are relative to this config).
  globalIgnores(['dist', 'dist-server', '.worktrees']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
  },
  {
    // The prerender entry runs in Node at build time and is never part of an
    // HMR graph, so the Fast-Refresh rule about mixed exports does not apply:
    // re-exporting the meta tables is the whole point of the file.
    files: ['src/entry-server.tsx'],
    rules: { 'react-refresh/only-export-components': 'off' },
  },
])
