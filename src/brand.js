// Everything brand-specific lives here, so a rebrand never touches the templates.
export const BRAND = {
  name: 'Now Learning',
  studio: 'Now Learning Studio',
  tagline: 'Discover It. Learn It. Use It.',
  watermark: 'Now Learning',
  storeKey: 'nowlearning-studio-v1',
  fileApp: 'nowlearning-studio',
  // The IndexedDB store holding uploaded media. Renaming it orphans anything already uploaded.
  assetDb: 'nowlearning-studio',
}

// Base palette. Each series has its own colour template in lib/nl.js (THEMES).
export const COLORS = { navy: '#0B1220', mint: '#2EE6A6', yellow: '#FFD23F', white: '#F5F7FA', slate: '#8A94A6' }

const STACK = '"Space Grotesk", "Noto Sans Tamil", "Noto Sans Devanagari", system-ui, sans-serif'
export const FONTS = { display: STACK, body: STACK, fun: STACK, script: STACK, serif: STACK }

// Canvas text only uses a web font once it has been loaded.
export const FONT_LOADS = ['500 30px "Space Grotesk"', '700 30px "Space Grotesk"', '500 30px "Noto Sans Tamil"', '700 30px "Noto Sans Tamil"', '500 30px "Noto Sans Devanagari"', '700 30px "Noto Sans Devanagari"']
