import { useEffect, useState, lazy, Suspense } from 'react'
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { supabase } from './services/supabaseClient'
import { useUserStore } from './store/useUserStore'
import { Loader2, AlertTriangle } from 'lucide-react' // Tambah icon Alert
import { Toaster } from 'react-hot-toast'

import NotificationListener from './components/NotificationListener'

// --- 1. IMPORT KOMPONEN UTAMA ---
import Login from './pages/Login'
import ProtectedRoute from './components/ProtectedRoute'

// --- 2. LAZY IMPORT ---
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

// KOMPONEN LOADER DI LUAR (Agar tidak re-render error)
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
  const [errorMessage, setErrorMessage] = useState(null) // Untuk nampilin error di layar

  useEffect(() => {
    const checkSession = async () => {
      console.log("1. Mulai Cek Session...") // CCTV
      try {
          // Kasih timeout manual (misal 10 detik gak ada respon, anggap error)
          const timeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error("Koneksi timeout (10s)")), 10000)
          );

          // Balapan: Siapa cepat, Supabase atau Timeout?
          const { data } = await Promise.race([
              supabase.auth.getSession(),
              timeoutPromise
          ]).catch(err => { throw err }); // Tangkap error timeout

          console.log("2. Respon Supabase Diterima:", data) // CCTV

          if (data?.session) {
            console.log("3. User ditemukan, ambil Profil...") // CCTV
            const { data: profile, error: profileError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', data.session.user.id)
              .single()
            
            if (profileError) {
                console.error("Gagal ambil profil:", profileError) // CCTV
                // Tetap login meski profil gagal (fallback)
                setUser({ ...data.session.user }) 
            } else {
                setUser({ ...data.session.user, ...profile })
            }
          } else {
            console.log("3. User tamu (belum login)") // CCTV
            clearUser()
          }

      } catch (error) {
          console.error("CRITICAL ERROR:", error) // CCTV
          setErrorMessage(error.message || "Gagal memuat data")
          clearUser()
      } finally {
          console.log("4. Loading selesai.") // CCTV
          setIsAuthChecking(false) // <--- WAJIB JALAN APAPUN YANG TERJADI
      }
    }

    checkSession()

    // Listener Auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth Change Event:", event) // CCTV
      if (session) {
         // Logic update user... (Simplified for stability)
         setUser(session.user) 
      } else {
        clearUser()
        if (location.pathname !== '/login') {
            navigate('/login')
        }
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  // TAMPILAN JIKA ERROR (Biar gak stuck putih)
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

  // TAMPILAN LOADING AWAL
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
      <Toaster 
          position="top-center"
          reverseOrder={false}
          toastOptions={{
            style: {
              borderRadius: '12px',
              background: '#333',
              color: '#fff',
            },
            success: {
              style: {
                background: '#10B981', // Hijau Emerald
                color: 'white',
              },
              iconTheme: {
                primary: 'white',
                secondary: '#10B981',
              },
            },
            error: {
              style: {
                background: '#EF4444', // Merah
                color: 'white',
              },
            },
          }}
        />

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