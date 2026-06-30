import eienjs from '@eienjs/eslint-config';

export default eienjs({
  adonisjs: true,
  markdown: true,
  typescript: {
    tsconfigPath: 'tsconfig.json',
    erasableSyntaxOnly: {
      parameterProperties: false,
    },
  },
}).append({
  rules: {
    '@typescript-eslint/restrict-template-expressions': 'off',
    '@typescript-eslint/no-base-to-string': 'off',
  },
}, {
  files: ['src/define_config.ts'],
  rules: {
    '@typescript-eslint/require-await': 'off',
  },
}, {
  files: ['tests/**/*.ts'],
  rules: {
    'e18e/prefer-static-regex': 'off',
    '@typescript-eslint/no-unsafe-call': 'off',
    '@typescript-eslint/no-unsafe-member-access': 'off',
    '@typescript-eslint/promise-function-async': 'off',
  },
});
