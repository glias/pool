const { join } = require('path');

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['packages', 'apps/server'],
  testMatch: ['<rootDir>/**/*.spec.ts'],
  setupFiles: ['regenerator-runtime/runtime'],
  globals: {
    'ts-jest': {
      babelConfig: true,
    },
  },
};
