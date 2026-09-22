const canUseWindowStorage = (storageName) =>
  typeof window !== 'undefined' && Boolean(window[storageName]);

const makeSafeStorage = (storageName) => ({
  getItem(key) {
    try {
      if (!canUseWindowStorage(storageName)) return null;
      return window[storageName].getItem(key);
    } catch {
      return null;
    }
  },
  setItem(key, value) {
    try {
      if (!canUseWindowStorage(storageName)) return;
      window[storageName].setItem(key, value);
    } catch {
      // Storage can be blocked in private browsing or strict privacy modes.
    }
  },
  removeItem(key) {
    try {
      if (!canUseWindowStorage(storageName)) return;
      window[storageName].removeItem(key);
    } catch {
      // Storage can be blocked in private browsing or strict privacy modes.
    }
  }
});

export const safeLocalStorage = makeSafeStorage('localStorage');
export const safeSessionStorage = makeSafeStorage('sessionStorage');
