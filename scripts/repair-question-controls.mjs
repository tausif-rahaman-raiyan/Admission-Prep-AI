import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve('public/data');
function repairJsonEscapes(source) {
  let output = '';
  let inString = false;
  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    if (!inString) { output += char; if (char === '"') inString = true; continue; }
    if (char === '"') { output += char; inString = false; continue; }
    if (char !== '\\') { output += char; continue; }
    const next = source[index + 1];
    if (next === undefined) { output += char; continue; }
    if (next === '\\') { output += '\\\\'; index += 1; continue; }
    if (next === 'u' && /^[0-9a-fA-F]{4}$/.test(source.slice(index + 2, index + 6))) {
      output += source.slice(index, index + 6); index += 5; continue;
    }
    const tail = source.slice(index + 1);
    const controlWasLatex = (
      (next === 't' && /^(?:text|times|theta|tan|tanh|to|triangle|therefore|top)/.test(tail)) ||
      (next === 'b' && /^(?:beta|begin|bar|binom|bf)/.test(tail)) ||
      (next === 'f' && /^(?:frac|forall|phi)/.test(tail)) ||
      (next === 'r' && /^(?:rightarrow|right|rho)/.test(tail)) ||
      (next === 'n' && /^(?:neq|nu|nabla)/.test(tail))
    );
    const validJsonEscape = '"\\/bfnrt'.includes(next);
    output += controlWasLatex || !validJsonEscape ? '\\\\' + next : '\\' + next;
    index += 1;
  }
  return output;
}
let repairedFiles = 0;
let checkedFiles = 0;
function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(file);
    else if (entry.isFile() && (file.endsWith('.json') || file.endsWith('_json.txt'))) {
      checkedFiles += 1;
      const original = fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, '');
      const repaired = repairJsonEscapes(original);
      try {
        JSON.parse(repaired);
        if (repaired !== original) { fs.writeFileSync(file, repaired, 'utf8'); repairedFiles += 1; }
      } catch (error) {
        console.warn('Skipped non-JSON or malformed question source:', path.relative(process.cwd(), file), error.message);
      }
    }
  }
}
walk(root);
console.log(`Scanned ${checkedFiles} JSON question files; repaired ${repairedFiles}.`);
