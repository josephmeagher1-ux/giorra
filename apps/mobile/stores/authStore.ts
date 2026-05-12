import { create } from 'zustand';
import { Platform } from 'react-native';

interface AuthState {
  signedIn: boolean;
  email?: string;
  signIn: (email: string) => void;
  signOut: () => void;
}

const STORAGE_KEY = 'giorra-auth';

/**
 * Tiny synchronous web-only persistence layer. Avoids zustand/middleware
 * (which uses import.meta and breaks Metro's classic <script> output).
 * Native falls through with no persistence — production would wire
 * AsyncStorage here.
 */
function loadInitial(): { signedIn: boolean; email?: string } {
  if (Platform.OS !== 'web' || typeof window === 'undefined') {
    return { signedIn: false };
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { signedIn: false };
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && parsed.signedIn === true) {
      return { signedIn: true, email: typeof parsed.email === 'string' ? parsed.email : undefined };
    }
  } catch {
    // ignore
  }
  return { signedIn: false };
}

function persistOnWeb(value: { signedIn: boolean; email?: string }) {
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
  signIn: (email) => {
    persistOnWeb({ signedIn: true, email });
    set({ signedIn: true, email });
  },
  signOut: () => {
    persistOnWeb({ signedIn: false });
    set({ signedIn: false, email: undefined });
  },
}));
