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
const STORAGE_KEYS = {
  accessToken: "accessToken",
  refreshToken: "refreshToken",
  cachedUser: "cachedUser",
};
const AUTH_STORAGE_KEYS = Object.values(STORAGE_KEYS);

function parseCachedUser(value) {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

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
        refreshTokenRef.current ||
        AsyncStorage.getItem(STORAGE_KEYS.refreshToken),
      onTokenRefreshed: async (nextAccessToken, nextRefreshToken) => {
        if (!mounted) return;
        setToken(nextAccessToken);
        await AsyncStorage.setItem(STORAGE_KEYS.accessToken, nextAccessToken);
        if (nextRefreshToken) {
          setRefreshToken(nextRefreshToken);
          refreshTokenRef.current = nextRefreshToken;
          await AsyncStorage.setItem(
            STORAGE_KEYS.refreshToken,
            nextRefreshToken,
          );
        }
      },
      onAuthFailure: async () => {
        if (!mounted) return;
        setToken(null);
        refreshTokenRef.current = null;
        setRefreshToken(null);
        setUser(null);
        setLoading(false);
        await AsyncStorage.multiRemove(AUTH_STORAGE_KEYS);
      },
    });

    const clearSession = async () => {
      await AsyncStorage.multiRemove(AUTH_STORAGE_KEYS);
      if (!mounted) return;
      setToken(null);
      refreshTokenRef.current = null;
      setRefreshToken(null);
      setUser(null);
    };

    const saveSession = async (
      nextAccessToken,
      nextRefreshToken,
      nextUser,
    ) => {
      const entries = [[STORAGE_KEYS.accessToken, nextAccessToken]];

      if (nextRefreshToken) {
        entries.push([STORAGE_KEYS.refreshToken, nextRefreshToken]);
      }
      if (nextUser) {
        entries.push([STORAGE_KEYS.cachedUser, JSON.stringify(nextUser)]);
      }

      await AsyncStorage.multiSet(entries);
    };

    const refreshStoredSession = async (storedRefreshToken, blockStartup) => {
      if (!storedRefreshToken) return;

      try {
        const res = await api.refresh(storedRefreshToken);
        if (!mounted) return;
        if (!res?.accessToken) {
          throw new Error("Refresh response did not include an access token.");
        }

        const nextRefreshToken = res.refreshToken || storedRefreshToken;
        setToken(res.accessToken);
        setRefreshToken(nextRefreshToken);
        refreshTokenRef.current = nextRefreshToken;
        await saveSession(res.accessToken, nextRefreshToken);

        api.me(res.accessToken)
          .then(async (me) => {
            if (!mounted) return;
            const nextUser = me.user || null;
            setUser(nextUser);
            if (nextUser) {
              await AsyncStorage.setItem(
                STORAGE_KEYS.cachedUser,
                JSON.stringify(nextUser),
              );
            }
          })
          .catch(() => {});
      } catch (error) {
        if (blockStartup || error?.status === 401) {
          await clearSession();
        }
      }
    };

    // Hard safety net: startup should never stay on the splash gate forever.
    const safetyTimer = setTimeout(() => {
      if (mounted) setLoading(false);
    }, 10000);

    const done = () => {
      clearTimeout(safetyTimer);
      if (mounted) setLoading(false);
    };

    (async () => {
      try {
        const storedValues = await AsyncStorage.multiGet(AUTH_STORAGE_KEYS);
        if (!mounted) return;
        const stored = Object.fromEntries(storedValues);
        const storedAccessToken = stored[STORAGE_KEYS.accessToken];
        const storedRefreshToken = stored[STORAGE_KEYS.refreshToken];
        const cachedUser = parseCachedUser(stored[STORAGE_KEYS.cachedUser]);

        if (cachedUser) {
          setUser(cachedUser);
        }

        if (storedRefreshToken) {
          setRefreshToken(storedRefreshToken);
          refreshTokenRef.current = storedRefreshToken;
        }

        if (storedAccessToken) {
          setToken(storedAccessToken);
          done();
          refreshStoredSession(storedRefreshToken, false);
          return;
        }

        if (!storedRefreshToken) {
          return done();
        }

        await refreshStoredSession(storedRefreshToken, true);
      } catch {
        await clearSession();
      } finally {
        done();
      }
    })();
    return () => {
      mounted = false;
      clearTimeout(safetyTimer);
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
        await AsyncStorage.setItem(STORAGE_KEYS.accessToken, accessToken);
        if (refreshToken) {
          setRefreshToken(refreshToken);
          refreshTokenRef.current = refreshToken;
          await AsyncStorage.setItem(STORAGE_KEYS.refreshToken, refreshToken);
        }
        if (nextUser) {
          await AsyncStorage.setItem(
            STORAGE_KEYS.cachedUser,
            JSON.stringify(nextUser),
          );
        } else {
          await AsyncStorage.removeItem(STORAGE_KEYS.cachedUser);
        }
      },
      signOut: async () => {
        const stored =
          refreshToken ||
          (await AsyncStorage.getItem(STORAGE_KEYS.refreshToken));
        try {
          if (stored) await api.logout(stored);
        } catch (_) {}
        await AsyncStorage.multiRemove(AUTH_STORAGE_KEYS);
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
