import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { api, configureAuthClient } from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [refreshToken, setRefreshToken] = useState(null);
  const [user, setUser] = useState(null);
  const refreshTokenRef = useRef(null);

  useEffect(() => {
    refreshTokenRef.current = refreshToken;
  }, [refreshToken]);

  useEffect(() => {
    let mounted = true;

    configureAuthClient({
      getRefreshToken: async () =>
        refreshTokenRef.current || AsyncStorage.getItem("refreshToken"),
      onTokenRefreshed: async (nextAccessToken, nextRefreshToken) => {
        if (!mounted) return;
        setToken(nextAccessToken);
        if (nextRefreshToken) {
          setRefreshToken(nextRefreshToken);
          await AsyncStorage.setItem("refreshToken", nextRefreshToken);
        }
      },
      onAuthFailure: async () => {
        if (!mounted) return;
        setToken(null);
        refreshTokenRef.current = null;
        setRefreshToken(null);
        setUser(null);
        await AsyncStorage.removeItem("refreshToken");
      },
    });

    (async () => {
      try {
        const stored = await AsyncStorage.getItem("refreshToken");
        if (!stored) return;
        if (!mounted) return;
        setRefreshToken(stored);
        const res = await api.refresh(stored);
        if (!mounted) return;
        setToken(res.accessToken);
        setRefreshToken(res.refreshToken || stored);
        await AsyncStorage.setItem("refreshToken", res.refreshToken || stored);
        const me = await api.me(res.accessToken);
        setUser(me.user || null);
      } catch {
        await AsyncStorage.removeItem("refreshToken");
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
        if (refreshToken) {
          setRefreshToken(refreshToken);
          await AsyncStorage.setItem("refreshToken", refreshToken);
        }
      },
      signOut: async () => {
        const stored =
          refreshToken || (await AsyncStorage.getItem("refreshToken"));
        try {
          if (stored) await api.logout(stored);
        } catch (_) {}
        await AsyncStorage.removeItem("refreshToken");
        setToken(null);
        refreshTokenRef.current = null;
        setRefreshToken(null);
        setUser(null);
      },
    }),
    [token, user, refreshToken],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
