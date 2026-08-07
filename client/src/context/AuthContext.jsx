import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  completePasswordReset,
  getMe,
  loginRequest,
  logoutRequest,
  requestPasswordReset,
  registerRequest,
  verifyLoginRequest
} from '../api/client.js';

const AuthContext = createContext(null);

const storageUser = 'planeforge_user';
const storageToken = 'planeforge_token';
const storageSession = 'planeforge_session';

const readJson = (key) => {
  try {
    return JSON.parse(localStorage.getItem(key));
  } catch {
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => readJson(storageUser));
  const [session, setSession] = useState(() => readJson(storageSession));
  const [pendingChallenge, setPendingChallenge] = useState(null);

  const persist = (nextUser, token, nextSession) => {
    localStorage.setItem(storageUser, JSON.stringify(nextUser));
    if (token) {
      localStorage.setItem(storageToken, token);
    } else {
      localStorage.removeItem(storageToken);
    }
    localStorage.setItem(storageSession, JSON.stringify(nextSession || null));
    setUser(nextUser);
    setSession(nextSession || null);
  };

  const clearLocalSession = () => {
    localStorage.removeItem(storageUser);
    localStorage.removeItem(storageToken);
    localStorage.removeItem(storageSession);
    setUser(null);
    setSession(null);
  };

  useEffect(() => {
    const token = localStorage.getItem(storageToken);
    if (!token) return;

    getMe()
      .then((data) => {
        localStorage.setItem(storageUser, JSON.stringify(data.user));
        localStorage.setItem(storageSession, JSON.stringify(data.session || null));
        setUser(data.user);
        setSession(data.session || null);
      })
      .catch(clearLocalSession);
  }, []);

  const login = async ({ email, password, role }) => {
    const challenge = await loginRequest({ email, password, role });
    setPendingChallenge({ ...challenge, email });
    return challenge;
  };

  const register = async (payload) => {
    const challenge = await registerRequest(payload);
    setPendingChallenge({ ...challenge, email: payload.email });
    return challenge;
  };

  const verifyLogin = async ({ challengeId, code }) => {
    const data = await verifyLoginRequest({ challengeId, code });
    persist(data.user, data.token, data.session);
    setPendingChallenge(null);
    return data.user;
  };

  const logout = async () => {
    try {
      if (localStorage.getItem(storageToken)) {
        await logoutRequest();
      }
    } catch {
      // Local cleanup still matters if the remote session is already expired.
    }

    clearLocalSession();
  };

  const enrollCourse = (course) => {
    if (!user) return;
    const current = Array.isArray(user.ownedCourses) ? user.ownedCourses : [];
    const nextUser = {
      ...user,
      ownedCourses: Array.from(new Set([...current, course.slug, course._id].filter(Boolean))),
      orders: [
        ...(user.orders || []),
        {
          id: `order-${Date.now()}`,
          invoiceNumber: `PF-${new Date().toISOString().slice(0, 10).replaceAll('-', '')}-LOCAL`,
          amount: course.price,
          status: 'paid',
          courseTitle: course.title
        }
      ]
    };
    persist(nextUser, localStorage.getItem(storageToken), session);
  };

  const updateUser = (updates) => {
    if (!user) return;
    persist({ ...user, ...updates }, localStorage.getItem(storageToken), session);
  };

  const refreshMe = async () => {
    const data = await getMe();
    persist(data.user, localStorage.getItem(storageToken), data.session);
    return data.user;
  };

  const startPasswordReset = (payload) => requestPasswordReset(payload);

  const finishPasswordReset = (payload) => completePasswordReset(payload);

  const value = useMemo(
    () => ({
      user,
      session,
      pendingChallenge,
      login,
      register,
      verifyLogin,
      logout,
      enrollCourse,
      updateUser,
      refreshMe,
      startPasswordReset,
      finishPasswordReset,
      isAuthenticated: Boolean(user)
    }),
    [user, session, pendingChallenge]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
