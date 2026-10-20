import { FONTS, BRAND } from '../brand.js'
import { seg, clamp, easeOut, easeBack, easeInOut, text, cover, fitSize, richLines } from './draw.js'

// The landscape (16:9) kit, shared by every studio's long-video template.
//
// A long video is a list show: a title card, a hook, one slide per item, and a closing card. The
// shape is the same everywhere; only the item fields and the palette change per channel, so this
// file is byte-identical in all three studios and can be diffed between them.
//
// Everything here is pure in its arguments. A palette `P` is { bg, panel, accent, ink, mute, on }.

export const LW = 1920
export const LH = 1080
// Title-safe inset for 16:9. YouTube's own chrome (title, progress bar, end cards) sits outside
// this box on every surface, so key text and faces belong inside it.
export const LSAFE = { x: 96, y: 60, w: LW - 192, h: LH - 120 }

const circle = (ctx, x, y, r, c) => {
  ctx.beginPath()
  ctx.arc(x, y, r, 0, 7)
  ctx.fillStyle = c
  ctx.fill()
}
const rnd = (i, k) => {
  const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453
  return x - Math.floor(x)
}
const glow = (ctx, P, x, y, r, al = '2E') => {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r)
  g.addColorStop(0, P.accent + al)
  g.addColorStop(1, P.accent + '00')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, LW, LH)
}

// Background templates, sized for 16:9. Names match the vertical set so the two feel like one studio.
const STYLES = {
  Glow: (ctx, P) => glow(ctx, P, 960, 200, 1200),
  Grid: (ctx, P) => {
    glow(ctx, P, 960, 200, 1200, '24')
    ctx.fillStyle = P.accent + '1C'
    for (let x = 0; x <= LW; x += 96) ctx.fillRect(x - 1, 0, 2, LH)
    for (let y = 0; y <= LH; y += 96) ctx.fillRect(0, y - 1, LW, 2)
  },
  Dots: (ctx, P) => {
    glow(ctx, P, 960, 200, 1200, '24')
    for (let y = 40; y < LH; y += 72) for (let x = 40; x < LW; x += 72) circle(ctx, x, y, 4, P.accent + '33')
  },
  Stripes: (ctx, P) => {
    glow(ctx, P, 960, 200, 1200, '20')
    ctx.save()
    ctx.translate(960, 540)
    ctx.rotate(-0.35)
    ctx.fillStyle = P.accent + '14'
    for (let x = -2400; x < 2400; x += 170) ctx.fillRect(x, -2400, 74, 4800)
    ctx.restore()
  },
  Rays: (ctx, P) => {
    ctx.fillStyle = P.accent + '14'
    for (let i = 0; i < 28; i += 2) {
      const a0 = (i / 28) * Math.PI * 2
      const a1 = ((i + 1) / 28) * Math.PI * 2
      ctx.beginPath()
      ctx.moveTo(960, 300)
      ctx.lineTo(960 + Math.cos(a0) * 3200, 300 + Math.sin(a0) * 3200)
      ctx.lineTo(960 + Math.cos(a1) * 3200, 300 + Math.sin(a1) * 3200)
      ctx.fill()
    }
    glow(ctx, P, 960, 300, 900, '33')
  },
  Aurora: (ctx, P, t) => {
    glow(ctx, P, 360 + 90 * Math.sin(t * 0.5), 240, 1000, '38')
    glow(ctx, P, 1560 - 90 * Math.cos(t * 0.4), 640, 1100, '26')
    glow(ctx, P, 900 + 120 * Math.sin(t * 0.3 + 2), 1000, 1000, '30')
  },
  Waves: (ctx, P, t) => {
    glow(ctx, P, 960, 200, 1200, '22')
    ;[0, 1, 2].forEach((k) => {
      const base = 820 + k * 90
      ctx.beginPath()
      ctx.moveTo(0, LH)
      for (let x = 0; x <= LW; x += 24) ctx.lineTo(x, base + Math.sin(x / 190 + t * (0.8 + k * 0.3) + k * 2) * 32)
      ctx.lineTo(LW, LH)
      ctx.fillStyle = P.accent + ['14', '1C', '26'][k]
      ctx.fill()
    })
  },
  Bokeh: (ctx, P, t) => {
    glow(ctx, P, 960, 200, 1200, '1E')
    for (let i = 0; i < 30; i++) {
      const r = 34 + rnd(i, 1) * 100
      const span = LH + 300
      const y = (((rnd(i, 2) * span - t * (10 + rnd(i, 3) * 22)) % span) + span) % span - 150
      circle(ctx, rnd(i, 4) * LW, y, r, P.accent + (rnd(i, 5) > 0.5 ? '12' : '0C'))
    }
  },
  Circuit: (ctx, P) => {
    glow(ctx, P, 960, 200, 1200, '20')
    ctx.strokeStyle = P.accent + '30'
    ctx.lineWidth = 3
    ctx.lineJoin = 'round'
    for (let i = 0; i < 26; i++) {
      let x = Math.round(rnd(i, 1) * 20) * 96
      let y = Math.round(rnd(i, 2) * 11) * 96
      ctx.beginPath()
      ctx.moveTo(x, y)
      for (let k = 0; k < 4; k++) {
        if ((i + k) % 2) x += (rnd(i, 10 + k) > 0.5 ? 1 : -1) * 96 * (1 + Math.floor(rnd(i, 20 + k) * 3))
        else y += (rnd(i, 30 + k) > 0.5 ? 1 : -1) * 96 * (1 + Math.floor(rnd(i, 40 + k) * 3))
        ctx.lineTo(x, y)
      }
      ctx.stroke()
      circle(ctx, x, y, 9, P.accent + '40')
    }
  },
}
export const WIDE_BACKGROUNDS = Object.keys(STYLES)
export const wideBgField = () => ({ group: 'Look', key: 'bgStyle', label: 'Background template', type: 'select', options: WIDE_BACKGROUNDS })

export function wideBackdrop(ctx, P, style = 'Glow', t = 0) {
  ctx.fillStyle = P.bg
  ctx.fillRect(0, 0, LW, LH)
  ;(STYLES[style] || STYLES.Glow)(ctx, P, t)
}

// Wrapped text, centred vertically on `cy`. Shrinks until it fits `max` lines rather than cutting
// the end off, and renders `**bold**` words in `boldColor` the way the editors promise.
export function wpara(ctx, str, x, cy, { px = 54, weight = 500, font = FONTS.body, color = '#fff', boldColor = null, maxW = 900, max = 4, align = 'center', alpha = 1, rise = 0, lh = 1.25 } = {}) {
  const mk = (s, bold) => `${bold ? 700 : weight} ${s}px ${font}`
  const min = Math.max(18, Math.round(px * 0.55))
  const src = String(str ?? '')
  let size = px
  let ls = richLines(ctx, src, maxW, (b) => mk(size, b))
  while (size > min && (ls.length > max || ls.some((l) => l.width > maxW))) {
    size -= 3
    ls = richLines(ctx, src, maxW, (b) => mk(size, b))
  }
  ls = ls.slice(0, max)
  const step = size * lh
  const y0 = cy - ((ls.length - 1) * step) / 2 + size * 0.35
  ctx.save()
  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'
  ctx.globalAlpha *= alpha
  ls.forEach((ln, i) => {
    const y = y0 + i * step + rise
    let cx = align === 'center' ? x - ln.width / 2 : align === 'right' ? x - ln.width : x
    for (const wd of ln.words) {
      cx += wd.space
      ctx.font = mk(size, wd.bold)
      ctx.fillStyle = wd.bold ? boldColor || color : color
      ctx.fillText(wd.w, cx, y)
      cx += wd.width
    }
  })
  ctx.restore()
  return ls.length * step
}

// A rounded panel with an accent hairline.
export function panel(ctx, P, x, y, w, h, r = 28, { fill = P.panel, stroke = P.accent, width = 3, alpha = 1 } = {}) {
  ctx.save()
  ctx.globalAlpha *= alpha
  ctx.beginPath()
  ctx.roundRect(x, y, w, h, r)
  ctx.fillStyle = fill
  ctx.fill()
  if (stroke) {
    ctx.lineWidth = width
    ctx.strokeStyle = stroke
    ctx.stroke()
  }
  ctx.restore()
}

// Small accent label, e.g. a series name above the title.
export function kicker(ctx, P, str, x, y, { px = 34, align = 'center', alpha = 1, color = P.accent } = {}) {
  const s = String(str || '').trim().toUpperCase()
  if (!s) return
  text(ctx, s, x, y, { font: `700 ${px}px ${FONTS.body}`, color, spacing: 6, align, alpha })
}

// A filled pill with text, measured to fit.
export function wpill(ctx, P, str, cx, cy, { px = 38, maxW = 760, fill = P.accent, color = P.on } = {}) {
  const s = String(str || '').trim()
  if (!s) return 0
  ctx.save()
  let size = px
  for (; size > 20; size -= 2) {
    ctx.font = `700 ${size}px ${FONTS.body}`
    if (ctx.measureText(s).width + 64 <= maxW) break
  }
  ctx.font = `700 ${size}px ${FONTS.body}`
  const w = Math.min(maxW, ctx.measureText(s).width + 64)
  ctx.restore()
  ctx.beginPath()
  ctx.roundRect(cx - w / 2, cy - size * 0.95, w, size * 1.9, size)
  ctx.fillStyle = fill
  ctx.fill()
  text(ctx, s, cx, cy + size * 0.34, { font: `700 ${size}px ${FONTS.body}`, color })
  return w
}

// The rank chip on an item slide: "01", or the countdown number.
export function rankChip(ctx, P, n, x, y, r = 58, { alpha = 1 } = {}) {
  ctx.save()
  ctx.globalAlpha *= alpha
  circle(ctx, x, y, r, P.accent)
  text(ctx, String(n).padStart(2, '0'), x, y + r * 0.36, { font: `700 ${Math.round(r * 1.02)}px ${FONTS.body}`, color: P.on })
  ctx.restore()
}

// Progress rail plus "3 / 10", pinned above the bottom safe edge.
export function wideRail(ctx, P, done, total, { y = LH - 54, label = true } = {}) {
  const x = LSAFE.x
  const w = LSAFE.w - (label ? 180 : 0)
  ctx.fillStyle = P.mute + '55'
  ctx.beginPath()
  ctx.roundRect(x, y, w, 8, 4)
  ctx.fill()
  ctx.fillStyle = P.accent
  ctx.beginPath()
  ctx.roundRect(x, y, Math.max(8, w * clamp(done / Math.max(1, total))), 8, 4)
  ctx.fill()
  if (label) text(ctx, `${Math.min(total, Math.max(0, Math.round(done)))} / ${total}`, LSAFE.x + LSAFE.w, y + 10, { font: `700 30px ${FONTS.body}`, color: P.mute, align: 'right' })
}

export function wideWatermark(ctx, P, { y = LH - 54, align = 'left', x = LSAFE.x } = {}) {
  text(ctx, BRAND.watermark, x, y, { font: `400 30px ${FONTS.body}`, color: P.mute, spacing: 3, align })
}

// ---------------------------------------------------------------------------
// Timeline. A list show is: title, hook, N items, closing card.
// `lt` below is always the time elapsed inside the current scene.

export const wsec = (v, def, min = 1, max = 60) => Math.min(max, Math.max(min, +v || def))

export function listCount(d) {
  return Math.max(1, (d.items || []).length)
}

// Scene boundaries for the whole video.
export function listPlan(d) {
  const n = listCount(d)
  const title = wsec(d.secTitle, 3)
  const hook = String(d.hook || '').trim() ? wsec(d.secHook, 3) : 0
  const item = wsec(d.secItem, 7, 2)
  const cta = wsec(d.secCta, 4)
  return { n, title, hook, item, cta, total: title + hook + n * item + cta }
}

export const listDuration = (d) => listPlan(d).total

// Which scene is on screen at time t, and how far into it we are.
export function listAt(d, t) {
  const p = listPlan(d)
  let lt = t
  if (lt < p.title) return { scene: 'title', i: -1, lt, dur: p.title, plan: p }
  lt -= p.title
  if (p.hook && lt < p.hook) return { scene: 'hook', i: -1, lt, dur: p.hook, plan: p }
  lt -= p.hook
  if (lt < p.n * p.item) {
    const i = Math.min(p.n - 1, Math.floor(lt / p.item))
    return { scene: 'item', i, lt: lt - i * p.item, dur: p.item, plan: p }
  }
  lt -= p.n * p.item
  return { scene: 'cta', i: -1, lt, dur: p.cta, plan: p }
}

// The number shown on item `i`: a countdown runs N..1, otherwise 1..N.
export const rankOf = (d, i, n) => (d.countdown ? n - i : i + 1)

// Timing and look fields every long template shares, so the three studios stay consistent.
export const listTimingFields = () => [
  { group: 'Timing & sound', key: 'secTitle', label: 'Title card (seconds)', type: 'number', min: 1, max: 20, step: 0.5 },
  { group: 'Timing & sound', key: 'secHook', label: 'Hook card (seconds)', type: 'number', min: 1, max: 20, step: 0.5 },
  { group: 'Timing & sound', key: 'secItem', label: 'Seconds per item', type: 'number', min: 2, max: 60, step: 0.5 },
  { group: 'Timing & sound', key: 'secCta', label: 'Closing card (seconds)', type: 'number', min: 1, max: 20, step: 0.5 },
  { group: 'Timing & sound', key: 'audio', label: 'Music (optional)', type: 'audio' },
  { group: 'Timing & sound', key: 'musicVol', label: 'Music volume', type: 'range', min: 0, max: 1, step: 0.05 },
]

export const listTimingDefaults = () => ({ secTitle: 3, secHook: 3, secItem: 7, secCta: 4, audio: '', musicVol: 0.75 })

// ---------------------------------------------------------------------------
// Scene painters. Each takes the scene-local time so a scene can be previewed on its own.

export function titleCard(ctx, P, lt, { kicker: k = '', title = '', sub = '', t = 0 } = {}) {
  const a = easeOut(seg(lt, 0.1, 0.7))
  const b = easeOut(seg(lt, 0.5, 0.7))
  const pop = easeBack(seg(lt, 0, 0.8))
  ctx.save()
  ctx.globalAlpha = a
  kicker(ctx, P, k, 960, 350 - (1 - a) * 30, { px: 38 })
  ctx.restore()
  const big = String(title || '').trim() || 'Untitled'
  const font = fitSize(ctx, big, (s) => `700 ${s}px ${FONTS.display}`, 1600, 150, 60, 2)
  ctx.save()
  ctx.globalAlpha = a
  ctx.translate(960, 512)
  ctx.scale(0.86 + 0.14 * pop, 0.86 + 0.14 * pop)
  text(ctx, big, 0, 0, { font, color: P.ink, spacing: 2 })
  ctx.restore()
  ctx.fillStyle = P.accent
  ctx.beginPath()
  ctx.roundRect(960 - 140 * b, 596, 280 * b, 8, 4)
  ctx.fill()
  wpara(ctx, sub, 960, 712, { px: 48, color: P.mute, maxW: 1400, max: 2, alpha: b, rise: (1 - b) * 24 })
}

export function hookCard(ctx, P, lt, { hook = '', note = '' } = {}) {
  const a = easeOut(seg(lt, 0.1, 0.6))
  const b = easeOut(seg(lt, 0.6, 0.6))
  ctx.save()
  ctx.globalAlpha = a
  ctx.translate(0, (1 - a) * 30)
  panel(ctx, P, 200, 320, 1520, 440, 44, { alpha: a })
  ctx.restore()
  wpara(ctx, hook, 960, 500, { px: 72, weight: 700, font: FONTS.display, color: P.ink, maxW: 1340, max: 3, alpha: a })
  if (note) wpara(ctx, note, 960, 658, { px: 40, color: P.mute, maxW: 1300, max: 2, alpha: b })
}

// One item slide. `shape` picks the picture box: a 2:3 poster, a 16:9 still or a square.
export const SHAPES = { poster: [560, 840], wide: [880, 495], square: [700, 700] }
export function itemSlide(ctx, P, lt, dur, item, A, { shape = 'poster', rank = 1, label = 'ADD IMAGE', rows = [], body = '', heading = '', zoom = 1, fx = 0.5, fy = 0.5, img = undefined, tag = '', tagColor = null, bodyMax = 5 } = {}) {
  const a = easeOut(seg(lt, 0, 0.5))
  const out = 1 - easeInOut(seg(lt, dur - 0.35, 0.35))
  const slide = (1 - a) * 70
  const [iw, ih] = SHAPES[shape] || SHAPES.poster
  const ix = 150
  const iy = Math.round((LH - ih) / 2)
  ctx.save()
  ctx.globalAlpha = Math.min(a, out)

  // Picture, with a soft card behind it.
  ctx.save()
  ctx.translate(-slide, 0)
  ctx.shadowColor = 'rgba(0,0,0,.45)'
  ctx.shadowBlur = 48
  ctx.shadowOffsetY = 18
  ctx.fillStyle = P.panel
  ctx.beginPath()
  ctx.roundRect(ix - 14, iy - 14, iw + 28, ih + 28, 34)
  ctx.fill()
  ctx.shadowColor = 'transparent'
  // `img` lets a template hand over a prepared picture (Remembrance passes a grayscale copy).
  cover(ctx, img === undefined ? A.img(item.image) : img, ix, iy, iw, ih, { radius: 24, label, zoom, fx, fy })
  ctx.restore()

  // Text column to the right of the picture.
  const cx = ix + iw + 70
  const cw = LSAFE.x + LSAFE.w - cx
  ctx.save()
  ctx.translate(slide, 0)
  let top = 250
  if (String(tag || '').trim()) {
    // A small status chip above the heading, e.g. OFFICIAL / RUMOUR or where to watch.
    const s = String(tag).trim().toUpperCase()
    ctx.save()
    ctx.font = `700 26px ${FONTS.body}`
    ctx.letterSpacing = '4px'
    const tw = ctx.measureText(s).width + 44
    ctx.restore()
    ctx.beginPath()
    ctx.roundRect(cx, 150, tw, 50, 25)
    ctx.fillStyle = tagColor || P.accent
    ctx.fill()
    text(ctx, s, cx + tw / 2, 184, { font: `700 26px ${FONTS.body}`, color: P.on, spacing: 4 })
    top = 290
  }
  rankChip(ctx, P, rank, cx + 58, top, 58)
  const head = String(heading || '').trim() || 'Untitled'
  const hf = fitSize(ctx, head, (s) => `700 ${s}px ${FONTS.display}`, cw - 150, 92, 44, 1)
  text(ctx, head, cx + 140, top + 22, { font: hf, color: P.ink, align: 'left', spacing: 1 })
  let y = top + 140
  for (const [k, v] of rows) {
    if (!String(v || '').trim()) continue
    text(ctx, String(k).toUpperCase(), cx, y, { font: `700 26px ${FONTS.body}`, color: P.accent, spacing: 4, align: 'left' })
    y += 46
    wpara(ctx, v, cx, y + 10, { px: 42, color: P.ink, maxW: cw, max: 1, align: 'left' })
    y += 74
  }
  if (String(body || '').trim()) {
    y += 10
    wpara(ctx, body, cx, y + 60, { px: 40, color: P.mute, boldColor: P.ink, maxW: cw, max: bodyMax, align: 'left' })
  }
  ctx.restore()
  ctx.restore()
}

// One chapter of a deep-dive: a labelled section with a picture and a longer piece of writing.
// It shares listPlan/listAt with the list show; only the painting differs, because "title, setup,
// N sections, closing" is the same shape whether the sections are ranked items or chapters.
export function chapterSlide(ctx, P, lt, dur, item, A, { shape = 'wide', chip = '', heading = '', body = '', note = '', label = 'ADD IMAGE', img = undefined, zoom = 1, fx = 0.5, fy = 0.5, side = 'left' } = {}) {
  const a = easeOut(seg(lt, 0, 0.5))
  const out = 1 - easeInOut(seg(lt, dur - 0.35, 0.35))
  const slide = (1 - a) * 70
  const [iw, ih] = SHAPES[shape] || SHAPES.wide
  const left = side === 'left'
  const ix = left ? 150 : LW - 150 - iw
  const iy = Math.round((LH - ih) / 2)
  ctx.save()
  ctx.globalAlpha = Math.min(a, out)

  ctx.save()
  ctx.translate(left ? -slide : slide, 0)
  ctx.shadowColor = 'rgba(0,0,0,.45)'
  ctx.shadowBlur = 48
  ctx.shadowOffsetY = 18
  ctx.fillStyle = P.panel
  ctx.beginPath()
  ctx.roundRect(ix - 14, iy - 14, iw + 28, ih + 28, 34)
  ctx.fill()
  ctx.shadowColor = 'transparent'
  cover(ctx, img === undefined ? A.img(item.image) : img, ix, iy, iw, ih, { radius: 24, label, zoom, fx, fy })
  ctx.restore()

  const cx = left ? ix + iw + 70 : LSAFE.x
  const cw = left ? LSAFE.x + LSAFE.w - cx : ix - 70 - LSAFE.x
  ctx.save()
  ctx.translate(left ? slide : -slide, 0)
  let y = 250
  if (String(chip || '').trim()) {
    kicker(ctx, P, chip, cx, y, { px: 32, align: 'left' })
    y += 56
  }
  const head = String(heading || '').trim() || 'Untitled'
  text(ctx, head, cx, y + 48, { font: fitSize(ctx, head, (s) => `700 ${s}px ${FONTS.display}`, cw, 86, 40, 1), color: P.ink, align: 'left', spacing: 1 })
  y += 100
  if (String(note || '').trim()) {
    text(ctx, String(note), cx, y + 34, { font: `700 40px ${FONTS.body}`, color: P.accent, align: 'left' })
    y += 70
  }
  if (String(body || '').trim()) wpara(ctx, body, cx, y + 110, { px: 38, color: P.mute, boldColor: P.ink, maxW: cw, max: 7, align: 'left', lh: 1.35 })
  ctx.restore()
  ctx.restore()
}

// The closing card of a deep-dive: a score or result in a ring, with a line under it.
export function verdictCard(ctx, P, lt, { head = '', score = '', label = '', sub = '', tag = '' } = {}) {
  const a = easeOut(seg(lt, 0.1, 0.6))
  const pop = easeBack(seg(lt, 0, 0.9))
  const b = easeOut(seg(lt, 0.7, 0.6))
  const big = String(head || '').trim()
  if (big) {
    ctx.save()
    ctx.globalAlpha = a
    text(ctx, big, 960, 250, { font: fitSize(ctx, big, (s) => `700 ${s}px ${FONTS.display}`, 1500, 96, 48, 2), color: P.ink, spacing: 2 })
    ctx.restore()
  }
  const value = String(score || '').trim()
  if (value) {
    const r = 160
    const cy = 500
    ctx.save()
    ctx.globalAlpha = a
    ctx.translate(960, cy)
    ctx.scale(0.85 + 0.15 * pop, 0.85 + 0.15 * pop)
    ctx.beginPath()
    ctx.arc(0, 0, r, 0, Math.PI * 2)
    ctx.fillStyle = P.panel
    ctx.fill()
    ctx.lineWidth = 10
    ctx.strokeStyle = P.accent
    ctx.stroke()
    text(ctx, value, 0, 26, { font: fitSize(ctx, value, (s) => `700 ${s}px ${FONTS.display}`, r * 1.7, 96, 40, 1), color: P.accent })
    ctx.restore()
    if (String(label || '').trim()) kicker(ctx, P, label, 960, cy + r + 62, { px: 32, alpha: a })
  }
  if (String(sub || '').trim()) wpara(ctx, sub, 960, value ? 800 : 560, { px: 46, color: P.mute, maxW: 1400, max: 2, alpha: b })
  if (String(tag || '').trim()) {
    ctx.save()
    ctx.globalAlpha = b
    wpill(ctx, P, tag, 960, value ? 920 : 720, { px: 40, maxW: 1100 })
    ctx.restore()
  }
}

// Paints a whole list show for time `t`. Every list template's draw() is this call plus the
// palette, because the scenes, the rail and the watermark placement are the same for all of them;
// `itemOf(item, index)` is where a template says what its own slides contain.
export function drawListShow(ctx, t, d, A, P, { bgDefault = 'Glow', shape = 'poster', imageLabel = 'ADD IMAGE', itemOf, shapes = ['poster', 'wide', 'square'] } = {}) {
  const n = listCount(d)
  const at = listAt(d, t)
  wideBackdrop(ctx, P, WIDE_BACKGROUNDS.includes(d.bgStyle) ? d.bgStyle : bgDefault, t)

  if (at.scene === 'title') {
    titleCard(ctx, P, at.lt, { kicker: d.kicker, title: d.title, sub: d.sub })
  } else if (at.scene === 'hook') {
    hookCard(ctx, P, at.lt, { hook: d.hook, note: d.hookNote })
  } else if (at.scene === 'item') {
    const it = (d.items && d.items[at.i]) || {}
    itemSlide(ctx, P, at.lt, at.dur, it, A, {
      shape: shapes.includes(d.shape) ? d.shape : shape,
      rank: rankOf(d, at.i, n),
      label: imageLabel,
      ...itemOf(it, at.i),
    })
    if (d.showRail) wideRail(ctx, P, at.i + 1, n)
  } else {
    ctaCard(ctx, P, at.lt, { head: d.ctaH, sub: d.ctaS, tag: d.ctaTag })
  }

  // The watermark sits opposite the rail so the two never collide.
  const tucked = at.scene === 'item' && d.showRail
  if (d.watermark) wideWatermark(ctx, P, { align: tucked ? 'right' : 'center', x: tucked ? LSAFE.x + LSAFE.w : LW / 2, y: tucked ? LH - 92 : LH - 54 })
}

// The fields every list show shares: the cards either side of the items, and the look.
export const listShellFields = (lookField, { shapes = ['poster', 'wide', 'square'] } = {}) => [
  { group: 'Content', key: 'kicker', label: 'Small heading (title card)', type: 'text' },
  { group: 'Content', key: 'title', label: 'Video title', type: 'text' },
  { group: 'Content', key: 'sub', label: 'Subtitle', type: 'text' },
  { group: 'Content', key: 'hook', label: 'Hook line (empty = skip the hook card)', type: 'textarea' },
  { group: 'Content', key: 'hookNote', label: 'Hook note (small line under it)', type: 'text' },
  { group: 'Closing card', key: 'ctaH', label: 'Closing heading', type: 'text' },
  { group: 'Closing card', key: 'ctaS', label: 'Closing line', type: 'text' },
  { group: 'Closing card', key: 'ctaTag', label: 'Closing tagline pill', type: 'text' },
  lookField(),
  wideBgField(),
  { group: 'Look', key: 'shape', label: 'Picture shape', type: 'select', options: shapes },
  { group: 'Look', key: 'countdown', label: 'Count down (N \u2192 1) instead of up', type: 'checkbox' },
  { group: 'Look', key: 'showRail', label: 'Show the progress rail', type: 'checkbox' },
  { group: 'Look', key: 'watermark', label: 'Show channel watermark', type: 'checkbox' },
]

// The matching defaults, so a new list show only declares what is actually its own.
export const listShellDefaults = (over = {}) => ({
  kicker: '',
  title: '',
  sub: '',
  hook: '',
  hookNote: '',
  ctaH: '',
  ctaS: '',
  ctaTag: '',
  bgStyle: 'Glow',
  shape: 'poster',
  countdown: false,
  showRail: true,
  watermark: true,
  ...listTimingDefaults(),
  ...over,
})

// The cover frame for a list show: the first item, settled.
export const listThumbTime = (d) => {
  const p = listPlan(d)
  return p.title + p.hook + Math.min(p.item - 0.2, 1.2)
}

export function ctaCard(ctx, P, lt, { head = '', sub = '', tag = '' } = {}) {
  const a = easeOut(seg(lt, 0.1, 0.6))
  const b = easeOut(seg(lt, 0.6, 0.6))
  const pop = easeBack(seg(lt, 0, 0.9))
  ctx.save()
  ctx.globalAlpha = a
  ctx.translate(960, 420)
  ctx.scale(0.9 + 0.1 * pop, 0.9 + 0.1 * pop)
  const big = String(head || '').trim() || 'Thanks for watching'
  text(ctx, big, 0, 0, { font: fitSize(ctx, big, (s) => `700 ${s}px ${FONTS.display}`, 1500, 128, 56, 2), color: P.ink, spacing: 2 })
  ctx.restore()
  wpara(ctx, sub, 960, 580, { px: 50, color: P.mute, maxW: 1300, max: 2, alpha: a })
  ctx.save()
  ctx.globalAlpha = b
  if (tag) wpill(ctx, P, tag, 960, 760, { px: 44, maxW: 1100 })
  ctx.restore()
}
