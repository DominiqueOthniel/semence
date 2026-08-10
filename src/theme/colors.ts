export const colors = {
  ground: '#F1EEE6',
  groundDeep: '#E4EDE3',
  surface: '#FFFEFA',
  surfaceSoft: '#F3F6F1',
  panel: '#163529',
  panelDeep: '#0F241C',
  panelSoft: '#1F4336',
  ink: '#15201C',
  ink2: '#45554D',
  ink3: '#74847B',
  inkOnDark: 'rgba(255,255,255,0.74)',
  rule: '#E2E8E1',
  ruleFort: '#C5D2C4',
  ruleOnDark: 'rgba(255,255,255,0.12)',
  goldLine: 'rgba(196,137,42,0.38)',
  or: '#2A6349',
  orVif: '#3A8160',
  orWash: '#E2EDE6',
  ambre: '#B88228',
  ambreVif: '#C9922C',
  ambreWash: '#F7EEDC',
  vert: '#2A6349',
  vertWash: '#E2EDE6',
  rouge: '#B5453A',
  rougeWash: '#F6E2DF',
  white: '#FFFFFF',
  overlay: 'rgba(21, 32, 28, 0.04)',
  avatarA: '#2A6349',
  avatarB: '#B88228',
  avatarC: '#3D6B8A',
  avatarD: '#8A5A3D',
  avatarE: '#6B4F8A',
  chartRevenu: '#2A6349',
  chartDepense: '#C9922C',
} as const;

/** Ombres douces pour une surface premium, sans lourdeur. */
export const elev = {
  soft: {
    shadowColor: '#0F241C',
    shadowOpacity: 0.06,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
  card: {
    shadowColor: '#0F241C',
    shadowOpacity: 0.08,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 4,
  },
  float: {
    shadowColor: '#0F241C',
    shadowOpacity: 0.12,
    shadowRadius: 32,
    shadowOffset: { width: 0, height: 16 },
    elevation: 6,
  },
} as const;

export const space = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radius = {
  sm: 12,
  md: 18,
  lg: 24,
  xl: 30,
  full: 999,
} as const;

export const fonts = {
  display: 'Fraunces_600SemiBold',
  displayItalic: 'Fraunces_500Medium_Italic',
  displayBold: 'Fraunces_700Bold',
  corps: 'Nunito_400Regular',
  corpsMed: 'Nunito_500Medium',
  corpsSemi: 'Nunito_600SemiBold',
  corpsBold: 'Nunito_700Bold',
  chiffre: 'Nunito_600SemiBold',
  chiffreMed: 'Nunito_700Bold',
} as const;

export const avatarPalette = [
  colors.avatarA,
  colors.avatarB,
  colors.avatarC,
  colors.avatarD,
  colors.avatarE,
] as const;

export function avatarColor(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h + seed.charCodeAt(i) * (i + 1)) % 997;
  return avatarPalette[h % avatarPalette.length];
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'S';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}
