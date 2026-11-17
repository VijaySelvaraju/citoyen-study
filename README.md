# Citoyen — V1.1

A bilingual, mobile-friendly study reader for the **May 2026 Livret du citoyen**. French and English extracts are paired by original PDF page, preserving all 83 page sections, the five parts, appendices and 14 editorial notes. This is an independent, unofficial guide.

## Use it now

Open **Citoyen.html** in a modern browser. It contains the entire reader, styles and both languages, and needs no server or internet to read. External source links require a connection. Browser handling of local-file storage varies: export your progress if you want a reliable backup. Installation as a PWA requires the hosted version below.

## Version 1

- French, English and bilingual comparison views. Comparison is side by side on wide screens and stacked on phones; alignment is by PDF page, not sentence.
- Five-part navigation, original PDF page links, appendices, previous/next navigation and page jump.
- Search across both languages, ignoring accents and case. Keyboard shortcut: Ctrl/Cmd + K.
- Explicit “mark as read”, bookmarks, last page and relative reading position stored locally.
- Adjustable text, globally accessible white/AMOLED theme controls, distraction-free focus mode and reduced-motion support.
- Progress/bookmark JSON export and merge import, without an account.
- Install manifest and service worker caching the complete site. A visible status confirms when offline preparation has finished. A new release offers a reload action.
- Source limitations and dated editorial notes are visible and remain separate from the extracted booklet text.
- No analytics, paid services, runtime dependencies, remote fonts, account or backend.

## Run and build

Requirements: Python 3.10+; Node 20+ for the tests. No dependency installation is needed.

```sh
npm run build
npm test
npm start
```

Open http://localhost:4173. `python3 scripts/standalone.py` generates the portable `Citoyen.html` after a build.

## Publish for free with GitHub Pages

1. Create an empty **public** GitHub repository, for example `citoyen-study`. GitHub Pages is available for public repositories on GitHub Free.
2. Put the contents of this project in its `main` branch, including `.github/workflows/pages.yml`. Do not upload the ZIP as a single repository file.
3. Open **Settings → Pages → Build and deployment → Source → GitHub Actions**.
4. Push to `main`, or run **Actions → Publish study guide → Run workflow**.
5. The deployment job shows the published URL, normally `https://YOUR-USERNAME.github.io/citoyen-study/`.
6. Open it online once and wait for the offline-ready indicator. On Android use the browser’s install menu; on iPhone use Safari → Share → Add to Home Screen. Availability and wording vary by browser.

The site uses relative asset URLs and hash-based page navigation, so repository subpaths work without rewrites or a custom domain. Nothing secret belongs in this public repository. The provided content files have private file identifiers removed.

The workflow builds, checks the content and application logic, uploads `dist/`, then deploys through GitHub's official Pages actions. The built `dist/` is also included in the ZIP for hosts that accept static files directly. `.github/` can be hidden by file managers; using Git preserves it.

If publishing manually with Git:

```sh
git init -b main
git add .
git commit -m "Build bilingual Citoyen study guide"
git remote add origin https://github.com/YOUR-USERNAME/citoyen-study.git
git push -u origin main
```

## Content and provenance

- `content/fr.md`: French working transcription supplied for this project.
- `content/en.md`: supplied English study translation.
- Both refer to an 83-page PDF with **May 2026** printed on the cover. The ministry download page describes its available PDF as the **July 2026** version. The app labels its own source by the supplied extract's printed edition; a fresh PDF identity comparison has not been performed in this build.
- [Official Ministry booklet page](https://www.immigration.interieur.gouv.fr/documentation/guides-textes-et-brochures/livret-du-citoyen.html).
- Text copyright attribution: Ministère de l’Intérieur, Direction générale des étrangers en France. This project does not imply government affiliation or approval. No government logo or third-party photographs are reproduced.
- The app preserves the source's dated claims and displays supplied editorial corrections separately, dated 16 November 2026. They were not re-fact-checked for this build.
- All 83 text sections are included. Photographs, decorative elements, some credits and small map labels are absent from the supplied extracts. Page 21 links to the official map. The complete original visual layout has **not** been recreated.
- The booklet itself says it is not exhaustive. This is not a guarantee of covering every possible exam or interview question.

## Architecture

`content/` → `scripts/build.py` → `dist/content.json` + static `site/` files.

The builder uses only Python's standard library. It validates page alignment, renders the Markdown constructs used by these inputs, creates install icons, and versions the service worker from the actual asset/content bytes. It is a deliberately small renderer for these curated sources, not a general Markdown publishing engine.

Page IDs (`p001`–`p083`) are stable **within this edition**. Locale is a display choice; progress and bookmarks reference the page ID. A future edition must have its own edition ID and a reviewed migration map. Native HTML/JavaScript keeps this first version portable and inexpensive. A framework migration is unnecessary for the present scope; Astro/Starlight is a reasonable future option if editorial contributions expand significantly.

## Validation and limits

On 17 November 2026, **14 automated tests passed**, including:

- Exact source-body preservation for all 166 language/page combinations.
- 249 reader views (83 pages × 3 language modes) and every chapter route generated in a mocked DOM without application errors.
- Cross-language, accent-insensitive search, escaped display text, malformed saved-state handling, read/bookmark actions and persistence.
- Manifest paths, cache asset coverage, private-reference exclusion and a mocked service-worker offline/cache lifecycle.

JavaScript syntax and the Python build pass. These checks are not visual browser tests. The environment blocked local HTTP server binding and local-file browser preview; real desktop/mobile rendering, browser installation, service-worker update UX and device offline behavior remain **unverified in an actual browser**. GitHub authentication could not be verified, so the project was not published.

Before announcing a public release: verify at 390 px and 1440 px; exercise keyboard/dialog navigation; test English and comparison modes on page 78's long text/table; mark/bookmark/reload; export/import; enable airplane mode after the offline indicator; verify a deployed update; and check iOS/Android installation. Review source reuse conditions before applying a blanket content license.

## Roadmap

See [PLAN.md](PLAN.md) for decisions, acceptance criteria and future phases.

## V1.1 — white, AMOLED and foldable layouts

Requested on 17 November 2026: remove the green palette; use regular white and true AMOLED black. Theme selection is now explicitly labelled in the header of every screen (Light / AMOLED; Blanc / AMOLED in French). The selection persists across navigation and reloads, and updates browser theme-color. Reader and main surfaces use #FFFFFF in light mode and #000000 in dark mode. Primary, secondary and accent text pass a 4.5:1 contrast check against both backgrounds.

Responsive design targets **available CSS viewport width**, rather than assuming the phone's physical display resolution or a fixed Galaxy model mapping. Browser zoom, system display settings, split-screen and orientation affect this width.

| Available width | Intended behavior |
|---|---|
| 320–359 px | Compact two-row header; visible language/theme choices; single-column reading; horizontal scrolling limited to wide tables |
| 360–430 px | Cover-screen and conventional phone layouts, 44 px theme/language controls, one-column chapter cards |
| 431–719 px | Single-column reader/comparison; flexible wrapping controls and generous reading space |
| 720–1099 px | Collapsible navigation frees the reading surface; bilingual comparison becomes two columns; chapter cards use two columns |
| 1100 px and above | Persistent navigation rail; full desktop reading layout |

The UI includes safe-area insets, unrestricted browser zoom, pointer-coarse link target adjustments, and a visible navigation close button/backdrop. Unfolding reflows the same document without resetting page/bookmark state. These rules cover narrow cover screens, standard iPhone/Android browser widths, landscape, unfolded screens and tablet-sized viewports. **The exact Galaxy Z Fold8 viewport is not assumed or claimed to be device-tested.**

Validation: 14 passing automated tests (content, mocked DOM behavior, explicit persistent theme switching, contrast and responsive-policy presence). An additional isolated demo check covers theme, language, navigation and width selection. These are not pixel-layout or real-browser viewport tests. Physical Fold 8, Safari/Chrome/Samsung Internet, text scaling and real folding transitions still need hands-on verification. The environment's earlier server/file-preview restrictions remain; they were not bypassed.

References: [MDN viewport concepts](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/CSSOM_view/Viewport_concepts), [Samsung Fold8 product page](https://www.samsung.com/fr/smartphones/galaxy-z-fold8/). Browser layout should not be inferred from screen diagonal alone.
