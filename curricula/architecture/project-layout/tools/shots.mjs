#!/usr/bin/env node
/**
 * shots — يفحص ميزانية اللقطة: ≤٢٥٠ كلمة و≤بلوكين و≤٣ بوّابات في الإقليم.
 *
 *   node tools/shots.mjs
 *
 * سببه أن الحدّ يُنسى بعد الفصل الثالث، وأن اللقطة التي تتجاوزه تصير درساً.
 */
import fs from 'node:fs';
import path from 'node:path';

const REG = path.join(path.resolve(import.meta.dirname, '..'), 'regions');
let bad = 0, total = 0, longest = 0;

for (const f of fs.readdirSync(REG).sort()) {
  if (!f.endsWith('.md')) continue;
  const md = fs.readFileSync(path.join(REG, f), 'utf8');
  /* الفصل ٠٠ أجزاؤه `##` ولقطاته `###`؛ وغيره لقطاته `##` */
  const lvl = /^## الجزء /m.test(md) ? '###' : '##';
  const parts = md.split(new RegExp(`^${lvl} `, 'm')).slice(1);
  const gates = (md.match(/^\*{0,2}المخرَج\*{0,2}\s*:\s*$/gm) || []).length;
  const words = md.split(/\s+/).length;
  if (gates > 3) { bad++; console.log(`  ✗ ${f}: ${gates} بوّابات — الحدّ ٣`); }
  if (gates > Math.ceil(words / 500)) { bad++; console.log(`  ✗ ${f}: بوّابة لكل ${Math.round(words / gates)} كلمة — الحدّ ٥٠٠`); }

  for (const p of parts) {
    total++;
    const title = p.split('\n')[0].trim();
    const prose = p.replace(/```[\s\S]*?```/g, '').split(/\s+/).filter(Boolean).length;
    const blocks = (p.match(/^```(?!$)/gm) || []).length;
    longest = Math.max(longest, prose);
    if (prose > 250) { bad++; console.log(`  ✗ ${f.slice(0, 2)} · ${title} — ${prose} كلمة`); }
    if (blocks > 2) { bad++; console.log(`  ✗ ${f.slice(0, 2)} · ${title} — ${blocks} بلوكات`); }
  }
}
console.log(`\nلقطات: ${total} · أطولها ${longest} كلمة · مخالفات: ${bad}`);
process.exit(bad ? 1 : 0);
