import fs from 'node:fs';
import path from 'node:path';
const root = path.resolve('public/data');
const repairs = [
  [new RegExp(String.raw`(?<!\\\\)\\\\f(?=rac)`, 'g'), String.raw`\\\\f`],
  [new RegExp(String.raw`(?<!\\\\)\\\\t(?=ext|imes|heta)`, 'g'), String.raw`\\\\t`],
  [new RegExp(String.raw`(?<!\\\\)\\\\b(?=eta)`, 'g'), String.raw`\\\\b`],
  [new RegExp(String.raw`(?<!\\\\)\\\\n(?=eq)`, 'g'), String.raw`\\\\n`],
  [new RegExp(String.raw`(?<!\\\\)\\\\r(?=ightarrow)`, 'g'), String.raw`\\\\r`],
];
let changed = 0;
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(file);
    else if (entry.isFile() && file.endsWith('.json')) {
      const original = fs.readFileSync(file, 'utf8');
      let repaired = original;
      for (const [pattern, replacement] of repairs) repaired = repaired.replace(pattern, replacement);
      if (repaired !== original) { fs.writeFileSync(file, repaired); changed++; }
    }
  }
}
walk(root);
console.log(`Scanned question JSON. Repaired ${changed} file(s).`);
