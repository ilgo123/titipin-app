import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../services/supabaseClient'
import { useUserStore } from '../store/useUserStore'
import { 
  ShieldCheck, CheckCircle2, Loader2, LogOut, Building2, AlertTriangle, UserX
} from 'lucide-react'
import { toast } from 'react-hot-toast'

export default function AdminDashboard() {
  const navigate = useNavigate()
  const { user } = useUserStore()
  
  const [activeTab, setActiveTab] = useState('withdraws')
  const [withdraws, setWithdraws] = useState([])
  const [verifications, setVerifications] = useState([])
  const [loading, setLoading] = useState(true)

  // --- GANTI DENGAN EMAIL ASLI KAMU DI SINI ---
  const ADMIN_EMAIL = "prayogoilham27@gmail.com" // <--- GANTI INI!

  useEffect(() => {
    // 1. CEK SECURITY: Kalau bukan admin, TENDANG!
    if (user?.email !== ADMIN_EMAIL) {
        toast.error("Ngapain? Kamu bukan Admin! 😡")
        navigate('/')
        return
    }

    fetchAdminData()
  }, [user])

  const fetchAdminData = async () => {
    setLoading(true)
    
    // Ambil Data Withdraw Pending
    const { data: wdData } = await supabase
      .from('withdrawals')
      .select('*, profiles(full_name, email)')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    // Ambil User Limit 20
    const { data: userData } = await supabase
      .from('profiles')
      .select('*')
      .eq('is_verified', false)
      .limit(20)

    setWithdraws(wdData || [])
    setVerifications(userData || [])
    setLoading(false)
  }

  const handleApproveWithdraw = async (wd) => {
    if(!confirm(`Setujui transfer Rp ${wd.amount} ke ${wd.bank_name}?`)) return;

    try {
        const { error } = await supabase.from('withdrawals').update({ status: 'approved' }).eq('id', wd.id)
        if (error) throw error
        toast.success("Penarikan disetujui! ✅")
        fetchAdminData() 
    } catch (err) {
        toast.error("Gagal: " + err.message)
    }
  }

  const handleRejectWithdraw = async (wd) => {
    if(!confirm("Yakin tolak dan kembalikan saldo user?")) return;

    try {
        // Kembalikan Saldo User
        const { data: currentUser } = await supabase.from('profiles').select('balance').eq('id', wd.user_id).single()
        
        await supabase.from('profiles').update({ balance: currentUser.balance + wd.amount }).eq('id', wd.user_id)
        await supabase.from('withdrawals').update({ status: 'rejected' }).eq('id', wd.id)

        toast.success("Penarikan ditolak. Saldo dikembalikan.")
        fetchAdminData()
    } catch (err) {
        toast.error("Gagal: " + err.message)
    }
  }

  const handleVerifyUser = async (userId) => {
      if(!confirm("Berikan centang biru user ini?")) return;
      await supabase.from('profiles').update({ is_verified: true }).eq('id', userId)
      toast.success("User Verified! 🔵")
      fetchAdminData()
  }

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-slate-300"/></div>

  return (
    <div className="min-h-screen bg-slate-900 text-white pb-20">
      
      {/* HEADER ADMIN */}
      <div className="p-6 flex justify-between items-center border-b border-slate-800">
          <div>
              <h1 className="text-xl font-bold flex items-center gap-2">
                  <ShieldCheck className="text-green-400"/> Admin Panel
              </h1>
              <p className="text-xs text-slate-400">Login sebagai: {user.email}</p>
          </div>
          <button onClick={() => navigate('/profile')} className="bg-slate-800 p-2 rounded-full hover:bg-slate-700">
              <LogOut size={18}/>
          </button>
      </div>

      {/* TABS */}
      <div className="flex border-b border-slate-800">
          <button 
            onClick={() => setActiveTab('withdraws')}
            className={`flex-1 py-4 text-sm font-bold ${activeTab === 'withdraws' ? 'text-white border-b-2 border-green-500 bg-slate-800' : 'text-slate-500 hover:text-slate-300'}`}
          >
              Withdraw ({withdraws.length})
          </button>
          <button 
            onClick={() => setActiveTab('users')}
            className={`flex-1 py-4 text-sm font-bold ${activeTab === 'users' ? 'text-white border-b-2 border-blue-500 bg-slate-800' : 'text-slate-500 hover:text-slate-300'}`}
          >
              Users
          </button>
      </div>

      {/* CONTENT */}
      <div className="p-4 space-y-4">
          
          {/* TAB WITHDRAW */}
          {activeTab === 'withdraws' && (
              <>
                {withdraws.length === 0 ? (
                    <div className="text-center py-10 text-slate-600">Aman, tidak ada tagihan.</div>
                ) : (
                    withdraws.map(wd => (
                        <div key={wd.id} className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <h3 className="font-bold text-lg">Rp {new Intl.NumberFormat('id-ID').format(wd.amount)}</h3>
                                    <p className="text-xs text-slate-400">{wd.profiles?.full_name}</p>
                                </div>
                                <div className="text-right">
                                    <span className="text-xs font-bold bg-yellow-500/20 text-yellow-500 px-2 py-1 rounded">PENDING</span>
                                </div>
                            </div>

                            <div className="bg-slate-900/50 p-3 rounded-lg text-sm text-slate-300 mb-4 flex items-center gap-3">
                                <Building2 size={16} className="text-slate-500"/>
                                <div>
                                    <p className="font-bold">{wd.bank_name} - {wd.account_number}</p>
                                    <p className="text-xs text-slate-500">A.N {wd.account_holder}</p>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <button onClick={() => handleRejectWithdraw(wd)} className="flex-1 py-2 bg-red-500/10 text-red-500 rounded-lg text-xs font-bold hover:bg-red-500/20">Tolak</button>
                                <button onClick={() => handleApproveWithdraw(wd)} className="flex-1 py-2 bg-green-500 text-white rounded-lg text-xs font-bold hover:bg-green-600">Transfer</button>
                            </div>
                        </div>
                    ))
                )}
              </>
          )}

          {/* TAB USERS */}
          {activeTab === 'users' && (
             verifications.map(u => (
                <div key={u.id} className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-700 rounded-full overflow-hidden">
                            <img src={u.avatar_url || "https://via.placeholder.com/100"} className="w-full h-full object-cover"/>
                        </div>
                        <div>
                            <h4 className="font-bold text-sm text-white">{u.full_name}</h4>
                            <p className="text-xs text-slate-500 truncate max-w-[150px]">{u.email}</p>
                        </div>
                    </div>
                    <button onClick={() => handleVerifyUser(u.id)} className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700"><ShieldCheck size={18}/></button>
                </div>
             ))
          )}
      </div>
    </div>
  )
}