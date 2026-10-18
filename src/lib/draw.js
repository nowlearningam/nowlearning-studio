import { BRAND, FONTS } from '../brand.js'

export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x))
export const lerp = (a, b, x) => a + (b - a) * x
export const seg = (t, start, dur) => clamp((t - start) / dur)
export const easeOut = (x) => 1 - (1 - x) ** 3
export const easeInOut = (x) => (x < 0.5 ? 4 * x ** 3 : 1 - (-2 * x + 2) ** 3 / 2)
export const easeBack = (x) => {
  const c = 1.70158
  return 1 + (c + 1) * (x - 1) ** 3 + c * (x - 1) ** 2
}

const rgb = (c) => {
  c = c.replace('#', '')
  if (c.length === 3) c = [...c].map((x) => x + x).join('')
  return [0, 2, 4].map((i) => parseInt(c.slice(i, i + 2), 16))
}
export const mix = (a, b, k) => {
  const A = rgb(a)
  const B = rgb(b)
  return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * k).toString(16).padStart(2, '0')).join('')
}

export const srcSize = (s) => [s.naturalWidth || s.videoWidth || s.width || 0, s.naturalHeight || s.videoHeight || s.height || 0]

// Fills a rectangle with an image/video frame, cropping like CSS object-fit: cover.
export function cover(ctx, src, x, y, w, h, { radius = 0, zoom = 1, fx = 0.5, fy = 0.5, label = 'ADD IMAGE' } = {}) {
  ctx.save()
  ctx.beginPath()
  if (radius) ctx.roundRect(x, y, w, h, radius)
  else ctx.rect(x, y, w, h)
  ctx.clip()
  const [iw, ih] = src ? srcSize(src) : [0, 0]
  if (iw && ih) {
    const k = Math.max(w / iw, h / ih) * zoom
    ctx.drawImage(src, x + (w - iw * k) * fx, y + (h - ih * k) * fy, iw * k, ih * k)
  } else {
    ctx.fillStyle = '#25252d'
    ctx.fillRect(x, y, w, h)
    ctx.strokeStyle = 'rgba(255,255,255,.12)'
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineTo(x + w, y + h)
    ctx.moveTo(x + w, y)
    ctx.lineTo(x, y + h)
    ctx.stroke()
    text(ctx, label, x + w / 2, y + h / 2 + 12, { font: `600 ${Math.max(24, Math.min(40, w / 8))}px ${FONTS.body}`, color: 'rgba(255,255,255,.4)', spacing: 4 })
  }
  ctx.restore()
}

// One text call for everything: alignment is corrected for letter spacing so centred text stays centred.
export function text(ctx, str, x, y, { font, color = '#fff', align = 'center', spacing = 0, alpha = 1, shadow = null, baseline = 'alphabetic' } = {}) {
  ctx.save()
  ctx.font = font
  ctx.letterSpacing = spacing + 'px'
  ctx.textAlign = align
  ctx.textBaseline = baseline
  ctx.fillStyle = color
  ctx.globalAlpha *= alpha
  if (shadow) {
    ctx.shadowColor = shadow.color
    ctx.shadowOffsetX = shadow.x || 0
    ctx.shadowOffsetY = shadow.y || 0
    ctx.shadowBlur = shadow.blur || 0
  }
  const dx = align === 'center' ? spacing / 2 : align === 'right' ? spacing : 0
  ctx.fillText(str, x + dx, y)
  ctx.restore()
}

// Largest font (from `size` down to `min`) whose text fits `maxW`. `mk(px)` builds the CSS font string.
export function fitSize(ctx, str, mk, maxW, size, min = 16, spacing = 0) {
  ctx.save()
  ctx.letterSpacing = spacing + 'px'
  let s = size
  for (; s > min; s -= 2) {
    ctx.font = mk(s)
    if (ctx.measureText(str).width <= maxW) break
  }
  ctx.restore()
  return mk(s)
}

// Words wrapped to maxW. `**bold**` marks bold words (used for names in synopses).
export function richLines(ctx, str, maxW, fontFor) {
  const lines = []
  for (const para of String(str).split('\n')) {
    const words = []
    let prevEndsSpace = true
    para.split(/(\*\*[^*]+\*\*)/).forEach((chunk) => {
      if (!chunk) return
      const bold = /^\*\*[^*]+\*\*$/.test(chunk)
      const body = bold ? chunk.slice(2, -2) : chunk
      const parts = body.split(/\s+/).filter(Boolean)
      parts.forEach((w, k) => {
        // Punctuation or a bold name touching the previous chunk stays glued to it (no space between).
        const glue = k === 0 && !prevEndsSpace && !/^\s/.test(body) && words.length > 0
        words.push({ w, bold, glue })
      })
      prevEndsSpace = /\s$/.test(body)
    })
    let line = []
    let width = 0
    for (const word of words) {
      ctx.font = fontFor(word.bold)
      const ww = ctx.measureText(word.w).width
      const sp = word.glue ? 0 : ctx.measureText(' ').width
      if (line.length && width + sp + ww > maxW) {
        lines.push({ words: line, width })
        line = []
        width = 0
        word.glue = false
      }
      word.width = ww
      word.space = line.length ? (word.glue ? 0 : sp || ctx.measureText(' ').width) : 0
      width += word.space + ww
      line.push(word)
    }
    lines.push({ words: line, width })
  }
  return lines
}

export function drawRich(ctx, lines, cx, y, lh, fontFor, color, boldColor) {
  ctx.save()
  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'
  lines.forEach((ln, i) => {
    let x = cx - ln.width / 2
    ln.words.forEach((wd) => {
      x += wd.space
      ctx.font = fontFor(wd.bold)
      ctx.fillStyle = wd.bold ? boldColor : color
      ctx.fillText(wd.w, x, y + i * lh)
      x += wd.width
    })
  })
  ctx.restore()
}

export function watermark(ctx, W, H, { color = 'rgba(255,255,255,.55)', y = H - 62, shadow = null } = {}) {
  text(ctx, BRAND.watermark, W / 2, y, { font: `400 32px ${FONTS.body}`, color, spacing: 3, shadow })
}

// A white-bordered photo print, rotated about its centre.
export function polaroid(ctx, img, cx, cy, w, h, rot, { border = 24, bottom = 74, zoom = 1, fx = 0.5, fy = 0.5, label = 'ADD PHOTO' } = {}) {
  ctx.save()
  ctx.translate(cx, cy)
  ctx.rotate(rot)
  ctx.shadowColor = 'rgba(0,0,0,.5)'
  ctx.shadowBlur = 44
  ctx.shadowOffsetY = 20
  ctx.fillStyle = '#F7F4EC'
  ctx.beginPath()
  ctx.roundRect(-w / 2, -h / 2, w, h, 10)
  ctx.fill()
  ctx.shadowColor = 'transparent'
  cover(ctx, img, -w / 2 + border, -h / 2 + border, w - border * 2, h - border - bottom, { zoom, fx, fy, label })
  ctx.restore()
}

// A gold wax-seal style medallion.
export function seal(ctx, x, y, r, scale = 1) {
  ctx.save()
  ctx.translate(x, y)
  ctx.scale(scale, scale)
  ctx.shadowColor = 'rgba(0,0,0,.4)'
  ctx.shadowBlur = 14
  ctx.shadowOffsetY = 6
  const g = ctx.createRadialGradient(-r * 0.3, -r * 0.35, r * 0.1, 0, 0, r)
  g.addColorStop(0, '#FFE9A0')
  g.addColorStop(0.55, '#D4A63A')
  g.addColorStop(1, '#8F6A12')
  ctx.fillStyle = g
  ctx.beginPath()
  ctx.arc(0, 0, r, 0, Math.PI * 2)
  ctx.fill()
  ctx.shadowColor = 'transparent'
  ctx.strokeStyle = 'rgba(120,80,0,.45)'
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.arc(0, 0, r * 0.72, 0, Math.PI * 2)
  ctx.stroke()
  ctx.restore()
}

// Slowly rising golden specks; positions come from the index, so any frame is reproducible.
export function sparkles(ctx, t, W, H, { count = 22, color = '255,236,170' } = {}) {
  ctx.save()
  for (let i = 0; i < count; i++) {
    const x = ((i * 137) % 100) / 100 * W
    const speed = 18 + (i % 5) * 9
    const y = (((((i * 61) % 100) / 100) * H - t * speed) % H + H) % H
    const r = 3 + (i % 4) * 2
    ctx.globalAlpha = 0.18 + 0.2 * (0.5 + 0.5 * Math.sin(t * 1.8 + i))
    ctx.fillStyle = `rgb(${color})`
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.restore()
}
