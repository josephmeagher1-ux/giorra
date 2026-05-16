import { create } from 'zustand';
import { Platform } from 'react-native';

export type AuthProvider = 'email' | 'google' | 'apple' | 'facebook';

interface AuthState {
  signedIn: boolean;
  email?: string;
  displayName?: string;
  avatarUrl?: string;
  provider?: AuthProvider;
  signIn: (opts: {
    email: string;
    displayName?: string;
    avatarUrl?: string;
    provider?: AuthProvider;
  }) => void;
  signOut: () => void;
}

const STORAGE_KEY = 'giorra-auth';

interface PersistedAuth {
  signedIn: boolean;
  email?: string;
  displayName?: string;
  avatarUrl?: string;
  provider?: AuthProvider;
}

function loadInitial(): PersistedAuth {
  if (Platform.OS !== 'web' || typeof window === 'undefined') {
    return { signedIn: false };
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { signedIn: false };
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && parsed.signedIn === true) {
      return {
        signedIn: true,
        email: parsed.email,
        displayName: parsed.displayName,
        avatarUrl: parsed.avatarUrl,
        provider: parsed.provider,
      };
    }
  } catch {
    // ignore
  }
  return { signedIn: false };
}

function persistOnWeb(value: PersistedAuth) {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch {
    // ignore quota / private-mode failures
  }
}

const initial = loadInitial();

export const useAuthStore = create<AuthState>((set) => ({
  signedIn: initial.signedIn,
  email: initial.email,
  displayName: initial.displayName,
  avatarUrl: initial.avatarUrl,
  provider: initial.provider,
  signIn: ({ email, displayName, avatarUrl, provider = 'email' }) => {
    const data: PersistedAuth = { signedIn: true, email, displayName, avatarUrl, provider };
    persistOnWeb(data);
    set({ signedIn: true, email, displayName, avatarUrl, provider });
  },
  signOut: () => {
    persistOnWeb({ signedIn: false });
    set({ signedIn: false, email: undefined, displayName: undefined, avatarUrl: undefined, provider: undefined });
  },
}));
