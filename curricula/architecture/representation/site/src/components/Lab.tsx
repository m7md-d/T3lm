/**
 * المختبر — القارئ يكتب لغةَ المخطّطات، فيرى ما يراه `python3` عنده بعينه.
 *
 * والمنفّذ نقلُ `programs/dsl.py` و`model.py` و`emit.py` إلى المتصفّح، **وقد
 * فُحص تطابقُه** مع Python على حزمتَي `examples/` نصّاً وموضعاً
 * (`scripts/conform.ts`)، فالزرّ مسموح (`invariants` §١، وقاعدة زرّ التشغيل).
 *
 * والمعروضُ يتبع مرحلة الأنبوب: رموزٌ (`06`) أو شجرة (`07`) أو نموذجٌ يرفض
 * (`09` · `12` · `15`) أو شكلٌ قانونيّ (`22`) أو صورة.
 *
 * **والصورة تخطيطُها تخطيطُ الـepitome** — صفٌّ واحد بثوابته من الفصل `00` —
 * والبنيةُ التي تُرسَم هي ما نجا من متحقِّق `12`. والمنهج يقف عند `SVG` نصّاً،
 * فهذا هو الموضع الوحيد الذي يجمع الاثنين، وهو مكتوبٌ هنا لا في الفصول.
 */
import { useMemo, useState } from 'react';
import { DslError, Parser, tokenize } from '../lib/dsl';
import { build, TYPES } from '../lib/model';
import { dump } from '../lib/emit';
import { lexDsl, lexPanel } from '../lib/lex';
import type { Component, Diagram } from '../lib/model';
import type { Stage } from '../content/labs';

/* ملفّات الأمثلة نفسُها بذوراً — لا نصٌّ منسوخ في الكود (الثابت ٤). */
const raw = import.meta.glob('../../../examples/**/*.dsl', {
  query: '?raw', import: 'default', eager: true,
}) as Record<string, string>;

const seedText = (name: string): string =>
  raw[`../../../examples/${name}`] ?? '';

const STAGE_K: Record<Stage, string> = {
  tokens: 'الرموز — كلٌّ ومعه موضعُه',
  tree: 'الشجرة — قاعدةٌ لكلّ نداء',
  model: 'النموذج — ما نجا من المتحقِّق',
  canonical: 'الشكل القانونيّ',
  picture: 'الصورة',
};

/* الحكمُ يسمّي المرحلة التي بلغها النصّ: التقطيعُ ليس قبولاً. */
const PASSED: Record<Stage, string> = {
  tokens: 'قُطِّع',
  tree: 'حُلِّل',
  model: 'قُبل',
  canonical: 'قُبل',
  picture: 'قُبل',
};

export function Lab({ stage, claim, seeds, id }: {
  stage: Stage; claim: string; seeds: string[]; id: string;
}) {
  const [seed, setSeed] = useState(seeds[0]!);
  const [src, setSrc] = useState(() => seedText(seeds[0]!));

  const result = useMemo(() => run(stage, src), [stage, src]);

  return (
    <section className="lab" aria-label="مختبر">
      <div className="lab__head">
        <span className="tag">تكتبه أنت</span>
        <span className="lab__claim">{claim}</span>
      </div>

      <div className="lab__grid">
        <div className="lab__pane">
          <div className="lab__k">
            <span>المصدر</span>
            <span className="en">.dsl</span>
          </div>
          {/* المصدر مُلوَّنٌ **بمقطِّع المنهج نفسه**: طبقةٌ تقرأ تحت الكتابة،
              والحقلُ فوقها بحرفٍ شفّافٍ ومؤشّرٍ ظاهر. */}
          <div className="lab__edit">
            <pre className="lab__ghost" aria-hidden>
              <code dangerouslySetInnerHTML={{ __html: `${lexDsl(src)}\n` }} />
            </pre>
            <textarea
              value={src}
              spellCheck={false}
              onChange={(e) => setSrc(e.target.value)}
              aria-label="نصُّ المخطّط"
            />
          </div>
          <div className="lab__seeds">
            {seeds.map((s) => (
              <button
                key={s}
                type="button"
                className={`lab__seed${s === seed ? ' lab__seed--now' : ''}`}
                onClick={() => { setSeed(s); setSrc(seedText(s)); }}
              >
                <span className="en">{s}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="lab__pane">
          <div className="lab__k"><span>{STAGE_K[stage]}</span></div>
          <div className={`lab__verdict lab__verdict--${result.ok ? 'ok' : 'no'}`}>
            {result.ok ? PASSED[stage] : 'رُفض بموضعه'}
          </div>
          {stage === 'picture' && result.svg ? (
            <div className="lab__svg" dangerouslySetInnerHTML={{ __html: result.svg }} />
          ) : (
            <pre id={`lab-${id}`}>
              <code dangerouslySetInnerHTML={{ __html: lexPanel(result.text) }} />
            </pre>
          )}
        </div>
      </div>
    </section>
  );
}

type Result = { ok: boolean; text: string; svg?: string };

function run(stage: Stage, src: string): Result {
  try {
    if (stage === 'tokens') return { ok: true, text: tokensOf(src) };
    if (stage === 'tree') return { ok: true, text: treeOf(src) };
    const diagram = build(src);
    if (stage === 'canonical') return { ok: true, text: canonicalOf(src, diagram) };
    if (stage === 'picture') return { ok: true, text: '', svg: draw(diagram) };
    return { ok: true, text: modelOf(diagram) };
  } catch (e) {
    if (e instanceof DslError) return { ok: false, text: e.report() };
    return { ok: false, text: String(e) };
  }
}

/* الصيغ أدناه تطابق ما تطبعه برامج الفصول، فلا يفترق ما في الشاشة عمّا في المتن. */

const pad = (s: string, n: number) => s + ' '.repeat(Math.max(0, n - s.length));
const repr = (s: string) => `'${s}'`;

/** كما يطبعه `programs/06-tokens.py`. */
function tokensOf(src: string): string {
  return tokenize(src)
    .map((t) => `${pad(t.kind, 7)} ${pad(repr(t.text), 12)} سطر ${t.line} عمود ${t.col}`)
    .join('\n');
}

/** كما يطبعه `programs/07-parse.py`: الرمزُ الذي قرّر، والقاعدة التي نُوديت. */
function treeOf(src: string): string {
  const parser = new Parser(src);
  const out: string[] = [];
  while (parser.peek.kind !== 'EOF') {
    const decide = parser.peek;
    const node = parser.statement();
    out.push(`${pad(decide.kind, 5)} (سطر ${decide.line}) ⇒ ${node.t}`);
    if (node.t === 'Box') {
      const props = Object.entries(node.props).map(([k, v]) => `${k}: ${v}`).join(', ');
      out.push(`      Box(${node.name}, ${repr(node.label)}${props ? `, {${props}}` : ''})`);
    } else {
      out.push(`      Link(${node.src.box}.${node.src.port} -> ${node.dst.box}.${node.dst.port})`);
    }
  }
  return out.join('\n');
}

/** كما يطبعه `programs/model.py` حين يُشغَّل وحده. */
function modelOf(d: Diagram): string {
  const out: string[] = [];
  for (const c of d.components.values()) {
    out.push(`${pad(c.id, 3)} ${pad(c.kind, 7)} منافذ=${ports(c)}`);
  }
  for (const e of d.edges) out.push(`${e.src.id}.${e.srcPort} -> ${e.dst.id}.${e.dstPort}`);
  return out.join('\n') || 'لا شيء';
}

const ports = (c: Component) =>
  `{${Object.entries(TYPES[c.kind]!).map(([k, v]) => `${repr(k)}: ${repr(v)}`).join(', ')}}`;

/** كما يطبعه `programs/22-serialize.py`: الشكل، ثم استقرارُ الدورة. */
function canonicalOf(src: string, d: Diagram): string {
  const first = dump(d);
  const second = dump(build(first));
  return [
    first.replace(/\n$/, ''),
    '',
    `الدورة الثانية تطابق الأولى: ${first === second ? 'True' : 'False'}`,
    `والأصلُ يطابق ناتجَه:      ${src === first ? 'True' : 'False'}`,
  ].join('\n');
}

/* ــ الصورة: ثوابتُ الـepitome وتخطيطُه، والبنيةُ ما نجا من المتحقِّق ــ */
const UNIT = 40, GAP = 60, HEIGHT = 60, PAD = 20;

function draw(d: Diagram): string {
  const places = new Map<string, [number, number, number, number]>();
  let x = PAD;
  for (const c of d.components.values()) {
    const w = Number(c.params['width'] ?? 2) * UNIT;
    places.set(c.id, [x, PAD, w, HEIGHT]);
    x += w + GAP;
  }
  if (!places.size) return '<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"></svg>';

  const body: string[] = [];
  for (const c of d.components.values()) {
    const [bx, by, w, h] = places.get(c.id)!;
    body.push(`<rect x="${bx}" y="${by}" width="${w}" height="${h}" fill="none"/>`);
    body.push(`<text x="${bx + w / 2}" y="${by + h / 2}" text-anchor="middle" dominant-baseline="middle">${esc(c.label)}</text>`);
  }
  for (const e of d.edges) {
    const [x1, y1, w1, h1] = places.get(e.src.id)!;
    const [x2, y2, , h2] = places.get(e.dst.id)!;
    body.push(`<line x1="${x1 + w1}" y1="${y1 + h1 / 2}" x2="${x2}" y2="${y2 + h2 / 2}"/>`);
  }
  const width = Math.max(...[...places.values()].map(([px, , pw]) => px + pw)) + PAD;
  return [`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="100" viewBox="0 0 ${width} 100">`,
    ...body, '</svg>'].join('\n');
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
