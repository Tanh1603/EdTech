import { create } from 'zustand';

interface AuthState {
  activeRole: 'student' | 'teacher' | 'admin';
  setActiveRole: (role: 'student' | 'teacher' | 'admin') => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  activeRole: (localStorage.getItem('activeRole') as 'student' | 'teacher' | 'admin') || 'student',
  setActiveRole: (role) => {
    localStorage.setItem('activeRole', role);
    set({ activeRole: role });
  },
}));
