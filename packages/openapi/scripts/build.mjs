import { cpSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const packageRoot = resolve(import.meta.dirname, '..');
const sourceFile = resolve(packageRoot, 'openapi.yaml');
const outputDir = resolve(packageRoot, 'dist');
const outputFile = resolve(outputDir, 'openapi.yaml');

mkdirSync(outputDir, { recursive: true });
cpSync(sourceFile, outputFile);
