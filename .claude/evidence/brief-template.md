# قالب طلب دراسة

انسخ ما بين الخطّين، واملأ `⟨…⟩`، ثم شغّله في أداة بحثٍ عميق. **شغّله مرّتين
مستقلّتين إن أمكن** — اختلافهما موضع فحص، **واتفاقهما ليس دراستين**: التقريران
أداتا استخراج تقرآن الأدبيات نفسها.

القالب بالإنجليزية عمداً: الأدبيات إنجليزية، والطلب الإنجليزيّ يقلّل الترجمة
الوسيطة. والمخرَج يُطلَب بالإنجليزية للسبب نفسه.

---

## Context

I design self-study curricula on ⟨المجال — مثلاً: low-level systems and
programming-language internals⟩, delivered as static websites with in-browser
code execution.

**Learner profile.** Not a beginner: already fluent in ⟨لغة/مجال المرساة⟩ and
entering an adjacent domain. Very high intrinsic motivation — motivation is not
the problem, instructional method is. Deeply analytical; rejects black boxes;
rejects gamification outright. Studies **completely alone**: no instructor, no
peers, no cohort, no deadlines, no grading.

**Delivery constraints.** No instructor and no human feedback of any kind. No
learner tracking, no analytics, no A/B testing — anything stored stays in the
learner's browser. Static client-side site: it can execute code, build
manipulable diagrams, and lock a reveal until the learner writes something.
**If a recommendation requires a classroom, a cohort, a grader, or telemetry,
say so and skip it rather than proposing it.**

**Author decisions are constraints, not open questions.** The list below is
already decided. Do not argue for replacing a decision because the literature
favours something else — instead, state plainly what the evidence says, what it
costs us, and where the decision's limits are. A finding that contradicts a
decision is wanted; a recommendation to abolish it is not.

**Already settled — do not re-derive.** ⟨انسخ من `findings.md` العناوين المحسومة؛
حالياً:⟩ cognitive load theory · worked-example effect · expertise reversal ·
refutation texts and conceptual change · the reading/tracing/writing hierarchy ·
Mayer's multimedia principles · extrinsic rewards undermining intrinsic
motivation · automatic animation underperforming learner-controlled stepping ·
learner-pulled help outperforming system-pushed hints · whole-task (epitome)
sequencing. **Only answer the questions below.**

## Evidence rules

1. Primary sources only: peer-reviewed studies, meta-analyses, or standard
   reference books. **No Wikipedia, blogs, Google Scholar profile pages,
   ResearchGate mirrors, or aggregator pages.** If no primary source exists for
   a claim, say so instead of citing the nearest page.
2. **Write every effect size as plain text — `d = 0.45`, `g = 0.36`. Never as an
   equation image.** Images make the numbers unreadable.
3. **If a source is a review or theoretical paper, label it as such. Never
   invent a sample size or population for it.** This is checked.
4. Separate **established** / **contested** (name who disagrees, on what
   evidence, including failed replications) / **unknown**. Leave unknowns empty
   rather than filling them plausibly.
5. State the sample and setting for every finding. Most of this literature
   studies undergraduates in classrooms — say so when it does.
6. Do not soften a finding because it flatters the design above. If the evidence
   says the current approach is wrong, say it plainly.
7. **For every effect size, name the original comparison**: what was measured
   against what, on which task, with which outcome measure. A bare number is
   unusable.
8. **Never turn effect sizes into ratios or multipliers.** Do not divide one
   effect size by another ("five times better"), do not read `d = 0.65` as
   "doubles completion", and do not rank features by comparing effect sizes
   drawn from different studies.
9. **Say what you actually read** for each source: full text, publisher
   abstract, or record page only. An abstract does not license a claim about the
   article's tables or subgroup analyses.

## Questions

⟨سؤالٌ لكل فجوة، فقرةً واحدة: ما السؤال · لماذا يهمّ في التصميم · ثم سطر مراسٍ⟩

**1 — ⟨العنوان⟩.** ⟨السؤال، وما يحجزه من قرار⟩
*Anchors: ⟨أسماء باحثين ومصطلحات بحث⟩.*

## Output format

For each question, in this order:

1. **Short answer** — three lines: what to do.
2. **Established** — primary source, plain-text effect size, actual sample and
   setting.
3. **Contested** — who disagrees, on what evidence.
4. **Unknown** — gaps in the published record.
5. **Transfer** — does this hold for a highly motivated advanced adult studying
   alone, with no instructor and no deadline? Where does it break?
6. **Rule** — one checkable design rule: *"do X, at this point, under this
   condition, and not when Y."* Generic advice ("balance guidance and autonomy")
   is worthless. It must be a rule whose violation can be detected.
7. **Read** — for each source cited in this answer: full text / abstract only /
   record page only.

Close with: a table of conflicts between your own answers and how you resolve
them; and a source list ranked by strength, marking each as meta-analysis,
systematic review, single study, or opinion.

**Report in English.**

---

## بعد الاستلام

اتبع الفحوص الأربعة في `README.md` §٣ **قبل** البناء على التقرير: مصادر مشطوبة ·
أوصاف منهجية مُختلَقة · أرقامٌ مخبّأة في صور · تناقضٌ داخليّ بين سؤالٍ وآخر.
ثلاثةٌ منها كشفت عيوباً فعلية في تقارير وردت.

ثم استخرج الصفوف إلى `findings.md` و`open.md`، **واحذف التقرير**. لا يبقى وسيطٌ
بين المستودع والأدبيات.
