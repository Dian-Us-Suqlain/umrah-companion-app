// Writes made-up Firebase configuration files for the local emulator into .firebase/ (git-ignored).
// The "demo-" project does not exist anywhere: these files unlock nothing and only let the app start.
// Real configuration files (staging, production) are never in this repository; point the build at them with
// GOOGLE_SERVICES_PLIST and GOOGLE_SERVICES_JSON instead.
import { mkdirSync, writeFileSync } from 'node:fs';

const PROJECT = 'demo-umrah-companion';
const SENDER = '100000000000';
const NOT_A_KEY = 'AIza' + 'x'.repeat(35); // the libraries only check the shape
const BASE = 'com.dianussuqlain.umrahcompanion';
const ids = [`${BASE}.dev`, `${BASE}.staging`, BASE];
const bundle = process.env.APP_VARIANT === 'production' ? ids[2] : process.env.APP_VARIANT === 'staging' ? ids[1] : ids[0];

const plist = (entries) =>
  `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
${Object.entries(entries)
  .map(([k, v]) => `  <key>${k}</key>\n  ${typeof v === 'boolean' ? `<${v}/>` : `<string>${v}</string>`}`)
  .join('\n')}
</dict>
</plist>
`;

mkdirSync('.firebase', { recursive: true });
writeFileSync(
  '.firebase/GoogleService-Info.plist',
  plist({
    API_KEY: NOT_A_KEY,
    GCM_SENDER_ID: SENDER,
    PLIST_VERSION: '1',
    BUNDLE_ID: bundle,
    PROJECT_ID: PROJECT,
    STORAGE_BUCKET: `${PROJECT}.appspot.com`,
    IS_ADS_ENABLED: false,
    IS_ANALYTICS_ENABLED: false,
    IS_APPINVITE_ENABLED: false,
    IS_GCM_ENABLED: false,
    IS_SIGNIN_ENABLED: true,
    GOOGLE_APP_ID: `1:${SENDER}:ios:0000000000000000000000`,
  }),
);
writeFileSync(
  '.firebase/google-services.json',
  JSON.stringify(
    {
      project_info: { project_number: SENDER, project_id: PROJECT, storage_bucket: `${PROJECT}.appspot.com` },
      client: ids.map((id, i) => ({
        client_info: { mobilesdk_app_id: `1:${SENDER}:android:000000000000000000000${i}`, android_client_info: { package_name: id } },
        oauth_client: [],
        api_key: [{ current_key: NOT_A_KEY }],
        services: { appinvite_service: { other_platform_oauth_client: [] } },
      })),
      configuration_version: '1',
    },
    null,
    2,
  ) + '\n',
);
console.log(`Demo Firebase configuration written to .firebase/ for ${bundle}`);
