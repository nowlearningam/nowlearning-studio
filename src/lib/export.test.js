// @vitest-environment happy-dom
import { describe, it, expect, vi, afterEach } from 'vitest'
import { pickMethod, exportBlocker, recordVideo } from './exporter.js'
import { polyfillCanvas } from './polyfill.js'

describe('pickMethod (what each kind of device gets)', () => {
  const desktopChrome = { secure: true, fast: true, fastAudio: true, rec: true }
  const ios26 = { secure: true, fast: true, fastAudio: true, rec: true }
  const ios17 = { secure: true, fast: true, fastAudio: false, rec: true } // video encoder only
  const ios15 = { secure: true, fast: false, fastAudio: false, rec: true }
  const lanHttp = { secure: false, fast: false, fastAudio: false, rec: true }
  const none = { secure: true, fast: false, fastAudio: false, rec: false }

  it('uses fast export wherever audio can be encoded', () => {
    expect(pickMethod(desktopChrome, true)).toBe('fast')
    expect(pickMethod(ios26, true)).toBe('fast')
  })
  it('older iPhones record in real time when sound is wanted, and export fast when it is not', () => {
    expect(pickMethod(ios17, true)).toBe('record')
    expect(pickMethod(ios17, false)).toBe('fast')
    expect(pickMethod(ios15, true)).toBe('record')
    expect(pickMethod(lanHttp, false)).toBe('record')
  })
  it('falls back to a silent fast export if recording is impossible, and to nothing otherwise', () => {
    expect(pickMethod({ secure: true, fast: true, fastAudio: false, rec: false }, true)).toBe('fast')
    expect(pickMethod(none, true)).toBe('')
  })
  it('honours the user choice only when that method exists', () => {
    expect(pickMethod(desktopChrome, true, 'record')).toBe('record')
    expect(pickMethod(ios15, true, 'fast')).toBe('record')
    expect(pickMethod(desktopChrome, false, 'fast')).toBe('fast')
  })
  it('explains why export is unavailable', () => {
    expect(exportBlocker({ secure: false, fast: false, rec: false })).toMatch(/https/)
    expect(exportBlocker({ secure: true, fast: false, rec: false })).toMatch(/iPhone/)
    expect(exportBlocker({ secure: true, fast: false, rec: true })).toBe('')
  })
})

describe('canvas polyfills for older Safari', () => {
  afterEach(() => delete globalThis.CanvasRenderingContext2D)

  function install() {
    const calls = []
    class Fake {
      textAlign = 'left'
      save() { calls.push(['save']) }
      restore() { calls.push(['restore']) }
      fillText(s, x) { calls.push(['fillText', s, x]) }
      measureText(s) { return { width: String(s).length * 10 } }
      moveTo() { calls.push(['moveTo']) }
      lineTo() { calls.push(['lineTo']) }
      arcTo() { calls.push(['arcTo']) }
      closePath() { calls.push(['closePath']) }
    }
    globalThis.CanvasRenderingContext2D = Fake
    polyfillCanvas()
    return { Fake, calls }
  }

  it('letterSpacing spaces centred text letter by letter and restores with the state stack', () => {
    const { Fake, calls } = install()
    const c = new Fake()
    c.textAlign = 'center'
    c.letterSpacing = '5px'
    expect(c.measureText('ABC').width).toBe(45)
    c.fillText('ABC', 100, 50)
    const xs = calls.filter((x) => x[0] === 'fillText')
    expect(xs.map((x) => x[1]).join('')).toBe('ABC')
    expect(xs.map((x) => x[2])).toEqual([77.5, 92.5, 107.5])
    expect(c.textAlign).toBe('center')
    c.save()
    c.letterSpacing = '9px'
    c.restore()
    expect(c.letterSpacing).toBe('5px')
  })

  it('never splits scripts that need shaping (Malayalam, Tamil, Hindi)', () => {
    const { Fake, calls } = install()
    const c = new Fake()
    c.letterSpacing = '5px'
    c.fillText('\u0D35\u0D7C\u0D37\u0D19\u0D4D\u0D19\u0D7E', 0, 0)
    expect(calls.filter((x) => x[0] === 'fillText')).toHaveLength(1)
  })

  it('roundRect draws four rounded corners', () => {
    const { Fake, calls } = install()
    new Fake().roundRect(0, 0, 100, 50, 10)
    expect(calls.filter((x) => x[0] === 'arcTo')).toHaveLength(4)
    expect(calls.filter((x) => x[0] === 'closePath')).toHaveLength(1)
  })

  it('leaves browsers that already support these features alone', () => {
    class Native {
      roundRect() {}
      get letterSpacing() { return '0px' }
      set letterSpacing(v) {}
    }
    globalThis.CanvasRenderingContext2D = Native
    const before = Native.prototype.roundRect
    polyfillCanvas()
    expect(Native.prototype.roundRect).toBe(before)
  })
})

describe('recordVideo (real-time export, with a pretend MediaRecorder)', () => {
  const tpl = { size: [64, 64], fps: 30, duration: () => 1, draw: vi.fn(), fields: [] }

  function setup(supported) {
    class FakeRecorder {
      static isTypeSupported = (t) => supported.includes(t)
      constructor(stream, opts) { this.state = 'inactive'; this.mimeType = opts.mimeType || '' }
      start() { this.state = 'recording' }
      stop() { this.state = 'inactive'; this.ondataavailable({ data: new Blob(['abc']) }); this.onstop() }
    }
    globalThis.MediaRecorder = FakeRecorder
    HTMLCanvasElement.prototype.captureStream = () => ({ addTrack() {}, getTracks: () => [] })
    HTMLCanvasElement.prototype.getContext = () => new Proxy({}, { get: (t, k) => (k in t ? t[k] : () => {}), set: (t, k, v) => ((t[k] = v), true) })
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date', 'performance', 'requestAnimationFrame', 'cancelAnimationFrame'] })
  }
  afterEach(() => vi.useRealTimers())

  it('plays the template once and returns an mp4 when the browser records mp4 (Safari)', async () => {
    setup(['video/mp4;codecs=avc1.640028,mp4a.40.2'])
    const progress = []
    const p = recordVideo({ tpl, data: {}, sound: false, onProgress: (v) => progress.push(v), isCancelled: () => false })
    await vi.advanceTimersByTimeAsync(3000)
    const out = await p
    expect(out.ext).toBe('mp4')
    expect(out.blob.size).toBeGreaterThan(0)
    expect(out.audio).toBe(false)
    expect(progress.length).toBeGreaterThan(5)
    expect(progress[progress.length - 1]).toBeGreaterThan(0.95)
    expect(tpl.draw.mock.calls.length).toBeGreaterThan(5)
    expect(document.querySelectorAll('canvas')).toHaveLength(0) // helper canvas cleaned up
  })

  it('falls back to webm where mp4 recording is unavailable', async () => {
    setup(['video/webm'])
    const p = recordVideo({ tpl, data: {}, sound: false, onProgress() {}, isCancelled: () => false })
    await vi.advanceTimersByTimeAsync(3000)
    expect((await p).ext).toBe('webm')
  })

  it('stops cleanly when cancelled', async () => {
    setup(['video/mp4'])
    let cancel = false
    const p = recordVideo({ tpl, data: {}, sound: false, onProgress() {}, isCancelled: () => cancel })
    p.catch(() => {})
    await vi.advanceTimersByTimeAsync(200)
    cancel = true
    await vi.advanceTimersByTimeAsync(500)
    await expect(p).rejects.toThrow('cancelled')
    expect(document.querySelectorAll('canvas')).toHaveLength(0)
  })
})
