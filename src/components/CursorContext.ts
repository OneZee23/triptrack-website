import { createContext } from 'react';

interface CursorContextType {
  setHoverState: (state: { text: string; active: boolean } | null) => void;
}

export const CursorContext = createContext<CursorContextType>({ setHoverState: () => {} });
