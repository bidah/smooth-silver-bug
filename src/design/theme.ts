import type { TextStyle } from 'react-native';

/**
 * Glassline — fog-grey neutrals with a cobalt pinprick (see /design.md).
 * One accent only (`accent`), reserved for the single primary action per screen.
 * Flat by design: no gradients.
 */
const light = {
  bg: '#F1F3F5', // neutral — the page foundation
  surface: '#FFFFFF',
  surfaceAlt: '#E6E9ED',
  text: '#0F1419', // primary
  textSecondary: '#4A5568', // secondary
  textTertiary: '#9AA3B0',
  border: '#DDE1E6',
  separator: '#ECEEF1',
  accent: '#2C5EF5', // tertiary — cobalt
  onAccent: '#FFFFFF',
  ink: '#0F1419',
  onInk: '#FFFFFF',
  danger: '#D93025',
};

const dark: typeof light = {
  bg: '#0B0E11',
  surface: '#151A20',
  surfaceAlt: '#1F252D',
  text: '#F1F3F5',
  textSecondary: '#A0AABA',
  textTertiary: '#5B6573',
  border: '#262D36',
  separator: '#1F252D',
  accent: '#4D7BFF',
  onAccent: '#FFFFFF',
  ink: '#F1F3F5',
  onInk: '#0F1419',
  danger: '#FF6B5F',
};

export type Palette = typeof light;
export const palettes = { light, dark };

export const space = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 } as const;
export const radius = { sm: 6, md: 10, lg: 16, pill: 999 } as const;

export const fonts = {
  regular: 'Geist_400Regular',
  medium: 'Geist_500Medium',
  semibold: 'Geist_600SemiBold',
  mono: 'GeistMono_400Regular',
  monoMedium: 'GeistMono_500Medium',
} as const;

/** Type ramp from design.md, scaled for a phone. */
export const type = {
  display: { fontFamily: fonts.semibold, fontSize: 44, lineHeight: 48, letterSpacing: -1.3 },
  h1: { fontFamily: fonts.semibold, fontSize: 32, lineHeight: 38, letterSpacing: -0.64 },
  h2: { fontFamily: fonts.semibold, fontSize: 20, lineHeight: 26, letterSpacing: -0.3 },
  title: { fontFamily: fonts.medium, fontSize: 16, lineHeight: 22, letterSpacing: -0.16 },
  body: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 23, letterSpacing: -0.1 },
  small: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 19 },
  label: { fontFamily: fonts.mono, fontSize: 12, lineHeight: 16, letterSpacing: 0 },
  labelCaps: { fontFamily: fonts.monoMedium, fontSize: 11, lineHeight: 14, letterSpacing: 0.4, textTransform: 'uppercase' },
} satisfies Record<string, TextStyle>;

export const priorityLabels = ['None', 'Low', 'Medium', 'High'] as const;
