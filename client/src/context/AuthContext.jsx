import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  completePasswordReset,
  confirmProfileChange,
  getMe,
  loginRequest,
  logoutRequest,
  requestProfileChange,
  requestPasswordReset,
  registerRequest,
  resendLoginCodeRequest,
  updateProfileRequest,
  verifyPasswordResetCodeRequest,
  verifyLoginRequest
} from '../api/client.js';
import { safeLocalStorage } from '../utils/storage.js';

const AuthContext = createContext(null);

const storageUser = 'planeforge_user';
const storageToken = 'planeforge_token';
const storageSession = 'planeforge_session';

const readJson = (key) => {
  try {
    return JSON.parse(safeLocalStorage.getItem(key));
  } catch {
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => readJson(storageUser));
  const [session, setSession] = useState(() => readJson(storageSession));
  const [pendingChallenge, setPendingChallenge] = useState(null);

  const persist = (nextUser, token, nextSession) => {
    safeLocalStorage.setItem(storageUser, JSON.stringify(nextUser));
    if (token) {
      safeLocalStorage.setItem(storageToken, token);
    } else {
      safeLocalStorage.removeItem(storageToken);
    }
    safeLocalStorage.setItem(storageSession, JSON.stringify(nextSession || null));
    setUser(nextUser);
    setSession(nextSession || null);
  };

  const clearLocalSession = () => {
    safeLocalStorage.removeItem(storageUser);
    safeLocalStorage.removeItem(storageToken);
    safeLocalStorage.removeItem(storageSession);
    setUser(null);
    setSession(null);
  };

  useEffect(() => {
    const token = safeLocalStorage.getItem(storageToken);
    if (!token) return;

    getMe()
      .then((data) => {
        safeLocalStorage.setItem(storageUser, JSON.stringify(data.user));
        safeLocalStorage.setItem(storageSession, JSON.stringify(data.session || null));
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
    setPendingChallenge(challenge?.challengeId ? { ...challenge, email: payload.email } : null);
    return challenge;
  };

  const verifyLogin = async ({ challengeId, code }) => {
    const data = await verifyLoginRequest({ challengeId, code });
    persist(data.user, data.token, data.session);
    setPendingChallenge(null);
    return data.user;
  };

  const resendLoginCode = async ({ challengeId }) => {
    const challenge = await resendLoginCodeRequest({ challengeId });
    setPendingChallenge((current) =>
      challenge?.challengeId ? { ...challenge, email: current?.email } : current
    );
    return challenge;
  };

  const logout = async () => {
    try {
      if (safeLocalStorage.getItem(storageToken)) {
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
    persist(nextUser, safeLocalStorage.getItem(storageToken), session);
  };

  const updateUser = async (updates) => {
    if (!user) return null;
    const data = await updateProfileRequest(updates);
    const nextUser = data.user || { ...user, ...updates };
    persist(nextUser, safeLocalStorage.getItem(storageToken), session);
    return nextUser;
  };

  const refreshMe = async () => {
    const data = await getMe();
    persist(data.user, safeLocalStorage.getItem(storageToken), data.session);
    return data.user;
  };

  const startPasswordReset = (payload) => requestPasswordReset(payload);

  const verifyPasswordResetCode = (payload) => verifyPasswordResetCodeRequest(payload);

  const finishPasswordReset = (payload) => completePasswordReset(payload);

  const startProfileChange = (payload) => requestProfileChange(payload);

  const finishProfileChange = async (payload) => {
    const data = await confirmProfileChange(payload);
    if (data.user) {
      persist(data.user, safeLocalStorage.getItem(storageToken), session);
    }
    return data;
  };

  const value = useMemo(
    () => ({
      user,
      session,
      pendingChallenge,
      login,
      register,
      verifyLogin,
      resendLoginCode,
      logout,
      enrollCourse,
      updateUser,
      refreshMe,
      startPasswordReset,
      verifyPasswordResetCode,
      finishPasswordReset,
      startProfileChange,
      finishProfileChange,
      isAuthenticated: Boolean(user)
    }),
    [user, session, pendingChallenge]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
