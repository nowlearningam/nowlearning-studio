import { seg, easeOut, easeBack, text, watermark } from '../lib/draw.js'
import { W, H, f, pal, lb, sec, themeField, langField, backdrop, chip, pill, circle, para, phone, tap, nowCard, progress } from '../lib/nl.js'

// How To Use It (45-90 s): hook, problem, one scene per step with a screenshot, result, Now Learning Card.
const step = (text, tapIt = false) => ({ image: '', text, tap: tapIt, hx: 0.5, hy: 0.5 })
const segs = (d) => {
  let x = 0
  const a = [['hook', sec(d.sHook, 3)]]
  if (String(d.problem || '').trim()) a.push(['prob', sec(d.sProb, 3)])
  ;(d.steps || []).forEach((_, i) => a.push(['step', sec(d.sStep, 4), i]))
  a.push(['res', sec(d.sRes, 3)], ['card', sec(d.sCard, 3)])
  return a.map(([n, l, i]) => {
    const o = { n, i, s: x, e: x + l }
    x += l
    return o
  })
}

export default {
  key: 'howto',
  label: 'How To Use It',
  short: 'How To',
  emoji: '\u{1F4F1}',
  size: [W, H],
  fps: 30,
  defaults: () => ({
    theme: 'Apps',
    lang: 'English',
    app: 'Citymapper',
    hook: 'New city? Not sure which bus or train to take?',
    problem: 'You can’t tell which bus or train goes where.',
    steps: [step('Open the app and check your city'), step('Type where you’re going', true), step('Compare time and transport options'), step('Walk to the stop it shows')],
    result: 'Your whole journey, planned.',
    useFor: 'Public transport in a new city',
    cost: 'Free (paid tier optional)',
    sHook: 3, sProb: 3, sStep: 4, sRes: 3, sCard: 3,
    watermark: true,
    audio: '',
    musicVol: 0.7,
  }),
  fields: [
    { group: 'Content', key: 'app', label: 'Tool or app name', type: 'text' },
    { group: 'Content', key: 'hook', label: 'Hook (the first 3 seconds)', type: 'textarea' },
    { group: 'Content', key: 'problem', label: 'Problem (leave empty to skip)', type: 'textarea' },
    {
      group: 'Content', key: 'steps', type: 'list', itemLabel: 'Step', newItem: step(''),
      fields: [
        { key: 'image', label: 'Screenshot', type: 'image' },
        { key: 'text', label: 'What to do', type: 'text' },
        { key: 'tap', label: 'Show tap highlight', type: 'checkbox' },
        { key: 'hx', label: 'Highlight: left \u2194 right', type: 'range', min: 0, max: 1, step: 0.01 },
        { key: 'hy', label: 'Highlight: top \u2195 bottom', type: 'range', min: 0, max: 1, step: 0.01 },
      ],
    },
    { group: 'Content', key: 'result', label: 'Result line', type: 'text' },
    { group: 'Now Learning Card', key: 'useFor', label: 'Use it for', type: 'text' },
    { group: 'Now Learning Card', key: 'cost', label: 'Cost (Free / Paid / Free + paid)', type: 'text' },
    themeField(),
    langField(),
    { group: 'Look', key: 'watermark', label: 'Show channel watermark', type: 'checkbox' },
    { group: 'Timing & sound', key: 'sHook', label: 'Hook (s)', type: 'number', min: 1, max: 30 },
    { group: 'Timing & sound', key: 'sProb', label: 'Problem (s)', type: 'number', min: 1, max: 30 },
    { group: 'Timing & sound', key: 'sStep', label: 'Each step (s)', type: 'number', min: 1, max: 30 },
    { group: 'Timing & sound', key: 'sRes', label: 'Result (s)', type: 'number', min: 1, max: 30 },
    { group: 'Timing & sound', key: 'sCard', label: 'Card (s)', type: 'number', min: 1, max: 30 },
    { group: 'Timing & sound', key: 'audio', label: 'Music (optional)', type: 'audio' },
    { group: 'Timing & sound', key: 'musicVol', label: 'Music volume', type: 'range', min: 0, max: 1, step: 0.05 },
  ],
  duration: (d) => segs(d).at(-1).e,
  thumbTime: () => 1.2,
  fileName: (d) => d.app,

  draw(ctx, t, d, A) {
    const P = pal(d)
    const l = lb(d)
    const g = segs(d)
    const total = this.duration(d)
    const s = g.find((x) => t >= x.s && t < x.e) || g.at(-1)
    const lt = t - s.s
    const pop = easeBack(seg(lt, 0, 0.45))
    const a = easeOut(seg(lt, 0, 0.3))
    backdrop(ctx, P)
    ctx.save()
    if (s.n === 'step') {
      const st = d.steps[s.i] || {}
      circle(ctx, 130, 340, 46, P.accent)
      text(ctx, String(s.i + 1), 130, 358, { font: f(700, 52), color: P.on })
      text(ctx, `${l.step} ${s.i + 1}/${d.steps.length}`, 200, 354, { font: f(700, 40), color: P.ink, align: 'left' })
      d.steps.forEach((_, k) => circle(ctx, 990 - (d.steps.length - 1 - k) * 34, 340, k === s.i ? 11 : 7, k <= s.i ? P.accent : P.mute + '66'))
      const r = phone(ctx, P, A.img(st.image), 1 + 0.04 * seg(lt, 0, s.e - s.s))
      if (st.tap) tap(ctx, r, st.hx, st.hy, lt)
      para(ctx, st.text, 540, 1370, { px: 50, color: P.ink, maxW: 920, max: 3, alpha: a, rise: (1 - a) * 30 })
    } else if (s.n === 'hook') {
      chip(ctx, d, P)
      ctx.globalAlpha = a
      pill(ctx, d.app, 540, 500, P)
      para(ctx, d.hook, 540, 900, { px: 88, color: P.ink, maxW: 880, max: 5 })
      ctx.fillStyle = P.accent
      ctx.fillRect(540 - 100 * seg(lt, 0, 0.6), 1180, 200 * seg(lt, 0, 0.6), 10)
    } else if (s.n === 'prob') {
      chip(ctx, d, P)
      ctx.globalAlpha = a
      circle(ctx, 540, 560, 90, P.accent)
      text(ctx, '?', 540, 600, { font: f(700, 120), color: P.on })
      text(ctx, l.prob, 540, 790, { font: f(700, 42), color: P.accent })
      para(ctx, d.problem, 540, 980, { px: 76, color: P.ink, maxW: 860, max: 5 })
    } else if (s.n === 'res') {
      chip(ctx, d, P)
      ctx.translate(540, 640)
      ctx.scale(0.6 + 0.4 * pop, 0.6 + 0.4 * pop)
      ctx.translate(-540, -640)
      circle(ctx, 540, 640, 130, P.accent)
      ctx.beginPath()
      ctx.moveTo(480, 640)
      ctx.lineTo(525, 685)
      ctx.lineTo(605, 590)
      ctx.lineWidth = 26
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.strokeStyle = P.on
      ctx.stroke()
      text(ctx, l.res, 540, 890, { font: f(700, 42), color: P.accent })
      para(ctx, d.result, 540, 1060, { px: 84, color: P.ink, maxW: 880, max: 4 })
    } else {
      chip(ctx, d, P)
      nowCard(ctx, lt, d, P)
    }
    ctx.restore()
    progress(ctx, P, t, total)
    if (d.watermark) watermark(ctx, W, H, { y: 1896, color: P.mute })
  },
}
