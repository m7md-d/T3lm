/**
 * مقطع كودٍ يُقرأ — **مُلوَّنٌ بمحلّل CodeMirror**، لا بتعبيراتٍ نمطية.
 *
 * ولا محرّرَ ولا زرَّ تشغيل: مشغّل المتصفّح يمرّ بـJavaScript، وقد أثبت الإقليم
 * ٠٠ أنه يعطي **جواباً مختلفاً** لأسئلة الإقليم ٠٢ — و`../../../README.md`
 * يعلنها قاعدةً. فالمقطع يُنسَخ ويُشغَّل عند القارئ.
 *
 * وكل بلوكٍ بلا وسمٍ **برنامجٌ كامل**: يُحفَظ `main.dart` كما يقول المنهج،
 * وبهذا الاسم كُتبت رسائل المترجم في اللوحات. والمقتطع مُعلَّمٌ بذلك.
 */
import { Suspense, lazy } from 'react';
import { escapeOnly } from '@t3lm/kit/highlight';
import { highlightToHtml as paintDart } from '@t3lm/kit/highlight/dart';
import { highlightToHtml as paintSh } from '@t3lm/kit/highlight/sh';
import { FileCode2, Scissors } from 'lucide-react';
import type { Program } from '../lib/types';
import { CopyButton } from './CopyButton';

const PROGRAMS = '../../programs/';

const CBody = lazy(() => import('./CBody'));
const isC = (lang: string) => lang === 'c' || lang === 'h';

function paint(code: string, lang: string): string {
  if (lang === 'dart') return paintDart(code, 'dart');
  if (lang === 'yaml' || lang === 'yml') return paintDart(code, 'yaml');
  if (lang === 'sh' || lang === 'bash' || lang === 'shell') return paintSh(code, 'sh');
  return escapeOnly(code);
}

const FILENAME: Record<string, string> = { dart: 'main.dart', c: 'native.c', yaml: 'pubspec.yaml', bash: 'sh' };

export function Code({ program }: { program: Program }) {
  const { lang, code, file, excerpt } = program;
  const name = file ? `${file}.dart` : FILENAME[lang] ?? lang;

  return (
    <figure className="code" data-lang={lang}>
      <figcaption className="code__bar">
        {file ? (
          <a className="code__file" href={PROGRAMS + file + '.dart'} target="_blank" rel="noreferrer">
            <FileCode2 aria-hidden />
            <span className="en">{name}</span>
          </a>
        ) : (
          <span className="code__file en">{name}</span>
        )}
        {excerpt ? (
          <span className="code__cut" title="مقتطعٌ لا يعمل وحده">
            <Scissors aria-hidden />
            <span>مقتطع</span>
          </span>
        ) : null}
        <span className="spacer" />
        <CopyButton text={code} />
      </figcaption>
      {isC(lang) ? (
        <Suspense fallback={<pre className="code__body en">{code}</pre>}>
          <CBody code={code} />
        </Suspense>
      ) : (
        <pre className="code__body en" dangerouslySetInnerHTML={{ __html: paint(code, lang) }} />
      )}
    </figure>
  );
}
