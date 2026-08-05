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
  wide: 1120,
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

  const gutter = isCompact ? 16 : isTablet ? 28 : 40;
  const maxWidth = isDesktop ? CONTENT_WIDTH.wide : isTablet ? CONTENT_WIDTH.app : CONTENT_WIDTH.app;
  const formWidth = isCompact ? CONTENT_WIDTH.narrow : CONTENT_WIDTH.form;
  const columns = isWide ? 2 : 1;
  const sidebarWidth = isDesktop ? 232 : 200;

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
