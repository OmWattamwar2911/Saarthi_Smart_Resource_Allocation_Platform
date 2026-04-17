import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { authApi, setAuthToken } from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("saarthi_token") || "");
  const [user, setUser] = useState(() => {
    const value = localStorage.getItem("saarthi_user");
    return value ? JSON.parse(value) : null;
  });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setAuthToken(token || "");
    if (token) {
      localStorage.setItem("saarthi_token", token);
    } else {
      localStorage.removeItem("saarthi_token");
    }
  }, [token]);

  useEffect(() => {
    if (user) {
      localStorage.setItem("saarthi_user", JSON.stringify(user));
    } else {
      localStorage.removeItem("saarthi_user");
    }
  }, [user]);

  useEffect(() => {
    const bootstrap = async () => {
      if (!token) {
        setReady(true);
        return;
      }
      try {
        const me = await authApi.me();
        setUser(me.user);
      } catch {
        setToken("");
        setUser(null);
      } finally {
        setReady(true);
      }
    };
    bootstrap();
  }, [token]);

  const value = useMemo(
    () => ({
      token,
      user,
      ready,
      isAuthenticated: Boolean(token && user),
      async login(payload) {
        const data = await authApi.login(payload);
        setToken(data.token);
        setUser(data.user);
        return data;
      },
      async register(payload) {
        const data = await authApi.register(payload);
        setToken(data.token);
        setUser(data.user);
        return data;
      },
      logout() {
        setToken("");
        setUser(null);
      }
    }),
    [token, user, ready]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}
