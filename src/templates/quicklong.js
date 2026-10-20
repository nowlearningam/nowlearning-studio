import { BRAND } from '../brand.js'
import { SERIES, pal, themeField, langField } from '../lib/nl.js'
import { nowCardWide, nowCardFields, nowCardDefaults } from '../lib/nlwide.js'
import {
  LW, LH, LSAFE, wideBackdrop, wideBgField, WIDE_BACKGROUNDS, wideRail, wideWatermark,
  titleCard, hookCard, itemSlide,
  listPlan, listAt, listCount, listDuration, rankOf, listTimingFields, listTimingDefaults,
} from '../lib/wide.js'

// Quick Discovery, long form: one tool, several of its features.
//
// The vertical Quick Discovery covers a single feature in twenty seconds; this takes the same tool
// and walks through everything worth knowing about it. That is what makes it different from Tool
// Roundup, which covers many tools one feature deep. It closes on the Now Learning Card.

const feature = (heading = '', badge = '', body = '') => ({ image: '', heading, badge, body })

export default {
  key: 'quicklong',
  label: 'Quick Discovery (long)',
  short: 'Quick+',
  emoji: '\u{1F50E}',
  kind: 'long',
  size: [LW, LH],
  fps: 30,
  defaults: () => ({
    theme: 'Tricks',
    lang: 'English',
    kicker: '',
    title: 'Everything Google Lens Can Do',
    sub: 'One app, six things worth knowing',
    hook: 'Most people use Google Lens for one thing. It does six.',
    hookNote: 'All of them free, all of them on the phone you already have.',
    items: [
      feature('Identify a plant or a product', 'Point and shoot', 'Open Lens, point the camera, and it names what it is looking at. Works offline for common things, better online.'),
      feature('Copy text off a photo', 'Saves retyping', 'Photograph a printed page and Lens turns it into text you can select. It handles handwriting too, if it is neat.'),
      feature('Translate a sign or a menu', 'Live, through the camera', 'Hold the camera over foreign text and the translation replaces it on screen. Download the language first so it works without signal.'),
    ],
    result: 'Now you know what it is.',
    ...nowCardDefaults({ app: 'Google Lens', useFor: 'Identify plants, products and printed text', cost: 'Free', cardH: 'Now you know what it is.' }),
    shape: 'wide',
    bgStyle: 'Dots',
    countdown: false,
    showRail: true,
    watermark: true,
    ...listTimingDefaults(),
    secItem: 12,
    secCta: 7,
  }),
  fields: [
    { group: 'Content', key: 'kicker', label: 'Small heading (empty = the series name)', type: 'text' },
    { group: 'Content', key: 'title', label: 'Video title', type: 'text' },
    { group: 'Content', key: 'sub', label: 'Subtitle', type: 'text' },
    { group: 'Content', key: 'hook', label: 'Hook line (empty = skip the hook card)', type: 'textarea' },
    { group: 'Content', key: 'hookNote', label: 'Hook note (small line under it)', type: 'text' },
    {
      group: 'Content',
      key: 'items',
      label: 'Features',
      type: 'list',
      itemLabel: 'Feature',
      newItem: feature('', '', ''),
      fields: [
        { key: 'image', label: 'Screenshot', type: 'image' },
        { key: 'heading', label: 'What it does', type: 'text' },
        { key: 'badge', label: 'Short badge (optional)', type: 'text' },
        { key: 'body', label: 'How to use it (**bold** for key words)', type: 'textarea' },
      ],
    },
    ...nowCardFields(),
    themeField(),
    langField(),
    wideBgField(),
    { group: 'Look', key: 'shape', label: 'Screenshot shape', type: 'select', options: ['wide', 'poster', 'square'] },
    { group: 'Look', key: 'countdown', label: 'Count down (N → 1) instead of up', type: 'checkbox' },
    { group: 'Look', key: 'showRail', label: 'Show the progress rail', type: 'checkbox' },
    { group: 'Look', key: 'watermark', label: 'Show channel watermark', type: 'checkbox' },
    ...listTimingFields(),
  ],
  duration: listDuration,
  thumbTime: (d) => {
    const p = listPlan(d)
    return p.title + p.hook + Math.min(p.item - 0.2, 1.2)
  },
  fileName: (d) => d.title,

  draw(ctx, t, d, A) {
    const P = pal(d)
    const n = listCount(d)
    const at = listAt(d, t)
    wideBackdrop(ctx, P, WIDE_BACKGROUNDS.includes(d.bgStyle) ? d.bgStyle : 'Dots', t)

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
        tag: it.badge,
        rows: [],
        body: it.body,
        bodyMax: 4,
      })
      if (d.showRail) wideRail(ctx, P, at.i + 1, n)
    } else {
      nowCardWide(ctx, P, at.lt, d, { head: d.cardH || d.result })
    }

    const tucked = at.scene === 'item' && d.showRail
    if (d.watermark) wideWatermark(ctx, P, { align: tucked ? 'right' : 'center', x: tucked ? LSAFE.x + LSAFE.w : LW / 2, y: tucked ? LH - 92 : LH - 54 })
  },
}
