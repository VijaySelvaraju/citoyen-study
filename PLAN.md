# Citoyen — product and delivery plan

Decision date: 17 November 2026.

## Goal and V1 boundary

Help people study the French government's Livret du citoyen on their phone, moving between French and English without losing their place. V1 is a usable reading guide. It does not require accounts, a paid service, quizzes, AI generation or a database.

## 1. Preserve content before enhancing it

Keep every original page in order, grouped under the five original parts and appendices. Pair the two languages through a shared page ID. Do not summarize away examples, sidebars, anthem verses, tables or founding texts. The French transcription is the closer source; English is an explicitly unofficial study translation. Keep editorial additions visibly separate and dated, and attach corrections to the affected pages instead of hiding them at the end.

Implemented: all 83 page pairs, original order and page links, 14 attached editorial notes, readable tables and a complete notes page. Source content has exact automated coverage checks. The app's public content omits private file metadata.

V1.2 visually inspected the 83-page official download and restored 31 selected crops on 23 pages, including the administrative/EU maps, elections diagram, timelines, school diagram and selected cultural/geographical photos. Captions and alternative text are bilingual; French labels and credits are preserved. Remaining content work: full text/edition audit, remaining historical portraits and photography, and richer accessible text equivalents for dense maps. Do not call the app a visual facsimile or an exhaustive exam curriculum.

## 2. Reading design

Updated V1.1 direction: regular white light mode and true-black AMOLED dark mode, neutral surfaces, restrained blue accents and serif reading text. The user explicitly rejected the earlier green palette. An always-visible Light / AMOLED selector is in the global header. The home screen presents a clear sequence of parts, not a wall of text. Desktop has a persistent contents rail; mobile has a compact header and collapsible navigation. Page-based chunks preserve source references and keep sessions manageable.

Language controls stay in the header. Switching FR/EN retains the page and relative reading position. Comparison aligns complete pages, since the translation is not sentence-for-sentence. On phones it stacks French and English. Include reader text size, theme and focus controls; respect reduced-motion preferences. Source diagrams should be rebuilt as accessible HTML/SVG when exactness matters, not generated as decorative factual images.

## 3. Persistence and free hosting

Store the published content as versioned files in Git. Host generated static files on GitHub Pages using a public repository and its standard domain. Ship all content with the app; no content API, paid translation service or backend is needed.

Keep progress/bookmarks/preferences in localStorage with defensive parsing. Export/import provides an account-free way to move or back up progress; importing merges read pages and bookmarks. Browser storage is device/browser-specific and can be cleared. Do not promise synchronization. Cache the entire small static site with a service worker. Installation and first offline preparation require HTTPS or localhost; the portable single-file reader works from disk independently.

## 4. V1 release gates

Automated gates passed: content alignment and coverage, notes coverage, state validation, search, route rendering, persistence actions, static paths and mocked cache behavior. Hosted-browser checks passed for the foreword at viewport settings from 320 to 820 px, white/AMOLED switching and reload persistence, and wide bilingual columns. Remaining manual gates: broader responsive content coverage, keyboard and focus accessibility, long tables, phone install flow, offline reload, and update behavior.

The current deliverable includes the source, a deployment workflow, prebuilt static files and a standalone downloadable reader. Published on 17 November 2026: https://vijayselvaraju.github.io/citoyen-study/ from https://github.com/VijaySelvaraju/citoyen-study. The initial build/test and deploy jobs passed. No paid hosting is required.

## 5. V1.1 — strengthen learning and content confidence

- Audit the original PDF against the paired Markdown and capture any missing meaningful visuals.
- Use stable source references and an edition/content manifest; review the known factual corrections and date-sensitive claims.
- Add useful infographics only where they clarify relationships: institutions and elections, constitutional principles, historical chronology. Keep full source prose available beside each diagram.
- Improve navigation with within-page headings, a glossary, and per-section language reveal if learner testing shows page-level comparison is too long.
- Conduct accessibility and phone usability testing with several learners before adding features.

## 6. V2 — personal notes

Use IndexedDB for richer local notes, keyed by edition + page ID + stable section ID. Add export/import, migration tests and deletion controls before synchronization. The reading content remains separate from personal data. Only consider an optional free-tier backend when cross-device synchronization is a demonstrated need, and explain its quotas and privacy implications at that point.

## 7. V3 — flashcards and practice

Introduce manually reviewed, source-linked cards with French prompts and optional English help. Store review scheduling locally. Keep source notes and disputed claims out of unqualified quiz answers. Add spaced repetition, tags and progress only after a small verified deck works well. A quiz must distinguish published official questions from author-written practice questions; never imply guaranteed exam coverage.

## Research and rationale

- [GitHub Pages overview](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages): static HTML/CSS/JS hosting and public repository availability on GitHub Free.
- [Publishing with GitHub Actions](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site): use the workflow as the publishing source.
- [web.dev service workers](https://web.dev/learn/pwa/service-workers): offline interception/caching; installation alone is not an offline guarantee.
- [web.dev assets and data](https://web.dev/learn/pwa/assets-and-data): distinguish cached app/content resources from user data storage.
- [Astro Starlight internationalization](https://starlight.astro.build/guides/i18n/): associate equivalent pages across locales and make translation/fallback behavior explicit. Its documentation-site model is useful inspiration, but a custom page-comparison reader is simpler here without framework dependencies.
- [Ministry source](https://www.immigration.interieur.gouv.fr/documentation/guides-textes-et-brochures/livret-du-citoyen.html): source edition and official reference.

Research checked 17 November 2026. Decisions are specific to this free, reading-first V1; they do not require committing to a backend or a framework for later versions.

## V1.1 preference and device update

The primary target is the Galaxy Z Fold8 cover display, with occasional unfolded use. Prioritize narrow-screen reading and make bilingual comparison use the wider screen when at least 720 CSS px are available. Preserve the reading page and preferences across reflow; do not hard-code an unverified device resolution. Test common phone widths (320, 360, 375, 390, 412, 430) and larger widths (720, 768, 820, 1024) in actual browsers when available. The current changes implement the responsive policies and pass automated content/logic/contrast checks; real-device layout verification is still pending.

## Next improvements, in order

1. **Learning confidence:** complete the PDF/text audit and create a concise change log for date-sensitive facts and editorial corrections. The source text and interpretations must remain distinct.
2. **Quick help while reading:** tap a key French term to reveal a short English meaning; start with a small reviewed glossary, preserving the full reading text.
3. **Short sessions:** offer “next unread page” and a 5–10 minute study suggestion without streak pressure or notifications.
4. **Visual recall:** add a browseable map/timeline gallery and sentence-level explanations of each diagram, linked back to the lessons.
5. **Accessibility and phone checks:** physical Fold cover/unfolded transitions, text scaling, keyboard/screen-reader behavior, installation, offline reload and update UX.
6. **Personal notes and flashcards:** retain the existing later-phase boundary. Implement notes/export first, then reviewed source-linked cards; avoid turning the reading guide into a crowded dashboard.

V1.2 homepage rationale: a long French-only PDF is difficult to study on a phone, vocabulary interruptions break concentration, and short study sessions need a reliable return point. Keep this explanation below the primary reading/resume action, in both languages.

### Theme refinement during V1.2

The user asked whether regular dark mode could look better across different screens. Keep three explicit choices: Light, Dark, AMOLED. Recommend regular charcoal Dark for visual separation between reading surfaces, navigation and cards; retain true black as an optional preference. Preserve existing AMOLED selections and avoid inferring display technology from device names. A compact appearance selector on phones preserves room for language switching.
