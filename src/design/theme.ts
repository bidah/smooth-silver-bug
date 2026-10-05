import type { TextStyle } from 'react-native';

/** Accent palette the user can pick from. Each has a deeper shade for gradients. */
export const accents = {
  indigo: { base: '#5E5CE6', deep: '#3634A3' },
  blue: { base: '#0A84FF', deep: '#0050B5' },
  teal: { base: '#14B8A6', deep: '#0B7A6E' },
  green: { base: '#30B85C', deep: '#1D7A3A' },
  orange: { base: '#FF8A00', deep: '#C25400' },
  pink: { base: '#FF2D78', deep: '#B0104A' },
  purple: { base: '#AF52DE', deep: '#6E2B91' },
} as const;
export type AccentKey = keyof typeof accents;

const light = {
  bg: '#F2F2F7',
  surface: '#FFFFFF',
  surfaceAlt: '#E9E9EE',
  elevated: '#FFFFFF',
  text: '#0B0B0F',
  textSecondary: '#6C6C74',
  textTertiary: '#AEAEB4',
  separator: 'rgba(60,60,67,0.13)',
  danger: '#FF3B30',
  warning: '#FF9500',
  success: '#34C759',
  shadow: '#1A1A40',
};

const dark: typeof light = {
  bg: '#000000',
  surface: '#1C1C1E',
  surfaceAlt: '#2C2C2E',
  elevated: '#2C2C2E',
  text: '#FFFFFF',
  textSecondary: '#A1A1A8',
  textTertiary: '#5C5C63',
  separator: 'rgba(84,84,88,0.5)',
  danger: '#FF453A',
  warning: '#FF9F0A',
  success: '#30D158',
  shadow: '#000000',
};

export type Palette = typeof light;
export const palettes = { light, dark };

export const space = { xxs: 2, xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 28, xxxl: 40 } as const;
export const radius = { sm: 8, md: 12, lg: 16, xl: 22, xxl: 28, pill: 999 } as const;

/** iOS-style type ramp (SF Pro via the system font). */
export const type = {
  hero: { fontSize: 40, fontWeight: '800', letterSpacing: -1.2 },
  largeTitle: { fontSize: 32, fontWeight: '800', letterSpacing: -0.9 },
  title: { fontSize: 22, fontWeight: '700', letterSpacing: -0.5 },
  headline: { fontSize: 17, fontWeight: '600', letterSpacing: -0.3 },
  body: { fontSize: 17, fontWeight: '400', letterSpacing: -0.3 },
  callout: { fontSize: 16, fontWeight: '500', letterSpacing: -0.2 },
  subhead: { fontSize: 15, fontWeight: '500', letterSpacing: -0.2 },
  footnote: { fontSize: 13, fontWeight: '500', letterSpacing: -0.05 },
  caption: { fontSize: 12, fontWeight: '600', letterSpacing: 0.2 },
  overline: { fontSize: 12, fontWeight: '700', letterSpacing: 1.1, textTransform: 'uppercase' },
} satisfies Record<string, TextStyle>;

export const priorityMeta = [
  { label: 'None', color: null, flags: 0 },
  { label: 'Low', color: '#0A84FF', flags: 1 },
  { label: 'Medium', color: '#FF9500', flags: 2 },
  { label: 'High', color: '#FF3B30', flags: 3 },
] as const;

/** Hex → rgba helper for tinted backgrounds. */
export function alpha(hex: string, a: number) {
  const h = hex.replace('#', '');
  const n = parseInt(h, 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

export function cardShadow(c: Palette, isDark: boolean) {
  return isDark
    ? {}
    : {
        shadowColor: c.shadow,
        shadowOpacity: 0.06,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
      };
}
