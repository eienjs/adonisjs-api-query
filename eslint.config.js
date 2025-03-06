// @ts-check
import nodecfdiConfig from '@nodecfdi/eslint-config';

const { defineConfig } = nodecfdiConfig(import.meta.dirname, { adonisjs: true, sonarjs: true, n: true });

export default defineConfig({
  rules: {
    'unicorn/no-array-reduce': 'off',
    'unicorn/prefer-spread': 'off',
  },
});
