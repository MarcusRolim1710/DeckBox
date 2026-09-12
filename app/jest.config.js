module.exports = {
  preset: 'jest-expo',
  testMatch: ['**/tests/**/*.test.ts', '**/tests/**/*.test.tsx'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  transformIgnorePatterns: ['node_modules/(?!(jest-)?react-native|@react-native|@expo|expo-.*)'],
  collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/**/*.d.ts'],
};
