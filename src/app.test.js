// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeAll } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'

// Canvas and a few browser APIs do not exist in the simulated DOM, so give them harmless stand-ins.
const ctx = new Proxy({}, { get: (t, k) => (k === 'measureText' ? () => ({ width: 10 }) : k === 'createLinearGradient' || k === 'createRadialGradient' ? () => ({ addColorStop() {} }) : t[k] || (() => {})), set: (t, k, v) => ((t[k] = v), true) })
beforeAll(() => {
  HTMLCanvasElement.prototype.getContext = () => ctx
  globalThis.ResizeObserver = class { observe() {} disconnect() {} }
  document.fonts = { load: async () => [] }
  URL.createObjectURL = () => 'blob:x'
})

describe('App', () => {
  it('mounts, switches between all templates and shows their fields', async () => {
    const { default: App } = await import('./App.vue')
    const w = mount(App, { attachTo: document.body })
    await flushPromises()
    expect(w.text()).toContain('Now Learning')
    const tabs = w.findAll('.tpls button')
    expect(tabs).toHaveLength(3)
    const seen = []
    for (const tab of tabs) {
      await tab.trigger('click')
      await flushPromises()
      seen.push(w.find('.tname').text())
      expect(w.findAll('details').length).toBeGreaterThan(2)
    }
    expect(seen.join('|')).toContain('How To Use It')
    expect(seen.join('|')).toContain('Quick Discovery')
    expect(seen.join('|')).toContain('Festival Wishes')
  })

  it('loads one of the 30 ideas into its template', async () => {
    const { default: App } = await import('./App.vue')
    const w = mount(App, { attachTo: document.body })
    await flushPromises()
    const sel = w.find('select[aria-label="Start from an idea"]')
    expect(sel.findAll('option')).toHaveLength(31)
    await sel.setValue('3')
    await flushPromises()
    expect(w.find('.tname').text()).toContain('Quick Discovery')
  })

  it('edits a field, adds and removes a list item, and autosaves', async () => {
    vi.useFakeTimers()
    const { default: App } = await import('./App.vue')
    const w = mount(App, { attachTo: document.body })
    await w.findAll('.tpls button').find((b) => b.text().includes('How To')).trigger('click')
    await flushPromises()
    const title = w.findAll('input[type=text]').find((i) => i.element.value === 'Citymapper')
    await title.setValue('Test App')
    const before = w.findAll('.item').length
    await w.findAll('button.add').find((b) => b.text().includes('Add step')).trigger('click')
    expect(w.findAll('.item').length).toBe(before + 1)
    await w.findAll('.item')[0].find('button[aria-label=Remove]').trigger('click')
    expect(w.findAll('.item').length).toBe(before)
    vi.advanceTimersByTime(500)
    const saved = JSON.parse(localStorage.getItem('nowlearning-studio-v1'))
    expect(saved.template).toBe('howto')
    expect(saved.data.howto.app).toBe('Test App')
    vi.useRealTimers()
  })
})

describe('App on a phone without fast export (older iPhone)', () => {
  it('offers real-time recording, enables Export and explains it', async () => {
    globalThis.MediaRecorder = class { static isTypeSupported() { return true } }
    HTMLCanvasElement.prototype.captureStream = () => ({})
    const { default: App } = await import('./App.vue')
    const w = mount(App, { attachTo: document.body })
    await flushPromises()
    expect(w.text()).toContain('Real-time recording')
    expect(w.text()).toContain('Keep this screen on')
    const btn = w.findAll('button').find((b) => b.text().startsWith('Export 1080'))
    expect(btn.attributes('disabled')).toBeUndefined()
    delete globalThis.MediaRecorder
  })
})
