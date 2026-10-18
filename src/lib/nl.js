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
export const SERIES = { Apps: 'Apps You Should Know', AI: 'Do This With AI', Tricks: 'Tricks You Didn’t Know', Websites: 'Websites That Help', 'One tool': 'One Tool, One Solution', Daylight: 'Now Learning' }
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

export function backdrop(ctx, P) {
  ctx.fillStyle = P.bg
  ctx.fillRect(0, 0, W, H)
  const g = ctx.createRadialGradient(540, 300, 0, 540, 300, 900)
  g.addColorStop(0, P.accent + '2E')
  g.addColorStop(1, P.accent + '00')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, W, H)
}
export const circle = (ctx, x, y, r, c) => {
  ctx.beginPath()
  ctx.arc(x, y, r, 0, 7)
  ctx.fillStyle = c
  ctx.fill()
}
export function chip(ctx, d, P) {
  circle(ctx, 66, 288, 8, P.accent)
  text(ctx, SERIES[d.theme] || '', 90, 300, { font: f(700, 34), color: P.accent, align: 'left' })
}
export function pill(ctx, str, x, y, P, px = 40) {
  ctx.save()
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
  const font = f(w, px)
  const ls = richLines(ctx, String(str || ''), maxW, () => font).slice(0, max)
  const lh = px * 1.2
  const y0 = cy - ((ls.length - 1) * lh) / 2 + px * 0.35
  ls.forEach((l, i) => text(ctx, l.words.map((q) => q.w).join(' '), x, y0 + i * lh + rise, { font, color, align, alpha }))
}
export function phone(ctx, P, img, zoom = 1) {
  const r = { x: 330, y: 400, w: 420, h: 860 }
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
