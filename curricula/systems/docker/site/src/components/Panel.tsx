/**
 * لوحة المخرَج — **الأمر ومخرَجُه المسجَّل معاً**، مُلوَّنين، والتشريح إلى سطره.
 *
 * ١) لا زرّ تشغيل: منفّذ المتصفّح لا يملك نواة، والفرق في **الجواب** لا في صيغته.
 *    فالأمر معروضٌ ليُنسَخ ويُشغَّل عند القارئ في مختبرٍ مثبَّتٍ ببصمته.
 * ٢) الأمر بمحلّل CodeMirror، والمخرَج بمعجم الموضوع (`../lib/outlex.ts`): كلُّ
 *    رمزٍ بلون مالكه، فيرى القارئ في السطر ما تضمنه النواة وما هو محضُ جهازه.
 * ٣) **التقارب المكانيّ** (d ≈ 0.80): شرحُ السطر يُرسى بجانبه داخل اللوحة، لا في
 *    قائمةٍ تحتها تُجبر القارئ على مطابقةٍ ذهنية بين رقمٍ وسطر.
 */
import { highlightToHtml as paintSh } from '@t3lm/kit/highlight/sh';
import type { PanelBlock } from '../lib/types';
import { authorityOf } from '../lib/authority';
import { paintOutput } from '../lib/outlex';
import { AuthorityTag } from './AuthorityTag';
import { SiteTag } from './SiteTag';
import { CopyButton } from './CopyButton';

export interface PanelProps {
  block: PanelBlock;
  gated?: boolean;
  /** تشريحٌ مرسًى: رقم السطر (من صفر) ⇒ جملةٌ واحدة تُعرَض بجانبه */
  notes?: Record<number, string>;
}

export function Panel({ block, gated = false, notes }: PanelProps) {
  const body = block.output.replace(/\n$/, '');
  const lines = body.split('\n');
  const painted = paintOutput(body).split('\n');
  const anyNote = notes !== undefined && Object.keys(notes).length > 0;

  return (
    <figure className={`panel${gated ? ' panel--gated' : ''}`} data-auth={authorityOf(block.tag)}>
      <figcaption className="panel__bar">
        <SiteTag site={block.site} />
        <AuthorityTag tag={block.tag} />
        <span className="topbar__spacer" />
        {block.command ? <CopyButton text={block.command} label="انسخ الأمر" /> : null}
      </figcaption>

      {block.command ? (
        <pre
          className="panel__cmd en"
          dangerouslySetInnerHTML={{ __html: paintSh(block.command, 'sh') }}
        />
      ) : null}

      <div className="panel__cut"><span>مخرَجٌ مسجَّل</span></div>

      <div className={`panel__body${anyNote ? ' panel__body--noted' : ''}`} aria-hidden={gated || undefined}>
        {lines.map((_, i) => (
          <div className="oline" key={i}>
            <code className="oline__t en" dangerouslySetInnerHTML={{ __html: painted[i] ?? '' }} />
            {notes?.[i] ? <span className="oline__note">{notes[i]}</span> : null}
          </div>
        ))}
      </div>
    </figure>
  );
}
