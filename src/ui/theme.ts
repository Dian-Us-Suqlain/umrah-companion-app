import { useColorScheme } from 'react-native';

const light = {
  background: '#F6F5F1',
  card: '#FFFFFF',
  text: '#16201D',
  muted: '#5F6B67',
  line: '#DDDCD5',
  accent: '#0F5C4D',
  accentSoft: '#E3F0EC',
  warn: '#8A5A00',
  warnSoft: '#FBF0D9',
  danger: '#A12B2B',
  ok: '#1E6B3A',
};
const dark: typeof light = {
  background: '#0E1513',
  card: '#182220',
  text: '#F1F4F2',
  muted: '#A3AFAB',
  line: '#2A3835',
  accent: '#6FCDB6',
  accentSoft: '#1B3A33',
  warn: '#F0C36A',
  warnSoft: '#3A2E12',
  danger: '#FF8F8F',
  ok: '#7BD69A',
};

export type Theme = typeof light;
export const themes = { light, dark };

export function useTheme(): Theme {
  return useColorScheme() === 'dark' ? dark : light;
}
