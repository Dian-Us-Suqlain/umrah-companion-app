import type { ExpoConfig } from 'expo/config';

// One code base, three apps that can sit side by side on a phone. Local runs are the development variant.
type Variant = 'development' | 'staging' | 'production';
const variant: Variant =
  process.env.APP_VARIANT === 'production' ? 'production' : process.env.APP_VARIANT === 'staging' ? 'staging' : 'development';

const BASE_ID = 'com.dianussuqlain.umrahcompanion';
const VARIANTS: Record<Variant, { name: string; id: string; scheme: string }> = {
  development: { name: 'Umrah Companion (Dev)', id: `${BASE_ID}.dev`, scheme: 'umrahcompanion-dev' },
  staging: { name: 'Umrah Companion (Staging)', id: `${BASE_ID}.staging`, scheme: 'umrahcompanion-staging' },
  production: { name: 'Umrah Companion', id: BASE_ID, scheme: 'umrahcompanion' },
};
const v = VARIANTS[variant];

const config: ExpoConfig = {
  name: v.name,
  slug: 'umrah-companion',
  version: '0.1.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: v.scheme,
  userInterfaceStyle: 'automatic',
  ios: { bundleIdentifier: v.id, supportsTablet: false },
  android: {
    package: v.id,
    adaptiveIcon: {
      backgroundColor: '#E6F4FE',
      foregroundImage: './assets/images/android-icon-foreground.png',
      backgroundImage: './assets/images/android-icon-background.png',
      monochromeImage: './assets/images/android-icon-monochrome.png',
    },
  },
  web: { output: 'static', favicon: './assets/images/favicon.png' },
  plugins: [
    'expo-router',
    ['expo-splash-screen', { backgroundColor: '#0F5C4D', image: './assets/images/splash-icon.png', imageWidth: 76 }],
  ],
  experiments: { typedRoutes: true, reactCompiler: true },
  extra: { variant },
};

export default config;
