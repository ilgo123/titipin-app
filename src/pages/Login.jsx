import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../services/supabaseClient'
import { useUserStore } from '../store/useUserStore'
import { motion } from 'framer-motion'
import { Mail, Lock, Loader2, ArrowRight, Sparkles } from 'lucide-react'
import { toast } from 'react-hot-toast'

export default function Login() {
  const navigate = useNavigate()
  const checkSession = useUserStore((state) => state.checkSession)
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 }
    }
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100 } }
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      await checkSession()
      toast.success("Login Berhasil! 🚀")
      navigate('/')
    } catch (error) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setLoading(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: 'com.titipin.app://google-auth' }
    })
    if (error) {
        toast.error(error.message)
    } else {
        await checkSession()
        setLoading(false)
    }
  }

  return (
    // REVISI LAYOUT:
    // 1. min-h-[100dvh]: Agar bisa discroll kalau konten kepanjangan/keyboard muncul
    // 2. py-12: Memberi jarak pasti di atas dan bawah (biar gak mepet)
    <div className="min-h-[100dvh] w-full bg-white relative flex flex-col justify-center py-12 px-6">
      
      {/* BACKGROUND VISUALS (Fixed agar tidak ikut scroll) */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-20%] w-[80vw] h-[80vw] bg-green-400/20 rounded-full blur-[80px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] left-[-20%] w-[70vw] h-[70vw] bg-blue-500/20 rounded-full blur-[80px]"></div>
      </div>

      {/* MAIN CONTENT */}
      <motion.div 
        className="relative z-10 w-full max-w-md mx-auto"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        
        {/* HEADER */}
        <motion.div variants={itemVariants} className="mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-50 border border-slate-200 rounded-full mb-4">
                <Sparkles size={14} className="text-orange-500" />
                <span className="text-xs font-bold text-slate-600 tracking-wide">TITIP.IN APP</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 mb-2 leading-tight">
                Halo,<br />Kawan Lama! 👋
            </h1>
            <p className="text-gray-500 text-lg">Siap cari cuan atau nitip barang hari ini?</p>
        </motion.div>

        {/* GOOGLE BUTTON */}
        <motion.div variants={itemVariants}>
            <button 
                onClick={handleGoogleLogin}
                className="w-full bg-white border border-gray-200 rounded-2xl py-4 flex items-center justify-center gap-3 font-bold text-slate-700 hover:bg-gray-50 hover:border-gray-300 hover:shadow-md active:scale-95 transition-all duration-300"
            >
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Lanjut dengan Google
            </button>
        </motion.div>

        {/* DIVIDER */}
        <motion.div variants={itemVariants} className="flex items-center gap-4 my-6">
            <div className="h-px bg-gray-200 flex-1"></div>
            <span className="text-xs text-gray-400 font-bold tracking-widest">ATAU MANUAL</span>
            <div className="h-px bg-gray-200 flex-1"></div>
        </motion.div>

        {/* FORM */}
        <motion.form variants={itemVariants} onSubmit={handleLogin} className="space-y-4">
            <div className="group">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 block group-focus-within:text-green-600 transition-colors">Email</label>
                <div className="relative">
                    <Mail className="absolute left-4 top-3.5 text-gray-400 group-focus-within:text-green-600 transition-colors" size={20}/>
                    <input 
                        type="email" 
                        required
                        className="w-full bg-gray-50 border border-gray-200 text-slate-900 text-lg font-semibold rounded-2xl pl-12 pr-4 py-3.5 focus:bg-white focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all placeholder:text-gray-300"
                        placeholder="contoh@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </div>
            </div>

            <div className="group">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 block group-focus-within:text-green-600 transition-colors">Password</label>
                <div className="relative">
                    <Lock className="absolute left-4 top-3.5 text-gray-400 group-focus-within:text-green-600 transition-colors" size={20}/>
                    <input 
                        type="password" 
                        required
                        className="w-full bg-gray-50 border border-gray-200 text-slate-900 text-lg font-semibold rounded-2xl pl-12 pr-4 py-3.5 focus:bg-white focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all placeholder:text-gray-300"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </div>
            </div>

            <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-slate-900 text-white font-bold text-lg rounded-2xl py-4 shadow-xl shadow-slate-200 hover:bg-slate-800 active:scale-95 transition-all flex items-center justify-center gap-2 mt-6"
            >
                {loading ? <Loader2 className="animate-spin" /> : <>Masuk <ArrowRight size={20}/></>}
            </button>
        </motion.form>

        <motion.p variants={itemVariants} className="mt-8 text-center text-gray-500 text-sm">
            Baru di sini? <Link to="/register" className="text-green-600 font-black hover:underline decoration-2 underline-offset-4">Buat Akun Gratis</Link>
        </motion.p>

      </motion.div>
    </div>
  )
}