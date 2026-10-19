import { FONTS } from '../brand.js'
import { seg, easeOut, text, cover, richLines } from './draw.js'

export const W = 1080
export const H = 1920
const YE = '#FFD23F'
export const f = (w, px) => `${w} ${px}px ${FONTS.display}`

// Colour templates: one per series, plus a light one. `on` is the text colour used on top of the accent.
export const THEMES = {
  Apps: { bg: '#0B1220', panel: '#121b2e', accent: '#2EE6A6', ink: '#F5F7FA', mute: '#8A94A6', on: '#0B1220' },
  AI: { bg: '#100D24', panel: '#1a1636', accent: '#9B8CFF', ink: '#F5F7FA', mute: '#9A94B8', on: '#100D24' },
  Tricks: { bg: '#14110A', panel: '#211c10', accent: '#FFD23F', ink: '#F5F7FA', mute: '#A39A80', on: '#14110A' },
  Websites: { bg: '#07131C', panel: '#0e2230', accent: '#4CC2FF', ink: '#F5F7FA', mute: '#8AA0B0', on: '#07131C' },
  'One tool': { bg: '#1A0E0B', panel: '#2a1713', accent: '#FF7A59', ink: '#F5F7FA', mute: '#B09088', on: '#1A0E0B' },
  Daylight: { bg: '#F5F7FA', panel: '#FFFFFF', accent: '#0FA97A', ink: '#0B1220', mute: '#5B6577', on: '#FFFFFF' },
}
export const SERIES = { Apps: 'How To Use This App', AI: 'How To Use AI', Tricks: 'How To: Quick Trick', Websites: 'How To Use This Website', 'One tool': 'How To Use This Tool', Daylight: 'Now Learning' }
export const titleField = () => ({ group: 'Content', key: 'title', label: 'Title badge (empty = series default)', type: 'text' })
export const LB = {
  English: { step: 'Step', prob: 'The problem', res: 'Result', tool: 'Tool', use: 'Use it for', cost: 'Cost' },
  தமிழ்: { step: 'படி', prob: 'சிக்கல்', res: 'முடிவு', tool: 'கருவி', use: 'பயன்பாடு', cost: 'விலை' },
  हिन्दी: { step: 'चरण', prob: 'समस्या', res: 'नतीजा', tool: 'टूल', use: 'किसलिए', cost: 'कीमत' },
}
export const themeField = () => ({ group: 'Look', key: 'theme', label: 'Colour template', type: 'select', options: Object.keys(THEMES) })
export const langField = () => ({ group: 'Look', key: 'lang', label: 'Language of on-screen labels', type: 'select', options: Object.keys(LB) })
export const pal = (d) => THEMES[d.theme] || THEMES.Apps
export const lb = (d) => LB[d.lang] || LB.English
export const sec = (v, def) => Math.min(30, Math.max(1, +v || def))

// Background templates: a pattern drawn over the colour template's `bg`. Pure in (style, t).
const glow = (ctx, P, x, y, r, al = '2E') => {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r)
  g.addColorStop(0, P.accent + al)
  g.addColorStop(1, P.accent + '00')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, W, H)
}
const rnd = (i, k) => {
  const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453
  return x - Math.floor(x)
}
const STYLES = {
  Glow: (ctx, P) => glow(ctx, P, 540, 300, 900),
  Grid: (ctx, P) => {
    glow(ctx, P, 540, 300, 900, '24')
    ctx.fillStyle = P.accent + '1C'
    for (let x = 0; x <= W; x += 90) ctx.fillRect(x - 1, 0, 2, H)
    for (let y = 0; y <= H; y += 90) ctx.fillRect(0, y - 1, W, 2)
  },
  Dots: (ctx, P) => {
    glow(ctx, P, 540, 300, 900, '24')
    for (let y = 45; y < H; y += 70) for (let x = 45; x < W; x += 70) circle(ctx, x, y, 4, P.accent + '33')
  },
  Stripes: (ctx, P) => {
    glow(ctx, P, 540, 300, 900, '20')
    ctx.save()
    ctx.translate(540, 960)
    ctx.rotate(-0.35)
    ctx.fillStyle = P.accent + '14'
    for (let x = -1800; x < 1800; x += 160) ctx.fillRect(x, -2200, 70, 4400)
    ctx.restore()
  },
  Rays: (ctx, P) => {
    ctx.fillStyle = P.accent + '14'
    for (let i = 0; i < 24; i += 2) {
      const a0 = (i / 24) * Math.PI * 2
      const a1 = ((i + 1) / 24) * Math.PI * 2
      ctx.beginPath()
      ctx.moveTo(540, 420)
      ctx.lineTo(540 + Math.cos(a0) * 2600, 420 + Math.sin(a0) * 2600)
      ctx.lineTo(540 + Math.cos(a1) * 2600, 420 + Math.sin(a1) * 2600)
      ctx.fill()
    }
    glow(ctx, P, 540, 420, 700, '33')
  },
  Aurora: (ctx, P, t) => {
    glow(ctx, P, 200 + 60 * Math.sin(t * 0.5), 400, 800, '38')
    glow(ctx, P, 900 - 60 * Math.cos(t * 0.4), 1000, 900, '26')
    glow(ctx, P, 500 + 80 * Math.sin(t * 0.3 + 2), 1700, 800, '30')
  },
  Waves: (ctx, P, t) => {
    glow(ctx, P, 540, 300, 900, '22')
    ;[0, 1, 2].forEach((k) => {
      const base = 1480 + k * 110
      ctx.beginPath()
      ctx.moveTo(0, H)
      for (let x = 0; x <= W; x += 20) ctx.lineTo(x, base + Math.sin(x / 150 + t * (0.8 + k * 0.3) + k * 2) * 34)
      ctx.lineTo(W, H)
      ctx.fillStyle = P.accent + ['14', '1C', '26'][k]
      ctx.fill()
    })
  },
  Bokeh: (ctx, P, t) => {
    glow(ctx, P, 540, 300, 900, '1E')
    for (let i = 0; i < 26; i++) {
      const r = 30 + rnd(i, 1) * 90
      const y = (((rnd(i, 2) * (H + 300) - t * (10 + rnd(i, 3) * 22)) % (H + 300)) + H + 300) % (H + 300) - 150
      circle(ctx, rnd(i, 4) * W, y, r, P.accent + (rnd(i, 5) > 0.5 ? '12' : '0C'))
    }
  },
  Circuit: (ctx, P) => {
    glow(ctx, P, 540, 300, 900, '20')
    ctx.strokeStyle = P.accent + '30'
    ctx.lineWidth = 3
    ctx.lineJoin = 'round'
    for (let i = 0; i < 22; i++) {
      let x = Math.round(rnd(i, 1) * 12) * 90
      let y = Math.round(rnd(i, 2) * 21) * 90
      ctx.beginPath()
      ctx.moveTo(x, y)
      for (let k = 0; k < 4; k++) {
        if ((i + k) % 2) x += (rnd(i, 10 + k) > 0.5 ? 1 : -1) * 90 * (1 + Math.floor(rnd(i, 20 + k) * 3))
        else y += (rnd(i, 30 + k) > 0.5 ? 1 : -1) * 90 * (1 + Math.floor(rnd(i, 40 + k) * 3))
        ctx.lineTo(x, y)
      }
      ctx.stroke()
      circle(ctx, x, y, 9, P.accent + '40')
    }
  },
}
export const BACKGROUNDS = Object.keys(STYLES)
export const bgField = () => ({ group: 'Look', key: 'bgStyle', label: 'Background template', type: 'select', options: BACKGROUNDS })
export function backdrop(ctx, P, style = 'Glow', t = 0) {
  ctx.fillStyle = P.bg
  ctx.fillRect(0, 0, W, H)
  ;(STYLES[style] || STYLES.Glow)(ctx, P, t)
}
export const circle = (ctx, x, y, r, c) => {
  ctx.beginPath()
  ctx.arc(x, y, r, 0, 7)
  ctx.fillStyle = c
  ctx.fill()
}
// Title badge in several styles, all centred around x 540 inside y 276-350.
export const TITLE_STYLES = ['Pill', 'Solid', 'Text + line', 'Side lines', 'Tag', 'Corners']
export const titleStyleField = () => ({ group: 'Look', key: 'titleStyle', label: 'Title style', type: 'select', options: TITLE_STYLES })
export function chip(ctx, d, P) {
  const str = String(d.title || '').trim().toUpperCase() || (SERIES[d.theme] || '').toUpperCase()
  if (!str) return
  const style = TITLE_STYLES.includes(d.titleStyle) ? d.titleStyle : 'Pill'
  const px = style === 'Text + line' || style === 'Side lines' ? 42 : 34
  const y = 276
  const cy = y + 37
  ctx.save()
  ctx.font = f(700, px)
  ctx.letterSpacing = '3px'
  const tw = ctx.measureText(str).width
  ctx.restore()
  const label = (color, x = 540, align = 'center') => text(ctx, str, x, cy + px * 0.35, { font: f(700, px), color, spacing: 3, align })
  const box = (w, r) => {
    ctx.beginPath()
    ctx.roundRect(540 - w / 2, y, w, 74, r)
  }
  if (style === 'Pill') {
    box(tw + 80, 37)
    ctx.fillStyle = P.accent + '26'
    ctx.fill()
    ctx.lineWidth = 3
    ctx.strokeStyle = P.accent + 'AA'
    ctx.stroke()
    label(P.accent)
  } else if (style === 'Solid') {
    box(tw + 90, 14)
    ctx.fillStyle = P.accent
    ctx.fill()
    label(P.on)
  } else if (style === 'Text + line') {
    label(P.accent)
    ctx.fillStyle = P.accent
    ctx.beginPath()
    ctx.roundRect(540 - 60, cy + 38, 120, 8, 4)
    ctx.fill()
  } else if (style === 'Side lines') {
    label(P.accent)
    const gap = 36
    const len = Math.min(150, (900 - tw) / 2 - gap)
    ctx.fillStyle = P.accent + 'AA'
    if (len > 20) {
      ctx.fillRect(540 - tw / 2 - gap - len, cy - 2, len, 4)
      ctx.fillRect(540 + tw / 2 + gap, cy - 2, len, 4)
    }
  } else if (style === 'Tag') {
    const w = tw + 100
    box(w, 10)
    ctx.fillStyle = P.panel
    ctx.fill()
    ctx.fillStyle = P.accent
    ctx.beginPath()
    ctx.roundRect(540 - w / 2, y, 14, 74, [10, 0, 0, 10])
    ctx.fill()
    label(P.ink, 540 + 7)
  } else {
    const w = tw + 110
    const x0 = 540 - w / 2
    const k = 26
    ctx.strokeStyle = P.accent
    ctx.lineWidth = 6
    ctx.lineCap = 'round'
    ctx.beginPath()
    ;[[x0, y, 1, 1], [x0 + w, y, -1, 1], [x0, y + 74, 1, -1], [x0 + w, y + 74, -1, -1]].forEach(([x, yy, sx, sy]) => {
      ctx.moveTo(x + sx * k, yy)
      ctx.lineTo(x, yy)
      ctx.lineTo(x, yy + sy * k)
    })
    ctx.stroke()
    label(P.ink)
  }
}
export function pill(ctx, str, x, y, P, px = 40) {
  ctx.save()
  // Shrink long tool names so the pill stays inside the frame.
  for (; px > 24; px -= 2) {
    ctx.font = f(700, px)
    if (ctx.measureText(String(str)).width + 80 <= 900) break
  }
  ctx.font = f(700, px)
  const w = ctx.measureText(String(str)).width + 80
  ctx.restore()
  ctx.fillStyle = P.accent
  ctx.beginPath()
  ctx.roundRect(x - w / 2, y - px, w, px * 2, px)
  ctx.fill()
  text(ctx, String(str), x, y + px * 0.35, { font: f(700, px), color: P.on })
}
// Wrapped text centred vertically on cy; `**bold**` is not used here, words wrap on spaces.
export function para(ctx, str, x, cy, { px = 60, w = 700, color = '#fff', maxW = 880, max = 4, align = 'center', alpha = 1, rise = 0 } = {}) {
  // Shrink the text until it fits `max` lines instead of cutting the end off.
  const min = Math.round(px * 0.6)
  let font = f(w, px)
  let ls = richLines(ctx, String(str || ''), maxW, () => font)
  while (px > min && (ls.length > max || ls.some((l) => l.width > maxW))) {
    px -= 4
    font = f(w, px)
    ls = richLines(ctx, String(str || ''), maxW, () => font)
  }
  ls = ls.slice(0, max)
  const lh = px * 1.2
  const y0 = cy - ((ls.length - 1) * lh) / 2 + px * 0.35
  ls.forEach((l, i) => text(ctx, l.words.map((q) => q.w).join(' '), x, y0 + i * lh + rise, { font, color, align, alpha }))
}
// Smaller frame that leaves room for the series badge and a header above it.
export const PHONE_S = { x: 358, y: 565, w: 364, h: 735 }
export function phone(ctx, P, img, zoom = 1, r = { x: 330, y: 400, w: 420, h: 860 }) {
  ctx.fillStyle = P.panel
  ctx.beginPath()
  ctx.roundRect(r.x - 14, r.y - 14, r.w + 28, r.h + 28, 62)
  ctx.fill()
  ctx.lineWidth = 5
  ctx.strokeStyle = P.mute
  ctx.stroke()
  cover(ctx, img, r.x, r.y, r.w, r.h, { radius: 48, zoom, label: 'ADD SCREENSHOT' })
  return r
}
// Pulsing tap highlight at (hx, hy) as a fraction of the phone screen.
export function tap(ctx, r, hx, hy, t) {
  const x = r.x + r.w * (Number.isFinite(+hx) ? +hx : 0.5)
  const y = r.y + r.h * (Number.isFinite(+hy) ? +hy : 0.5)
  const k = (t * 1.4) % 1
  ctx.save()
  ctx.strokeStyle = YE
  ctx.lineWidth = 8
  ctx.globalAlpha = 1 - k
  ctx.beginPath()
  ctx.arc(x, y, 24 + 60 * k, 0, 7)
  ctx.stroke()
  ctx.restore()
  circle(ctx, x, y, 16, YE)
}
// The Now Learning Card: Tool, Use it for, Cost. Always the last frame.
export function nowCard(ctx, lt, d, P) {
  const q = easeOut(seg(lt, 0, 0.4))
  const l = lb(d)
  ctx.save()
  ctx.globalAlpha = q
  ctx.translate(0, (1 - q) * 40)
  ctx.fillStyle = P.panel
  ctx.beginPath()
  ctx.roundRect(80, 520, 920, 680, 36)
  ctx.fill()
  ctx.lineWidth = 4
  ctx.strokeStyle = P.accent
  ctx.stroke()
  text(ctx, 'Now Learning', 130, 590, { font: f(700, 40), color: P.accent, align: 'left' })
  ;[[l.tool, d.app], [l.use, d.useFor], [l.cost, d.cost]].forEach(([a, b], k) => {
    const y = 700 + k * 160
    text(ctx, a, 130, y, { font: f(500, 30), color: P.mute, align: 'left' })
    para(ctx, b, 130, y + 62, { px: 50, color: P.ink, maxW: 820, align: 'left', max: 2 })
  })
  ctx.restore()
  text(ctx, BRAND_TAG, 540, 1320, { font: f(700, 44), color: P.accent, alpha: q })
}
const BRAND_TAG = 'Discover It. Learn It. Use It.'
export function progress(ctx, P, t, total) {
  ctx.fillStyle = P.mute + '55'
  ctx.fillRect(90, 1484, 900, 6)
  ctx.fillStyle = P.accent
  ctx.fillRect(90, 1484, 900 * Math.min(1, t / total), 6)
}
