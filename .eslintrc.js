module.exports = {
  parser: '@typescript-eslint/parser',
  extends: [
    'plugin:react/recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:import/errors',
    'plugin:import/warnings',
    'plugin:import/typescript',
  ],
  plugins: ['prettier', 'import'],
  ignorePatterns: ['packages/*/lib', '*.js', 'generated'],
  rules: {
    'prettier/prettier': 'error',
    'no-unused-vars': 'off',
    'import/order': ['warn', { alphabetize: { order: 'asc' } }],
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
  },
};
