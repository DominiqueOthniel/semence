export const colors = {
  ground: '#F4F1EA',
  groundDeep: '#E7EFE4',
  surface: '#FFFFFF',
  surfaceSoft: '#F0F5EE',
  panel: '#1B3D2F',
  panelDeep: '#142E24',
  panelSoft: '#244A3A',
  ink: '#1A2420',
  ink2: '#4A5850',
  ink3: '#7A8A80',
  inkOnDark: 'rgba(255,255,255,0.72)',
  rule: '#E4EBE3',
  ruleFort: '#C9D6C8',
  ruleOnDark: 'rgba(255,255,255,0.12)',
  or: '#2F6B4F',
  orVif: '#3F8A64',
  orWash: '#DDECE4',
  ambre: '#C4892A',
  ambreVif: '#D4922E',
  ambreWash: '#F6EBD4',
  vert: '#2F6B4F',
  vertWash: '#DDECE4',
  rouge: '#B5453A',
  rougeWash: '#F6E2DF',
  white: '#FFFFFF',
  overlay: 'rgba(26, 36, 32, 0.05)',
  avatarA: '#2F6B4F',
  avatarB: '#C4892A',
  avatarC: '#3D6B8A',
  avatarD: '#8A5A3D',
  avatarE: '#6B4F8A',
  chartRevenu: '#2F6B4F',
  chartDepense: '#D4922E',
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
  sm: 10,
  md: 16,
  lg: 22,
  xl: 28,
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
