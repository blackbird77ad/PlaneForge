import { createContext, useContext, useMemo, useState } from 'react';
import { demoUsers } from '../data/catalog.js';
import { loginRequest, registerRequest } from '../api/client.js';

const AuthContext = createContext(null);

const storageUser = 'planeforge_user';
const storageToken = 'planeforge_token';

const readStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem(storageUser));
  } catch {
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(readStoredUser);

  const persist = (nextUser, token = 'demo-token') => {
    localStorage.setItem(storageUser, JSON.stringify(nextUser));
    localStorage.setItem(storageToken, token);
    setUser(nextUser);
  };

  const login = async ({ email, password }) => {
    try {
      const data = await loginRequest({ email, password });
      persist(data.user, data.token);
      return data.user;
    } catch (error) {
      const fallback = Object.values(demoUsers).find((demoUser) => demoUser.email === email);
      if (!fallback || password !== 'Password123!') {
        throw error;
      }
      persist(fallback);
      return fallback;
    }
  };

  const register = async (payload) => {
    try {
      const data = await registerRequest(payload);
      persist(data.user, data.token);
      return data.user;
    } catch {
      const fallback = {
        id: `demo-${Date.now()}`,
        name: payload.name,
        email: payload.email,
        role: payload.role || 'student',
        ownedCourses: []
      };
      persist(fallback);
      return fallback;
    }
  };

  const loginAsDemo = (role) => {
    const demoUser = demoUsers[role];
    persist(demoUser);
    return demoUser;
  };

  const logout = () => {
    localStorage.removeItem(storageUser);
    localStorage.removeItem(storageToken);
    setUser(null);
  };

  const enrollCourse = (course) => {
    if (!user) return;
    const current = Array.isArray(user.ownedCourses) ? user.ownedCourses : [];
    const nextUser = {
      ...user,
      ownedCourses: Array.from(new Set([...current, course.slug])),
      orders: [
        ...(user.orders || []),
        {
          id: `order-${Date.now()}`,
          invoiceNumber: `PF-${new Date().toISOString().slice(0, 10).replaceAll('-', '')}-DEMO`,
          amount: course.price,
          status: 'paid',
          courseTitle: course.title
        }
      ]
    };
    persist(nextUser);
  };

  const updateUser = (updates) => {
    if (!user) return;
    persist({ ...user, ...updates });
  };

  const value = useMemo(
    () => ({
      user,
      login,
      register,
      loginAsDemo,
      logout,
      enrollCourse,
      updateUser,
      isAuthenticated: Boolean(user)
    }),
    [user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
