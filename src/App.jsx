import { useEffect, useState, lazy, Suspense } from 'react'
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { supabase } from './services/supabaseClient'
import { useUserStore } from './store/useUserStore'
import { Loader2, AlertTriangle } from 'lucide-react'
import { Toaster } from 'react-hot-toast'

// --- IMPORT WAJIB UNTUK DEEP LINK ---
import { App as CapacitorApp } from '@capacitor/app'
import NotificationListener from './components/NotificationListener'

// --- LAZY IMPORTS ---
import Login from './pages/Login'
import ProtectedRoute from './components/ProtectedRoute'

const Home = lazy(() => import('./pages/Home'))
const TravelerMarket = lazy(() => import('./pages/TravelerMarket'))
const Activity = lazy(() => import('./pages/Activity'))
const ChatRoom = lazy(() => import('./pages/ChatRoom'))
const Profile = lazy(() => import('./pages/Profile'))
const WalletHistory = lazy(() => import('./pages/WalletHistory'))
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'))
const PenitipForm = lazy(() => import('./pages/PenitipForm'))
const OrderDetail = lazy(() => import('./pages/OrderDetail'))
const Withdraw = lazy(() => import('./pages/Withdraw'))
const TopUp = lazy(() => import('./pages/TopUp'))
const Notification = lazy(() => import('./pages/Notifications'))

// LOADER COMPONENT
const PageLoader = () => (
  <div className="flex h-screen w-full items-center justify-center bg-gray-50">
      <Loader2 className="animate-spin text-slate-400" size={32} />
  </div>
)

export default function App() {
  const navigate = useNavigate()
  const location = useLocation()
  const { setUser, clearUser } = useUserStore()
  
  const [isAuthChecking, setIsAuthChecking] = useState(true)
  const [errorMessage, setErrorMessage] = useState(null)

  useEffect(() => {
    // --- 1. LISTENER KHUSUS GOOGLE LOGIN (DEEP LINK) ---
    const setupDeepLinkListener = async () => {
        CapacitorApp.addListener('appUrlOpen', async (data) => {
            console.log('App opened with URL:', data.url);
            
            // Cek apakah URL dari Google Auth
            if (data.url.includes('google-auth')) {
                const splitUrl = data.url.split('#');
                if (splitUrl.length > 1) {
                    const params = new URLSearchParams(splitUrl[1]);
                    const accessToken = params.get('access_token');
                    const refreshToken = params.get('refresh_token');

                    if (accessToken) {
                        // A. Masukkan Token ke Supabase
                        const { data: sessionData, error } = await supabase.auth.setSession({
                            access_token: accessToken,
                            refresh_token: refreshToken || '',
                        });

                        if (error) {
                            console.error("Gagal Set Session:", error);
                            return;
                        }
                        
                        // B. Ambil Data Profil (Saldo, Nama, dll)
                        if (sessionData.session) {
                            const userAuth = sessionData.session.user;

                            const { data: profileData, error: profileError } = await supabase
                                .from('profiles')
                                .select('*')
                                .eq('id', userAuth.id)
                                .single();

                            // FIX ERROR DISINI: Gunakan variabel profileError agar tidak warning
                            if (profileError) {
                                console.error("Gagal ambil profil saat login Google:", profileError);
                            }

                            if (profileData) {
                                // Gabung data Auth + Profil
                                setUser({ ...userAuth, ...profileData });
                                console.log("Login Google Sukses & Profil Dimuat!");
                            } else {
                                setUser(userAuth);
                            }

                            // C. Pindah ke Home
                            navigate('/'); 
                        }
                    }
                }
            }
        });
    };

    setupDeepLinkListener();

    // --- 2. CEK SESSION BIASA (SAAT APLIKASI DIBUKA MANUAL) ---
    const checkSession = async () => {
      console.log("1. Mulai Cek Session...")
      try {
          const timeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error("Koneksi timeout (10s)")), 10000)
          );

          const { data } = await Promise.race([
              supabase.auth.getSession(),
              timeoutPromise
          ]).catch(err => { throw err });

          console.log("2. Respon Supabase Diterima:", data)

          if (data?.session) {
            console.log("3. User ditemukan, ambil Profil...")
            const { data: profile, error: profileError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', data.session.user.id)
              .single()
            
            if (profileError) {
                console.error("Gagal ambil profil:", profileError)
                setUser({ ...data.session.user }) 
            } else {
                setUser({ ...data.session.user, ...profile })
            }
          } else {
            console.log("3. User tamu (belum login)")
            clearUser()
          }

      } catch (error) {
          console.error("CRITICAL ERROR:", error)
          setErrorMessage(error.message || "Gagal memuat data")
          clearUser()
      } finally {
          setIsAuthChecking(false)
      }
    }

    checkSession()

    // --- 3. AUTH STATE LISTENER ---
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
         // Logic update user sederhana jika auth berubah
         // (Opsional: bisa fetch profile lagi disini kalau mau lebih ketat)
      } else {
        clearUser()
        if (location.pathname !== '/login') {
            navigate('/login')
        }
      }
    })

    return () => {
        subscription.unsubscribe()
        CapacitorApp.removeAllListeners(); // Bersihkan listener saat keluar
    }
  }, [])

  if (errorMessage) {
      return (
        <div className="flex h-screen w-full flex-col items-center justify-center bg-white p-6 text-center">
            <AlertTriangle className="text-red-500 mb-4" size={48} />
            <h2 className="text-xl font-bold text-slate-900">Gagal Memuat Aplikasi</h2>
            <p className="text-gray-500 mt-2 mb-6 text-sm">{errorMessage}</p>
            <button 
                onClick={() => window.location.reload()} 
                className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold"
            >
                Coba Lagi
            </button>
        </div>
      )
  }

  if (isAuthChecking) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-white flex-col gap-3">
        <Loader2 className="animate-spin text-slate-300" size={40} />
        <p className="text-xs text-gray-400 animate-pulse">Menghubungkan...</p>
      </div>
    )
  }

  return (
    <Suspense fallback={<PageLoader />}>
      <Toaster position="top-center" toastOptions={{ style: { background: '#333', color: '#fff' } }} />
      <NotificationListener />
        <Routes>
            <Route path="/login" element={<Login />} />
            
            <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
            <Route path="/traveler" element={<ProtectedRoute><TravelerMarket /></ProtectedRoute>} />
            <Route path="/activity" element={<ProtectedRoute><Activity /></ProtectedRoute>} />
            <Route path="/chat" element={<ProtectedRoute><ChatRoom /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/wallet-history" element={<ProtectedRoute><WalletHistory /></ProtectedRoute>} />
            <Route path="/order-detail/:id" element={<ProtectedRoute><OrderDetail /></ProtectedRoute>} />
            <Route path="/withdraw" element={<ProtectedRoute><Withdraw /></ProtectedRoute>} />
            <Route path="/topup" element={<ProtectedRoute><TopUp /></ProtectedRoute>} />
            <Route path="/notifications" element={<ProtectedRoute><Notification /></ProtectedRoute>} />
            
            <Route path="/penitip" element={<ProtectedRoute><PenitipForm /></ProtectedRoute>} />
            <Route path="/admin" element={<AdminDashboard />} />
        </Routes>
    </Suspense>
  )
}