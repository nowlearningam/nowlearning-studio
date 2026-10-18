<script setup>
import { ref, reactive, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { BRAND, FONT_LOADS } from './brand.js'
import { TEMPLATES, getTemplate, normalizeData, collectIds, audioPlan } from './templates/index.js'
import { useClock, useMusicPreview } from './lib/useClock.js'
import { hydrate, prune, exportAssets, importAssets } from './lib/assets.js'
import { exportCaps, pickMethod, exportBlocker, renderVideo, recordVideo, renderStill, keepAwake } from './lib/exporter.js'
import { download, fileSlug, shortsStatus } from './lib/files.js'
import { IDEAS } from './lib/ideas.js'
import StageCanvas from './components/StageCanvas.vue'
import TransportBar from './components/TransportBar.vue'
import FieldEditor from './components/FieldEditor.vue'

const logo = import.meta.env.BASE_URL + 'logo.svg'
const caps = exportCaps()
const canExport = caps.fast || caps.rec
const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
const clone = (o) => JSON.parse(JSON.stringify(o))

const project = reactive({ template: TEMPLATES[0].key, data: Object.fromEntries(TEMPLATES.map((t) => [t.key, t.defaults()])) })
const ui = reactive({ tab: 'edit', safe: false, sound: true, method: 'auto' })
const ready = ref(null) // { blob, name } of the last finished file, so it can be shared or saved again
const message = reactive({ text: '', err: false })
const notify = (text, err = false) => Object.assign(message, { text, err })
const fontsReady = ref(false)
const exporting = ref(false)
const renderInfo = reactive({ p: 0, text: '' })
let cancelled = false

// Restore the last session. Uploaded media is restored separately from IndexedDB (see onMounted).
try {
  const s = JSON.parse(localStorage.getItem(BRAND.storeKey) || 'null')
  if (s) {
    for (const t of TEMPLATES) if (s.data && s.data[t.key]) project.data[t.key] = normalizeData(t, s.data[t.key])
    if (TEMPLATES.some((t) => t.key === s.template)) project.template = s.template
    if (typeof s.sound === 'boolean') ui.sound = s.sound
  }
} catch {
  /* ignore corrupt or unavailable storage */
}

const tpl = computed(() => getTemplate(project.template))
const data = computed(() => project.data[project.template])
const total = computed(() => tpl.value.duration(data.value))
const clock = useClock(() => total.value)
useMusicPreview(() => data.value.audio, () => data.value.musicVol, clock.playing, clock.t, computed(() => ui.sound))

const groups = computed(() => {
  const out = []
  for (const f of tpl.value.fields) {
    let g = out.find((x) => x.name === f.group)
    if (!g) out.push((g = { name: f.group, fields: [] }))
    g.fields.push(f)
  }
  return out
})
const status = computed(() => shortsStatus(total.value))
const wantsSound = computed(() => ui.sound && audioPlan(tpl.value, data.value, total.value).length > 0)
const method = computed(() => pickMethod(caps, wantsSound.value, ui.method))
const methodText = computed(() => {
  if (method.value === 'fast') return caps.fastAudio || !wantsSound.value ? 'Fast export: renders offline, usually quicker than real time.' : 'Fast export without sound: this browser cannot encode audio offline.'
  if (method.value === 'record') return 'Real-time recording: takes as long as the video. Keep this screen on, stay on this page, and do not switch apps.'
  return ''
})

// Editing pauses but keeps the frame on screen, so you see what you are changing.
watch(data, () => clock.pause(), { deep: true })
watch(total, (v) => {
  if (clock.t.value >= v) clock.t.value = Math.max(0, v - 0.001)
})

let saveTimer
watch(
  [project, () => ui.sound],
  () => {
    clearTimeout(saveTimer)
    saveTimer = setTimeout(() => {
      try {
        localStorage.setItem(BRAND.storeKey, JSON.stringify({ template: project.template, sound: ui.sound, data: project.data }))
      } catch {
        /* storage full or blocked: autosave is best-effort */
      }
    }, 400)
  },
  { deep: true },
)

const ideaGroups = ['Apps', 'AI', 'Tricks', 'Websites'].map((name) => ({ name, items: IDEAS.filter((i) => i.series === name) }))
function loadIdea(id) {
  const i = IDEAS.find((x) => x.id === +id)
  if (!i) return
  const d = getTemplate(i.template).defaults()
  Object.assign(d, { theme: i.series, app: i.app, hook: i.hook, useFor: i.useFor, cost: i.cost })
  project.data[i.template] = d
  project.template = i.template
  clock.seekTime(0)
  notify(`Idea ${i.id} loaded. Add the steps and screenshots, then check the tool before filming.`)
}

function setTemplate(key) {
  if (exporting.value || key === project.template) return
  clock.seekTime(0)
  project.template = key
  notify('')
}

const cancelExport = () => {
  cancelled = true
}

// Phones block automatic downloads once the long render has finished, so the result is always offered with
// buttons (Share / Save, Download). On computers it also downloads straight away.
function deliver(blob, name) {
  ready.value = { blob, name }
  if (!isMobile) download(blob, name)
}
async function shareReady() {
  const r = ready.value
  if (!r) return
  const file = new File([r.blob], r.name, { type: r.blob.type })
  try {
    if (navigator.canShare && navigator.canShare({ files: [file] })) await navigator.share({ files: [file], title: r.name })
    else download(r.blob, r.name)
  } catch (e) {
    if (e.name !== 'AbortError') notify('Could not open the share sheet. Use Download instead.', true)
  }
}
const downloadReady = () => ready.value && download(ready.value.blob, ready.value.name)

async function exportVideo() {
  if (exporting.value) return
  if (!canExport) return notify(exportBlocker(caps), true)
  cancelled = false
  clock.pause()
  ui.tab = 'view'
  ready.value = null
  exporting.value = true
  renderInfo.p = 0
  renderInfo.text = 'Preparing…'
  notify(renderInfo.text)
  const started = performance.now()
  const t = tpl.value
  const d = clone(data.value)
  const total = t.duration(d)
  const wanted = ui.sound && audioPlan(t, d, total).length > 0
  let used = method.value
  const onProgress = (p, phase) => {
    renderInfo.p = p
    if (phase === 'Recording') {
      renderInfo.text = `Recording ${Math.min(total, Math.round(p * (total + 0.3)))} of ${Math.round(total)} s · keep this screen on`
    } else {
      const left = p > 0.03 ? Math.ceil(((performance.now() - started) * (1 - p)) / p / 1000) : 0
      renderInfo.text = phase === 'Rendering' ? `Rendering ${Math.round(p * 100)}%` + (left ? ` · about ${left >= 60 ? Math.ceil(left / 60) + ' min' : left + ' s'} left` : '') : phase + '…'
    }
    notify(renderInfo.text)
  }
  const args = { tpl: t, data: d, sound: ui.sound, isCancelled: () => cancelled, onProgress }
  const release = await keepAwake()
  try {
    let out
    try {
      out = used === 'record' ? await recordVideo(args) : await renderVideo(args)
    } catch (e) {
      // If fast export fails on this device, fall back to real-time recording.
      if (used === 'fast' && !cancelled && caps.rec && ui.method === 'auto') {
        notify('Fast export is not working on this device. Recording in real time instead…')
        used = 'record'
        renderInfo.p = 0
        out = await recordVideo(args)
      } else throw e
    }
    const name = `cinephile-${t.key}-${fileSlug(t.fileName(d))}.${out.ext}`
    deliver(out.blob, name)
    const note = !ui.sound ? 'Sound was off, so the video is silent.' : wanted && !out.audio ? 'Sound could not be added on this device, so the video is silent.' : ''
    notify(`Ready: ${name} (${t.size[0]}×${t.size[1]}). ${note}`.trim(), !!note)
  } catch (e) {
    notify(cancelled ? 'Export cancelled.' : e.message || 'Export failed.', true)
  } finally {
    release()
    exporting.value = false
  }
}

async function downloadCover() {
  if (exporting.value) return
  const t = tpl.value
  const d = clone(data.value)
  try {
    const blob = await renderStill({ tpl: t, data: d, time: t.thumbTime(d) })
    const name = `cinephile-${t.key}-cover-${fileSlug(t.fileName(d))}.jpg`
    deliver(blob, name)
    notify(`Cover ready: ${name} (${t.size[0]}×${t.size[1]}).`)
  } catch (e) {
    notify(e.message || 'Could not save the cover.', true)
  }
}

async function save() {
  const t = tpl.value
  const d = clone(data.value)
  notify('Saving…')
  const assets = await exportAssets(collectIds(t, d))
  const name = `cinephile-${t.key}-${fileSlug(t.fileName(d))}.json`
  deliver(new Blob([JSON.stringify({ app: BRAND.fileApp, version: 1, template: t.key, data: d, assets })], { type: 'application/json' }), name)
  notify('Project ready: ' + name + ' (photos and clips are included).')
}

function loadFile(file) {
  if (!file) return
  const r = new FileReader()
  r.onload = async () => {
    let o
    try {
      o = JSON.parse(r.result)
    } catch (x) {
      return notify('Invalid JSON: ' + x.message, true)
    }
    if (!o || o.app !== BRAND.fileApp || !TEMPLATES.some((t) => t.key === o.template) || typeof o.data !== 'object') {
      return notify('This is not a Cinephile Studio project file.', true)
    }
    try {
      await importAssets(o.assets)
    } catch {
      notify('Loaded, but some media could not be restored.', true)
    }
    project.data[o.template] = normalizeData(getTemplate(o.template), o.data)
    project.template = o.template
    clock.seekTime(0)
    notify('Loaded ' + file.name)
  }
  r.onerror = () => notify('Could not read the file.', true)
  r.readAsText(file)
}

function resetTemplate() {
  if (!window.confirm(`Reset "${tpl.value.label}" to its defaults? Your text and media choices for it will be cleared.`)) return
  project.data[project.template] = tpl.value.defaults()
  clock.seekTime(0)
  notify('Template reset.')
}

const setTab = (tab) => {
  if (tab === 'edit') clock.pause()
  ui.tab = tab
}

function onKey(e) {
  if (e.key === 'Escape') {
    if (exporting.value) cancelled = true
    return
  }
  if (exporting.value) return
  if (['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON', 'SUMMARY'].includes(e.target.tagName)) return
  if (e.code === 'Space') {
    e.preventDefault()
    clock.toggle()
  } else if (e.key === 'r' || e.key === 'R') clock.play(0)
}

onMounted(async () => {
  document.addEventListener('keydown', onKey)
  Promise.all(FONT_LOADS.map((f) => document.fonts.load(f, 'AaĀāÉéŠšŁłअ').catch(() => null))).finally(() => (fontsReady.value = true))
  const ids = new Set()
  for (const t of TEMPLATES) collectIds(t, project.data[t.key]).forEach((i) => ids.add(i))
  await hydrate([...ids])
  prune(ids)
})
onBeforeUnmount(() => document.removeEventListener('keydown', onKey))
</script>

<template>
  <div class="app" :data-tab="ui.tab" :class="{ exporting }">
    <aside class="panel" aria-label="Editor" :inert="exporting">
      <div class="phead">
        <img :src="logo" alt="Now Learning logo">
        <div>
          <h1>{{ BRAND.name }}</h1>
          <div class="tag">Studio · {{ BRAND.tagline }}</div>
        </div>
      </div>

      <div class="tpls" role="tablist" aria-label="Video template">
        <button v-for="t in TEMPLATES" :key="t.key" role="tab" :aria-selected="t.key === project.template" :class="{ on: t.key === project.template }" @click="setTemplate(t.key)">
          <span class="em">{{ t.emoji }}</span>{{ t.short }}
        </button>
      </div>
      <label class="ideas"><span>Start from one of 30 ideas</span>
        <select aria-label="Start from an idea" @change="loadIdea($event.target.value); $event.target.value = ''">
          <option value="">Choose an idea…</option>
          <optgroup v-for="g in ideaGroups" :key="g.name" :label="g.name"><option v-for="i in g.items" :key="i.id" :value="i.id">{{ i.id }}. {{ i.hook }}</option></optgroup>
        </select>
      </label>
      <div class="tname">{{ tpl.label }} <span>{{ tpl.size[0] }}×{{ tpl.size[1] }} · {{ tpl.fps }} fps</span></div>

      <div class="pbody">
        <details v-for="g in groups" :key="project.template + g.name" :open="g.name === 'Content' || g.name === 'Photo position'">
          <summary>{{ g.name }}</summary>
          <FieldEditor v-for="f in g.fields" :key="f.key" :field="f" :obj="data" @notify="notify" @seek="clock.seekTime" />
        </details>

        <details open>
          <summary>Export</summary>
          <p class="note" :class="status.level">{{ status.text }}</p>
          <button class="primary wide" :disabled="exporting || !canExport" @click="exportVideo">Export {{ tpl.size[0] }}×{{ tpl.size[1] }} video</button>
          <button class="wide" :disabled="exporting" @click="downloadCover">Save cover image (JPG)</button>
          <p v-if="canExport" class="help">{{ methodText }}</p>
          <template v-if="caps.fast && caps.rec">
            <label for="method">Export method</label>
            <select id="method" v-model="ui.method">
              <option value="auto">Automatic (recommended)</option>
              <option value="fast">Fast (offline)</option>
              <option value="record">Real-time recording</option>
            </select>
          </template>
          <p v-if="!canExport" class="note warn">{{ exportBlocker(caps) }}</p>
          <p class="help">Clip sound and music are mixed into the exported file. The preview plays the music track only.</p>
        </details>

        <details>
          <summary>View &amp; file</summary>
          <label class="chk"><input type="checkbox" v-model="ui.safe"> Show platform safe area</label>
          <label class="chk"><input type="checkbox" v-model="ui.sound"> Sound on (preview and export)</label>
          <div class="btnrow">
            <button @click="save">Save project</button>
            <label class="btn">Load project<input type="file" accept="application/json,.json" hidden @change="loadFile($event.target.files[0]); $event.target.value = ''"></label>
            <button class="danger" @click="resetTemplate">Reset template</button>
          </div>
          <p class="help">Space plays or pauses, R restarts, Esc cancels an export.</p>
        </details>
      </div>

      <div class="pfoot"><div class="msg" :class="{ err: message.err }" role="status" aria-live="polite">{{ message.text }}</div></div>
    </aside>

    <main class="view">
      <StageCanvas :tpl="tpl" :data="data" :t="clock.t.value" :playing="clock.playing.value" :ready="fontsReady" :safe="ui.safe" />
      <TransportBar
        :playing="clock.playing.value"
        :t="clock.t.value"
        :total="total"
        :can-export="canExport"
        :exporting="exporting"
        @toggle="clock.toggle"
        @restart="clock.play(0)"
        @seek="clock.seek"
        @export="exportVideo"
      />
      <div v-if="ready && !exporting" class="ready" role="status">
        <span class="rname">{{ ready.name }}</span>
        <button class="primary" @click="shareReady">Share / Save</button>
        <button @click="downloadReady">Download</button>
        <button class="mini" aria-label="Dismiss" @click="ready = null">✕</button>
      </div>
      <div v-if="exporting" class="render" role="status">
        <div class="render-bar"><i :style="{ width: renderInfo.p * 100 + '%' }"></i></div>
        <span>{{ renderInfo.text }}</span>
        <button @click="cancelExport">Cancel</button>
      </div>
    </main>

    <nav class="tabs" role="tablist" aria-label="Studio view">
      <button role="tab" :aria-selected="ui.tab === 'edit'" @click="setTab('edit')">Edit</button>
      <button role="tab" :aria-selected="ui.tab === 'view'" @click="setTab('view')">Preview</button>
    </nav>
  </div>
</template>
