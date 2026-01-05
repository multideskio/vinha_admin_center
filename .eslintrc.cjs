/**
 * @fileoverview Configuração do ESLint para o projeto.
 * @version 1.0
 * @date 2024-08-07
 * @author PH
 */
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'unused-imports'],
  extends: [
    'next/core-web-vitals',
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/strict',
  ],
  ignorePatterns: ['*.md', 'docs/**/*.md'],
  rules: {
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/no-non-null-assertion': 'warn',
    '@typescript-eslint/triple-slash-reference': 'off',
    'unused-imports/no-unused-imports': 'error',
    'react/no-unescaped-entities': 'error',
  },
}
