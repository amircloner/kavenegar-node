/**
 * Jest root configuration defining three projects: unit, integration, functional.
 * Each project can have its own testMatch pattern.
 */
module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>'],
  projects: [
    {
      displayName: 'unit',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/tests/unit/**/*.test.ts'],
      transform: { '^.+\\.(t|j)sx?$': ['ts-jest', { tsconfig: 'tsconfig.json' }] },
      moduleFileExtensions: ['ts', 'js', 'json']
    },
    {
      displayName: 'integration',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/tests/integration/**/*.test.ts'],
      transform: { '^.+\\.(t|j)sx?$': ['ts-jest', { tsconfig: 'tsconfig.json' }] },
      moduleFileExtensions: ['ts', 'js', 'json']
    },
    {
      displayName: 'functional',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/tests/functional/**/*.test.ts'],
      transform: { '^.+\\.(t|j)sx?$': ['ts-jest', { tsconfig: 'tsconfig.json' }] },
      moduleFileExtensions: ['ts', 'js', 'json']
    }
  ],
  collectCoverageFrom: ['src/**/*.ts', '!**/dist/**'],
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      statements: 35,
      branches: 30,
      functions: 55,
      lines: 35
    }
  }
};
