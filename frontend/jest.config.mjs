import nextJest from 'next/jest.js';

// next/jest wires up TypeScript/SWC and the "@/..." imports for us.
const createJestConfig = nextJest({ dir: './' });

export default createJestConfig({
  testEnvironment: 'jest-environment-jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: { '^@/(.*)$': '<rootDir>/$1' },
  testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/.next/'],
});
