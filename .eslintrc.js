module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: ['./tsconfig.json'],
    tsconfigRootDir: __dirname,
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'prettier', // eslint-config-prettier
  ],
  env: {
    node: true,
    jest: true,
    es2021: true,
  },
  rules: {
    '@typescript-eslint/explicit-module-boundary-types': 'off',
  },
};
