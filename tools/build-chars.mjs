// Sinh js/data/chars.js từ dictionary.txt của Make Me a Hanzi (https://github.com/skishore/makemeahanzi)
// Cách dùng: node tools/build-chars.mjs <đường-dẫn-dictionary.txt>
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const dictPath = process.argv[2];
if (!dictPath) { console.error('Thiếu đường dẫn dictionary.txt'); process.exit(1); }

const ctx = { HSK: {} };
vm.createContext(ctx);
for (const f of fs.readdirSync(path.join(root, 'js/data')).filter((f) => /^hsk\d+\.js$/.test(f))) {
  vm.runInContext(fs.readFileSync(path.join(root, 'js/data', f), 'utf8'), ctx);
}
const isHan = (ch) => /\p{Script=Han}/u.test(ch) || /[⺀-⿟㇀-㇯]/u.test(ch);
const wanted = new Set();
for (const list of Object.values(ctx.HSK)) for (const [w] of list) for (const ch of w) if (/\p{Script=Han}/u.test(ch)) wanted.add(ch);

const dict = new Map();
for (const line of fs.readFileSync(dictPath, 'utf8').split('\n')) {
  if (!line.trim()) continue;
  const e = JSON.parse(line);
  dict.set(e.character, e);
}

const parts = (ids) => [...(ids || '')].filter((ch) => isHan(ch) && !/[⿰-⿿]/.test(ch));
const out = {};
const add = (ch) => {
  const e = dict.get(ch);
  if (!e || out[ch]) return;
  const et = e.etymology || {};
  out[ch] = {
    p: (e.pinyin || [])[0] || '',
    d: e.definition || '',
    r: e.radical || '',
    c: parts(e.decomposition).join(''),
    t: et.type || '',
    s: et.semantic || '',
    ph: et.phonetic || '',
    h: et.hint || '',
  };
};
for (const ch of wanted) add(ch);
for (const ch of wanted) for (const c of out[ch]?.c || '') add(c);

const missing = [...wanted].filter((ch) => !out[ch]);
fs.writeFileSync(
  path.join(root, 'js/data/chars.js'),
  '// Tự sinh bởi tools/build-chars.mjs từ Make Me a Hanzi — không sửa tay\n' +
    'const CHARS = ' + JSON.stringify(out) + ';\n',
);
console.log(`Đã ghi ${Object.keys(out).length} chữ (${wanted.size} chữ trong từ vựng). Thiếu: ${missing.join('') || 'không'}`);
