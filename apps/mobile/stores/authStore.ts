import { create } from 'zustand';

interface AuthState {
  signedIn: boolean;
  email?: string;
  signIn: (email: string) => void;
  signOut: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  signedIn: false,
  email: undefined,
  signIn: (email) => set({ signedIn: true, email }),
  signOut: () => set({ signedIn: false, email: undefined }),
}));
