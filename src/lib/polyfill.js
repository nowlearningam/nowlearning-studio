// Fills in canvas features that older Safari / iOS lack, so templates can use them everywhere.
// Safe to call in any browser: each patch only applies when the feature is missing.
const COMPLEX = /[\u0600-\u06FF\u0900-\u0DFF\u0E00-\u0EFF]/ // scripts that must be shaped as a whole, never split per letter

export function polyfillCanvas() {
  const P = globalThis.CanvasRenderingContext2D && globalThis.CanvasRenderingContext2D.prototype
  if (!P) return

  // ctx.roundRect (Safari before 16).
  if (!P.roundRect) {
    P.roundRect = function (x, y, w, h, r = 0) {
      const a = (Array.isArray(r) ? r : [r]).map((v) => (typeof v === 'object' && v ? +v.x || 0 : +v || 0))
      let tl, tr, br, bl
      if (a.length === 1) tl = tr = br = bl = a[0]
      else if (a.length === 2) [tl, tr] = [a[0], a[1]], (br = a[0]), (bl = a[1])
      else if (a.length === 3) [tl, tr, br] = a, (bl = a[1])
      else [tl, tr, br, bl] = a
      if (w < 0) [x, w] = [x + w, -w]
      if (h < 0) [y, h] = [y + h, -h]
      const k = Math.min(1, w / Math.max(tl + tr, 1e-9), w / Math.max(bl + br, 1e-9), h / Math.max(tl + bl, 1e-9), h / Math.max(tr + br, 1e-9))
      ;[tl, tr, br, bl] = [tl * k, tr * k, br * k, bl * k]
      this.moveTo(x + tl, y)
      this.lineTo(x + w - tr, y)
      this.arcTo(x + w, y, x + w, y + tr, tr)
      this.lineTo(x + w, y + h - br)
      this.arcTo(x + w, y + h, x + w - br, y + h, br)
      this.lineTo(x + bl, y + h)
      this.arcTo(x, y + h, x, y + h - bl, bl)
      this.lineTo(x, y + tl)
      this.arcTo(x, y, x + tl, y, tl)
      this.closePath()
    }
  }

  // ctx.letterSpacing (Safari before 18.4): emulated by drawing letter by letter.
  if (!('letterSpacing' in P)) {
    const state = new WeakMap()
    const st = (c) => {
      let s = state.get(c)
      if (!s) state.set(c, (s = { ls: 0, stack: [] }))
      return s
    }
    const { save, restore, fillText, measureText } = P
    Object.defineProperty(P, 'letterSpacing', {
      configurable: true,
      get() {
        return st(this).ls + 'px'
      },
      set(v) {
        const n = parseFloat(v)
        if (Number.isFinite(n)) st(this).ls = n
      },
    })
    P.save = function () {
      const s = st(this)
      s.stack.push(s.ls)
      return save.call(this)
    }
    P.restore = function () {
      const s = st(this)
      if (s.stack.length) s.ls = s.stack.pop()
      return restore.call(this)
    }
    P.measureText = function (str) {
      const ls = st(this).ls
      const m = measureText.call(this, str)
      const s = String(str)
      if (!ls || s.length < 2 || COMPLEX.test(s)) return m
      return { width: m.width + ls * [...s].length }
    }
    P.fillText = function (str, x, y, maxWidth) {
      const s = String(str)
      const ls = st(this).ls
      if (!ls || s.length < 2 || COMPLEX.test(s)) return fillText.call(this, s, x, y, maxWidth)
      const chars = [...s]
      const widths = chars.map((c) => measureText.call(this, c).width + ls)
      const total = widths.reduce((p, q) => p + q, 0)
      const align = this.textAlign
      let sx = x
      if (align === 'center') sx = x - total / 2
      else if (align === 'right' || align === 'end') sx = x - total
      this.textAlign = 'left'
      chars.forEach((c, i) => {
        fillText.call(this, c, sx, y)
        sx += widths[i]
      })
      this.textAlign = align
    }
  }
}
