import { describe, it, expect } from 'vitest'
import { TEMPLATES, getTemplate, normalizeData, collectIds, audioPlan } from '../templates/index.js'
import { shortsStatus, sizeStatus, fileSlug } from './files.js'
import { listPlan, listAt, rankOf, listCount, LW, LH } from './wide.js'
import { mix, seg, easeBack, richLines } from './draw.js'
import { WIDE_BACKGROUNDS } from './wide.js'
import { THEMES, LB } from './nl.js'

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


describe('long video (16:9 tool roundup)', () => {
  const ru = getTemplate('roundup')

  it('is horizontal and registered as a long template', () => {
    expect(ru.kind).toBe('long')
    expect(ru.size).toEqual([LW, LH])
    expect(LW).toBeGreaterThan(LH)
    expect(TEMPLATES.filter((t) => t.kind === 'long').map((t) => t.key)).toEqual(['howtolong', 'quicklong', 'roundup'])
    expect(TEMPLATES.filter((t) => t.kind === 'short').map((t) => t.key)).toEqual(['howto', 'quick', 'wish'])
  })

  it('lays the scenes out in order and grows with the tool list', () => {
    const d = ru.defaults()
    const p = listPlan(d)
    expect(p.n).toBe(3)
    expect(ru.duration(d)).toBeCloseTo(p.title + p.hook + 3 * p.item + p.cta)
    d.items = [...d.items, { image: '', heading: 'Four', useFor: '', cost: '', body: '' }]
    expect(ru.duration(d)).toBeCloseTo(p.total + p.item)
  })

  it('reports the right scene for any moment and skips an empty hook', () => {
    const d = ru.defaults()
    const p = listPlan(d)
    expect(listAt(d, 0).scene).toBe('title')
    expect(listAt(d, p.title + 0.1).scene).toBe('hook')
    expect(listAt(d, p.title + p.hook + 0.1)).toMatchObject({ scene: 'item', i: 0 })
    expect(listAt(d, p.total - 0.1).scene).toBe('cta')
    const noHook = { ...d, hook: '  ' }
    expect(listPlan(noHook).hook).toBe(0)
    expect(listAt(noHook, listPlan(noHook).title + 0.1).scene).toBe('item')
  })

  it('counts up by default and down when asked', () => {
    expect(rankOf({ countdown: false }, 0, 10)).toBe(1)
    expect(rankOf({ countdown: true }, 0, 10)).toBe(10)
    expect(ru.defaults().countdown).toBe(false)
  })

  it('uses every colour template and every background without throwing', () => {
    const d = ru.defaults()
    for (const theme of Object.keys(THEMES)) expect(() => ru.draw(fakeCtx(), 9, { ...d, theme }, A)).not.toThrow()
    for (const bgStyle of WIDE_BACKGROUNDS) expect(() => ru.draw(fakeCtx(), 9, { ...d, bgStyle }, A)).not.toThrow()
    for (const lang of Object.keys(LB)) expect(() => ru.draw(fakeCtx(), 9, { ...d, lang }, A)).not.toThrow()
  })

  it('survives an empty tool list', () => {
    const d = { ...ru.defaults(), items: [] }
    expect(listCount(d)).toBe(1)
    expect(() => ru.draw(fakeCtx(), ru.duration(d) / 2, d, A)).not.toThrow()
  })

  it('tells long videos apart from Shorts when advising on length', () => {
    expect(sizeStatus(ru, 600).level).toBe('ok')
    expect(sizeStatus(ru, 600).text).toContain('10:00')
    expect(sizeStatus(getTemplate('quick'), 600).level).toBe('bad')
  })

  it('tracks each tool screenshot as an asset', () => {
    const d = ru.defaults()
    d.items[0].image = 's1'
    d.items[2].image = 's3'
    d.audio = 'm1'
    expect(collectIds(ru, d).sort()).toEqual(['m1', 's1', 's3'])
  })
})


describe('every Shorts template except Festival Wishes has a long counterpart', () => {
  // The pairing the studio promises: one long template per short, Festival Wishes excepted.
  const PAIRS = [['howto', 'howtolong'], ['quick', 'quicklong']]

  it('pairs them up, and leaves the greeting out', () => {
    for (const [short, long] of PAIRS) {
      expect(getTemplate(short).kind).toBe('short')
      expect(getTemplate(long).kind).toBe('long')
      expect(getTemplate(long).size).toEqual([LW, LH])
    }
    expect(TEMPLATES.some((t) => t.key === 'wishlong')).toBe(false)
    // Nothing is missing: every short bar the greeting is covered.
    const shorts = TEMPLATES.filter((t) => t.kind === 'short').map((t) => t.key)
    expect(shorts.filter((k) => k !== 'wish').sort()).toEqual(PAIRS.map(([s]) => s).sort())
  })

  it('both carry the Now Learning Card and close on it', () => {
    for (const [, long] of PAIRS) {
      const d = getTemplate(long).defaults()
      for (const k of ['app', 'useFor', 'cost']) expect(d[k], `${long}.${k}`).toBeDefined()
      const keys = getTemplate(long).fields.filter((f) => f.group === 'Now Learning Card').map((f) => f.key)
      expect(keys).toEqual(expect.arrayContaining(['app', 'useFor', 'cost']))
    }
  })

  it('draws every colour template, background and language without throwing', () => {
    for (const [, long] of PAIRS) {
      const tpl = getTemplate(long)
      const d = tpl.defaults()
      const mid = tpl.duration(d) / 2
      for (const theme of Object.keys(THEMES)) expect(() => tpl.draw(fakeCtx(), mid, { ...d, theme }, A)).not.toThrow()
      for (const bgStyle of WIDE_BACKGROUNDS) expect(() => tpl.draw(fakeCtx(), mid, { ...d, bgStyle }, A)).not.toThrow()
      for (const lang of Object.keys(LB)) expect(() => tpl.draw(fakeCtx(), mid, { ...d, lang }, A)).not.toThrow()
    }
  })

  it('grows with its list and survives an empty one', () => {
    for (const [, long] of PAIRS) {
      const tpl = getTemplate(long)
      const d = tpl.defaults()
      const before = tpl.duration(d)
      const grown = { ...d, items: [...d.items, { image: '', heading: 'Extra', body: '' }] }
      expect(tpl.duration(grown)).toBeCloseTo(before + listPlan(d).item)
      const empty = { ...d, items: [] }
      expect(listCount(empty)).toBe(1)
      for (let i = 0; i <= 20; i++) {
        expect(() => tpl.draw(fakeCtx(), (tpl.duration(empty) * i) / 20.5, empty, A)).not.toThrow()
      }
    }
  })

  it('tracks every picture in the list as an asset', () => {
    for (const [, long] of PAIRS) {
      const tpl = getTemplate(long)
      const d = tpl.defaults()
      d.items[0].image = 'p1'
      d.items[1].image = 'p2'
      d.audio = 'm1'
      expect(collectIds(tpl, d).sort()).toEqual(['m1', 'p1', 'p2'])
    }
  })
})
