import type { Config } from '@jest/types';

type JestConfig = Config.InitialOptions;

const jestConfig: JestConfig = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.spec.ts',
    '<rootDir>/scripts/__tests__/**/*.spec.js',
    '<rootDir>/test/integration/**/*.spec.ts',
    '<rootDir>/test/e2e/**/*.e2e-spec.ts',
  ],
  transform: {
    '^.+\\.(t|j)s$': ['ts-jest', { useESM: true }],
  },
  collectCoverageFrom: [
    'src/**/*.(t|j)s',
    '!src/**/__tests__/**',
    '!src/**/__mocks__/**',
    '!src/**/*.spec.ts',
    '!src/**/*.d.ts',
  ],
  coverageDirectory: 'coverage',
  testEnvironment: 'node',
  testPathIgnorePatterns: ['/node_modules/', '/dist/', '/__mocks__/'],
  transformIgnorePatterns: ['node_modules/(?!(.pnpm/jose@|jose))'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  extensionsToTreatAsEsm: ['.ts'],
  preset: 'ts-jest/presets/default-esm',
};

export default jestConfig;
