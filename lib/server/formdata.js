import path from 'path';
import url from 'url';
import fs from 'fs';

import FormData from 'form-data';

const { name, version } = JSON.parse(fs.readFileSync(
  path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '../../package.json')
));

const userAgent = { 'User-Agent': `${name}@${version}` };

export { FormData, userAgent };
