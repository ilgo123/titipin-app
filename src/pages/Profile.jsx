import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../services/supabaseClient'
import { useUserStore } from '../store/useUserStore'
import { 
  ChevronLeft, LogOut, CreditCard, User, Settings, 
  HelpCircle, Shield, Plus, Camera, Wallet, Save, Loader2, 
  ShieldCheck, ChevronRight, Star, List 
} from 'lucide-react'
import { toast } from 'react-hot-toast'

export default function Profile() {
  const navigate = useNavigate()
  const { user, clearUser, checkSession } = useUserStore()
  
  const [loading, setLoading] = useState(false)
  const [dataLoading, setDataLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  
  const [username, setUsername] = useState('')
  const [avatarUrl, setAvatarUrl] = useState(null)
  const [isEditing, setIsEditing] = useState(false)

  useEffect(() => {
    if (user?.id) getProfile()
  }, [user?.id])

  const getProfile = async () => {
    try {
      setDataLoading(true)
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, avatar_url, balance, is_verified, rating, review_count')
        .eq('id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading profile:', error.message)
      }

      if (data) {
        setUsername(data.full_name || user?.user_metadata?.full_name || '')
        setAvatarUrl(data.avatar_url)
      }
    } catch (error) {
      console.log('Error loading profile:', error.message)
    } finally {
      setDataLoading(false)
    }
  }

  const updateProfile = async () => {
    try {
      setLoading(true)
      const { error } = await supabase
        .from('profiles')
        .update({ 
            full_name: username,
            updated_at: new Date(),
        })
        .eq('id', user.id)

      if (error) throw error
      
      await checkSession()
      setIsEditing(false)
      toast.success('Nama berhasil disimpan! ✨')
    } catch (error) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  const uploadAvatar = async (event) => {
    try {
      setUploading(true)
      if (!event.target.files || event.target.files.length === 0) return

      const file = event.target.files[0]
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}-${Math.random()}.${fileExt}`
      const filePath = `${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath)
      
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: data.publicUrl })
        .eq('id', user.id)

      if (updateError) throw updateError

      setAvatarUrl(data.publicUrl)
      await checkSession()
      toast.success('Foto profil baru keren! 📸')

    } catch (error) {
      toast.error('Gagal upload: ' + error.message)
    } finally {
      setUploading(false)
    }
  }

  const handleLogout = async () => {
    if (!confirm('Yakin ingin keluar akun?')) return
    await supabase.auth.signOut()
    clearUser()
    navigate('/login')
  }

  const formatRp = (num) => new Intl.NumberFormat('id-ID').format(num || 0)

  return (
    <div className="min-h-screen bg-gray-50 pb-24 relative">
      
      {/* TOMBOL KEMBALI */}
      <button 
        onClick={() => navigate('/')} 
        className="absolute top-6 left-6 z-30 p-2 bg-white/20 backdrop-blur-md rounded-full text-slate-900 hover:bg-white transition-all shadow-sm"
      >
        <ChevronLeft size={24} />
      </button>

      {/* HEADER PROFILE */}
      <div className="bg-white px-6 pt-16 pb-8 rounded-b-[2.5rem] shadow-sm relative overflow-hidden">
         <div className="absolute top-[-50%] right-[-10%] w-64 h-64 bg-slate-50 rounded-full blur-3xl -z-10"></div>

         <div className="flex flex-col items-center text-center">
            
            {/* AVATAR */}
            <div className="relative mb-4 group cursor-pointer">
                <label htmlFor="single" className="cursor-pointer block relative">
                    <div className="w-24 h-24 rounded-full border-4 border-white shadow-lg overflow-hidden bg-slate-200">
                        {uploading || dataLoading ? (
                            <div className="w-full h-full flex items-center justify-center bg-slate-100">
                                <Loader2 className="animate-spin text-slate-400"/>
                            </div>
                        ) : avatarUrl ? (
                            <img src={avatarUrl} className="w-full h-full object-cover" alt="Profile"/>
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-slate-800 text-white font-bold text-2xl">
                                {(username || user?.email || 'U').charAt(0).toUpperCase()}
                            </div>
                        )}
                    </div>
                    <div className="absolute bottom-0 right-0 bg-slate-900 text-white p-2 rounded-full border-2 border-white shadow-md hover:scale-110 transition-transform">
                        <Camera size={14} />
                    </div>
                </label>
                <input type="file" id="single" accept="image/*" onChange={uploadAvatar} disabled={uploading} className="hidden" />
            </div>

            {/* EDITABLE NAME */}
            <div className="relative w-full max-w-[250px] flex flex-col items-center">
                {dataLoading ? (
                    <div className="h-8 w-32 bg-gray-200 rounded animate-pulse mb-1"></div>
                ) : (
                    <div className="relative w-full flex items-center justify-center gap-1">
                        <input 
                            type="text" 
                            value={username}
                            onChange={(e) => {
                                setUsername(e.target.value)
                                setIsEditing(true)
                            }}
                            placeholder="Tulis Nama Kamu"
                            className="text-xl font-black text-slate-900 text-center bg-transparent border-b-2 border-transparent hover:border-gray-200 focus:border-slate-900 outline-none transition-colors pb-1 px-2 w-auto min-w-[100px]"
                        />
                        
                        {user?.is_verified && (
                            <div className="bg-blue-500 text-white p-0.5 rounded-full shrink-0" title="Terverifikasi">
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                        )}

                        {!isEditing && (
                            <div className="absolute right-0 top-1 text-gray-300 pointer-events-none opacity-0">
                                <User size={14}/>
                            </div>
                        )}
                    </div>
                )}
                
                <p className="text-sm text-gray-500 font-medium mt-1">{user?.email}</p>

                {/* RATING DISPLAY */}
                <div className="flex items-center gap-4 mt-4 bg-white/50 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/40 shadow-sm">
                    <div className="text-center">
                        <p className="text-[10px] text-gray-400 font-bold uppercase">Rating</p>
                        <div className="flex items-center gap-1">
                            <Star size={14} className="text-yellow-500 fill-yellow-500"/>
                            <span className="font-black text-slate-900">{user?.rating ? user.rating.toFixed(1) : '0.0'}</span>
                        </div>
                    </div>
                    <div className="w-px h-6 bg-gray-200"></div>
                    <div className="text-center">
                        <p className="text-[10px] text-gray-400 font-bold uppercase">Review</p>
                        <span className="font-black text-slate-900">{user?.review_count || 0}</span>
                    </div>
                </div>

                {isEditing && (
                    <button 
                        onClick={updateProfile}
                        disabled={loading}
                        className="mt-4 bg-green-600 text-white px-6 py-2 rounded-full text-xs font-bold shadow-md hover:bg-green-700 transition-all flex items-center gap-2 animate-in fade-in slide-in-from-top-2"
                    >
                        {loading ? <Loader2 size={14} className="animate-spin"/> : <><Save size={14}/> Simpan Nama</>}
                    </button>
                )}
            </div>
         </div>
      </div>

      <div className="px-6 -mt-6">
        {/* WALLET CARD */}
        <div className="bg-slate-900 rounded-3xl p-6 text-white shadow-xl shadow-slate-200 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl transform translate-x-10 -translate-y-10"></div>
            
            <div className="flex justify-between items-start mb-6 relative z-10">
                <div className="flex items-center gap-2 text-slate-300">
                    <Wallet size={18} />
                    <span className="text-xs font-bold uppercase tracking-widest">TitipPay</span>
                </div>
                <div className="w-10 h-7 border border-white/20 rounded bg-gradient-to-br from-white/10 to-transparent"></div>
            </div>

            <div className="mb-6 relative z-10">
                <p className="text-xs text-slate-400 font-medium mb-1">Saldo Aktif</p>
                <h2 className="text-3xl font-black tracking-tight">Rp {formatRp(user?.balance)}</h2>
            </div>

            {/* TOMBOL ACTION (TopUp & History) */}
            <div className="flex gap-3">
                <button 
                    onClick={() => navigate('/topup')}
                    className="flex-1 bg-white text-slate-900 py-3 rounded-xl font-bold text-sm hover:bg-gray-100 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                    <Plus size={18} /> Top Up
                </button>
                <button 
                    onClick={() => navigate('/wallet-history')}
                    className="flex-1 bg-slate-800 text-white py-3 rounded-xl font-bold text-sm hover:bg-slate-700 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                    <List size={18} /> History
                </button>
            </div>
        </div>
      </div>

      {/* MENU LAINNYA */}
      <div className="px-6 mt-8 space-y-6">
        {!user?.is_verified && (
            <div className="mb-4">
                <div className="bg-blue-50 border border-blue-100 rounded-3xl overflow-hidden">
                     <button onClick={() => navigate('/verification')} className="w-full flex items-center justify-between p-4 hover:bg-blue-100 transition-colors group">
                        <div className="flex items-center gap-4 text-blue-700">
                            <div className="p-2 bg-white rounded-full">
                                <ShieldCheck size={20}/>
                            </div>
                            <span className="font-bold text-sm">Verifikasi Akun Sekarang</span>
                        </div>
                        <ChevronRight size={18} className="text-blue-300 group-hover:text-blue-700"/>
                    </button>
                </div>
            </div>
        )}

        <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 px-2">Keuangan</h3>
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                <MenuItem 
                    icon={<CreditCard size={20}/>} 
                    label="Tarik Saldo (Withdraw)" 
                    onClick={() => navigate('/withdraw')} 
                />
                <div className="h-px bg-gray-50 mx-4"></div>
                <MenuItem icon={<Settings size={20}/>} label="Pengaturan Aplikasi" />
            </div>
        </div>

        <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 px-2">Lainnya</h3>
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                <MenuItem icon={<HelpCircle size={20}/>} label="Pusat Bantuan" />
                <div className="h-px bg-gray-50 mx-4"></div>
                <MenuItem icon={<Shield size={20}/>} label="Kebijakan Privasi" />
            </div>
        </div>

        <button 
            onClick={handleLogout}
            className="w-full py-4 rounded-3xl border border-red-100 bg-red-50 text-red-600 font-bold flex items-center justify-center gap-2 hover:bg-red-100 active:scale-95 transition-all"
        >
            <LogOut size={20} />
            Keluar Aplikasi
        </button>

        <p className="text-center text-[10px] text-gray-300 font-bold pt-4 pb-8">Versi 1.0.0</p>
      </div>
    </div>
  )
}

function MenuItem({ icon, label, onClick }) {
    return (
        <button onClick={onClick} className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors group">
            <div className="flex items-center gap-4 text-slate-600 group-hover:text-slate-900 transition-colors">
                <div className="p-2 bg-gray-100 rounded-full group-hover:bg-white group-hover:shadow-sm transition-all">
                    {icon}
                </div>
                <span className="font-bold text-sm">{label}</span>
            </div>
        </button>
    )
}