// Phone/tablet detection. Only ever used to pick lighter defaults or a friendlier way to hand
// over a file — never to decide whether a feature is available. That is always feature detection,
// because the same browser engine ships on very different devices.
export function isHandheld() {
  if (typeof navigator === 'undefined') return false
  if (/Android|iPhone|iPad|iPod/.test(navigator.userAgent)) return true
  // iPadOS reports itself as a Mac; a desktop Mac has no touch screen.
  return navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1
}
