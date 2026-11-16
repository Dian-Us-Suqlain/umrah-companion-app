// The local emulator sends no real email. This opens every pending "confirm your address" link for you,
// so accounts made in a development build can invite and join. Then tap "I've confirmed it" in the app.
const host = process.env.EMULATOR_HOST ?? 'localhost';
const base = `http://${host}:9099`;
const res = await fetch(`${base}/emulator/v1/projects/demo-umrah-companion/oobCodes`).catch(() => null);
if (!res?.ok) {
  console.error('The emulator is not running. Start it with: npm run emulators');
  process.exit(1);
}
const latest = new Map();
for (const c of (await res.json()).oobCodes ?? []) if (c.requestType === 'VERIFY_EMAIL') latest.set(c.email, c.oobLink);
for (const [email, link] of latest) {
  const ok = (await fetch(link.replace(/\/\/[^/:]+:/, `//${host}:`))).ok;
  console.log(`${ok ? 'confirmed' : 'already used'}: ${email}`);
}
if (!latest.size) console.log('No confirmation emails are waiting.');
