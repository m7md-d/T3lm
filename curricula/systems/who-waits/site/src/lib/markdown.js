/**
 * محرّك تحليل ماركداون المنهج — انسخه كما هو.
 *
 * خالٍ عمداً من أي اعتماد على Vite أو على بنية منهجٍ بعينه، حتى يمكن اختباره
 * بـ `node` مباشرة داخل `verify.mjs`.
 */

/**
 * مُعرّف مطابق لخوارزمية GitHub — ضروريٌّ حتى تعمل الروابط الداخلية التي كتبها
 * المنهج نفسه (`03-x.md#عنوان-القسم`).
 *
 * تفصيلتان تكسران كل شيء لو أُغفلتا، وكلتاهما كلّفت تصحيحاً حقيقياً:
 *  ١) `\p{M}` تبقى: علامات التشكيل العربية (التنوين في «فعلاً») ليست حروفاً،
 *     وحذفها يولّد مرساةً مختلفة عن مرساة GitHub.
 *  ٢) كل مسافة تصير شرطة **على حدة** ولا تُدمَج المتتالية — لذلك «—» المحاطة
 *     بمسافتين تنتج شرطتين لا واحدة.
 */
export function slugify(s) {
  return String(s)
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\p{M}\s-]/gu, '')
    .replace(/\s/g, '-');
}

/**
 * يبني مُحوّل روابط: من روابط الماركداون (`04-x.md#مرساة`) إلى مسارات الموقع.
 * @param {Record<string,string>} fileToSlug  اسم الملف → slug الفصل
 * @param {string} base  بادئة مسار الفصل (مثلاً `/ch` أو `/crypto`)
 */
export function makeRewriteHref(fileToSlug, base = '/ch') {
  return function rewriteHref(href) {
    if (!href) return href;
    if (/^(https?:|mailto:|#)/.test(href)) return href;
    const [file, hash] = href.split('#');
    if (file === 'README.md' || file === '') return hash ? `/#${hash}` : '/';
    const slug = fileToSlug[file];
    if (slug) return `${base}/${slug}${hash ? `#${hash}` : ''}`;
    return href;
  };
}

// لغزٌ تحت عنوانٍ فرعي: «### 🧩 …» ثم سؤال ثم <details>
const DETAILS =
  /(#{2,4})\s*🧩([^\n]*)\n([\s\S]*?)<details>\s*\n?<summary>([\s\S]*?)<\/summary>\s*([\s\S]*?)<\/details>/;

// لغزٌ عنوانُ القسم نفسه هو ترويسته: «## 🧩 قبل أن تكمل»
const BARE_DETAILS =
  /([\s\S]*?)<details>\s*\n?<summary>([\s\S]*?)<\/summary>\s*([\s\S]*?)<\/details>/;

function splitBlocks(body) {
  const blocks = [];
  let rest = body;
  let guard = 0;
  while (guard++ < 16) {
    const m = rest.match(DETAILS);
    if (!m) break;
    const before = rest.slice(0, m.index);
    if (before.trim()) blocks.push({ type: 'md', text: before });
    blocks.push({
      type: 'puzzle',
      label: (m[2] || 'قبل أن تكمل').trim(),
      question: m[3].trim(),
      reveal: (m[4] || 'الجواب').trim(),
      answer: m[5].trim(),
    });
    rest = rest.slice(m.index + m[0].length);
  }
  if (rest.trim()) blocks.push({ type: 'md', text: rest });
  return blocks;
}

/**
 * يحلّل ملف فصل إلى: العنوان، التمهيد، والأقسام (كل `## `).
 * يحذف ترويسة H1 وسطر التنقل السفلي لأن الموقع يوفّرهما بنفسه.
 */
export function parseChapter(raw) {
  let md = String(raw).replace(/\r\n/g, '\n');

  const h1 = md.match(/^#\s+(.+)$/m);
  const heading = h1 ? h1[1].trim() : '';
  if (h1) md = md.slice(h1.index + h1[0].length);

  md = md.replace(/\n---\s*\n+\*\*(التالي|العودة إلى|السابق)[\s\S]*$/m, '\n');

  const firstH2 = md.search(/^##\s+/m);
  const lead = (firstH2 === -1 ? md : md.slice(0, firstH2)).replace(/^\s*---\s*$/gm, '').trim();
  const rest = firstH2 === -1 ? '' : md.slice(firstH2);

  const sections = [];
  const re = /^##\s+(.+)$/gm;
  const marks = [];
  let m;
  while ((m = re.exec(rest))) marks.push({ title: m[1].trim(), start: m.index, after: re.lastIndex });

  marks.forEach((mk, i) => {
    const end = i + 1 < marks.length ? marks[i + 1].start : rest.length;
    const body = rest.slice(mk.after, end).replace(/^\s*---\s*$/gm, '').trim();

    let blocks;
    let bare = false;
    if (mk.title.includes('🧩')) {
      const bm = body.match(BARE_DETAILS);
      if (bm) {
        bare = true;
        blocks = [
          {
            type: 'puzzle',
            label: mk.title.replace('🧩', '').trim(),
            question: bm[1].trim(),
            reveal: (bm[2] || 'الجواب').trim(),
            answer: bm[3].trim(),
          },
        ];
        const tail = body.slice(bm.index + bm[0].length).trim();
        if (tail) blocks.push({ type: 'md', text: tail });
      }
    }
    if (!blocks) blocks = splitBlocks(body);

    sections.push({ title: mk.title, id: slugify(mk.title), blocks, raw: body, bare });
  });

  return { heading, lead, sections };
}

/** عناوين `### ` داخل نصّ قسم — لفهرسٍ أعمق عند الحاجة */
export function subHeadings(raw) {
  const out = [];
  const re = /^###\s+(.+)$/gm;
  let m;
  while ((m = re.exec(raw))) out.push({ title: m[1].trim(), id: slugify(m[1].trim()) });
  return out;
}

/** ينزع تنسيق الماركداون لأغراض البحث/المقتطفات */
export function plainText(md, max = 260) {
  return String(md)
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[#*_>|`\-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
}

/**
 * فهرس بحث مسطّح: فصول + أقسام + ألغاز.
 * @param {Array<{chapter:object, doc:object}>} parsed
 * @param {(chapter:object, hash?:string)=>string} linkFor  يبني مسار الفصل/القسم
 */
export function buildSearchIndex(parsed, linkFor) {
  const idx = [];
  for (const { chapter, doc } of parsed) {
    idx.push({
      kind: 'فصل',
      chapter,
      title: chapter.title,
      sub: chapter.full || '',
      to: linkFor(chapter),
      hay: `${chapter.title} ${chapter.full || ''} ${chapter.blurb || ''}`,
    });
    for (const s of doc.sections) {
      idx.push({
        kind: 'قسم',
        chapter,
        title: s.title,
        sub: `${chapter.id} · ${chapter.title}`,
        to: linkFor(chapter, s.id),
        hay: `${s.title} ${plainText(s.raw)}`,
      });
      for (const b of s.blocks) {
        if (b.type !== 'puzzle') continue;
        idx.push({
          kind: 'لغز',
          chapter,
          title: plainText(b.question, 90),
          sub: `🧩 ${chapter.id} · ${s.title}`,
          to: linkFor(chapter, s.id),
          hay: `${b.question} ${b.answer}`,
        });
      }
    }
  }
  return idx;
}
