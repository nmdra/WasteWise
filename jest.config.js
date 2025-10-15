module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
  },
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|firebase)',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@services/(.*)$': '<rootDir>/services/$1',
    '^@constants/(.*)$': '<rootDir>/constants/$1',
    '^@config/(.*)$': '<rootDir>/config/$1',
  },
  collectCoverageFrom: [
    'services/**/*.{js,jsx}',
    'constants/**/*.{js,jsx}',
    '!**/node_modules/**',
    '!**/vendor/**',
    '!**/__tests__/**',
    '!**/coverage/**',
  ],
  coverageThreshold: {
    global: {
      statements: 70,
      branches: 60,
      functions: 70,
      lines: 70,
    },
  },
  testMatch: [
    '**/__tests__/**/*.[jt]s?(x)',
    '**/?(*.)+(spec|test).[jt]s?(x)',
  ],
  moduleFileExtensions: ['js', 'jsx', 'json', 'node'],
  verbose: true,
};
