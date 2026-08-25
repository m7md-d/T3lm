/**
 * سبع خانات — البديهية ٢: «العزل خاصيّةُ العملية، تُلبَس قطعةً قطعة».
 * والخانة **تُملَك أو تُتقاسَم**، وهو ما يقيسه الإقليم ٠٧ حرفياً.
 *
 * والأسماء إنجليزية كما تكتبها النواة في `/proc/<pid>/ns/`.
 */
export const NAMESPACES = ['mnt', 'pid', 'net', 'ipc', 'uts', 'user', 'cgroup'] as const;
export type Ns = (typeof NAMESPACES)[number];

export function NsStrip({ own }: { own: Partial<Record<Ns, boolean>> }) {
  return (
    <div className="nsstrip">
      {NAMESPACES.map((ns) => (
        <span className="nsslot en" key={ns} data-own={own[ns] === true}
              title={own[ns] ? 'نطاقٌ يملكه' : 'يتقاسمه مع المضيف'}>
          {ns}
        </span>
      ))}
    </div>
  );
}
