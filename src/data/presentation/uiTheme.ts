export const UI_THEME = {
  spacing: 8,
  safeMargin: 24,
  fontSizes: { compact: 14, body: 18, heading: 26, title: 52 },
  panelPadding: { x: 12, y: 8 },
  borderRadius: 6,
  iconSizes: { small: 22, regular: 30, large: 44 },
  panelOpacity: 0.9,
  colors: {
    ink: '#111827', paper: '#f8fafc', accent: '#f6bd60', danger: '#dc2626', safe: '#16a34a', panel: '#1f2937'
  },
  zIndexGroups: { world: 0, feedback: 800, hud: 1000, modal: 1200 }
} as const;
