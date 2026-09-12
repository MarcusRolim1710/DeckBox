// Mock expo modules for unit tests
jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: jest.fn(),
}));
jest.mock('expo-file-system/legacy', () => ({
  cacheDirectory: 'file:///cache/',
  documentDirectory: 'file:///cache/',
  downloadAsync: jest.fn(() => Promise.resolve({ uri: 'file:///cache/deckbox/images/LOB-001.jpg' })),
  getInfoAsync: jest.fn(() => Promise.resolve({ exists: true })),
  deleteAsync: jest.fn(() => Promise.resolve()),
  makeDirectoryAsync: jest.fn(() => Promise.resolve()),
}));
