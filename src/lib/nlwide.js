import { FONTS, BRAND } from '../brand.js'
import { seg, easeOut, text } from './draw.js'
import { lb } from './nl.js'
import { LW, LH, panel, kicker, wpara, wpill } from './wide.js'

// The Now Learning Card, laid out for 16:9.
//
// `nowCard` in lib/nl.js is the vertical one and hardcodes 1080x1920 coordinates, so the long
// templates need their own. The content is the same three rows — Tool, Use it for, Cost — in the
// language the project is set to, and it is always the last thing on screen.
export function nowCardWide(ctx, P, lt, d, { head = '' } = {}) {
  const l = lb(d)
  const a = easeOut(seg(lt, 0, 0.5))
  const b = easeOut(seg(lt, 0.5, 0.6))
  const rows = [
    [l.tool, d.app],
    [l.use, d.useFor],
    [l.cost, d.cost],
  ].filter(([, v]) => String(v || '').trim())

  if (String(head || '').trim()) {
    ctx.save()
    ctx.globalAlpha = a
    text(ctx, String(head), LW / 2, 210, { font: `700 68px ${FONTS.display}`, color: P.ink, spacing: 1 })
    ctx.restore()
  }

  const top = 270
  const h = Math.max(200, rows.length * 150 + 110)
  ctx.save()
  ctx.globalAlpha = a
  ctx.translate(0, (1 - a) * 30)
  panel(ctx, P, 310, top, LW - 620, h, 36)
  ctx.restore()

  ctx.save()
  ctx.globalAlpha = a
  kicker(ctx, P, BRAND.name, 370, top + 70, { px: 36, align: 'left' })
  rows.forEach(([label, value], i) => {
    const y = top + 140 + i * 150
    text(ctx, String(label).toUpperCase(), 370, y, { font: `700 28px ${FONTS.body}`, color: P.mute, spacing: 4, align: 'left' })
    wpara(ctx, value, 370, y + 56, { px: 46, color: P.ink, maxW: LW - 760, max: 1, align: 'left' })
  })
  ctx.restore()

  ctx.save()
  ctx.globalAlpha = b
  wpill(ctx, P, BRAND.tagline, LW / 2, top + h + 110, { px: 42, maxW: 1100 })
  ctx.restore()
}

// The Now Learning Card fields, shared by both long templates.
export const nowCardFields = () => [
  { group: 'Now Learning Card', key: 'app', label: 'Tool or app name', type: 'text' },
  { group: 'Now Learning Card', key: 'useFor', label: 'Use it for', type: 'text' },
  { group: 'Now Learning Card', key: 'cost', label: 'Cost (Free / Paid / Free + paid)', type: 'text' },
  { group: 'Now Learning Card', key: 'cardH', label: 'Heading above the card', type: 'text' },
]
export const nowCardDefaults = (over = {}) => ({ app: '', useFor: '', cost: 'Free', cardH: '', ...over })

export { LH }
