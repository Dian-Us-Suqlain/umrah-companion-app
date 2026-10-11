const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  { ignores: ['dist/*', 'ios/*', 'android/*', '.expo/*'] },
  {
    // Trip logic stays plain TypeScript: no React, no device APIs, no screens.
    files: ['src/core/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: ['react', 'react-native'],
          patterns: ['react/*', 'react-native/*', 'react-native-*', 'expo', 'expo-*', 'expo/*', '@expo/*', '@/app/*', '@/ui/*', '@/data/*', '../app/*', '../ui/*', '../data/*'],
        },
      ],
    },
  },
]);
