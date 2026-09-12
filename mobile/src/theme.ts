export const colors = {
  primary: '#1F9D55',
  primaryDark: '#0F5C31',
  primaryLight: '#E6F6EC',
  accent: '#F5A524',
  accentDark: '#C67D0A',

  background: '#F7F8F7',
  surface: '#FFFFFF',
  border: '#E6E8E6',

  text: '#1A1D1B',
  textMuted: '#6B7268',
  textFaint: '#A0A69C',
  placeholder: '#B4BAB0',
  onDark: '#FFFFFF',
  onDarkMuted: 'rgba(255,255,255,0.78)',

  danger: '#E5484D',
  dangerLight: '#FDECEC',

  overlay: 'rgba(17, 20, 18, 0.45)',
  white: '#FFFFFF',
};

export const gradients = {
  hero: ['#1F9D55', '#0F5C31'] as const,
  gold: ['#F9C158', '#C67D0A'] as const,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  pill: 999,
};

export const typography = {
  title: { fontSize: 28, fontWeight: '700' as const, color: colors.text },
  heading: { fontSize: 20, fontWeight: '700' as const, color: colors.text },
  subheading: { fontSize: 15, fontWeight: '600' as const, color: colors.textMuted },
  body: { fontSize: 16, fontWeight: '400' as const, color: colors.text },
  bodyStrong: { fontSize: 16, fontWeight: '600' as const, color: colors.text },
  caption: { fontSize: 13, fontWeight: '400' as const, color: colors.textMuted },
  button: { fontSize: 16, fontWeight: '700' as const },
};

export const shadow = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  raised: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
};
