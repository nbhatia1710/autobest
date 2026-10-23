import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { createApiClient } from './api';
import { createDemoClient } from './demo';
export const isDemo = import.meta.env.VITE_API_MODE !== 'live';
const key = isDemo ? 'autobest.demo.session' : 'autobest.live.session';
function stored() {
  try {
    return JSON.parse(sessionStorage.getItem(key));
  } catch {
    return null;
  }
}
const AuthContext = createContext(null);
export function AuthProvider({ children }) {
  const [session, setSession] = useState(stored);
  const [expired, setExpired] = useState(false);
  function save(value) {
    if (value) sessionStorage.setItem(key, JSON.stringify(value));
    else sessionStorage.removeItem(key);
    setSession(value);
  }
  const api = useMemo(
    () =>
      isDemo
        ? createDemoClient(() => stored()?.user)
        : createApiClient(
            import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api',
            () => stored()?.access_token,
            () => {
              save(null);
              setExpired(true);
            },
          ),
    [],
  );
  useEffect(() => {
    if (!session?.expires_at) return;
    const ms = session.expires_at - Date.now();
    if (ms <= 0) {
      save(null);
      setExpired(true);
      return;
    }
    const timer = setTimeout(() => {
      save(null);
      setExpired(true);
    }, ms);
    return () => clearTimeout(timer);
  }, [session]);
  async function login(values) {
    const data = await api.login(values);
    if (!data.access_token || !data.user)
      throw new Error('Invalid login response. Expected access_token and user.');
    let expires_at;
    if (!isDemo) {
      try {
        const part = data.access_token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
        const claims = JSON.parse(atob(part));
        expires_at = claims.exp * 1000;
        if (!Number.isFinite(expires_at) || expires_at <= Date.now()) throw new Error();
      } catch {
        throw new Error('The server returned an invalid or expired token.');
      }
    }
    save({ ...data, expires_at });
    setExpired(false);
  }
  function demoLogin(role) {
    if (isDemo) {
      save({ access_token: 'demo-session', user: { email: `${role}@autobest.demo`, role } });
      setExpired(false);
    }
  }
  return (
    <AuthContext.Provider
      value={{ user: session?.user, api, login, demoLogin, logout: () => save(null), expired }}
    >
      {children}
    </AuthContext.Provider>
  );
}
export const useAuth = () => useContext(AuthContext);
