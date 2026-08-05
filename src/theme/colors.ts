export const colors = {
  ground: '#F3EBDD',
  groundDeep: '#E8DCC8',
  surface: '#FCFAF5',
  surfaceSoft: '#F7F1E5',
  ink: '#1C1914',
  ink2: '#5A5246',
  ink3: '#8A8070',
  rule: '#E2D7C4',
  ruleFort: '#C9BBA3',
  or: '#8A5F12',
  orVif: '#B58524',
  orWash: '#F0E4C6',
  vert: '#456534',
  vertWash: '#E3EBDA',
  rouge: '#8F3428',
  rougeWash: '#F0E0DB',
  white: '#FFFFFF',
  overlay: 'rgba(28, 25, 20, 0.04)',
} as const;

export const space = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const fonts = {
  display: 'LibreBaskerville_400Regular',
  displayItalic: 'LibreBaskerville_400Regular_Italic',
  displayBold: 'LibreBaskerville_700Bold',
  corps: 'SourceSans3_400Regular',
  corpsMed: 'SourceSans3_500Medium',
  corpsSemi: 'SourceSans3_600SemiBold',
  chiffre: 'IBMPlexMono_400Regular',
  chiffreMed: 'IBMPlexMono_500Medium',
} as const;

/** Fallbacks if Google fonts fail to load (offline / web). */
export const fontsFallback = {
  display: 'Georgia',
  displayItalic: 'Georgia',
  displayBold: 'Georgia',
  corps: 'system-ui',
  corpsMed: 'system-ui',
  corpsSemi: 'system-ui',
  chiffre: 'ui-monospace, monospace',
  chiffreMed: 'ui-monospace, monospace',
} as const;
