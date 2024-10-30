module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testRegex: 'test/.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: ['**/*.(t|j)s'],
  setupFilesAfterEnv: [
    '<rootDir>/test/integration/test-containers/setup-tests.ts',
  ],
  globalSetup: '<rootDir>/test/integration/test-containers/global-setup.ts',
  globalTeardown:
    '<rootDir>/test/integration/test-containers/global-teardown.ts',
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^src/(.*)$': '<rootDir>/src/$1',
    '^test/(.*)$': '<rootDir>/test/$1',
  },
  maxWorkers: 1,
  testTimeout: 30_000,
};
