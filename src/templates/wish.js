import { seg, easeOut, easeBack, text, watermark, mix } from '../lib/draw.js'
import { W, H, f, backdrop, bgField, para, pill, circle, BACKGROUNDS } from '../lib/nl.js'

// Festival wishes poster (5-15 s): an occasion palette, a glowing emblem, the greeting, a wish line and "from Now Learning".
export const OCCASIONS = {
  Diwali: { emoji: '\u{1FA94}', bg: '#1A0B2E', panel: '#2A1448', accent: '#FFB627', ink: '#FFF6E0', mute: '#C9A8E8', on: '#1A0B2E', star: '#FFE08A' },
  Pongal: { emoji: '\u{1F33E}', bg: '#0F2A14', panel: '#17401F', accent: '#FFD23F', ink: '#FFF9E3', mute: '#9FC9A0', on: '#0F2A14', star: '#FFF2A8' },
  'New Year': { emoji: '\u{1F386}', bg: '#0A1030', panel: '#141E4A', accent: '#F5C84C', ink: '#F5F7FA', mute: '#98A4D8', on: '#0A1030', star: '#FFFFFF' },
  Christmas: { emoji: '\u{1F384}', bg: '#10241B', panel: '#1B3A2C', accent: '#FF5A5F', ink: '#F5F7FA', mute: '#9CC3AE', on: '#FFFFFF', star: '#FFE9A8' },
  Eid: { emoji: '\u{1F319}', bg: '#07242A', panel: '#0E3A43', accent: '#E8C468', ink: '#F5F7FA', mute: '#8FBCC4', on: '#07242A', star: '#FFF1BF' },
  Holi: { emoji: '\u{1F3A8}', bg: '#25082B', panel: '#3A1042', accent: '#FF4FA3', ink: '#FFF5FB', mute: '#D9A0D2', on: '#FFFFFF', star: '#7CF0FF' },
  'Independence Day': { emoji: '\u{1F1EE}\u{1F1F3}', bg: '#0B1B33', panel: '#13294A', accent: '#FF9933', ink: '#F5F7FA', mute: '#8FA4C4', on: '#0B1B33', star: '#7BE495' },
  'Ayudha Pooja': { emoji: '\u{1F6E0}\uFE0F', bg: '#2A0E10', panel: '#431A1C', accent: '#FFAE1A', ink: '#FFF4DC', mute: '#D8A98A', on: '#2A0E10', star: '#FFD66B' },
  Dussehra: { emoji: '\u{1F3F9}', bg: '#2B0F0A', panel: '#451B12', accent: '#FF7A1A', ink: '#FFF3E0', mute: '#D9A58A', on: '#2B0F0A', star: '#FFD27A' },
  Navaratri: { emoji: '\u{1F54A}\uFE0F', bg: '#2A0A2E', panel: '#40154A', accent: '#FF5EA8', ink: '#FFF5FB', mute: '#D9A0D2', on: '#FFFFFF', star: '#FFD66B' },
  Onam: { emoji: '\u{1F338}', bg: '#0F2A1A', panel: '#17402A', accent: '#FFC53D', ink: '#FFF9E3', mute: '#9FC9A8', on: '#0F2A1A', star: '#FFFFFF' },
  Ugadi: { emoji: '\u{1F96D}', bg: '#10281A', panel: '#193E29', accent: '#9BE15D', ink: '#F7FFE9', mute: '#A6C9A8', on: '#10281A', star: '#FFE45C' },
  'Ganesh Chaturthi': { emoji: '\u{1F418}', bg: '#2B1208', panel: '#46200F', accent: '#FF8A3D', ink: '#FFF3E6', mute: '#D9AE92', on: '#2B1208', star: '#FFD66B' },
  'Republic Day': { emoji: '\u{1F1EE}\u{1F1F3}', bg: '#0B1B33', panel: '#13294A', accent: '#FF9933', ink: '#F5F7FA', mute: '#8FA4C4', on: '#0B1B33', star: '#7BE495' },
  'Now Learning': { emoji: '✨', bg: '#0B1220', panel: '#121b2e', accent: '#2EE6A6', ink: '#F5F7FA', mute: '#8A94A6', on: '#0B1220', star: '#FFD23F' },
}
export const CUSTOM = 'Custom'
// Custom: two colours and an emoji; the other shades are derived from them.
const custom = (d) => {
  const bg = /^#[0-9a-f]{6}$/i.test(d.customBg) ? d.customBg : '#101428'
  const accent = /^#[0-9a-f]{6}$/i.test(d.customAccent) ? d.customAccent : '#FFB627'
  return { emoji: '\u2728', bg, panel: mix(bg, '#ffffff', 0.08), accent, ink: '#F5F7FA', mute: mix(bg, '#ffffff', 0.55), on: bg, star: mix(accent, '#ffffff', 0.5) }
}
const pal = (d) => {
  const P = d.occasion === CUSTOM ? custom(d) : OCCASIONS[d.occasion] || OCCASIONS['Now Learning']
  const e = String(d.emoji || '').trim()
  return e ? { ...P, emoji: e } : P
}
const sparkle = (ctx, x, y, r, c, al) => {
  ctx.save()
  ctx.globalAlpha = al
  ctx.fillStyle = c
  ctx.beginPath()
  ctx.moveTo(x, y - r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.quadraticCurveTo(x, y, x, y + r)
  ctx.quadraticCurveTo(x, y, x - r, y)
  ctx.quadraticCurveTo(x, y, x, y - r)
  ctx.fill()
  ctx.restore()
}

export default {
  key: 'wish',
  label: 'Festival Wishes',
  short: 'Wishes',
  emoji: '\u{1F389}',
  kind: 'short',
  size: [W, H],
  fps: 30,
  defaults: () => ({
    occasion: 'Diwali',
    emoji: '',
    customBg: '#101428',
    customAccent: '#FFB627',
    bgStyle: 'Rays',
    greeting: 'Happy Diwali',
    wish: 'Wishing you light, joy and new things to learn.',
    from: 'from Now Learning',
    emblem: '',
    seconds: 8,
    watermark: true,
    audio: '',
    musicVol: 0.7,
  }),
  fields: [
    { group: 'Content', key: 'greeting', label: 'Greeting', type: 'text' },
    { group: 'Content', key: 'wish', label: 'Wish line', type: 'textarea' },
    { group: 'Content', key: 'from', label: 'From line', type: 'text' },
    { group: 'Content', key: 'emblem', label: 'Emblem image (optional, replaces the emoji)', type: 'image' },
    { group: 'Look', key: 'occasion', label: 'Festival / occasion colours', type: 'select', options: [...Object.keys(OCCASIONS), CUSTOM] },
    { group: 'Look', key: 'emoji', label: 'Emblem emoji (empty = festival default)', type: 'text' },
    { group: 'Look', key: 'customBg', label: 'Custom: background colour (when Custom)', type: 'color' },
    { group: 'Look', key: 'customAccent', label: 'Custom: accent colour (when Custom)', type: 'color' },
    bgField(),
    { group: 'Look', key: 'watermark', label: 'Show channel watermark', type: 'checkbox' },
    { group: 'Timing & sound', key: 'seconds', label: 'Length (seconds)', type: 'number', min: 4, max: 30 },
    { group: 'Timing & sound', key: 'audio', label: 'Music (optional)', type: 'audio' },
    { group: 'Timing & sound', key: 'musicVol', label: 'Music volume', type: 'range', min: 0, max: 1, step: 0.05 },
  ],
  duration: (d) => Math.min(30, Math.max(4, +d.seconds || 8)),
  thumbTime: () => 2,
  fileName: (d) => d.greeting,

  draw(ctx, t, d, A) {
    const P = pal(d)
    const pop = easeBack(seg(t, 0.2, 0.9))
    const a1 = easeOut(seg(t, 0.9, 0.6))
    const a2 = easeOut(seg(t, 1.4, 0.6))
    const a3 = easeOut(seg(t, 1.9, 0.6))
    backdrop(ctx, P, BACKGROUNDS.includes(d.bgStyle) ? d.bgStyle : 'Rays', t)
    for (let i = 0; i < 30; i++) {
      const x = ((i * 137) % 100) / 100 * W
      const y = 120 + ((i * 61) % 100) / 100 * (H - 240)
      sparkle(ctx, x, y, 10 + (i % 4) * 7, i % 3 ? P.star : P.accent, 0.15 + 0.45 * (0.5 + 0.5 * Math.sin(t * 2 + i * 1.7)))
    }
    // Emblem: glowing ring with the emoji or an uploaded image.
    ctx.save()
    ctx.translate(540, 620)
    ctx.scale(0.5 + 0.5 * pop, 0.5 + 0.5 * pop)
    ctx.translate(-540, -620)
    const g = ctx.createRadialGradient(540, 620, 60, 540, 620, 330)
    g.addColorStop(0, P.accent + '55')
    g.addColorStop(1, P.accent + '00')
    ctx.fillStyle = g
    ctx.fillRect(140, 220, 800, 800)
    circle(ctx, 540, 620, 220, P.panel)
    ctx.lineWidth = 8
    ctx.strokeStyle = P.accent
    ctx.stroke()
    ctx.lineWidth = 3
    ctx.strokeStyle = P.accent + '66'
    ctx.beginPath()
    ctx.arc(540, 620, 250 + 6 * Math.sin(t * 2), 0, 7)
    ctx.stroke()
    const img = A.img(d.emblem)
    if (img) {
      ctx.save()
      ctx.beginPath()
      ctx.arc(540, 620, 200, 0, 7)
      ctx.clip()
      const iw = img.naturalWidth || img.videoWidth || img.width
      const ih = img.naturalHeight || img.videoHeight || img.height
      const k = Math.max(400 / iw, 400 / ih)
      ctx.drawImage(img, 540 - (iw * k) / 2, 620 - (ih * k) / 2, iw * k, ih * k)
      ctx.restore()
    } else {
      ctx.font = `200px system-ui, "Apple Color Emoji", "Segoe UI Emoji", sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(P.emoji, 540, 630 + 6 * Math.sin(t * 2.4))
    }
    ctx.restore()
    // Greeting, accent bar, wish line, from line.
    ctx.save()
    ctx.globalAlpha = a1
    para(ctx, d.greeting, 540, 1010, { px: 128, color: P.accent, maxW: 900, max: 2, rise: (1 - a1) * 40 })
    ctx.restore()
    ctx.fillStyle = P.accent
    ctx.beginPath()
    ctx.roundRect(540 - 90 * a2, 1150, 180 * a2, 8, 4)
    ctx.fill()
    para(ctx, d.wish, 540, 1250, { px: 52, w: 500, color: P.ink, maxW: 860, max: 3, alpha: a2, rise: (1 - a2) * 30 })
    ctx.save()
    ctx.globalAlpha = a3
    pill(ctx, d.from, 540, 1420, P, 36)
    ctx.restore()
    if (d.watermark) watermark(ctx, W, H, { y: 1896, color: P.mute })
  },
}
