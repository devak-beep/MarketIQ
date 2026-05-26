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
  const [loading, setLoading] = useState(true);
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
        if (!stored) { setLoading(false); return; }
        if (!mounted) return;
        setRefreshToken(stored);
        // Restore cached user & mark as loading=false immediately so app opens
        const cachedUser = await AsyncStorage.getItem("cachedUser");
        if (cachedUser && mounted) {
          try {
            const parsed = JSON.parse(cachedUser);
            setUser(parsed);
            // Set a placeholder token so navigator goes to Tabs right away
            setToken("__restoring__");
          } catch (_) {}
        }
        if (mounted) setLoading(false);
        // Refresh in background
        const res = await api.refresh(stored);
        if (!mounted) return;
        setToken(res.accessToken);
        setRefreshToken(res.refreshToken || stored);
        await AsyncStorage.setItem("refreshToken", res.refreshToken || stored);
        const me = await api.me(res.accessToken);
        if (!mounted) return;
        setUser(me.user || null);
        await AsyncStorage.setItem("cachedUser", JSON.stringify(me.user || null));
      } catch {
        await AsyncStorage.multiRemove(["refreshToken", "cachedUser"]);
        if (mounted) { setToken(null); setUser(null); setLoading(false); }
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
      loading,
      setUser,
      signIn: async (accessToken, refreshToken, nextUser) => {
        setToken(accessToken);
        setUser(nextUser || null);
        if (refreshToken) {
          setRefreshToken(refreshToken);
          await AsyncStorage.setItem("refreshToken", refreshToken);
        }
        if (nextUser) {
          await AsyncStorage.setItem("cachedUser", JSON.stringify(nextUser));
        }
      },
      signOut: async () => {
        const stored =
          refreshToken || (await AsyncStorage.getItem("refreshToken"));
        try {
          if (stored) await api.logout(stored);
        } catch (_) {}
        await AsyncStorage.multiRemove(["refreshToken", "cachedUser"]);
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
