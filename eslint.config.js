import js from '@eslint/js';

// Config deliberadamente pragmática: el objetivo es atrapar errores reales
// (variables no definidas, código inalcanzable, casos de switch caídos sin
// "break", etc.), no forzar un rediseño de estilo sobre un archivo ya grande
// y con un estilo terso propio (nombres de una letra, sin punto y coma en
// algunos lugares). Las reglas de estilo puramente estéticas quedan fuera.
export default [
  js.configs.recommended,
  {
    files: ['src/**/*.js'],
    ignores: ['src/**/*.test.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        window: 'readonly',
        document: 'readonly',
        localStorage: 'readonly',
        location: 'readonly',
        navigator: 'readonly',
        console: 'readonly',
        alert: 'readonly',
        confirm: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        requestAnimationFrame: 'readonly',
        AudioContext: 'readonly',
        webkitAudioContext: 'readonly',
        Blob: 'readonly',
        URL: 'readonly',
        FileReader: 'readonly',
      },
    },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-undef': 'error',
      'no-fallthrough': 'error',
      'no-dupe-keys': 'error',
      'no-unreachable': 'error',
      'no-constant-condition': ['error', { checkLoops: false }],
    },
  },
  {
    files: ['src/**/*.test.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        describe: 'readonly',
        it: 'readonly',
        expect: 'readonly',
      },
    },
  },
  {
    ignores: ['dist/**', 'node_modules/**'],
  },
];
