import { create } from 'zustand';
import { authService } from '../lib/api-client';

interface User {
  id: number;
  full_name: string;
  username: string;
  email: string;
  role: string;
  faculty?: string;
  profile_picture?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (credentials: any) => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  loginWithGoogle: (token: string, user: any) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('auth_token'),
  isAuthenticated: !!localStorage.getItem('auth_token'),
  isLoading: false,
  error: null,

  loginWithGoogle: (token, user) => {
    localStorage.setItem('auth_token', token);
    set({ token, user, isAuthenticated: true, isLoading: false, error: null });
  },

  login: async (credentials) => {
    set({ isLoading: true, error: null });
    try {
      const data = await authService.login(credentials);
      localStorage.setItem('auth_token', data.access_token);
      set({ 
        token: data.access_token, 
        user: data.user, 
        isAuthenticated: true, 
        isLoading: false 
      });
    } catch (err: any) {
      set({ 
        error: err.response?.data?.detail || 'Login failed', 
        isLoading: false 
      });
      throw err;
    }
  },

  register: async (userData) => {
    set({ isLoading: true, error: null });
    try {
      const data = await authService.register(userData);
      localStorage.setItem('auth_token', data.access_token);
      set({ 
        token: data.access_token, 
        user: data.user, 
        isAuthenticated: true, 
        isLoading: false 
      });
    } catch (err: any) {
      set({ 
        error: err.response?.data?.detail || 'Registration failed', 
        isLoading: false 
      });
      throw err;
    }
  },

  logout: () => {
    localStorage.removeItem('auth_token');
    set({ user: null, token: null, isAuthenticated: false });
  },

  checkAuth: async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) return;
    
    set({ isLoading: true });
    try {
      const user = await authService.getProfile();
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (err) {
      localStorage.removeItem('auth_token');
      set({ user: null, token: null, isAuthenticated: false, isLoading: false });
    }
  }
}));
