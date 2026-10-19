import { seg, easeOut, text, watermark } from '../lib/draw.js'
import { W, H, f, pal, lb, themeField, titleField, titleStyleField, bgField, langField, backdrop, chip, PHONE_S, pill, circle, para, phone, nowCard } from '../lib/nl.js'

// Quick Discovery (20-40 s): hook, one screenshot with a one-line "what it does", result and the Now Learning Card.
export default {
  key: 'quick',
  label: 'Quick Discovery',
  short: 'Quick',
  emoji: '\u26A1',
  size: [W, H],
  fps: 30,
  defaults: () => ({
    theme: 'Tricks',
    lang: 'English',
    title: '',
    titleStyle: 'Pill',
    bgStyle: 'Glow',
    app: 'Google Lens',
    hook: 'Point your camera at anything to find out what it is',
    what: 'Open Lens, point at a plant or product, and tap the result.',
    image: '',
    result: 'Now you know what it is.',
    useFor: 'Identify plants and products',
    cost: 'Free',
    seconds: 25,
    watermark: true,
    audio: '',
    musicVol: 0.7,
  }),
  fields: [
    titleField(),
    { group: 'Content', key: 'app', label: 'Tool or app name', type: 'text' },
    { group: 'Content', key: 'hook', label: 'Hook', type: 'textarea' },
    { group: 'Content', key: 'what', label: 'What it does (one or two lines)', type: 'textarea' },
    { group: 'Content', key: 'image', label: 'Screenshot', type: 'image' },
    { group: 'Content', key: 'result', label: 'Result line', type: 'text' },
    { group: 'Now Learning Card', key: 'useFor', label: 'Use it for', type: 'text' },
    { group: 'Now Learning Card', key: 'cost', label: 'Cost (Free / Paid / Free + paid)', type: 'text' },
    themeField(),
    titleStyleField(),
    bgField(),
    langField(),
    { group: 'Look', key: 'watermark', label: 'Show channel watermark', type: 'checkbox' },
    { group: 'Timing & sound', key: 'seconds', label: 'Length (seconds)', type: 'number', min: 10, max: 60 },
    { group: 'Timing & sound', key: 'audio', label: 'Music (optional)', type: 'audio' },
    { group: 'Timing & sound', key: 'musicVol', label: 'Music volume', type: 'range', min: 0, max: 1, step: 0.05 },
  ],
  duration: (d) => Math.min(60, Math.max(10, +d.seconds || 25)),
  thumbTime: () => 1.2,
  fileName: (d) => d.app,

  draw(ctx, t, d, A) {
    const P = pal(d)
    const T = this.duration(d)
    const h = 0.22 * T
    const e = 0.78 * T
    backdrop(ctx, P, d.bgStyle, t)
    ctx.save()
    if (t < h) {
      ctx.globalAlpha = easeOut(seg(t, 0, 0.3))
      chip(ctx, d, P)
      pill(ctx, d.app, 540, 500, P)
      para(ctx, d.hook, 540, 900, { px: 88, color: P.ink, maxW: 880, max: 5 })
    } else if (t < e) {
      const lt = t - h
      const a = easeOut(seg(lt, 0, 0.35))
      chip(ctx, d, P)
      pill(ctx, d.app, 540, 452, P, 30)
      phone(ctx, P, A.img(d.image), 1 + 0.05 * seg(lt, 0, e - h), PHONE_S)
      para(ctx, d.what, 540, 1420, { px: 50, color: P.ink, maxW: 920, max: 3, alpha: a, rise: (1 - a) * 30 })
    } else {
      chip(ctx, d, P)
      circle(ctx, 540, 330, 46, P.accent)
      ctx.beginPath()
      ctx.moveTo(518, 330)
      ctx.lineTo(534, 346)
      ctx.lineTo(564, 312)
      ctx.lineWidth = 10
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.strokeStyle = P.on
      ctx.stroke()
      para(ctx, d.result, 540, 440, { px: 56, color: P.ink, maxW: 880, max: 2 })
      nowCard(ctx, t - e, d, P)
    }
    ctx.restore()
    if (d.watermark) watermark(ctx, W, H, { y: 1896, color: P.mute })
  },
}
