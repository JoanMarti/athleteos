module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: 'src',
  testRegex: '.*\\.test\\.ts$',
  transform: { '^.+\\.(t|j)s$': 'ts-jest' },
  collectCoverageFrom: ['**/*.(t|j)s', '!**/*.module.ts', '!**/main.ts'],
  coverageDirectory: '../coverage',
  moduleNameMapper: {
    '^@athleteos/types$': '<rootDir>/../../packages/types/src/index.ts',
    '^@athleteos/utils$': '<rootDir>/../../packages/utils/src/index.ts',
    '^@athleteos/mocks$': '<rootDir>/../../packages/mocks/src/index.ts',
  },
}
