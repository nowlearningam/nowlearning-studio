import { BRAND } from '../brand.js'
import { THEMES, SERIES, LB, pal, lb, themeField, langField } from '../lib/nl.js'
import {
  LW, LH, LSAFE, wideBackdrop, wideBgField, WIDE_BACKGROUNDS, wideRail, wideWatermark,
  titleCard, hookCard, itemSlide, ctaCard,
  listPlan, listAt, listCount, listDuration, rankOf, listTimingFields, listTimingDefaults,
} from '../lib/wide.js'

// Tool Roundup: the long-form (16:9) list show. Title card, hook, one slide per tool, closing card.
// Used for "10 free AI tools", "Apps every student needs", "Websites worth bookmarking" — anything
// that walks through a list of tools rather than a single how-to.
//
// The shape of the show (scenes, timing, rail, rank chips) lives in lib/wide.js and is shared with
// the other studios; this file supplies the Now Learning colour templates, labels and fields. The
// colour templates and the on-screen label languages are the same ones the vertical templates use.

const tool = (heading = '', useFor = '', cost = 'Free', body = '') => ({ image: '', heading, useFor, cost, body })

export default {
  key: 'roundup',
  label: 'Tool Roundup',
  short: 'Roundup',
  emoji: '\u{1F9F0}',
  kind: 'long',
  size: [LW, LH],
  fps: 30,
  defaults: () => ({
    theme: 'AI',
    lang: 'English',
    kicker: 'Now Learning',
    title: '10 Free AI Tools Worth Knowing',
    sub: 'All free to start · all usable in India',
    hook: 'Ten tools that save you real time — and cost you nothing to try.',
    hookNote: 'Check pricing yourself before you rely on any of them.',
    items: [
      tool('AI assistant', 'Summarising long documents', 'Free (paid tier optional)', 'Paste a 40-page PDF and ask for one page. Good for reports, notices and contracts.'),
      tool('Gamma', 'Building slides fast', 'Free (paid tier optional)', 'Give it a topic, get a deck you can edit. Export to PowerPoint when you are done.'),
      tool('Google Lens', 'Identify plants and products', 'Free', 'Point your camera at anything. Also copies printed text straight off a photo.'),
    ],
    countdown: false,
    shape: 'wide',
    ctaH: 'Which one will you try first?',
    ctaS: 'Tell us in the comments and we will cover it properly.',
    ctaTag: BRAND.tagline,
    bgStyle: 'Aurora',
    showRail: true,
    watermark: true,
    ...listTimingDefaults(),
  }),
  fields: [
    { group: 'Content', key: 'kicker', label: 'Small heading (title card)', type: 'text' },
    { group: 'Content', key: 'title', label: 'Video title', type: 'text' },
    { group: 'Content', key: 'sub', label: 'Subtitle', type: 'text' },
    { group: 'Content', key: 'hook', label: 'Hook line (empty = skip the hook card)', type: 'textarea' },
    { group: 'Content', key: 'hookNote', label: 'Hook note (small line under it)', type: 'text' },
    {
      group: 'Content',
      key: 'items',
      label: 'Tools',
      type: 'list',
      itemLabel: 'Tool',
      newItem: { image: '', heading: '', useFor: '', cost: 'Free', body: '' },
      fields: [
        { key: 'image', label: 'Screenshot', type: 'image' },
        { key: 'heading', label: 'Tool name', type: 'text' },
        { key: 'useFor', label: 'Use it for', type: 'text' },
        { key: 'cost', label: 'Cost', type: 'text' },
        { key: 'body', label: 'What it does (**bold** for key words)', type: 'textarea' },
      ],
    },
    { group: 'Content', key: 'ctaH', label: 'Closing heading', type: 'text' },
    { group: 'Content', key: 'ctaS', label: 'Closing line', type: 'text' },
    { group: 'Content', key: 'ctaTag', label: 'Closing tagline pill', type: 'text' },
    themeField(),
    langField(),
    wideBgField(),
    { group: 'Look', key: 'shape', label: 'Screenshot shape', type: 'select', options: ['wide', 'poster', 'square'] },
    { group: 'Look', key: 'countdown', label: 'Count down (10 → 1) instead of up', type: 'checkbox' },
    { group: 'Look', key: 'showRail', label: 'Show the progress rail', type: 'checkbox' },
    { group: 'Look', key: 'watermark', label: 'Show channel watermark', type: 'checkbox' },
    ...listTimingFields(),
  ],
  duration: listDuration,
  thumbTime: (d) => {
    const p = listPlan(d)
    // The first tool, settled: the most useful frame for a cover.
    return p.title + p.hook + Math.min(p.item - 0.2, 1.2)
  },
  fileName: (d) => d.title,

  draw(ctx, t, d, A) {
    const P = pal(d)
    const l = lb(d)
    const n = listCount(d)
    const at = listAt(d, t)
    wideBackdrop(ctx, P, WIDE_BACKGROUNDS.includes(d.bgStyle) ? d.bgStyle : 'Aurora', t)

    if (at.scene === 'title') {
      titleCard(ctx, P, at.lt, { kicker: d.kicker || SERIES[d.theme] || BRAND.name, title: d.title, sub: d.sub })
    } else if (at.scene === 'hook') {
      hookCard(ctx, P, at.lt, { hook: d.hook, note: d.hookNote })
    } else if (at.scene === 'item') {
      const it = (d.items && d.items[at.i]) || {}
      itemSlide(ctx, P, at.lt, at.dur, it, A, {
        shape: ['wide', 'poster', 'square'].includes(d.shape) ? d.shape : 'wide',
        rank: rankOf(d, at.i, n),
        label: 'ADD SCREENSHOT',
        heading: it.heading,
        // The row labels follow the chosen language, exactly as the Now Learning Card does.
        rows: [
          [l.use, it.useFor],
          [l.cost, it.cost],
        ],
        body: it.body,
      })
      if (d.showRail) wideRail(ctx, P, at.i + 1, n)
    } else {
      ctaCard(ctx, P, at.lt, { head: d.ctaH, sub: d.ctaS, tag: d.ctaTag })
    }

    // The watermark sits opposite the rail so the two never collide.
    const tucked = at.scene === 'item' && d.showRail
    if (d.watermark) wideWatermark(ctx, P, { align: tucked ? 'right' : 'center', x: tucked ? LSAFE.x + LSAFE.w : LW / 2, y: tucked ? LH - 92 : LH - 54 })
  },
}
