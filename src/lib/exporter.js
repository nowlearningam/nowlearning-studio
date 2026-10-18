import { Muxer, ArrayBufferTarget } from 'mp4-muxer'
import { audioPlan } from '../templates/index.js'
import { getAsset, prepareVideos, provider } from './assets.js'

// Two ways to make the MP4, chosen by what the browser can do (never by browser name):
//  - "fast":   offline. Every frame is drawn by template.draw() and encoded with WebCodecs (H.264, plus AAC when
//              AudioEncoder exists). Chrome, Edge, Brave and Safari / iOS 26 or newer.
//  - "record": real time. The canvas is played once into MediaRecorder together with the mixed sound. Slower
//              (it takes as long as the video) but works on older iPhones, which have no audio encoder.
// iPhone Safari, Chrome and Brave all run on Apple's WebKit engine, so they share the same capabilities.
const SAMPLE_RATE = 48000
const TAIL = 0.5
const VIDEO_CODECS = ['avc1.640032', 'avc1.640028', 'avc1.4d0028', 'avc1.42002a']
const AUDIO_CODECS = [
  { codec: 'mp4a.40.2', mux: 'aac' },
  { codec: 'opus', mux: 'opus' },
]
const REC_TYPES = [
  'video/mp4;codecs=avc1.640028,mp4a.40.2',
  'video/mp4;codecs=avc1,mp4a.40.2',
  'video/mp4',
  'video/webm;codecs=vp9,opus',
  'video/webm;codecs=vp8,opus',
  'video/webm',
]
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

export function exportCaps() {
  const w = typeof window === 'undefined' ? {} : window
  const fast = !!(w.isSecureContext && w.VideoEncoder && w.VideoFrame && (w.OfflineAudioContext || w.webkitOfflineAudioContext))
  const fastAudio = !!(fast && w.AudioEncoder && w.AudioData)
  const rec = !!(w.MediaRecorder && typeof HTMLCanvasElement !== 'undefined' && HTMLCanvasElement.prototype.captureStream)
  return { secure: !!w.isSecureContext, fast, fastAudio, rec }
}

// Which method to use. `pref` is 'auto' | 'fast' | 'record' (the user's choice in the Export panel).
export function pickMethod(caps, wantsSound, pref = 'auto') {
  if (pref === 'fast' && caps.fast) return 'fast'
  if (pref === 'record' && caps.rec) return 'record'
  if (caps.fast && (!wantsSound || caps.fastAudio)) return 'fast'
  if (caps.rec) return 'record'
  return caps.fast ? 'fast' : '' // fast without audio encoding still produces a silent video
}

export function exportBlocker(caps = exportCaps()) {
  if (caps.fast || caps.rec) return ''
  if (!caps.secure) return 'Export needs a secure page (https:// or localhost). Open the deployed https address.'
  return 'This browser cannot create video. On iPhone, update iOS (Safari, Chrome and Brave all use the same engine); otherwise use Chrome, Edge or Safari on a computer.'
}
export const exportSupported = () => !exportBlocker()

// Keeps the phone awake while exporting. Best effort: not every browser has it.
export async function keepAwake() {
  try {
    const lock = await navigator.wakeLock?.request('screen')
    return () => lock?.release().catch(() => {})
  } catch {
    return () => {}
  }
}

async function pickVideoConfig(width, height, bitrate, fps) {
  for (const codec of VIDEO_CODECS) {
    const config = { codec, width, height, bitrate, framerate: fps, avc: { format: 'avc' } }
    const res = await VideoEncoder.isConfigSupported(config).catch(() => null)
    if (res && res.supported) return config
  }
  throw new Error('This browser cannot encode H.264 video.')
}

async function pickAudioConfig() {
  if (!window.AudioEncoder) return null
  for (const { codec, mux } of AUDIO_CODECS) {
    const config = { codec, sampleRate: SAMPLE_RATE, numberOfChannels: 2, bitrate: 128000 }
    const res = await AudioEncoder.isConfigSupported(config).catch(() => null)
    if (res && res.supported) return { config, mux }
  }
  return null
}

// Mixes music and clip sound into one buffer. Anything that cannot be decoded is skipped.
async function mixAudio(plan, seconds) {
  const Offline = window.OfflineAudioContext || window.webkitOfflineAudioContext
  const ctx = new Offline(2, Math.ceil(seconds * SAMPLE_RATE), SAMPLE_RATE)
  let used = 0
  for (const p of plan) {
    const a = getAsset(p.id)
    if (!a || !a.blob) continue
    let buf
    try {
      buf = await ctx.decodeAudioData(await a.blob.arrayBuffer())
    } catch {
      continue // e.g. a silent video has no audio track
    }
    const src = ctx.createBufferSource()
    src.buffer = buf
    src.loop = !!p.loop
    const gain = ctx.createGain()
    gain.gain.value = p.gain ?? 1
    if (p.fadeOut) {
      gain.gain.setValueAtTime(p.gain ?? 1, Math.max(0, p.start + p.dur - p.fadeOut))
      gain.gain.linearRampToValueAtTime(0, p.start + p.dur)
    }
    src.connect(gain)
    gain.connect(ctx.destination)
    const length = p.loop ? p.dur : Math.min(p.dur, buf.duration)
    src.start(p.start, p.offset || 0, length)
    used++
  }
  return used ? ctx.startRendering() : null
}

async function encodeAudio(buffer, config, muxer) {
  let failure = null
  const enc = new AudioEncoder({ output: (c, m) => muxer.addAudioChunk(c, m), error: (e) => (failure = e) })
  enc.configure(config)
  const left = buffer.getChannelData(0)
  const right = buffer.getChannelData(buffer.numberOfChannels > 1 ? 1 : 0)
  const step = 4800
  for (let off = 0; off < buffer.length; off += step) {
    const n = Math.min(step, buffer.length - off)
    const data = new Float32Array(n * 2)
    data.set(left.subarray(off, off + n), 0)
    data.set(right.subarray(off, off + n), n)
    const chunk = new AudioData({ format: 'f32-planar', sampleRate: SAMPLE_RATE, numberOfFrames: n, numberOfChannels: 2, timestamp: Math.round((off / SAMPLE_RATE) * 1e6), data })
    enc.encode(chunk)
    chunk.close()
  }
  await enc.flush()
  enc.close()
  if (failure) throw failure
}

async function paint(tpl, data, ctx, t) {
  const total = tpl.duration(data)
  const tt = Math.min(Math.max(t, 0), total - 0.001)
  if (tpl.video) await prepareVideos(tpl.video(data, tt), true)
  ctx.clearRect(0, 0, tpl.size[0], tpl.size[1])
  tpl.draw(ctx, tt, data, provider)
}

// One settled frame as a JPEG (used for covers/thumbnails).
export async function renderStill({ tpl, data, time, quality = 0.92 }) {
  const [w, h] = tpl.size
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  await paint(tpl, data, canvas.getContext('2d'), time)
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality))
  if (!blob) throw new Error('Could not save the image.')
  return blob
}

export async function renderVideo({ tpl, data, sound, bitrate = 10_000_000, onProgress, isCancelled }) {
  const [width, height] = tpl.size
  const fps = tpl.fps
  const total = tpl.duration(data)
  const seconds = total + TAIL
  const frames = Math.ceil(seconds * fps)
  const check = () => {
    if (isCancelled()) throw new Error('Export cancelled.')
  }

  const videoConfig = await pickVideoConfig(width, height, bitrate, fps)
  const audioCodec = sound && window.AudioEncoder ? await pickAudioConfig() : null
  let mixed = null
  if (audioCodec) {
    onProgress(0, 'Mixing sound')
    mixed = await mixAudio(audioPlan(tpl, data, total), seconds)
  }
  const audio = mixed ? audioCodec : null

  const muxer = new Muxer({
    target: new ArrayBufferTarget(),
    video: { codec: 'avc', width, height },
    audio: audio ? { codec: audio.mux, numberOfChannels: 2, sampleRate: SAMPLE_RATE } : undefined,
    fastStart: 'in-memory',
    firstTimestampBehavior: 'offset',
  })
  let failure = null
  const venc = new VideoEncoder({ output: (c, m) => muxer.addVideoChunk(c, m), error: (e) => (failure = e) })
  venc.configure(videoConfig)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  try {
    if (audio) await encodeAudio(mixed, audio.config, muxer)
    for (let i = 0; i < frames; i++) {
      check()
      if (failure) throw failure
      await paint(tpl, data, ctx, i / fps)
      const frame = new VideoFrame(canvas, { timestamp: Math.round((i * 1e6) / fps) })
      venc.encode(frame, { keyFrame: i % (fps * 2) === 0 })
      frame.close()
      while (venc.encodeQueueSize > 6) await sleep(4)
      if (i % 3 === 0) onProgress((i + 1) / frames, 'Rendering')
      if (i % 15 === 0) await sleep(0) // keep the page responsive (Esc to cancel)
    }
    check()
    await venc.flush()
    if (failure) throw failure
    muxer.finalize()
    return { blob: new Blob([muxer.target.buffer], { type: 'video/mp4' }), audio: !!audio, ext: 'mp4' }
  } finally {
    if (venc.state !== 'closed') venc.close()
  }
}

// Real-time export: plays the template once into MediaRecorder (canvas stream + mixed sound).
// Used on iPhones without AudioEncoder (before iOS 26) and as a fallback when fast export fails.
export async function recordVideo({ tpl, data, sound, bitrate = 8_000_000, onProgress, isCancelled }) {
  const [width, height] = tpl.size
  const fps = tpl.fps
  const total = tpl.duration(data)
  const seconds = total + 0.3
  const plan = sound ? audioPlan(tpl, data, total) : []

  // The audio context must be created straight from the user's tap, before any await.
  let ac = null
  let dest = null
  if (plan.length) {
    const AC = window.AudioContext || window.webkitAudioContext
    try {
      ac = AC ? new AC() : null
      dest = ac ? ac.createMediaStreamDestination() : null
    } catch {
      ac = null
    }
  }

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  canvas.style.cssText = 'position:fixed;left:0;top:0;width:2px;height:2px;opacity:.01;pointer-events:none;z-index:-1'
  document.body.appendChild(canvas)
  const ctx = canvas.getContext('2d')
  const stream = canvas.captureStream(fps)
  let interrupted = false
  const onHide = () => {
    if (document.hidden) interrupted = true
  }
  document.addEventListener('visibilitychange', onHide)
  let audioUsed = false
  const starters = []

  try {
    if (ac) {
      try {
        await ac.resume()
      } catch {
        /* handled below */
      }
      if (ac.state === 'running') {
        for (const p of plan) {
          const a = getAsset(p.id)
          if (!a || !a.blob) continue
          try {
            const buf = await ac.decodeAudioData(await a.blob.arrayBuffer())
            starters.push((at) => {
              const src = ac.createBufferSource()
              src.buffer = buf
              src.loop = !!p.loop
              const gain = ac.createGain()
              gain.gain.value = p.gain ?? 1
              if (p.fadeOut) {
                gain.gain.setValueAtTime(p.gain ?? 1, at + Math.max(0, p.start + p.dur - p.fadeOut))
                gain.gain.linearRampToValueAtTime(0, at + p.start + p.dur)
              }
              src.connect(gain)
              gain.connect(dest)
              src.start(at + p.start, p.offset || 0, p.loop ? p.dur : Math.min(p.dur, buf.duration))
            })
          } catch {
            /* no audio track, or unsupported: skip it */
          }
        }
        if (starters.length) {
          dest.stream.getAudioTracks().forEach((tr) => stream.addTrack(tr))
          audioUsed = true
        }
      }
    }

    const mimeType = REC_TYPES.find((m) => window.MediaRecorder.isTypeSupported && window.MediaRecorder.isTypeSupported(m)) || ''
    const rec = new MediaRecorder(stream, mimeType ? { mimeType, videoBitsPerSecond: bitrate } : { videoBitsPerSecond: bitrate })
    const chunks = []
    rec.ondataavailable = (e) => e.data && e.data.size && chunks.push(e.data)
    const stopped = new Promise((resolve, reject) => {
      rec.onstop = resolve
      rec.onerror = (e) => reject(e.error || new Error('Recording failed.'))
    })

    // Draw the first frame before recording starts so the video never opens on a blank frame.
    ctx.clearRect(0, 0, width, height)
    tpl.draw(ctx, 0, data, provider)
    rec.start(1000)
    const lead = 0.15
    const t0 = performance.now() + lead * 1000
    if (ac) starters.forEach((st) => st(ac.currentTime + lead))

    await new Promise((resolve) => {
      const frame = () => {
        if (isCancelled() || interrupted) return resolve()
        const t = (performance.now() - t0) / 1000
        const tt = Math.min(Math.max(t, 0), total - 0.001)
        if (tpl.video) prepareVideos(tpl.video(data, tt), false)
        ctx.setTransform(1, 0, 0, 1, 0, 0)
        ctx.globalAlpha = 1
        ctx.clearRect(0, 0, width, height)
        tpl.draw(ctx, tt, data, provider)
        onProgress(Math.min(1, Math.max(0, t / seconds)), 'Recording')
        if (t >= seconds) return resolve()
        requestAnimationFrame(frame)
      }
      requestAnimationFrame(frame)
    })

    if (rec.state !== 'inactive') rec.stop()
    await stopped
    if (isCancelled()) throw new Error('Export cancelled.')
    if (interrupted) throw new Error('Recording stopped because the page went to the background. Keep this screen open and try again.')
    const type = rec.mimeType || mimeType || 'video/mp4'
    return { blob: new Blob(chunks, { type }), audio: audioUsed, ext: /mp4/.test(type) ? 'mp4' : 'webm' }
  } finally {
    document.removeEventListener('visibilitychange', onHide)
    stream.getTracks().forEach((tr) => tr.stop())
    canvas.remove()
    if (ac && ac.state !== 'closed') ac.close().catch(() => {})
  }
}
