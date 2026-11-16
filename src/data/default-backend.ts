/* The server the running app uses. Tests replace this module with the in-memory one (see jest.setup.ts). */
import type { Backend } from './backend';
import { firebaseBackend } from './firebase-backend';

let backend: Backend | null = null;
export const getBackend = (): Backend => (backend ??= firebaseBackend());
