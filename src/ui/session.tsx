/* Who is using the app (a guest, or a signed-in person) and which of their groups is showing.
   Everything here comes from the phone's stored copy first, so it works with no network. */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';

import { isOwnGroup, resolveCurrentGroup, type Group } from '@/core/groups/rules';
import { problemOf, type Backend, type User } from '@/data/backend';

import { t } from './strings';

const CHOSEN_KEY = 'uc.current-group';

type Session = {
  /** False until the phone has said whether someone is signed in. */
  ready: boolean;
  user: User | null;
  groups: Group[];
  /** The group the app is showing; the person's own group unless they chose another. */
  current: Group | null;
  own: Group | null;
  choose(groupId: string): void;
  backend: Backend;
};

const Ctx = createContext<Session | null>(null);

export function SessionProvider({ backend, children }: { backend: Backend; children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [chosen, setChosen] = useState<string | null>(null);

  useEffect(
    () =>
      backend.onUser((u) => {
        setUser(u);
        setReady(true);
        if (!u) {
          setGroups([]);
          setChosen(null);
        }
      }),
    [backend],
  );

  const userId = user?.id;
  useEffect(() => {
    if (!userId) return;
    void AsyncStorage.getItem(CHOSEN_KEY).then((id) => {
      if (id) setChosen((made) => made ?? id); // a choice made in the meantime wins
    });
    return backend.onGroups(userId, setGroups);
  }, [backend, userId]);

  // Coming back to the app after opening the confirmation email: ask the server again.
  const unconfirmed = !!user && !user.emailConfirmed;
  useEffect(() => {
    if (!unconfirmed) return;
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') backend.refreshUser().catch(() => {});
    });
    return () => sub.remove();
  }, [backend, unconfirmed]);

  const choose = useCallback((groupId: string) => {
    setChosen(groupId);
    void AsyncStorage.setItem(CHOSEN_KEY, groupId);
  }, []);

  const value = useMemo<Session>(() => {
    const currentId = user ? resolveCurrentGroup(chosen, groups.map((g) => g.id), user.id) : null;
    return {
      ready,
      user,
      groups,
      current: groups.find((g) => g.id === currentId) ?? null,
      own: user ? (groups.find((g) => isOwnGroup(g, user.id)) ?? null) : null,
      choose,
      backend,
    };
  }, [ready, user, groups, chosen, choose, backend]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSession(): Session {
  const s = useContext(Ctx);
  if (!s) throw new Error('useSession needs a SessionProvider above it');
  return s;
}

/** Runs one request at a time: a second tap while the first is still going does nothing.
    Returns the plain-words error, if any, for the screen to show. */
export function useAction() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const running = useRef(false);
  const run = useCallback(async (fn: () => Promise<void>): Promise<boolean> => {
    if (running.current) return false;
    running.current = true;
    setBusy(true);
    setError(null);
    try {
      await fn();
      return true;
    } catch (e) {
      setError(t.problems[problemOf(e)] ?? t.problems.unknown);
      return false;
    } finally {
      running.current = false;
      setBusy(false);
    }
  }, []);
  return { busy, error, setError, run };
}
