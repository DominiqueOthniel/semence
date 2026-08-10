import { useWindowDimensions } from 'react-native';

export const BREAKPOINTS = {
  phone: 0,
  /** Au-delà : layout « large » (tablette paysage / desktop). */
  wide: 768,
  desktop: 1024,
} as const;

/** Largeurs de lecture HCI : colonne téléphone, tableau, bureau. */
export const CONTENT_WIDTH = {
  narrow: 400,
  form: 480,
  app: 720,
  wide: 1320,
} as const;

/** Cible tactile minimale (Apple HIG / Material ≈ 44–48). */
export const TOUCH = 48;

export function useLayout() {
  const { width, height } = useWindowDimensions();
  const isPhone = width < BREAKPOINTS.wide;
  const isTablet = width >= BREAKPOINTS.wide && width < BREAKPOINTS.desktop;
  const isDesktop = width >= BREAKPOINTS.desktop;
  /** Layout mobile dédié (colonne unique, tab bar bas). */
  const isCompact = isPhone;
  /** Layout large dédié (split, sidebar, densités bureau). */
  const isWide = !isPhone;
  const isLandscape = width > height;

  const gutter = isCompact ? 16 : isTablet ? 24 : 32;
  const maxWidth = isDesktop ? CONTENT_WIDTH.wide : isTablet ? 960 : CONTENT_WIDTH.app;
  const formWidth = isCompact ? CONTENT_WIDTH.narrow : CONTENT_WIDTH.form;
  /** Colonnes de contenu utile (hors sidebar). */
  const columns = isCompact ? 1 : isDesktop ? 3 : 2;
  const sidebarWidth = isDesktop ? 248 : 212;

  return {
    width,
    height,
    isPhone,
    isTablet,
    isDesktop,
    isCompact,
    isWide,
    isLandscape,
    gutter,
    maxWidth,
    formWidth,
    columns,
    sidebarWidth,
  };
}
