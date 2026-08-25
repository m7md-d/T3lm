/**
 * `@vm` سلطةٌ يفرضها هذا الموضوع بعينه: قارئٌ نواتُه لينكس، وآخرُ نواتُه في آلةٍ
 * افتراضية. والفرق **يُرفَع من داخل اللوحة إلى إطارٍ يسبقها** حتى لا يقرأ صاحب
 * الحالة الأخرى مخرَجاً لا يطابق ما عنده فيظنّ الخلل فيه.
 *
 * لونٌ ونصّ — بلا أيقونة، فالقناة الثانية واحدة.
 */
export function VmNotice({ children }: { children: React.ReactNode }) {
  return (
    <aside className="vmnotice" data-auth="env">
      <strong>قد يختلف عندك.</strong> {children}
    </aside>
  );
}
