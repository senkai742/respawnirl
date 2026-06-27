/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  dark: {
    background: '#0a0a0f', // Very dark/almost black background
    backgroundElement: '#14141e',
    backgroundSelected: '#1e1e2d',
    text: '#ffffff',
    textSecondary: '#80848e',
    neonCyan: '#00f3ff',
    neonPurple: '#b026ff',
    neonRed: '#ff003c',
    neonGreen: '#39ff14',
    border: '#1a1a2e',
  },
  light: {
    // Fallback light mode, though app is meant to be dark
    background: '#0a0a0f',
    backgroundElement: '#14141e',
    backgroundSelected: '#1e1e2d',
    text: '#ffffff',
    textSecondary: '#80848e',
    neonCyan: '#00f3ff',
    neonPurple: '#b026ff',
    neonRed: '#ff003c',
    neonGreen: '#39ff14',
    border: '#1a1a2e',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
