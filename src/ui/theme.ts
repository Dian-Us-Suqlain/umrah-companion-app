/* The design system's colours and sizes. Screens never write a colour or a font size themselves:
   they take them from here, so light and dark, and every screen, stay in step. */
import { useColorScheme } from 'react-native';

const light = {
  background: '#F5F2EB',
  card: '#FFFEFB',
  text: '#1A211F',
  muted: '#5C645F',
  line: '#DED8CE',
  /** Main buttons, links, the active tab. */
  accent: '#163A34',
  onAccent: '#FFFFFF',
  /** Icon backgrounds and quiet panels. */
  accentSoft: '#F0ECE4',
  /** The green card at the top of a screen, and what sits on it. */
  hero: '#163A34',
  onHero: '#FFFFFF',
  onHeroMuted: '#D5E2DC',
  heroLine: '#8FB0A6',
  heroTrack: '#2B5A50',
  gold: '#E6D3AE',
  goldText: '#5E4514',
  goldSoft: '#F4EAD6',
  danger: '#8C1D18',
  dangerSoft: '#FBE4E1',
  ok: '#1E6B3A',
};
const dark: typeof light = {
  background: '#0D1211',
  card: '#151B19',
  text: '#F3F2EE',
  muted: '#A5ADA8',
  line: '#28322F',
  accent: '#8DB4A5',
  onAccent: '#0D1211',
  accentSoft: '#1B2421',
  hero: '#1F4A42',
  onHero: '#FFFFFF',
  onHeroMuted: '#D5E2DC',
  heroLine: '#8FB0A6',
  heroTrack: '#2F6257',
  gold: '#E6D3AE',
  goldText: '#D2AE73',
  goldSoft: '#2E2713',
  danger: '#FF8A80',
  dangerSoft: '#3A1F1C',
  ok: '#7BD69A',
};

export type Theme = typeof light;
export type Colour = keyof Theme;
export const themes = { light, dark };

/** Every pair of text colour and background the app puts together. The contrast test walks this list. */
export const textPairs: [text: Colour, background: Colour][] = [
  ['text', 'background'],
  ['text', 'card'],
  ['text', 'accentSoft'],
  ['muted', 'background'],
  ['muted', 'card'],
  ['muted', 'accentSoft'],
  ['accent', 'background'],
  ['accent', 'card'],
  ['accent', 'accentSoft'],
  ['onAccent', 'accent'],
  ['onHero', 'hero'],
  ['onHeroMuted', 'hero'],
  ['gold', 'hero'],
  ['hero', 'gold'],
  ['goldText', 'goldSoft'],
  ['goldText', 'background'],
  ['goldText', 'card'],
  ['danger', 'dangerSoft'],
  ['danger', 'background'],
  ['danger', 'card'],
  ['ok', 'background'],
  ['ok', 'card'],
];

/** Nothing that can be tapped is shorter than this, in points. Larger than Apple's 44: see the all-ages study. */
export const MIN_TARGET = 48;
/** The one filled button on a screen. */
export const MAIN_BUTTON = 56;

/** Text sizes. `label` is the smallest in the app and is never used for something a person must read to act. */
export const size = { title: 30, heading: 22, large: 18, body: 17, text: 16, small: 14, label: 13 } as const;
export const radius = { card: 22, hero: 26, button: 18, field: 16, icon: 14, pill: 99 } as const;
/** The font for Arabic phrases, bundled with the app. Falls back to the phone's own Arabic font if missing. */
export const ARABIC_FONT = 'Amiri-Regular';

export function useTheme(): Theme {
  return useColorScheme() === 'dark' ? dark : light;
}
