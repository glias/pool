module.exports = {
  parser: '@typescript-eslint/parser',
  extends: ['plugin:react/recommended', 'plugin:@typescript-eslint/recommended'],
  plugins: ['prettier'],
  ignorePatterns: ['packages/*/lib', '*.js'],
  rules: {
    'prettier/prettier': 'error'
  },
};
