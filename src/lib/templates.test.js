import { describe, it, expect } from 'vitest'
import { TEMPLATES, getTemplate, normalizeData, collectIds, audioPlan } from '../templates/index.js'
import { shortsStatus, fileSlug } from './files.js'
import { mix, seg, easeBack, richLines } from './draw.js'

// A canvas context that accepts every call, so draw() can run in Node and any typo or bad
// reference still throws.
function fakeCtx() {
  const grad = { addColorStop() {} }
  return new Proxy(
    {},
    {
      get(target, k) {
        if (k === 'measureText') return (s) => ({ width: String(s).length * 12 })
        if (k === 'createLinearGradient' || k === 'createRadialGradient') return () => grad
        if (k in target) return target[k]
        return () => {}
      },
      set(target, k, v) {
        target[k] = v
        return true
      },
    },
  )
}
const fakeImg = { width: 800, height: 600 }
const A = { img: () => fakeImg, gray: () => fakeImg, video: () => ({ videoWidth: 640, videoHeight: 360 }), dur: () => 5 }

describe.each(TEMPLATES.map((t) => [t.key, t]))('template %s', (key, tpl) => {
  const d = tpl.defaults()

  it('has a positive duration and a thumbnail time inside it', () => {
    const total = tpl.duration(d)
    expect(total).toBeGreaterThan(2)
    expect(tpl.thumbTime(d)).toBeGreaterThanOrEqual(0)
    expect(tpl.thumbTime(d)).toBeLessThan(total)
  })

  it('draws every moment with and without media, without throwing', () => {
    const filled = JSON.parse(JSON.stringify(d))
    for (const f of tpl.fields) {
      if (['image', 'video', 'audio'].includes(f.type)) filled[f.key] = 'x1'
      if (f.type === 'images') filled[f.key] = ['x1', 'x2', 'x3']
      if (f.type === 'list') filled[f.key] = Array.from({ length: 3 }, () => Object.fromEntries(f.fields.map((g) => [g.key, g.type === 'text' ? 'Sample text' : 'x1'])))
    }
    for (const data of [d, filled]) {
      const total = tpl.duration(data)
      for (let i = 0; i <= 60; i++) {
        const t = Math.min((total * i) / 60, total - 0.001)
        expect(() => tpl.draw(fakeCtx(), t, data, i % 2 ? A : { img: () => null, video: () => null })).not.toThrow()
      }
    }
  })

  it('every field has a group, key and known type', () => {
    const types = ['text', 'textarea', 'number', 'range', 'color', 'checkbox', 'select', 'image', 'images', 'video', 'audio', 'list']
    for (const f of tpl.fields) {
      expect(f.group).toBeTruthy()
      expect(types).toContain(f.type)
      expect(key in { [key]: 1 } && f.key in d).toBe(true)
    }
  })

  it('normalizeData fills missing fields and ignores wrongly typed ones', () => {
    const out = normalizeData(tpl, { [Object.keys(d)[0]]: { bad: true } })
    expect(Object.keys(out).sort()).toEqual(Object.keys(d).sort())
  })
})

describe('helpers', () => {
  it('mix, seg and easeBack behave', () => {
    expect(mix('#000000', '#ffffff', 0.5)).toBe('#808080')
    expect(seg(5, 2, 2)).toBe(1)
    expect(seg(1, 2, 2)).toBe(0)
    expect(easeBack(0)).toBeCloseTo(0)
    expect(easeBack(1)).toBeCloseTo(1)
  })
  it('richLines keeps punctuation glued to bold names', () => {
    const ctx = fakeCtx()
    const lines = richLines(ctx, 'Hi **Venu**, bye', 10000, () => '10px x')
    const w = lines[0].words
    expect(w.map((x) => x.w)).toEqual(['Hi', 'Venu', ',', 'bye'])
    expect(w[2].glue).toBe(true)
    expect(w[1].bold).toBe(true)
  })
  it('shortsStatus and fileSlug', () => {
    expect(shortsStatus(45).level).toBe('ok')
    expect(shortsStatus(120).level).toBe('warn')
    expect(shortsStatus(200).level).toBe('bad')
    expect(fileSlug('Varshangalkku Shesham!')).toBe('varshangalkku-shesham')
    expect(fileSlug('')).toBe('video')
  })
})

import { IDEAS } from './ideas.js'
import { THEMES, SERIES } from './nl.js'

describe('Now Learning templates', () => {
  it('how-to grows with its steps and skips an empty problem', () => {
    const h = getTemplate('howto')
    const d = h.defaults()
    const base = h.duration(d)
    d.steps.push({ image: '', text: 'One more', tap: false, hx: 0.5, hy: 0.5 })
    expect(h.duration(d)).toBe(base + d.sStep)
    d.problem = ''
    expect(h.duration(d)).toBe(base + d.sStep - d.sProb)
  })
  it('quick discovery length follows the seconds field', () => {
    const q = getTemplate('quick')
    expect(q.duration({ seconds: 30 })).toBe(30)
    expect(q.duration({ seconds: 1 })).toBe(10)
  })
  it('every colour template has the colours the templates use', () => {
    for (const [name, P] of Object.entries(THEMES)) for (const k of ['bg', 'panel', 'accent', 'ink', 'mute', 'on']) expect(P[k], name + ' ' + k).toMatch(/^#[0-9A-Fa-f]{6}$/)
  })
  it('the 30 ideas point at real templates and colour templates', () => {
    expect(IDEAS).toHaveLength(30)
    for (const i of IDEAS) {
      expect(getTemplate(i.template).key).toBe(i.template)
      expect(THEMES[i.series]).toBeTruthy()
      expect(SERIES[i.series]).toBeTruthy()
      expect(i.hook && i.app && i.useFor && i.cost).toBeTruthy()
    }
  })
})
