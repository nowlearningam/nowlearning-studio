import { ref, watch } from 'vue'
import { assetTick, getAsset } from './assets.js'

// One playback clock for every template. `t` (seconds) is the single source of truth; the stage
// is simply drawn at t, so seeking, playing and exporting always agree.
export function useClock(getTotal) {
  const t = ref(0)
  const playing = ref(false)
  let raf = 0
  let base = 0
  let t0 = 0

  function tick() {
    if (!playing.value) return
    t.value = base + (performance.now() - t0) / 1000
    if (t.value >= getTotal()) {
      t.value = getTotal() - 0.001
      stop()
      return
    }
    raf = requestAnimationFrame(tick)
  }
  function stop() {
    playing.value = false
    cancelAnimationFrame(raf)
  }
  function start() {
    base = t.value
    t0 = performance.now()
    playing.value = true
    raf = requestAnimationFrame(tick)
  }
  const play = (from = 0) => {
    stop()
    t.value = from
    start()
  }
  const toggle = () => {
    if (playing.value) stop()
    else if (t.value >= getTotal() - 0.05) play(0)
    else start()
  }
  const seek = (fraction) => {
    stop()
    t.value = fraction * getTotal()
  }
  const seekTime = (s) => {
    stop()
    t.value = Math.max(0, s)
  }
  return { t, playing, play, toggle, pause: stop, seek, seekTime }
}

// Plays the chosen music file alongside the preview clock (export mixes it separately).
export function useMusicPreview(getId, getVolume, playing, t, enabled) {
  let el = null
  let cur = ''
  const sync = () => {
    const id = getId()
    if (id === cur) return
    cur = id
    if (el) el.pause()
    el = null
    const a = getAsset(id)
    if (a && a.kind === 'audio') el = new Audio(a.url)
  }
  watch([playing, enabled, assetTick, getId], () => {
    sync()
    if (!el) return
    if (playing.value && enabled.value) {
      el.volume = Math.min(1, Math.max(0, +getVolume() || 0))
      el.currentTime = Math.min(t.value, el.duration || t.value)
      el.play().catch(() => {})
    } else el.pause()
  })
}
