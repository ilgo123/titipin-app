import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useUserStore = create(
  persist(
    (set) => ({
      // 1. Data Awal (Kosong)
      user: null,

      // 2. Fungsi Login/Set User (INI YANG HILANG SEBELUMNYA)
      setUser: (userData) => set({ user: userData }),

      // 3. Fungsi Logout
      clearUser: () => set({ user: null }),
      
      // 4. Cek sesi (opsional)
      checkSession: () => {}, 
    }),
    {
      name: 'user-storage', // Agar data user tersimpan di browser (gak hilang pas refresh)
    }
  )
)