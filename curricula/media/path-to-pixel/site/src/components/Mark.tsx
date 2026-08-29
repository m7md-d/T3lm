/**
 * العلامة — **من المحتوى لا من مؤسّسة**.
 *
 * لا علامةَ رسميّةً لهذا الموضوع تُنتزَع، فالعلامةُ بديهيّتان في شكلٍ واحد:
 * خليّةٌ واحدة، وحافّةٌ تقطعها، والجزءُ المغطّى مملوءٌ بقدر تغطيته — ونقطةٌ في
 * **مركزها عند نصف وحدة**، وهي موضعُ العيّنة.
 */
export function Mark({ className }: { className: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" role="img" aria-label="من المسار إلى البكسل">
      <polygon className="mark__cov" points="3,15.5 21,7.5 21,21 3,21" />
      <rect className="mark__cell" x="3" y="3" width="18" height="18" />
      <circle className="mark__dot" cx="12" cy="12" r="1.7" />
    </svg>
  );
}
