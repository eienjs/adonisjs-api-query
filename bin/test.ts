import process from 'node:process';
import { assert } from '@japa/assert';
import { configure, processCLIArgs, run } from '@japa/runner';
import { ndjson, spec } from '@japa/runner/reporters';

processCLIArgs(process.argv.splice(2));
configure({
  files: ['tests/**/*.spec.ts'],
  plugins: [assert()],
  reporters: {
    activated: ['spec'],
    list: [ndjson(), spec()],
  },
});

void run();
