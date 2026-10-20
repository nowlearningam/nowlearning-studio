import { BRAND } from '../brand.js'
import { SERIES, pal, lb, themeField, langField } from '../lib/nl.js'
import { nowCardWide, nowCardFields, nowCardDefaults } from '../lib/nlwide.js'
import {
  LW, LH, LSAFE, wideBackdrop, wideBgField, WIDE_BACKGROUNDS, wideRail, wideWatermark,
  titleCard, hookCard, chapterSlide,
  listPlan, listAt, listCount, listDuration, listTimingFields, listTimingDefaults,
} from '../lib/wide.js'

// How To Use It, long form: a full tutorial rather than a ranked list.
//
// It shares the list show's timeline — title, setup, N sections, closing — but paints chapters: one
// step per slide with its screenshot and room to explain it properly, and the Now Learning Card at
// the end instead of a call to action. The steps mirror the vertical How To Use It, so a Short and a
// full tutorial can be written from the same notes.

const step = (heading = '', note = '', body = '') => ({ image: '', heading, note, body })

export default {
  key: 'howtolong',
  label: 'How To Use It (long)',
  short: 'How to+',
  emoji: '\u{1F4D8}',
  kind: 'long',
  size: [LW, LH],
  fps: 30,
  defaults: () => ({
    theme: 'Apps',
    lang: 'English',
    kicker: '',
    title: 'How To Use Citymapper',
    sub: 'Public transport in a new city, start to finish',
    hook: 'You can’t tell which bus or train goes where.',
    hookNote: 'Six steps, and you will never guess at a bus stop again.',
    items: [
      step('Open the app and set your city', 'Takes 30 seconds', 'Citymapper asks for your city the first time you open it. Pick the one you are in — it only covers the cities on its list, so check yours is there before you rely on it.'),
      step('Type where you are going', 'Search, do not browse', 'Put the destination in the search box rather than hunting on the map. Saved places like Home and Work go at the top once you add them.'),
      step('Compare the options it offers', 'The important screen', 'Every route shows time, cost and how much walking is involved. The cheapest is rarely the fastest, and the app is honest about both.'),
      step('Follow it to the stop', 'It nudges you', 'Pick a route and it tells you which exit to use and when to get off. Turn on notifications and you can keep the phone in your pocket.'),
    ],
    result: 'Your whole journey, planned.',
    ...nowCardDefaults({ app: 'Citymapper', useFor: 'Public transport in a new city', cost: 'Free (paid tier optional)', cardH: 'Your whole journey, planned.' }),
    shape: 'poster',
    side: 'left',
    bgStyle: 'Glow',
    showRail: true,
    watermark: true,
    ...listTimingDefaults(),
    secItem: 16, // a step is an explanation, not a caption
    secCta: 7,
  }),
  fields: [
    { group: 'Content', key: 'kicker', label: 'Small heading (empty = the series name)', type: 'text' },
    { group: 'Content', key: 'title', label: 'Video title', type: 'text' },
    { group: 'Content', key: 'sub', label: 'Subtitle', type: 'text' },
    { group: 'Content', key: 'hook', label: 'The problem (empty to skip that card)', type: 'textarea' },
    { group: 'Content', key: 'hookNote', label: 'Note under the problem', type: 'text' },
    {
      group: 'Content',
      key: 'items',
      label: 'Steps',
      type: 'list',
      itemLabel: 'Step',
      newItem: step('', '', ''),
      fields: [
        { key: 'image', label: 'Screenshot', type: 'image' },
        { key: 'heading', label: 'What to do', type: 'text' },
        { key: 'note', label: 'Short note (optional)', type: 'text' },
        { key: 'body', label: 'Explain it (**bold** for key words)', type: 'textarea' },
      ],
    },
    ...nowCardFields(),
    themeField(),
    langField(),
    wideBgField(),
    { group: 'Look', key: 'shape', label: 'Screenshot shape', type: 'select', options: ['poster', 'wide', 'square'] },
    { group: 'Look', key: 'side', label: 'Screenshot on the', type: 'select', options: ['left', 'right'] },
    { group: 'Look', key: 'showRail', label: 'Show the progress rail', type: 'checkbox' },
    { group: 'Look', key: 'watermark', label: 'Show channel watermark', type: 'checkbox' },
    ...listTimingFields(),
  ],
  duration: listDuration,
  thumbTime: (d) => {
    const p = listPlan(d)
    return p.title + p.hook + Math.min(p.item - 0.2, 1.4)
  },
  fileName: (d) => d.title,

  draw(ctx, t, d, A) {
    const P = pal(d)
    const l = lb(d)
    const n = listCount(d)
    const at = listAt(d, t)
    wideBackdrop(ctx, P, WIDE_BACKGROUNDS.includes(d.bgStyle) ? d.bgStyle : 'Glow', t)

    if (at.scene === 'title') {
      titleCard(ctx, P, at.lt, { kicker: d.kicker || SERIES[d.theme] || BRAND.name, title: d.title, sub: d.sub })
    } else if (at.scene === 'hook') {
      hookCard(ctx, P, at.lt, { hook: d.hook, note: d.hookNote })
    } else if (at.scene === 'item') {
      const it = (d.items && d.items[at.i]) || {}
      chapterSlide(ctx, P, at.lt, at.dur, it, A, {
        shape: ['poster', 'wide', 'square'].includes(d.shape) ? d.shape : 'poster',
        side: d.side === 'right' ? 'right' : 'left',
        // "Step 2 of 6", in the chosen language.
        chip: `${l.step} ${at.i + 1} / ${n}`,
        heading: it.heading,
        note: it.note,
        body: it.body,
        label: 'ADD SCREENSHOT',
      })
      if (d.showRail) wideRail(ctx, P, at.i + 1, n)
    } else {
      nowCardWide(ctx, P, at.lt, d, { head: d.cardH || d.result })
    }

    const tucked = at.scene === 'item' && d.showRail
    if (d.watermark) wideWatermark(ctx, P, { align: tucked ? 'right' : 'center', x: tucked ? LSAFE.x + LSAFE.w : LW / 2, y: tucked ? LH - 92 : LH - 54 })
  },
}
