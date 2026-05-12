export const theme = {
  colors: {
    bg: '#fafaf7',
    surface: '#ffffff',
    border: '#e3e0d6',
    text: '#1a1a1a',
    textMuted: '#5d6361',
    textSubtle: '#8a8f8c',
    accent: '#0f6e4e',
    accentDark: '#0a5239',
    accentSoft: '#e6f1ec',
    warn: '#b4561d',
    warnSoft: '#fbe7d8',
    danger: '#a82a2a',
    info: '#3d5a80',
    chip: '#f1ede1',
  },
  radius: {
    sm: 8,
    md: 12,
    lg: 16,
    pill: 999,
  },
  spacing: (n: number) => n * 4,
  font: {
    sizeXs: 12,
    sizeSm: 14,
    sizeMd: 16,
    sizeLg: 18,
    sizeXl: 22,
    sizeXxl: 28,
  },
} as const;

export type Theme = typeof theme;
