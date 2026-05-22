import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { api } from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const stored = await AsyncStorage.getItem("refreshToken");
        if (!stored) return;
        const res = await api.refresh(stored);
        if (!mounted) return;
        setToken(res.accessToken);
        await AsyncStorage.setItem("refreshToken", res.refreshToken);
        const me = await api.me(res.accessToken);
        setUser(me.user || null);
      } catch {
        await AsyncStorage.removeItem("refreshToken");
      }
    })();
    return () => { mounted = false; };
  }, []);

  const value = useMemo(
    () => ({
      token,
      user,
      setUser,
      signIn: async (accessToken, refreshToken, nextUser) => {
        setToken(accessToken);
        setUser(nextUser || null);
        if (refreshToken) await AsyncStorage.setItem("refreshToken", refreshToken);
      },
      signOut: async () => {
        const stored = await AsyncStorage.getItem("refreshToken");
        try {
          if (stored) await api.logout(stored);
        } catch (_) {}
        await AsyncStorage.removeItem("refreshToken");
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
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
