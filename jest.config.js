module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/nodes/**/*.spec.ts'],
  collectCoverageFrom: [
    'nodes/**/*.ts',
    '!nodes/**/*.d.ts',
    '!nodes/**/index.ts',
    '!nodes/**/*.spec.ts'
  ],
  coverageThreshold: {
    global: {
      branches: 60,
      functions: 100,
      lines: 75,
      statements: 75
    }
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: 'tsconfig.json',
    }]
  }
};
