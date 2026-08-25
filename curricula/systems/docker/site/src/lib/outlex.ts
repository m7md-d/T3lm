/**
 * معجم المخرَج — تلوينٌ **مشتقٌّ من الموضوع**، لا لوحة syntax عامّة.
 *
 * المخرَج المسجَّل أكثر ما يُقرأ في هذا المنهج (١٨٣ لوحة)، وتتبّعُ سطرٍ فيه
 * بالرمادي الواحد بحثٌ لا قراءة. والتلوين هنا **درسٌ لا زينة**: كلُّ رمزٍ يأخذ
 * لون **مالكه**، وهو سلّم السلطة نفسه الذي يوسم به المؤلّف لوحاته:
 *
 *   ما تملكه النواة   → أزرق  : المسارات، وأسماء النطاقات، والقدرات، وerrno
 *   ما تملكه الأداة   → كهرمانيّ : docker وrunc وcontainerd، ومراجع الصور والبصمات
 *   ما يملكه تشغيلُك  → رماديّ  : أرقام العمليات وinodes والأزمنة، و`…`
 *   الرقم الذي هو المقصد → ساطعٌ ثقيل، بلا لون
 *
 * فيرى القارئ في السطر الواحد **ما يُضمَن وما هو محضُ جهازه** — وهو بعينه ما
 * تقوله `…` في اللوحة وما يقوله الوسم `@machine`.
 *
 * ولا محلّل لمخرَجٍ حرٍّ في أيّ منظومة، فالمعجم هو الأداة الصحيحة هنا؛ أمّا
 * الكود فمحلّل CodeMirror ولا يُرتجَل (`../components/CodeBlock.tsx`).
 */

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

interface Rule { re: RegExp; cls: string; title?: string; group?: number }

/* الترتيب يحكم: الأخصّ أوّلاً. */
const RULES: Rule[] = [
  { re: /…/g, cls: 'wild', title: 'تطابق أيّ شيء — غير مضمون' },

  /* ما يملكه هذا التشغيل وحده: inode النطاق، ورقم العملية، والزمن */
  { re: /\b(mnt|pid|net|ipc|uts|user|cgroup|time):\[\d+\]/g, cls: 'o-vol', title: 'inode النطاق — يتغيّر بكل تشغيل' },
  { re: /\b\d{7,}\b/g, cls: 'o-vol', title: 'رقمٌ خاصٌّ بهذا التشغيل' },
  { re: /\b\d+(\.\d+)?(ms|s|µs)\b/g, cls: 'o-vol', title: 'زمن — يتغيّر بكل تشغيل' },

  /* الرقم الذي هو مقصد اللقطة: رمز الخروج وما يجري مجراه. ساطعٌ بلا لون —
     فلا يفتح فئةً خامسة، والسطوع كافٍ لأنه واحدٌ في السطر لا صنفٌ مكرّر. */
  { re: /\b(?:exit|rc|status|code)\s*[:=]\s*(\d+)/g, cls: 'o-key', group: 1 },

  /* ما تملكه النواة */
  { re: /\bCAP_[A-Z_]+/g, cls: 'o-kernel' },
  { re: /\bE(PERM|ACCES|AGAIN|NOENT|INVAL|EXIST|NOSPC|NOMEM|BUSY|NOTTY|SRCH)\b/g, cls: 'o-kernel' },
  { re: /(Operation not permitted|Permission denied|No such file or directory|Killed|Resource temporarily unavailable)/g, cls: 'o-kernel' },
  { re: /\/(proc|sys|dev|run)\/[^\s:'"]*/g, cls: 'o-kernel' },
  { re: /\b(CLONE_NEW[A-Z]+|SIG[A-Z]+|MS_[A-Z]+|SECCOMP_[A-Z_]+)\b/g, cls: 'o-kernel' },

  /* ما تملكه الأداة والمواصفة */
  { re: /\bsha256:[0-9a-f]{6,}/g, cls: 'o-tool' },
  { re: /\b(docker|dockerd|runc|containerd|containerd-shim[-\w]*|podman|conmon|buildkitd|cosign)\b/g, cls: 'o-tool' },
  { re: /\b[a-z0-9][a-z0-9._-]*:[0-9][\w.-]*\b/g, cls: 'o-tool', title: 'مرجع صورة' },
];

/**
 * يلوّن سطراً واحداً بلا تداخل: أوّل قاعدةٍ تطابق مدًى تملكه.
 * ولا ترمي أبداً — ما لا يطابق يبقى نصّاً مهرَّباً.
 */
function paintLine(line: string): string {
  const taken = new Array<boolean>(line.length).fill(false);
  const marks: { s: number; e: number; cls: string; title?: string }[] = [];

  for (const r of RULES) {
    r.re.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = r.re.exec(line))) {
      if (m[0].length === 0) { r.re.lastIndex++; continue; }
      const g = r.group ?? 0;
      const text = g === 0 ? m[0] : m[g];
      if (!text) continue;
      const s = m.index + (g === 0 ? 0 : m[0].indexOf(text));
      const e = s + text.length;
      let free = true;
      for (let i = s; i < e; i++) if (taken[i]) { free = false; break; }
      if (!free) continue;
      for (let i = s; i < e; i++) taken[i] = true;
      marks.push({ s, e, cls: r.cls, title: r.title });
    }
  }

  if (marks.length === 0) return esc(line);
  marks.sort((a, b) => a.s - b.s);

  let out = '';
  let at = 0;
  for (const mk of marks) {
    if (mk.s < at) continue;
    out += esc(line.slice(at, mk.s));
    const t = mk.title ? ` title="${mk.title}"` : '';
    out += `<span class="${mk.cls}"${t}>${esc(line.slice(mk.s, mk.e))}</span>`;
    at = mk.e;
  }
  return out + esc(line.slice(at));
}

export const paintOutput = (output: string): string =>
  output.split('\n').map(paintLine).join('\n');
