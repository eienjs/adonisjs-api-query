import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const stubsRoot = path.dirname(fileURLToPath(import.meta.url));
