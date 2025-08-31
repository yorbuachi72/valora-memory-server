/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  clearMocks: true,
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageProvider: 'v8',
  extensionsToTreatAsEsm: ['.ts'],
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      useESM: true,
      tsconfig: {
        module: 'ESNext',
        target: 'ES2022',
      },
    }],
    '^.+\\.js$': ['ts-jest', {
      useESM: true,
    }],
  },
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
    '^lowdb$': '<rootDir>/src/__mocks__/lowdb.js',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(supertest|lowdb|@xenova|@huggingface)/)',
  ],
  testMatch: [
    '<rootDir>/src/**/*.test.ts',
  ],
}; 