/* Whether the first-run tutorial has been seen. Kept on the phone only. Erasing the app's data and
   deleting an account leave it alone; reinstalling the app brings the tutorial back. */
import AsyncStorage from '@react-native-async-storage/async-storage';

// Deliberately not under the `uc.` prefix: signing out, deleting an account and "Erase data on this phone"
// remove every `uc.` key, and none of them may bring the tutorial back.
export const TUTORIAL_SEEN_KEY = 'device.tutorial-seen';

export const tutorialSeen = async (): Promise<boolean> => (await AsyncStorage.getItem(TUTORIAL_SEEN_KEY).catch(() => null)) === '1';
export const markTutorialSeen = (): Promise<void> => AsyncStorage.setItem(TUTORIAL_SEEN_KEY, '1').catch(() => {});

/** The tutorial opens by itself only for someone who has not seen it and is not signed in
    (a person signed in after reinstalling already knows the app). Undecided until both facts are known. */
export function tutorialDecision(seen: boolean | null, sessionReady: boolean, signedIn: boolean): 'wait' | 'show' | 'skip' {
  if (seen === null) return 'wait';
  if (seen) return 'skip';
  if (!sessionReady) return 'wait';
  return signedIn ? 'skip' : 'show';
}
