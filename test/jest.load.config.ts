module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '../',
  testRegex: 'test/integration/load/load-test\\.js$',
  transform: {
    '^.+\\.js$': 'babel-jest',
  },
  collectCoverageFrom: ['**/*.(t|j)s'],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^src/(.*)$': '<rootDir>/src/$1',
    '^test/(.*)$': '<rootDir>/test/integration/load/$1',
  },
  maxWorkers: 1,
  testTimeout: 30_000,
};
