<script setup>
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import { assetTick, provider, prepareVideos } from '../lib/assets.js'

const props = defineProps({
  tpl: { type: Object, required: true },
  data: { type: Object, required: true },
  t: { type: Number, default: 0 },
  ready: Boolean,
  safe: Boolean,
  playing: Boolean,
})

const box = ref(null)
const cv = ref(null)
const scale = ref(0.3)
let ro

function fit() {
  const el = box.value
  if (!el) return
  const [W, H] = props.tpl.size
  scale.value = Math.max(0.05, Math.min((el.clientWidth - 24) / W, (el.clientHeight - 24) / H))
}

// Where the platform's own UI covers the frame. A template can override this with `safe`.
// Vertical (Shorts/Reels/Stories): the top 250 px and bottom 420 px are covered by captions,
// the handle and the action rail. Horizontal (YouTube long-form): a 16:9 title-safe inset, which
// clears the title bar, the progress bar and end cards on every surface.
function safeBox(tpl) {
  const [W, H] = tpl.size
  if (tpl.safe) return tpl.safe
  if (W > H) return { x: 96, y: 60, w: W - 192, h: H - 120 }
  return { x: 64, y: 250, w: W - 128, h: H - 250 - 420 }
}

function paint() {
  const c = cv.value
  if (!c) return
  const [W, H] = props.tpl.size
  const ctx = c.getContext('2d')
  const total = props.tpl.duration(props.data)
  const t = Math.min(Math.max(props.t, 0), total - 0.001)
  if (props.tpl.video) prepareVideos(props.tpl.video(props.data, t), false)
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.globalAlpha = 1
  ctx.clearRect(0, 0, W, H)
  try {
    props.tpl.draw(ctx, t, props.data, provider)
  } catch (e) {
    console.error(e)
  }
  if (props.safe) {
    const s = safeBox(props.tpl)
    ctx.save()
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.strokeStyle = 'rgba(255,0,60,.85)'
    ctx.lineWidth = 3
    ctx.setLineDash([16, 12])
    ctx.strokeRect(s.x, s.y, s.w, s.h)
    ctx.restore()
  }
}

onMounted(() => {
  ro = new ResizeObserver(fit)
  ro.observe(box.value)
  fit()
  paint()
})
onBeforeUnmount(() => ro && ro.disconnect())
watch(() => props.tpl, () => { fit(); paint() }, { flush: 'post' })
// While playing, paint at most ~30 times a second: plenty for the preview and kinder to phones.
let last = 0
watch(() => props.t, () => {
  if (!props.playing) return paint()
  const now = performance.now()
  if (now - last >= 30) {
    last = now
    paint()
  }
}, { flush: 'post' })
watch(() => [props.playing, props.ready, props.safe, assetTick.value], paint, { flush: 'post' })
watch(() => props.data, paint, { deep: true, flush: 'post' })
</script>

<template>
  <div ref="box" class="stagebox">
    <canvas
      ref="cv"
      class="stage"
      :width="tpl.size[0]"
      :height="tpl.size[1]"
      :style="{ width: tpl.size[0] * scale + 'px', height: tpl.size[1] * scale + 'px' }"
    ></canvas>
  </div>
</template>
