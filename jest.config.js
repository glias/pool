const { join } = require('path');

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: 'packages',
  testMatch: ['<rootDir>/**/*.spec.ts'],
  setupFiles: ['regenerator-runtime/runtime'],
  globals: {
    'ts-jest': {
      babelConfig: true,
    },
  },
};
