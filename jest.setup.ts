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
