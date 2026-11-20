// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config')
const expoConfig = require('eslint-config-expo/flat')

module.exports = defineConfig([
  expoConfig,
  { ignores: ['dist/*', '.expo/*'] },
  // Expo modules re-export through `export *`, which this rule cannot follow; TypeScript checks names.
  { rules: { 'import/namespace': 'off' } },
])
