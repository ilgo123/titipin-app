import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../services/supabaseClient'
import { useUserStore } from '../store/useUserStore'
import { ChevronLeft, Bell, Check, Trash2, Loader2 } from 'lucide-react'

export default function Notifications() {
  const navigate = useNavigate()
  const { user } = useUserStore()
  const [notifs, setNotifs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchNotifs()
    markAllRead() // Otomatis tandai sudah dibaca saat dibuka
  }, [])

  const fetchNotifs = async () => {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)
    
    setNotifs(data || [])
    setLoading(false)
  }

  const markAllRead = async () => {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false)
  }

  const handleClearAll = async () => {
      if(!confirm("Hapus semua notifikasi?")) return
      await supabase.from('notifications').delete().eq('user_id', user.id)
      setNotifs([])
  }

  // Format waktu relatif (e.g., "5 menit lalu")
  const timeAgo = (date) => {
      const seconds = Math.floor((new Date() - new Date(date)) / 1000)
      let interval = seconds / 31536000
      if (interval > 1) return Math.floor(interval) + " tahun lalu"
      interval = seconds / 2592000
      if (interval > 1) return Math.floor(interval) + " bulan lalu"
      interval = seconds / 86400
      if (interval > 1) return Math.floor(interval) + " hari lalu"
      interval = seconds / 3600
      if (interval > 1) return Math.floor(interval) + " jam lalu"
      interval = seconds / 60
      if (interval > 1) return Math.floor(interval) + " menit lalu"
      return "Baru saja"
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white sticky top-0 z-10 px-6 pt-6 pb-4 shadow-sm flex justify-between items-center">
        <div className="flex items-center gap-2">
            <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors">
                <ChevronLeft size={24} className="text-slate-900"/>
            </button>
            <h1 className="text-xl font-black text-slate-900">Notifikasi 🔔</h1>
        </div>
        {notifs.length > 0 && (
            <button onClick={handleClearAll} className="p-2 text-red-500 hover:bg-red-50 rounded-full">
                <Trash2 size={18}/>
            </button>
        )}
      </div>

      <div className="p-4 space-y-3">
        {loading ? (
             <div className="flex justify-center py-10"><Loader2 className="animate-spin text-slate-400"/></div>
        ) : notifs.length === 0 ? (
            <div className="text-center py-20 opacity-50 flex flex-col items-center">
                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-4 text-gray-400">
                    <Bell size={24}/>
                </div>
                <h3 className="font-bold text-gray-600">Sepi banget...</h3>
                <p className="text-xs text-gray-400">Belum ada kabar terbaru buatmu.</p>
            </div>
        ) : (
            notifs.map(n => (
                <div 
                    key={n.id} 
                    onClick={() => n.link && navigate(n.link)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${
                        n.is_read ? 'bg-white border-gray-100' : 'bg-blue-50 border-blue-100'
                    }`}
                >
                    {!n.is_read && <div className="absolute top-4 right-4 w-2 h-2 bg-blue-500 rounded-full"></div>}
                    
                    <div className="flex gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                             n.title.includes('Dompet') ? 'bg-green-100 text-green-600' :
                             n.title.includes('Pesan') ? 'bg-blue-100 text-blue-600' :
                             'bg-orange-100 text-orange-600'
                        }`}>
                            <Bell size={18}/>
                        </div>
                        <div>
                            <h4 className="font-bold text-sm text-slate-900">{n.title}</h4>
                            <p className="text-xs text-slate-500 mt-1 leading-relaxed">{n.message}</p>
                            <p className="text-[10px] text-gray-400 mt-2 font-medium">{timeAgo(n.created_at)}</p>
                        </div>
                    </div>
                </div>
            ))
        )}
      </div>
    </div>
  )
}