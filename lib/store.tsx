"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type Dispatch,
  type ReactNode,
} from "react";
import { loadAppData, saveAppData } from "./storage";
import { createDefaultAppData, type AppData } from "./types";

type StoreState = {
  data: AppData;
  loaded: boolean;
  warning: string | null;
  persistenceBlocked: boolean;
};

type StoreAction =
  | {
      type: "hydrate";
      data: AppData;
      warning: string | null;
      persistenceBlocked: boolean;
    }
  | { type: "update"; update: (data: AppData) => AppData }
  | { type: "warning"; warning: string };

const initialState: StoreState = {
  data: createDefaultAppData(),
  loaded: false,
  warning: null,
  persistenceBlocked: false,
};

function reducer(state: StoreState, action: StoreAction): StoreState {
  switch (action.type) {
    case "hydrate":
      return {
        data: action.data,
        loaded: true,
        warning: action.warning,
        persistenceBlocked: action.persistenceBlocked,
      };
    case "update":
      return { ...state, data: action.update(state.data) };
    case "warning":
      return { ...state, warning: action.warning };
  }
}

const StoreContext = createContext<{
  state: StoreState;
  dispatch: Dispatch<StoreAction>;
} | null>(null);

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    const result = loadAppData();
    dispatch({ type: "hydrate", ...result });
  }, []);

  useEffect(() => {
    if (!state.loaded || state.persistenceBlocked) return;
    const warning = saveAppData(state.data);
    if (warning) dispatch({ type: "warning", warning });
  }, [state.data, state.loaded, state.persistenceBlocked]);

  const value = useMemo(() => ({ state, dispatch }), [state]);
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useAppStore() {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error("useAppStore must be used inside AppStoreProvider.");
  }
  return context;
}
