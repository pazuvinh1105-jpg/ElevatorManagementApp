module.exports = {
  preset: '@react-native/jest-preset',
  transformIgnorePatterns: [
    'node_modules/(?!((@)?react-native|@react-native-community|@react-navigation|@react-native-async-storage|@react-native-documents)/)',
  ],
  setupFiles: ['./jest.setup.js'],
};
