import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { Link, useLocation } from 'react-router-dom';
import { slugify } from '../lib/markdown.js';

/* خريطة ملفّ→مسار: روابط المنهج الداخلية كُتِبت بأسلوب GitHub
   (`regions/04-time-state.md#…`) ويجب أن تعمل داخل الموقع بلا تعديل الماركداون. */
const REGION_FILES = {
  '00-ground.md': 'ground',
  '01-bytes.md': 'bytes',
  '02-who-waits.md': 'who-waits',
  '03-terminal.md': 'terminal',
  '04-time-state.md': 'time-state',
  '05-protocol.md': 'protocol',
  '06-shared-state.md': 'shared-state',
  '07-media.md': 'media',
  '08-disk.md': 'disk',
  '09-craft.md': 'craft',
};
const DOC_FILES = {
  'skill-tree.md': 'skill-tree',
  'mental-models.md': 'models',
  'cheatsheet.md': 'cheatsheet',
};

function rewrite(href) {
  if (!href) return href;
  if (/^(https?:|mailto:|#)/.test(href)) return href;
  const [file, hash] = href.split('#');
  const base = file.split('/').pop();
  if (base === 'README.md' || file === '') return hash ? `/#${hash}` : '/doc/readme';
  if (REGION_FILES[base]) return `/r/${REGION_FILES[base]}${hash ? `#${hash}` : ''}`;
  if (DOC_FILES[base]) return `/doc/${DOC_FILES[base]}${hash ? `#${hash}` : ''}`;
  return href;
}

/* فخّ HashRouter: `<a href="#x">` عادي يدهس المسار ويقذف القارئ خارج الصفحة. */
function Anchor({ href, children }) {
  const { pathname } = useLocation();
  if (!href) return <span>{children}</span>;
  if (href.startsWith('#')) return <Link to={`${pathname}${href}`}>{children}</Link>;
  const to = rewrite(href);
  if (/^(https?:|mailto:)/.test(to)) {
    return (
      <a href={to} target="_blank" rel="noreferrer noopener">
        {children}
      </a>
    );
  }
  return <Link to={to}>{children}</Link>;
}

function Pre({ children }) {
  const [done, setDone] = useState(false);
  const text = (function grab(n) {
    if (typeof n === 'string') return n;
    if (Array.isArray(n)) return n.map(grab).join('');
    if (n?.props?.children) return grab(n.props.children);
    return '';
  })(children);

  return (
    <div className="pre-wrap">
      <button
        type="button"
        className="copy"
        onClick={() => {
          if (typeof navigator !== 'undefined' && navigator.clipboard) {
            navigator.clipboard.writeText(text).then(
              () => {
                setDone(true);
                setTimeout(() => setDone(false), 1200);
              },
              () => {}
            );
          }
        }}
      >
        {done ? 'نُسِخ' : 'نسخ'}
      </button>
      <pre dir="ltr">{children}</pre>
    </div>
  );
}

const heading = (Tag) =>
  function H({ children }) {
    const text = (function grab(n) {
      if (typeof n === 'string') return n;
      if (Array.isArray(n)) return n.map(grab).join('');
      if (n?.props?.children) return grab(n.props.children);
      return '';
    })(children);
    const id = slugify(text);
    return (
      <Tag id={id}>
        {children}
        <a className="anchor" href={`#${id}`} aria-label="رابط">
          #
        </a>
      </Tag>
    );
  };

const COMPONENTS = {
  a: Anchor,
  pre: Pre,
  h2: heading('h2'),
  h3: heading('h3'),
  h4: heading('h4'),
  table: ({ children }) => (
    <div className="tw">
      <table>{children}</table>
    </div>
  ),
};

export default function Markdown({ children }) {
  return (
    <div className="md">
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]} components={COMPONENTS}>
        {children || ''}
      </ReactMarkdown>
    </div>
  );
}

export { rewrite };
