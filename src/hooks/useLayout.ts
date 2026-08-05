import { useWindowDimensions } from 'react-native';

export const BREAKPOINTS = {
  phone: 0,
  tablet: 720,
  desktop: 1024,
} as const;

/** Largeurs de lecture HCI : colonne téléphone, tableau, bureau. */
export const CONTENT_WIDTH = {
  narrow: 440,
  form: 520,
  app: 720,
  wide: 1080,
} as const;

/** Cible tactile minimale (Apple HIG / Material ≈ 44–48). */
export const TOUCH = 48;

export function useLayout() {
  const { width, height } = useWindowDimensions();
  const isPhone = width < BREAKPOINTS.tablet;
  const isTablet = width >= BREAKPOINTS.tablet && width < BREAKPOINTS.desktop;
  const isDesktop = width >= BREAKPOINTS.desktop;
  const isLandscape = width > height;

  const gutter = isPhone ? 16 : isTablet ? 28 : 40;
  const maxWidth = isDesktop ? CONTENT_WIDTH.wide : isTablet ? CONTENT_WIDTH.app : CONTENT_WIDTH.app;
  const formWidth = isPhone ? CONTENT_WIDTH.narrow : CONTENT_WIDTH.form;
  const columns = isDesktop ? 2 : 1;

  return {
    width,
    height,
    isPhone,
    isTablet,
    isDesktop,
    isLandscape,
    gutter,
    maxWidth,
    formWidth,
    columns,
  };
}
