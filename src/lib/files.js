export function fileSlug(text) {
  return String(text || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'video'
}

export function download(blob, name) {
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = name
  a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 1000)
}

export const fmtClock = (s) => {
  s = Math.max(0, s)
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`
}

// YouTube Shorts / Reels: vertical, up to 3 minutes (60 s on some older surfaces).
export function shortsStatus(sec) {
  const s = Math.round(sec)
  if (s <= 60) return { level: 'ok', text: `Fits Shorts, Reels and Stories (9:16, ${s}s).` }
  if (s <= 180) return { level: 'warn', text: `${s}s works on current Shorts (up to 3 min); Stories and older apps cap at 60s.` }
  return { level: 'bad', text: `${s}s is too long for Shorts (3 min max).` }
}

// Long-form 16:9. There is no upper limit worth warning about, but a very short "long" video is
// usually a mistake, and YouTube only pays attention to watch time past a minute or so.
export function longStatus(sec) {
  const s = Math.round(sec)
  if (s < 60) return { level: 'warn', text: `${fmtClock(s)} is short for a 16:9 upload — under a minute, a vertical Short usually travels further.` }
  return { level: 'ok', text: `Long video, 16:9, ${fmtClock(s)}. Add chapters in the YouTube description if it runs long.` }
}

// The right advice for whichever shape this template makes.
export const sizeStatus = (tpl, sec) => (tpl && tpl.kind === 'long' ? longStatus(sec) : shortsStatus(sec))
