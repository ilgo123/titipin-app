import { useEffect, useState } from 'react'
import { supabase } from '../services/supabaseClient'
import { useUserStore } from '../store/useUserStore'
import { Bell, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function NotificationListener() {
  const { user } = useUserStore()
  const navigate = useNavigate()
  const [notification, setNotification] = useState(null)
  const [sound] = useState(new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3')) // Sound effect simpel

  useEffect(() => {
    if (!user) return

    // Pasang Telinga (Listener) ke Tabel Notifications
    const channel = supabase
      .channel('realtime-notifications')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        (payload) => {
          // 1. Mainkan Suara
          sound.play().catch(() => {}) // Catch error jika browser memblokir autoplay
          
          // 2. Tampilkan Popup
          setNotification(payload.new)

          // 3. Hilangkan otomatis setelah 4 detik
          setTimeout(() => setNotification(null), 4000)
        }
      )
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [user])

  if (!notification) return null

  return (
    <div className="fixed top-4 left-4 right-4 z-[9999] animate-in slide-in-from-top-5 fade-in duration-300">
      <div 
        onClick={() => {
            if(notification.link) navigate(notification.link);
            setNotification(null);
        }}
        className="bg-slate-900 text-white p-4 rounded-2xl shadow-2xl flex items-center gap-4 cursor-pointer border border-slate-700 backdrop-blur-md bg-opacity-95"
      >
        <div className="bg-green-500 p-2 rounded-full animate-bounce">
            <Bell size={20} className="text-white" />
        </div>
        <div className="flex-1">
            <h4 className="font-bold text-sm text-green-400">{notification.title}</h4>
            <p className="text-xs text-slate-200 line-clamp-2">{notification.message}</p>
        </div>
        <button 
            onClick={(e) => { e.stopPropagation(); setNotification(null); }}
            className="p-1 hover:bg-white/10 rounded-full"
        >
            <X size={16} className="text-slate-400"/>
        </button>
      </div>
    </div>
  )
}