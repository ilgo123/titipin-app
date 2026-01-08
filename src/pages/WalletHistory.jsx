import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../services/supabaseClient'
import { useUserStore } from '../store/useUserStore'
import { 
  ChevronLeft, ArrowUpRight, ArrowDownLeft, Wallet, 
  Loader2, Filter, Calendar
} from 'lucide-react'

export default function WalletHistory() {
  const navigate = useNavigate()
  const { user } = useUserStore()
  
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) fetchHistory()
  }, [user])

  const fetchHistory = async () => {
    setLoading(true)
    
    // Ambil data dari tabel 'wallet_logs'
    // Pastikan tabel ini ada di Supabase kamu ya!
    const { data, error } = await supabase
      .from('wallet_logs')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
        console.error("Gagal ambil history:", error)
    } else {
        setLogs(data || [])
    }
    setLoading(false)
  }

  const formatRp = (num) => new Intl.NumberFormat('id-ID').format(num || 0)
  
  const formatDate = (dateString) => {
      const date = new Date(dateString)
      return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute:'2-digit' })
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      
      {/* HEADER */}
      <div className="bg-white sticky top-0 z-10 px-6 pt-6 pb-4 shadow-sm">
        <div className="flex items-center gap-2 mb-2">
            <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors">
                <ChevronLeft size={24} className="text-slate-900"/>
            </button>
            <h1 className="text-xl font-black text-slate-900">Riwayat Dompet 📜</h1>
        </div>
        <p className="text-xs text-gray-400">Catatan keluar masuk uangmu.</p>
      </div>

      {/* LIST TRANSAKSI */}
      <div className="p-6 space-y-3">
        {loading ? (
             <div className="flex justify-center py-10"><Loader2 className="animate-spin text-slate-300"/></div>
        ) : logs.length === 0 ? (
            <div className="text-center py-20 opacity-50 flex flex-col items-center">
                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-4 text-gray-400">
                    <Wallet size={24}/>
                </div>
                <h3 className="font-bold text-gray-600">Belum ada transaksi</h3>
            </div>
        ) : (
            logs.map((log) => (
                <div key={log.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            log.type === 'credit' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                        }`}>
                            {log.type === 'credit' ? <ArrowDownLeft size={20}/> : <ArrowUpRight size={20}/>}
                        </div>
                        <div>
                            <h4 className="font-bold text-sm text-slate-900 capitalize">{log.category || 'Transaksi'}</h4>
                            <p className="text-[10px] text-gray-400 flex items-center gap-1">
                                <Calendar size={10}/> {formatDate(log.created_at)}
                            </p>
                        </div>
                    </div>
                    <div className={`text-right font-black ${
                        log.type === 'credit' ? 'text-green-600' : 'text-slate-900'
                    }`}>
                        {log.type === 'credit' ? '+' : '-'} Rp {formatRp(log.amount)}
                    </div>
                </div>
            ))
        )}
      </div>
    </div>
  )
}