import { isHandheld } from './device.js'

// Handing a finished file to the user.
//
// A plain <a download> is right on a desktop, but on a phone it is unreliable: iOS Safari saves
// blobs to Files only sometimes, and Chrome and Brave on iOS (WebKit under the hood) often just
// open the blob instead. The system share sheet ("Save to Files", "Save Video") is the path that
// works on all three, so phones get that when the browser offers it.
//
// share() needs a fresh tap, so anything calling saveFile() must run straight from a click. A long
// render outlives the tap that started it, which is why a finished export waits behind a button
// instead of being pushed at the browser (see needsTapToSave).

const fileOf = (blob, name) => new File([blob], name, { type: blob.type || 'application/octet-stream' })

export function canShareFile(blob, name) {
  if (typeof navigator === 'undefined' || !navigator.share || !navigator.canShare || typeof File !== 'function') return false
  try {
    return navigator.canShare({ files: [fileOf(blob, name)] })
  } catch {
    return false
  }
}

// True when saving should wait for a tap instead of happening on its own: a share sheet cannot be
// opened from the end of a long render, because the tap that started it has long expired.
export const needsTapToSave = (blob, name) => isHandheld() && canShareFile(blob, name)

export function downloadFile(blob, name) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.target = '_self'
  a.rel = 'noopener'
  document.body.appendChild(a) // Safari ignores a click on an anchor that is not in the document
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 60000)
}

// Returns 'shared', 'cancelled' or 'downloaded'.
export async function saveFile(blob, name) {
  if (canShareFile(blob, name) && isHandheld()) {
    try {
      await navigator.share({ files: [fileOf(blob, name)], title: name })
      return 'shared'
    } catch (e) {
      if (e && e.name === 'AbortError') return 'cancelled'
      // Sharing was refused (no gesture left, or the browser changed its mind): fall back below.
    }
  }
  downloadFile(blob, name)
  return 'downloaded'
}
