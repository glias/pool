module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: 'packages',
  testMatch: ['<rootDir>/**/*.spec.ts'],
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.json',
    },
  },
};
