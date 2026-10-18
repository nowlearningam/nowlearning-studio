import { ref } from 'vue'

// Uploaded photos, clips and music. Files live in IndexedDB (so a refresh keeps them) and in memory
// as decoded bitmaps / media elements. Project data only ever stores the short asset id.
export const assetTick = ref(0) // bumps whenever something finishes loading, so the stage repaints

const cache = new Map()
let dbp

const db = () =>
  (dbp ||= new Promise((resolve, reject) => {
    const r = indexedDB.open('cinephile-studio', 1)
    r.onupgradeneeded = () => r.result.createObjectStore('assets')
    r.onsuccess = () => resolve(r.result)
    r.onerror = () => reject(r.error)
  }))

async function tx(mode, fn) {
  const d = await db()
  return new Promise((resolve, reject) => {
    const t = d.transaction('assets', mode)
    const req = fn(t.objectStore('assets'))
    t.oncomplete = () => resolve(req && req.result)
    t.onerror = () => reject(t.error)
  })
}

const kindOf = (type) => (type.startsWith('image') ? 'image' : type.startsWith('video') ? 'video' : type.startsWith('audio') ? 'audio' : null)
const newId = () => 'a' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7)

const waitMeta = (el) =>
  new Promise((resolve) => {
    el.onloadedmetadata = resolve
    el.onerror = resolve
  })

async function materialize(id, blob, name) {
  const kind = kindOf(blob.type)
  const e = { id, kind, name, blob, url: URL.createObjectURL(blob) }
  if (kind === 'image') {
    let bmp = await createImageBitmap(blob)
    const m = Math.max(bmp.width, bmp.height)
    if (m > 2400) {
      // Large photos are shrunk to save memory (phones especially). Browsers that ignore resize options keep the original.
      try {
        const k = 2400 / m
        const small = await createImageBitmap(bmp, { resizeWidth: Math.round(bmp.width * k), resizeHeight: Math.round(bmp.height * k), resizeQuality: 'high' })
        if (small.width < bmp.width) {
          bmp.close()
          bmp = small
        }
      } catch {
        /* keep the full-size bitmap */
      }
    }
    e.bitmap = bmp
  } else if (kind === 'video') {
    const v = document.createElement('video')
    v.muted = true
    v.playsInline = true
    v.preload = 'auto'
    v.src = e.url
    await waitMeta(v)
    e.video = v
    e.duration = v.duration || 0
  } else if (kind === 'audio') {
    const a = new Audio()
    a.preload = 'auto'
    a.src = e.url
    await waitMeta(a)
    e.duration = a.duration || 0
  }
  cache.set(id, e)
  assetTick.value++
  return e
}

export async function addFile(file) {
  if (!kindOf(file.type)) throw new Error(`"${file.name}" is not an image, video or audio file.`)
  const id = newId()
  try {
    await tx('readwrite', (s) => s.put({ blob: file, name: file.name }, id))
  } catch {
    /* storage unavailable: the asset still works for this session */
  }
  await materialize(id, file, file.name)
  return id
}

export async function hydrate(ids) {
  for (const id of ids) {
    if (!id || cache.has(id)) continue
    try {
      const rec = await tx('readonly', (s) => s.get(id))
      if (rec) await materialize(id, rec.blob, rec.name)
    } catch {
      /* missing asset: the field simply shows empty */
    }
  }
}

// Removes stored files no project field points at any more.
export async function prune(used) {
  try {
    const keys = await tx('readonly', (s) => s.getAllKeys())
    for (const k of keys || []) if (!used.has(k)) await tx('readwrite', (s) => s.delete(k))
  } catch {
    /* best effort */
  }
}

export const getAsset = (id) => (id ? cache.get(id) || null : null)

// Black-and-white copy of an image, made once. (ctx.filter is not available in Safari, so the look is baked in.)
const grayCache = new Map()
function gray(id) {
  const bmp = cache.get(id)?.bitmap
  if (!bmp) return null
  let g = grayCache.get(id)
  if (!g) {
    g = document.createElement('canvas')
    g.width = bmp.width
    g.height = bmp.height
    const x = g.getContext('2d')
    x.drawImage(bmp, 0, 0)
    x.globalCompositeOperation = 'saturation'
    x.fillStyle = '#000'
    x.fillRect(0, 0, g.width, g.height)
    grayCache.set(id, g)
  }
  return g
}

// Drawing helpers the templates receive as `A`.
export const provider = {
  img: (id) => cache.get(id)?.bitmap || null,
  gray,
  video: (id) => cache.get(id)?.video || null,
}

// Seeks the videos a frame needs. With wait=true (export) it resolves once each frame is decoded.
export function prepareVideos(needs, wait = false) {
  const jobs = []
  for (const n of needs || []) {
    const v = cache.get(n.id)?.video
    if (!v) continue
    const dur = v.duration || 0
    const target = dur ? n.time % dur : n.time
    if (!wait) {
      if (Math.abs(v.currentTime - target) > 0.12) {
        v.addEventListener('seeked', () => assetTick.value++, { once: true })
        v.currentTime = target
      }
      continue
    }
    jobs.push(
      new Promise((resolve) => {
        if (Math.abs(v.currentTime - target) < 0.001 && v.readyState >= 2) return resolve()
        const done = () => {
          v.removeEventListener('seeked', done)
          clearTimeout(timer)
          resolve()
        }
        const timer = setTimeout(done, 2500)
        v.addEventListener('seeked', done)
        v.currentTime = target
      }),
    )
  }
  return Promise.all(jobs)
}

const toDataUrl = (blob) =>
  new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(r.result)
    r.onerror = () => reject(r.error)
    r.readAsDataURL(blob)
  })

// Project files embed their media so they can be moved between computers.
export async function exportAssets(ids) {
  const out = {}
  for (const id of ids) {
    const a = cache.get(id)
    if (a) out[id] = { name: a.name, type: a.blob.type, data: await toDataUrl(a.blob) }
  }
  return out
}

export async function importAssets(map) {
  for (const [id, a] of Object.entries(map || {})) {
    if (cache.has(id) || !a || typeof a.data !== 'string') continue
    const blob = await (await fetch(a.data)).blob()
    try {
      await tx('readwrite', (s) => s.put({ blob, name: a.name }, id))
    } catch {
      /* best effort */
    }
    await materialize(id, blob, a.name || id)
  }
}
