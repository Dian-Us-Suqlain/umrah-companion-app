/* The one place the app reaches Firebase. A build without real configuration files talks to the local emulator. */
import { connectAuthEmulator, getAuth } from '@react-native-firebase/auth';
import { connectFirestoreEmulator, getFirestore } from '@react-native-firebase/firestore';
import Constants from 'expo-constants';

const extra = Constants.expoConfig?.extra ?? {};
export const usesEmulator = extra.usesEmulator === true;
export const emulatorHost = String(extra.emulatorHost ?? 'localhost');

let authConnected = false;
let dbConnected = false;

export function firebase() {
  const auth = getAuth();
  const db = getFirestore();
  if (usesEmulator && !authConnected) {
    authConnected = true;
    connectAuthEmulator(auth, `http://${emulatorHost}:9099`, { disableWarnings: true });
  }
  if (usesEmulator && !dbConnected) {
    dbConnected = true;
    try {
      connectFirestoreEmulator(db, emulatorHost, 8080);
    } catch {
      // Already pointed at the emulator.
    }
  }
  return { auth, db };
}

/** After the stored copy is cleared the database starts afresh and must be pointed at the emulator again. */
export function forgetConnection() {
  dbConnected = false;
  firebase();
}
