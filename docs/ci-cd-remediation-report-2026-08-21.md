# تقرير إصلاح CI/CD وGitHub Actions — 2026-08-21

## النطاق
تم تدقيق `.github/workflows`, `.circleci/config.yml`, سكربتات التحقق، حالة PR 200، Branch Protection، وتشغيلات GitHub Actions. المستودع هو `mohamedalaa7785-cpu/Zikr` وPR 200 مفتوح من `feat/source-verified-content-agent` إلى `main`.

## الأسباب الجذرية
كان GitHub Actions workflow `ZIKR verify` يعمل تلقائيًا على `pull_request` و`push` رغم أن GitHub-hosted runners في الحساب غير متاحة بسبب قفل الحساب/الفوترة؛ أحدث التشغيلات فشلت قبل إثبات فشل الكود. كما كان CircleCI يشغّل `production-smoke` على Pull Requests، مع أن الاختبار يقارن production commit مع `CIRCLE_SHA1` الخاص بالـPR؛ هذا يسبب فشلًا زائفًا حتى عندما يكون production سليمًا.

## الإصلاحات
1. تم تحويل `.github/workflows/verify.yml` إلى `workflow_dispatch` فقط كبديل يدوي مجاني، مع الإبقاء على `permissions: contents: read` وعدم إدخال أسرار.
2. تم تقييد CircleCI job `production-smoke` إلى فرع `main` فقط عبر `filters.branches.only: main`. بقي `verify` يعمل على تغييرات PR وpush، وبقي production smoke بعد تحقق main فقط.
3. تم دفع التعديلات إلى فرع PR 200 في commit `4c995a4` بعنوان `ci: prevent false production smoke failures`.

## نتائج الفحص المحلي
`pnpm verify` نجح بعد التعديل. شمل ذلك migration check، replay، routes، imports، mobile readiness، lint، TypeScript، 60 اختبارًا ناجحًا، وNext.js production build.

`pnpm audit --prod --audit-level=high` أعاد `No known vulnerabilities found`.

`pnpm deploy:check` اكتمل دون failures. ظهر 16 warning بسبب متغيرات اختيارية أو أسرار تشغيلية غير موجودة في بيئة الفحص المحلي، بينما كان Supabase Auth reachable بالمفتاح العام. لا ينبغي وضع service-role أو مفاتيح النشر في المستودع أو Pull Request workflow.

## حالة GitHub بعد الدفع
بعد دفع commit الجديد كانت Vercel Preview ناجحة، بينما كانت Vercel deployments وCircleCI verify قيد التنفيذ وقت الفحص. لا يمكن اعتبار النتيجة الخارجية نهائية قبل انتهاء CircleCI وVercel. فحص GitHub Actions التلقائي لم يعد يُطلق من هذا الملف، ويمكن تشغيله يدويًا بعد حل قفل الحساب.

## البدائل المجانية
البديل التلقائي الحالي هو CircleCI verify مع Vercel deployment checks. البديل اليدوي هو GitHub Actions `workflow_dispatch` أو تشغيل `pnpm verify` محليًا. لا يُنصح باستخدام Self-hosted Runner تلقائي مع Pull Requests في مستودع عام؛ إن استُخدم، فيجب أن يكون يدويًا على فرع موثوق، بلا أسرار إنتاجية، وبمستخدم Linux منفصل دون sudo.

## المراجع الخارجية
- GitHub CLI rerun: https://cli.github.com/manual/gh_run_rerun
- GitHub self-hosted runners: https://docs.github.com/actions/hosting-your-own-runners/adding-self-hosted-runners
- GitHub Actions secure use: https://docs.github.com/en/actions/reference/security/secure-use
- GitHub Actions repository settings: https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/enabling-features-for-your-repository/managing-github-actions-settings-for-a-repository
