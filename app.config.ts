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

// Firebase configuration files are never in this repository. Without real ones the build uses made-up files
// for the local emulator, written by `npm run firebase:demo-config`. Only a development build may use them.
const DEMO_PLIST = './.firebase/GoogleService-Info.plist';
const DEMO_JSON = './.firebase/google-services.json';
const realFiles = [process.env.GOOGLE_SERVICES_PLIST, process.env.GOOGLE_SERVICES_JSON].filter(Boolean).length;
if (realFiles === 1) {
  throw new Error('Set both GOOGLE_SERVICES_PLIST and GOOGLE_SERVICES_JSON, or neither: one real file and one made-up file would mix two projects.');
}
const usesEmulator = realFiles === 0;
if (usesEmulator && variant !== 'development') {
  throw new Error(`A ${variant} build needs real Firebase files: set GOOGLE_SERVICES_PLIST and GOOGLE_SERVICES_JSON.`);
}

const config: ExpoConfig = {
  name: v.name,
  slug: 'umrah-companion',
  version: '0.1.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: v.scheme,
  userInterfaceStyle: 'automatic',
  ios: {
    bundleIdentifier: v.id,
    supportsTablet: false,
    googleServicesFile: process.env.GOOGLE_SERVICES_PLIST ?? DEMO_PLIST,
    // Only an emulator build reaches the Mac over Wi-Fi, so only it asks for the local network.
    ...(usesEmulator ? { infoPlist: { NSLocalNetworkUsageDescription: 'This development build talks to the Firebase emulator on your Mac.' } } : {}),
  },
  android: {
    package: v.id,
    googleServicesFile: process.env.GOOGLE_SERVICES_JSON ?? DEMO_JSON,
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
    '@react-native-firebase/app',
    '@react-native-firebase/auth',
    // Firebase's iPhone libraries arrive as Swift packages and need dynamic frameworks (static fails at pod install).
    // iOS 27 refuses to launch an app that has not adopted the scene lifecycle; Expo SDK 57 needs it switched on.
    ['expo-build-properties', { ios: { useFrameworks: 'dynamic', enableSceneSupport: true } }],
    ['expo-splash-screen', { backgroundColor: '#0F5C4D', image: './assets/images/splash-icon.png', imageWidth: 76 }],
  ],
  experiments: { typedRoutes: true, reactCompiler: true },
  extra: { variant, usesEmulator, emulatorHost: process.env.EMULATOR_HOST ?? 'localhost' },
};

export default config;
