import { createContext } from 'react';
import type { Session } from './storage';

export interface AuthContextType {
  session: Session | null;
  signedIn: (session: Session) => void;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  session: null,
  signedIn: () => {},
  signOut: async () => {},
});
