/**
 * مقطع كودٍ يُقرأ — **مُلوَّنٌ بمحلّل CodeMirror**، لا بتعبيراتٍ نمطية.
 *
 * ولا محرّرَ مركَّباً هنا: البلوك يُقرأ ولا يُحرَّر ولا يُشغَّل (نداءات نواة
 * لينكس لا تُنفَّذ في متصفّح)، وتركيب محرّرٍ لكل بلوكٍ وعدٌ كاذبٌ وكلفةٌ بلا مقابل.
 * فالمحلّل نفسه يُستعمل ساكناً ⇒ HTML مرّةً واحدة.
 */
import { escapeOnly } from '@t3lm/kit/highlight';
import { highlightToHtml as paintC } from '@t3lm/kit/highlight/c';
import { highlightToHtml as paintSh } from '@t3lm/kit/highlight/sh';
import { FileCode2 } from 'lucide-react';
import { CopyButton } from './CopyButton';

const LANGS: Record<string, string> = {
  sh: 'sh', bash: 'sh', shell: 'sh',
  c: 'c', h: 'c',
  dockerfile: 'dockerfile', Dockerfile: 'dockerfile',
};

function paint(code: string, lang: string): string {
  const l = LANGS[lang] ?? lang;
  if (l === 'c') return paintC(code, 'c');
  if (l === 'sh' || l === 'dockerfile') return paintSh(code, l);
  return escapeOnly(code);
}

export function CodeBlock({
  code, lang, name, href,
}: { code: string; lang: string; name?: string; href?: string }) {
  return (
    <figure className="codeblock">
      <figcaption className="codeblock__bar">
        {href ? (
          <a className="partref" href={href} target="_blank" rel="noreferrer">
            <FileCode2 aria-hidden />
            <span className="en">{name}</span>
          </a>
        ) : (
          <span className="en">{name ?? lang}</span>
        )}
        <span className="topbar__spacer" />
        <CopyButton text={code} />
      </figcaption>
      <pre className="codeblock__body en" dangerouslySetInnerHTML={{ __html: paint(code, lang) }} />
    </figure>
  );
}
