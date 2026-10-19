import howto from './howto.js'
import quick from './quick.js'
import wish from './wish.js'

export const TEMPLATES = [howto, quick, wish]
export const getTemplate = (key) => TEMPLATES.find((t) => t.key === key) || TEMPLATES[0]

// Merges saved data over fresh defaults so fields added later still get a value.
export function normalizeData(tpl, saved) {
  const base = tpl.defaults()
  if (!saved || typeof saved !== 'object') return base
  const out = { ...base }
  for (const k of Object.keys(base)) if (saved[k] !== undefined && typeof saved[k] === typeof base[k]) out[k] = saved[k]
  return out
}

// Every asset id a project uses (images, videos, audio), found through the field definitions.
export function collectIds(tpl, data) {
  const ids = new Set()
  const walk = (fields, obj) => {
    for (const f of fields) {
      const v = obj?.[f.key]
      if (['image', 'video', 'audio'].includes(f.type) && v) ids.add(v)
      else if (f.type === 'images' && Array.isArray(v)) v.forEach((x) => x && ids.add(x))
      else if (f.type === 'list' && Array.isArray(v)) v.forEach((item) => walk(f.fields, item))
    }
  }
  walk(tpl.fields, data)
  return [...ids]
}

// Sound for the whole video: the music track plus anything the template adds (clip sound).
export function audioPlan(tpl, d, total) {
  const plan = []
  if (d.audio) plan.push({ id: d.audio, start: 0, dur: total, loop: false, gain: +d.musicVol >= 0 ? +d.musicVol : 0.8, fadeOut: 1, music: true })
  if (tpl.audio) plan.push(...tpl.audio(d, total))
  return plan
}
