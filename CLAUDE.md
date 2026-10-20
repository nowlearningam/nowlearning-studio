# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Now Learning Studio: a Vue 3 + Vite app that authors and exports "discover a tool, learn it, use it" videos for the Now Learning channel (Tamil, English, Hindi) — vertical Shorts (1080x1920) and one 16:9 long video (1920x1080). It is the Cinephile Perspective Studio architecture re-branded: same shell, clock, canvas stage, export, assets, file handover and autosave. Only `brand.js`, `lib/nl.js`, `lib/ideas.js` and `templates/` are Now Learning specific.

Templates are grouped by **kind**: `short` (vertical) or `long` (16:9). `App.vue` shows a Shorts / Long video switch above the template tabs and remembers which template you were last on in each kind.

| key | label | length |
|---|---|---|
| `howto` | How To Use It | grows with steps (hook, problem, N steps, result, card) |
| `quick` | Quick Discovery | fixed (default 25 s) |
| `wish` | Festival Wishes | fixed (default 8 s); own occasion palettes plus a `Custom` one (`OCCASIONS` in `templates/wish.js`), not `THEMES` |

Both How To Use It and Quick Discovery have a long-form counterpart, plus one extra:

| key | label | pairs with | shape |
|---|---|---|---|
| `howtolong` | How To Use It (long) | `howto` | **chaptered**: one step per chapter, closing on the Now Learning Card |
| `quicklong` | Quick Discovery (long) | `quick` | list show: one tool, several of its features |
| `roundup` | Tool Roundup | — | list show: many tools, one feature deep |

`templates.test.js` checks the pairing both ways. Festival Wishes has no long form by design.

## Commands (run in this directory)

`npm install`, `npm run dev`, `npm run build`, `npm test` (vitest; `npx vitest run src/lib/templates.test.js` for one file). Export needs https or localhost (WebCodecs).

## Architecture

- **One draw function per template** (`src/templates/<key>.js`): `{key,label,short,emoji,kind,size,fps,defaults,fields,duration,thumbTime,fileName,draw}`. `kind` is `'short'` or `'long'` and decides which switch the template appears under, the safe-area overlay and the length advice (`sizeStatus` in `lib/files.js`). `draw(ctx, t, data, A)` is pure in `(t, data, A)`; `A.img(id)` returns a decoded image or `null`. Preview (`StageCanvas.vue`) and export (`lib/exporter.js`) share it. Register templates in `templates/index.js`.
- **Colour templates** are `THEMES` in `lib/nl.js`, one per series (`Apps` mint, `AI` violet, `Tricks` yellow, `Websites` sky, `One tool` coral) plus a light `Daylight`. Each has `bg, panel, accent, ink, mute, on` (`on` is text on top of the accent). A template reads them with `pal(d)` and exposes `themeField()`; `SERIES` gives the label shown on screen. Add a colour template in `THEMES` and `SERIES` (the tests check all six keys).
- **Background templates** (`STYLES` in `lib/nl.js`, field `bgStyle` via `bgField()`): Glow, Grid, Dots, Stripes, Rays, Aurora, Waves, Bokeh, Circuit. They draw over the colour template's `bg` using its accent, independent of colour; `backdrop(ctx, P, style, t)`.
- **Shared pieces** in `lib/nl.js`: `backdrop`, `chip`, `pill`, `para` (wrapped centred text), `phone` (frame plus screenshot), `tap` (pulsing highlight), `nowCard` (Tool, Use it for, Cost; always the last frame), `progress`, and `LB` (on-screen labels per language: English, தமிழ், हिन्दी). App names and button labels stay English; hook, steps and result are typed per language.
- **Ideas** (`lib/ideas.js`): the 30 launch ideas as `series|template|tool|hook|use it for|cost`. `App.vue` `loadIdea()` loads one into its template with the matching colour template and blanks the narrative fields the idea does not supply (`problem`, `what`, `result`, step text), so the previous template's example copy cannot be filmed by mistake; steps and screenshots are still added by hand. Facts (availability in India, cost, privacy) must be checked before filming.
- **Fields drive the editor** (`FieldEditor.vue`): types text, textarea, number, range, color, checkbox, select, image, images, video, audio, list. `normalizeData` merges saved data over `defaults()`. Adding a field: `defaults()`, `fields`, `draw()`.
- **The long videos are built from `lib/wide.js`**, which holds the whole 16:9 kit (nine background templates, `wpara` with `**bold**` support, the scene painters, and the `listPlan` / `listAt` / `rankOf` timeline) and is byte-identical in Cinephile Perspective Studio — so fix layout bugs in both. Note `lib/nl.js` is vertical-only (it hardcodes 1080x1920); the long templates use `lib/wide.js` instead.
  - **List shows** (`quicklong`, `roundup`) call `drawListShow(ctx, t, d, A, P, { itemOf })`, which paints all four scenes, the rail and the watermark; `itemOf(item, i)` is the only per-template part.
  - **`howtolong` is chaptered**: same timeline, but `chapterSlide` per step with room to explain it, because a tutorial is a sequence, not a ranking. Its `secItem` defaults much higher than a list slide's.
  - **`lib/nlwide.js`** holds the 16:9 Now Learning Card (`nowCardWide`) and its fields. Both long templates close on it instead of a generic call to action, exactly as the vertical templates close on `nowCard`. Row labels follow the chosen language.
- **Handing over the finished file** is `lib/save.js` + `lib/device.js`, shared by all three studios: on a handheld that can share files the export waits behind a Share / Save button, because a share sheet needs a fresh tap and a long render has outlived the one that started it. `isHandheld()` only ever chooses *how* to hand a file over, never whether a feature exists.
- **Export, assets, clock, polyfills, autosave**: unchanged from Cinephile. `exporter.js` chooses `fast` (WebCodecs + `mp4-muxer`) or `record` (MediaRecorder) by feature detection; uploads live in IndexedDB (`lib/assets.js`); autosave key `nowlearning-studio-v1`; `lib/polyfill.js` patches `roundRect` and `letterSpacing`.

## Gotchas

- Keep key content inside the safe area: top 250 px and bottom 420 px are covered by platform UI. The progress bar is at y 1484; the watermark sits below it.
- Fonts are `@fontsource` Space Grotesk, Noto Sans Tamil, Noto Sans Devanagari. `FONT_LOADS` loads the Latin range; Tamil/Hindi glyphs fall back to a system font until the browser has loaded that range, so check a Tamil and a Hindi export by eye.
- Tamil and Hindi label text in `LB` is a first draft; have a native speaker check it.
- `templates.test.js` draws every template at 61 moments against a fake context. It catches runtime errors, not how things look; verify layout in the browser.
- `npm test` passes (49 tests across `templates.test.js`, `export.test.js`, `app.test.js`), but no real export has been verified in a browser yet. Test one before relying on it.
- No linter is configured. Deploy is Vercel (build `npm run build`, output `dist`); commit every new file.
