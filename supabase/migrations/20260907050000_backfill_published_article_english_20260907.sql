-- Backfill English summaries/body for the five currently published articles.
-- These rows already have verified Arabic source content and English titles.
update public.articles set
  summary_en='A practical method for building a consistent Quran reading portion that balances continuity, mindful reading, and review while distinguishing personal reflection from specialized tafsir.',
  content_en=$$In this guide, we treat a daily Quran reading portion as a habit that needs a realistic design, not a race to complete a certain number of pages. Many people begin with an ambitious plan and then stop when work or study schedules change. A better approach is to build a small, consistent minimum that can be maintained even on busy days, then expand it when circumstances allow.

Start at a clear time connected to an existing habit, such as after Fajr or before sleep. Preparing the mushaf or app before the scheduled time reduces decisions that can delay the start. It also helps to choose a quiet place and mute notifications during the session. The goal is not to create a complicated ritual, but to remove small obstacles.

Then choose an amount you can sustain. It might be ten minutes a day or a specific number of pages. Real success is maintaining the plan on most days of the month, not making it look perfect for a few days and then abandoning it. You can also set a minimum for busy days and an additional level for days when more time is available.

Do not separate reading from understanding. When you encounter an unfamiliar word or meaning, return to a reliable tafsir or trusted explanation instead of building a personal conclusion and attributing it to the verse. After each session, you can write down one question: What idea did I understand today? What behavior do I want to review?

If you are memorizing the Quran, reserve a fixed place for review in the schedule. New reading alone is not enough to preserve what has been memorized, and calm review reveals weak points before they accumulate. If your goal is recitation, you can also dedicate a weekly session to rereading a previous passage carefully.

A phone is useful, but it can also be the biggest source of distraction. Use Do Not Disturb, open the reading page directly, and avoid switching to other apps between passages. Every minute of reduced interruption makes it easier to return to the habit.

Finally, track consistency rather than an achievement counter alone. When adherence drops, look for the reason: an unsuitable time, an excessive amount, or a distracting environment. Adjusting the plan based on the cause is better than increasing pressure. This is general educational content; specialized questions of tafsir or fiqh should be referred to reliable sources and qualified scholars.

Verification references: the Quran, Al-Baqarah 2:185; Al-Muzzammil 73:20; Al-Isra 17:9; Quran.com.

Practical review section: Before publishing any information, ask what question the page answers, which parts were added by the editorial team, and which source the reader can consult. Simply rearranging information is not enough; value comes from explanation, context, and steps that help the reader understand, apply, and verify. At the end of each session, it can be useful to record one point for later review instead of saving many links without knowing why they were kept.$$,
  updated_at=now()
where slug='build-a-sustainable-quran-reading-routine';

update public.articles set
  summary_en='A practical approach to learning the Prophetic biography while distinguishing primary texts, historical reports, and educational explanation.',
  content_en=$$The Prophetic biography is one of the richest areas of learning, but it is also a field where shortened stories and popular reports circulate widely. Benefiting from it does not mean treating everything we hear as equal. It means paying attention to sources, context, and how much confidence we should place in individual details.

When reading an event, start by asking: What source did the writer rely on? If a hadith is cited, record the book and location when available. If the writer quotes a work of seerah or history, identify the book and author when possible. A reference does not automatically make every detail correct, but it makes verification possible.

Then separate the layers of the material: what is stated in the Quran, what is established in hadith, and what historians and seerah scholars have reported. These layers may agree on the broad event while differing in details. A historical sentence should therefore not be turned into a hadith simply because it appears in a religious article.

Chronological context also matters. A major event is not always understood from one paragraph. Reading what came before and after it prevents an oversimplification that turns the biography into a collection of isolated quotations. When you find differences in a date, number, or place, it is better to present the uncertainty carefully than to select a version arbitrarily because it makes a more exciting story.

Treat AI as a research aid, not as a final source. It can suggest keywords or collect links, but it can also mix up similar events or attribute a text to a nonexistent book. Before publication, the underlying source should be opened and checked.

The reader can apply a simple rule: the more exciting the story and the less direct the source, the more important it is to pause before sharing it. When a report is well known but its details are disputed, mention the disagreement briefly instead of presenting it as an absolute fact.

The purpose of studying the seerah is not merely to collect stories, but to understand guidance and decisions in context. After each event, ask: What is established by the source? What lesson do I personally draw from it? This approach preserves the integrity of transmission while opening the door to practical benefit.

Verification references: the Quran; Sunnah.com; and specialized seerah and historical research sources.

Practical review section: Before publishing any information, ask what question the page answers, which parts were added by the editorial team, and which source the reader can consult. Simply rearranging information is not enough; value comes from explanation, context, and steps that help the reader understand, apply, and verify. At the end of each session, it can be useful to record one point for later review instead of saving many links without knowing why they were kept.$$,
  updated_at=now()
where slug='how-to-read-prophetic-biography-responsibly';

update public.articles set
  summary_en='Practical steps for verifying reports attributed to the Prophet ﷺ before sharing them, while separating source material from editorial explanation.',
  content_en=$$The rapid spread of religious texts makes verification an essential skill. A text may be authentic, its meaning may be sound even though it is not a hadith, its wording may differ from the original report, or its chain may not be reliable. The beauty of a phrase must therefore be kept separate from the certainty of attributing it to the Prophet, peace be upon him.

Start by searching for a distinctive phrase in a clear hadith source, and record the book and hadith number when available. A social-media post or image is not a source. Once you reach a reference, read the narration in context rather than relying on a clipped sentence if the surrounding material changes its meaning.

Then distinguish the original text from commentary. If the platform adds an educational note around a hadith, the reader should be able to see where the quotation ends and the editor's explanation begins. This prevents a personal observation from being mistaken for a statement attributed to the Prophet, peace be upon him.

Terms such as sahih, hasan, da'if, and mawdu' have technical meanings. A final judgment should not be issued solely from an automated search. Smart tools can suggest sources and keywords, but they do not replace hadith scholarship. When a trustworthy source cannot be reached, the safer choice is not to publish the text as a hadith.

It is useful to keep a small reference record while preparing articles: the report title, source, link, and the grading quoted from the source. This allows an editor to return to the reference when updating a page instead of starting the search again.

Also be careful with repeated copying between websites. Finding the same phrase on five websites does not mean there are five independent sources; they may all have copied a single page. The better route is to reach the book or original hadith database and then compare the commentary with the underlying text.

This method does not prevent sharing beneficial reminders; it protects them from unsupported attribution. If the goal is to promote a value such as patience or mercy, it can be written as general advice without attaching an unverified hadith.

Verification references: Sunnah.com; the Quran, Al-Hujurat 49:6; and specialized hadith sources.

Practical review section: Before publishing any information, ask what question the page answers, which parts were added by the editorial team, and which source the reader can consult. Simply rearranging information is not enough; value comes from explanation, context, and steps that help the reader understand, apply, and verify. At the end of each session, it can be useful to record one point for later review instead of saving many links without knowing why they were kept.$$,
  updated_at=now()
where slug='how-to-verify-hadith-before-sharing';

update public.articles set
  summary_en='A practical method for building a verified morning-and-evening adhkar routine while clearly separating transmitted text from editorial explanation.',
  content_en=$$Daily worship becomes easier to maintain when it is clear and simple to repeat, and its educational value increases when the reader knows the text and its reference. Morning and evening adhkar are a clear example: instead of collecting dozens of images and forwarded messages, build a verified list for each dhikr and return to it each day.

Start from the source, not from a circulating image. For each dhikr, record the wording as it appears in the source, the book or page reference, and the number or timing when it is established in the report itself. Do not add promises such as guaranteed protection or guaranteed results without evidence.

Then separate transmitted text from explanation. If the platform writes an educational meaning or a brief explanation, keep it in a clearly identified section so the user knows what was transmitted and what was added by the editor. This is especially important in religious content because it prevents the original wording from being mixed with modern phrasing.

For daily use, set a simple minimum that can be sustained. You should not need to open a long page every morning; quick access to a verified list is better than moving between unknown sources. If you miss a session, do not turn it into punishment or a sense of failure. Return to the routine the next time.

Technology can help without taking over the act of worship. A simple counter, a button to open the reference, and saving the last point reached can all be useful. Too many effects, notifications, and advertisements, however, increase distraction. The screen should be designed around the text rather than secondary elements.

From an editorial perspective, it is better to maintain one strong primary page linked from other lists rather than copying the same dhikr across many pages. External references should also be updated when the source site's structure changes, and the source used should be clearly identified.

This is general educational content, not medical treatment or a fatwa. Dhikr is part of Muslim life, while detailed rulings and questions about the authenticity of reports should be referred to their sources and qualified scholars.

Verification references: Hisn al-Muslim on Sunnah.com; the Quran, Al-Ahzab 33:41-42.

Practical review section: Before publishing any information, ask what question the page answers, which parts were added by the editorial team, and which source the reader can consult. Simply rearranging information is not enough; value comes from explanation, context, and steps that help the reader understand, apply, and verify. At the end of each session, it can be useful to record one point for later review instead of saving many links without knowing why they were kept.$$,
  updated_at=now()
where slug='morning-evening-adhkar-verified-routine';

update public.articles set
  summary_en='A family guide to teaching Quran through short sessions, clear goals, review, and balanced encouragement.',
  content_en=$$Successful Quran learning for a child is not measured by the number of pages completed in a week. It is measured by the child's ability to return to learning with a positive attitude and a clear understanding. Families therefore need a short routine, specific goals, and calm correction that leaves room for trying again.

Start with a fixed and short time. A ten-minute session may be more sustainable than one long session each week. Make the beginning predictable: a quiet place, an appropriate mushaf, a specific passage, then reading or listening. When a child knows what is expected, the task becomes less intimidating.

Define the goal of each stage. The goal may be improving reading, memorizing a short surah, or understanding selected words. Do not try to do everything in one session. During memorization, make review part of the plan instead of continually adding new passages.

Correction matters, but it needs balance. If every mistake becomes a comment, the child may begin to fear reading aloud in front of parents. Correct gently and then give the child an opportunity to try again. Mistakes are a normal part of learning, not a judgment on the child's ability.

Technology can help: listening to a skilled reciter, using review cards, keeping a simple progress record, or recording the child's voice for comparison. Too many effects and games, however, can pull attention away from the text. Technology should serve learning rather than compete with it.

Respect individual differences. A child who needs more repetition is not necessarily less capable, while a child who memorizes quickly may need a different goal. Avoid comparing siblings, and connect encouragement to effort and consistency rather than ranking children against one another.

Role modeling at home matters. When a child sees parents reading calmly and using the Quran in everyday life, reading becomes a natural habit rather than an imposed task. Families can celebrate small progress, such as keeping the sessions consistent or mastering a short passage.

This is general educational content, not a treatment plan or fatwa. When an individual learning difficulty or a problem involving speech, hearing, or attention is present, the family can seek an appropriate specialist while preserving a positive relationship with the Quran.

Verification references: the Quran; and general principles of family learning and educational practice.

Practical review section: Before publishing any information, ask what question the page answers, which parts were added by the editorial team, and which source the reader can consult. Simply rearranging information is not enough; value comes from explanation, context, and steps that help the reader understand, apply, and verify. At the end of each session, it can be useful to record one point for later review instead of saving many links without knowing why they were kept.$$,
  updated_at=now()
where slug='teaching-quran-to-children-sustainable-routine';
