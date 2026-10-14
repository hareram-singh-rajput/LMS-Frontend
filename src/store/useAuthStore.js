import { create } from 'zustand';

const getSavedToken = () => {
  try {
    return localStorage.getItem('auth_token');
  } catch {
    return null;
  }
};

export const useAuthStore = create((set) => ({
  user: null,
  token: getSavedToken(),
  isAuthenticated: !!getSavedToken(),
  authInitialized: false,

  setAuth: (user, token) => {
    localStorage.setItem('auth_token', token);

    set({
      user,
      token,
      isAuthenticated: true,
      authInitialized: true,
    });
  },

  setUser: (user) => {
    set({
      user,
      isAuthenticated: !!user,
      authInitialized: true,
    });
  },

  setAuthInitialized: () => {
    set({ authInitialized: true });
  },

  logout: () => {
    localStorage.removeItem('auth_token');

    set({
      user: null,
      token: null,
      isAuthenticated: false,
      authInitialized: true,
    });
  },
}));
