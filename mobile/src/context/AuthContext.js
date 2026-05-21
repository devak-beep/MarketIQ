import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import * as SecureStore from "expo-secure-store";
import { api } from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    // try to restore session via refresh token stored securely
    let mounted = true;
    (async () => {
      try {
        const stored = await SecureStore.getItemAsync("refreshToken");
        if (!stored) return;
        const res = await api.refresh(stored);
        if (!mounted) return;
        setToken(res.accessToken);
        await SecureStore.setItemAsync("refreshToken", res.refreshToken);
        const me = await api.me(res.accessToken);
        setUser(me.user || null);
      } catch (err) {
        await SecureStore.deleteItemAsync("refreshToken");
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const value = useMemo(
    () => ({
      token,
      user,
      setUser,
      signIn: async (accessToken, refreshToken, nextUser) => {
        setToken(accessToken);
        setUser(nextUser || null);
        if (refreshToken)
          await SecureStore.setItemAsync("refreshToken", refreshToken);
      },
      signOut: async () => {
        const stored = await SecureStore.getItemAsync("refreshToken");
        try {
          if (stored) await api.logout(stored);
        } catch (_) {
          /* ignore */
        }
        await SecureStore.deleteItemAsync("refreshToken");
        setToken(null);
        setUser(null);
      },
    }),
    [token, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
