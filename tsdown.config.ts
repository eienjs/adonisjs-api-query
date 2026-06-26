import { defineConfig } from 'tsdown';
import { StaleGuardRecorder } from 'tsdown-stale-guard';

export default defineConfig({
  entry: ['index.ts', 'src/types.ts', 'providers/api_query_provider.ts'],
  outDir: 'build',
  clean: true,
  format: 'esm',
  minify: 'dce-only',
  fixedExtension: false,
  dts: true,
  treeshake: false,
  sourcemap: false,
  target: 'esnext',
  exports: true,
  // exports: {
  //   customExports(pkg, _context) {
  //     pkg['./commands'] = './build/commands/main.js';

  //     return pkg;
  //   },
  // }, // Add this back when need commands
  unbundle: true,
  copy: [
    { from: 'stubs/**/*.stub', to: 'build/stubs', flatten: false },
  ],
  plugins: [
    StaleGuardRecorder(),
  ],
});
