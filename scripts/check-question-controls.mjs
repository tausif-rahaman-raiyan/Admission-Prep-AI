import fs from 'node:fs';
import path from 'node:path';
const root = path.resolve('public/data');
const forbidden = /[\u0008\u0009\u000b\u000c\u000d]/;
const errors = [];
function inspect(value, file, key = '') {
  if (typeof value === 'string') {
    if (forbidden.test(value)) errors.push(`${file}: control character in ${key || 'string'}`);
  } else if (Array.isArray(value)) value.forEach((item, index) => inspect(item, file, `${key}[${index}]`));
  else if (value && typeof value === 'object') Object.entries(value).forEach(([k, v]) => inspect(v, file, key ? `${key}.${k}` : k));
}
function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(file);
    else if (entry.isFile() && (file.endsWith('.json') || file.endsWith('_json.txt'))) {
      try { inspect(JSON.parse(fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, '')), path.relative(process.cwd(), file)); }
      catch (error) { errors.push(`${file}: invalid JSON (${error.message})`); }
    }
  }
}
walk(root);
if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
console.log('Question and explanation strings contain no forbidden control characters.');
