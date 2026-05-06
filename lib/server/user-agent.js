import path from 'node:path';
import fs from 'node:fs';

const { name, version } = JSON.parse(fs.readFileSync(
  path.resolve(import.meta.dirname, '../../package.json')
));

export const userAgent = { 'User-Agent': `${name}@${version}` };
