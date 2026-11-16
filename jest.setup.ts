/* Tests never reach a real server: the app's backend is replaced by the in-memory one, shared per test file. */
import type { MemoryBackend } from '@/data/memory-backend';

jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));

jest.mock('@/data/default-backend', () => {
  const { memoryBackend } = require('@/data/memory-backend');
  let backend: MemoryBackend | null = null;
  return {
    getBackend: () => (backend ??= memoryBackend()),
    resetBackend: () => (backend = null),
  };
});

// The animation libraries' own stand-ins for tests: nothing moves, everything is in its final place.
jest.mock('react-native-worklets', () => require('react-native-worklets/lib/module/mock'));
jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(() => Promise.resolve()),
  notificationAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: { Light: 'light' },
  NotificationFeedbackType: { Success: 'success' },
}));
jest.mock('expo-clipboard', () => ({ setStringAsync: jest.fn(() => Promise.resolve(true)) }));

// The first-run tutorial has been seen, unless a test says otherwise: tests start on the tabs, as before.
const storage = require('@react-native-async-storage/async-storage');
void (storage.default ?? storage).setItem('device.tutorial-seen', '1');
