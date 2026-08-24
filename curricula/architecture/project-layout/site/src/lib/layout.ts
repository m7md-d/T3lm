/**
 * تحليل كتلة ```layout — **نفس الصيغة التي يقرؤها `tools/measure.mjs`**.
 *
 * والمصدر واحد: الماركداون. فالموقع يُصرِّف ولا يُفرِّع (ثابت ٤)، وما يعرضه هنا
 * هو ما تحسب عليه الأداة هناك. وأي انحرافٍ بين القراءتين يكشفه فحص الدخان.
 */
export type Role = 'core' | 'port' | 'app' | 'edge' | 'io' | 'wire' | 'shared';

export const ROLES: Role[] = ['core', 'port', 'app', 'edge', 'io', 'wire', 'shared'];

/**
 * عائلة اللون — **اتّجاه الاعتماد لا نوع الملفّ**.
 *
 * والمنهج يصنّف نفسه هكذا: ما لا يعرف العالم، وما يخاطبه، وما يصلهما.
 * أربعٌ بحدّ ركيزة ٧، والرابعة (`bad`) للمخالفة وحدها.
 */
export type Family = 'in' | 'out' | 'wire' | 'bad';

export const familyOf = (r: Role): Family =>
  r === 'core' || r === 'port' || r === 'app' ? 'in'
    : r === 'wire' ? 'wire'
      : r === 'shared' ? 'wire' : 'out';

export interface Node {
  path: string;
  role: Role;
  owns: string[];
  deps: string[];
}

export interface Layout {
  id: string;
  name: string;
  policy: string;
  enforced: string;
  compare: boolean;
  nodes: Node[];
}

/** غصنٌ في شجرة المسارات — يُشتقّ من العمود الأوّل وحده. */
export interface Branch {
  name: string;
  path: string;
  node?: Node;
  children: Branch[];
}

export function parseLayout(body: string): Layout {
  const g: Layout = { id: '', name: '', policy: 'none', enforced: 'review', compare: true, nodes: [] };
  for (const raw of body.split('\n')) {
    const line = raw.trim();
    if (!line || line === '---' || line.startsWith('#')) continue;

    const head = line.match(/^(id|name|policy|enforced|compare):\s*(.+)$/);
    if (head) {
      const [, k, v] = head as unknown as [string, string, string];
      if (k === 'compare') g.compare = v.trim() !== 'no';
      else (g as unknown as Record<string, string>)[k] = v.trim();
      continue;
    }

    const [lhs = '', rhs = ''] = line.split('->');
    const cols = lhs.trim().split(/\s{2,}|\t+/).map((x) => x.trim()).filter(Boolean);
    if (cols.length < 3) continue;
    const [path, role, owns] = cols as [string, Role, string];
    g.nodes.push({
      path,
      role,
      owns: owns === '-' ? [] : owns.split(',').map((x) => x.trim()).filter(Boolean),
      deps: rhs.split(',').map((x) => x.trim()).filter(Boolean),
    });
  }
  return g;
}

/** يبني الشجرة من المسارات — والمجلّد الأعلى هو ما يقيسه المنهج بـ«حوافّ عابرة». */
export function treeOf(l: Layout): Branch[] {
  const root: Branch = { name: '', path: '', children: [] };
  for (const n of l.nodes) {
    const segs = n.path.split('/');
    let cur = root;
    segs.forEach((seg, i) => {
      const path = segs.slice(0, i + 1).join('/');
      let next = cur.children.find((c) => c.name === seg);
      if (!next) { next = { name: seg, path, children: [] }; cur.children.push(next); }
      if (i === segs.length - 1) next.node = n;
      cur = next;
    });
  }
  return root.children;
}

/** الحافّة عابرةٌ حين تقفز بين مجلّدين أعلَيين — وجذر التركيب مستثنى. */
export function crosses(l: Layout, from: string, to: string): boolean {
  const src = l.nodes.find((n) => n.path === from);
  if (!src || src.role === 'wire') return false;
  return from.includes('/') && to.includes('/') && from.split('/')[0] !== to.split('/')[0];
}

/**
 * الوسم `en` **للّاتينيّ والأرقام فقط**: الخليّة الأحادية تفكّ وصل العربية.
 * وبعض المقاييس تُرجع جملةً عربية («لا قلب مفصول»)، فيُقرَّر الوسم من القيمة.
 */
export const latin = (v: string) => (/[\u0600-\u06FF]/.test(v) ? undefined : 'en');
