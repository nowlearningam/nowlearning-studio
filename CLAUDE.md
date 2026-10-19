# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Now Learning Studio: a Vue 3 + Vite app that authors and exports short vertical (1080x1920) "discover a tool, learn it, use it" videos for the Now Learning channel (Tamil, English, Hindi). It is the Cinephile Perspective Studio architecture re-branded: same shell, clock, canvas stage, export, assets and autosave. Only `brand.js`, `lib/nl.js`, `lib/ideas.js` and `templates/` are Now Learning specific.

| key | label | length |
|---|---|---|
| `howto` | How To Use It | grows with steps (hook, problem, N steps, result, card) |
| `quick` | Quick Discovery | fixed (default 25 s) |
| `wish` | Festival Wishes | fixed (default 8 s); own occasion palettes plus a `Custom` one (`OCCASIONS` in `templates/wish.js`), not `THEMES` |

## Commands (run in this directory)

`npm install`, `npm run dev`, `npm run build`, `npm test` (vitest; `npx vitest run src/lib/templates.test.js` for one file). Export needs https or localhost (WebCodecs).

## Architecture

- **One draw function per template** (`src/templates/<key>.js`): `{key,label,short,emoji,size,fps,defaults,fields,duration,thumbTime,fileName,draw}`. `draw(ctx, t, data, A)` is pure in `(t, data, A)`; `A.img(id)` returns a decoded image or `null`. Preview (`StageCanvas.vue`) and export (`lib/exporter.js`) share it. Register templates in `templates/index.js`.
- **Colour templates** are `THEMES` in `lib/nl.js`, one per series (`Apps` mint, `AI` violet, `Tricks` yellow, `Websites` sky, `One tool` coral) plus a light `Daylight`. Each has `bg, panel, accent, ink, mute, on` (`on` is text on top of the accent). A template reads them with `pal(d)` and exposes `themeField()`; `SERIES` gives the label shown on screen. Add a colour template in `THEMES` and `SERIES` (the tests check all six keys).
- **Background templates** (`STYLES` in `lib/nl.js`, field `bgStyle` via `bgField()`): Glow, Grid, Dots, Stripes, Rays, Aurora, Waves, Bokeh, Circuit. They draw over the colour template's `bg` using its accent, independent of colour; `backdrop(ctx, P, style, t)`.
- **Shared pieces** in `lib/nl.js`: `backdrop`, `chip`, `pill`, `para` (wrapped centred text), `phone` (frame plus screenshot), `tap` (pulsing highlight), `nowCard` (Tool, Use it for, Cost; always the last frame), `progress`, and `LB` (on-screen labels per language: English, தமிழ், हिन्दी). App names and button labels stay English; hook, steps and result are typed per language.
- **Ideas** (`lib/ideas.js`): the 30 launch ideas as `series|template|tool|hook|use it for|cost`. `App.vue` `loadIdea()` loads one into its template with the matching colour template; steps and screenshots are still added by hand. Facts (availability in India, cost, privacy) must be checked before filming.
- **Fields drive the editor** (`FieldEditor.vue`): types text, textarea, number, range, color, checkbox, select, image, images, video, audio, list. `normalizeData` merges saved data over `defaults()`. Adding a field: `defaults()`, `fields`, `draw()`.
- **Export, assets, clock, polyfills, autosave**: unchanged from Cinephile. `exporter.js` chooses `fast` (WebCodecs + `mp4-muxer`) or `record` (MediaRecorder) by feature detection; uploads live in IndexedDB (`lib/assets.js`); autosave key `nowlearning-studio-v1`; `lib/polyfill.js` patches `roundRect` and `letterSpacing`.

## Gotchas

- Keep key content inside the safe area: top 250 px and bottom 420 px are covered by platform UI. The progress bar is at y 1484; the watermark sits below it.
- Fonts are `@fontsource` Space Grotesk, Noto Sans Tamil, Noto Sans Devanagari. `FONT_LOADS` loads the Latin range; Tamil/Hindi glyphs fall back to a system font until the browser has loaded that range, so check a Tamil and a Hindi export by eye.
- Tamil and Hindi label text in `LB` is a first draft; have a native speaker check it.
- `templates.test.js` draws every template at 61 moments against a fake context. It catches runtime errors, not how things look; verify layout in the browser.
- `npm test` passes (31 tests across `templates.test.js`, `export.test.js`, `app.test.js`), but no real export has been verified in a browser yet. Test one before relying on it.
- No linter is configured. Deploy is Vercel (build `npm run build`, output `dist`); commit every new file.
