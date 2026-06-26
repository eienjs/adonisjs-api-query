import eienjs from '@eienjs/eslint-config';

export default eienjs({
  adonisjs: true,
  typescript: {
    tsconfigPath: 'tsconfig.json',
    erasableSyntaxOnly: {
      parameterProperties: false,
    },
  },
}).append({
  files: ['providers/*.ts'],
  rules: {
    '@typescript-eslint/method-signature-style': 'off',
  },
}, {
  files: ['src/bindings/*.ts'],
  rules: {
    'unicorn/no-this-outside-of-class': 'off',
  },
});
