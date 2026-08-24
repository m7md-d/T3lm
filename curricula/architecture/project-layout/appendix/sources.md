# المصادر

كل ادّعاءٍ تاريخيّ في هذا المنهج **منقولٌ من موضعه**، لا من ذاكرةٍ ولا من نقلِ
ناقل. وهذه مواضعها.

| الادّعاء | المصدر | التاريخ |
|---|---|---|
| معيار التقسيم: «قائمة القرارات الصعبة أو التي يُرجَّح أن تتغيّر» · وأن البرنامجين قد يخرجان متطابقين بعد التجميع | D. L. Parnas, *On the Criteria To Be Used in Decomposing Systems into Modules*, CACM 15(12) 1053–1058 | ديسمبر ١٩٧٢ |
| «Allow an application to equally be driven by users, programs, automated test or batch scripts…» · وأن عدد المنافذ متروكٌ للحدس | A. Cockburn, *Hexagonal Architecture*, HaT Technical Report 2005.02 | ٢٠٠٥-٠٩-٠٤ |
| «Transitive dependencies are still dependencies» · وأنها لا تصلح للمواقع الصغيرة | J. Palermo, *The Onion Architecture: part 1* | ٢٠٠٨-٠٧-٢٩ |
| «source code dependencies can only point inwards» · وأن هذه المعماريّات «very similar» | R. C. Martin, *The Clean Architecture* | ٢٠١٢-٠٨-١٣ |
| «suites of independently deployable services» | J. Lewis & M. Fowler, *Microservices* | ٢٠١٤-٠٣-٢٥ |
| «Almost all the successful microservice stories have started with a monolith…» | M. Fowler, *MonolithFirst* | ٢٠١٥-٠٦-٠٣ |
| نقد التجريدات الجامدة · وأن الطبقات تناسب أقلّية الطلبات | J. Bogard, *Vertical Slice Architecture* | — |
| «you can only inject providers that are… explicitly exported» | توثيق NestJS الرسميّ — صفحة `Modules` | — |
| المجال قبل التقنية · السياق المحدود · اللغة الموحّدة | E. Evans, *Domain-Driven Design* | ٢٠٠٣ |
| نمط `Facade`: واجهةٌ موحّدة أمام مجموعة واجهات | Gamma, Helm, Johnson & Vlissides, *Design Patterns* | ١٩٩٤ |

## ورفضُ الأدوات منقولٌ من تشغيلٍ حقيقيّ

لوحات الفصل ١١ مخرَجاتُ أوامر، لا نصوصاً منسوخة:

| اللغة | الأمر | الإصدار |
|---|---|---|
| Go | `go build ./...` | `go1.26.6` |
| Rust | `cargo build` | `rustc 1.98.0` |
| Java | `javac --module-path …` | `javac` من مجموعة الأدوات المثبَّتة |
| TypeScript | `tsc -p .` | `typescript 5` |
| Python | `python3 main.py` | `python3` |

**وكلّها في `<!-- shell -->`** — أي معلَنةٌ أنها خارج جهاز القياس، ويفحصها القارئ
بإعادة التجربة عنده.
