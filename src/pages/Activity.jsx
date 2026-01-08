import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../services/supabaseClient'
import { useUserStore } from '../store/useUserStore'
import { ChevronLeft, Package, Truck, CheckCircle2, Clock, ShoppingBag, ArrowRight, RefreshCw, Plus, Trash2, Loader2, AlertCircle } from 'lucide-react'
import { Skeleton } from '../components/ui/Skeleton'
import { toast } from 'react-hot-toast'
import ConfirmModal from '../components/ConfirmModal'

export default function Activity() {
  const navigate = useNavigate()
  const { user, checkSession } = useUserStore() 
  
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('requests')
  const [cancelingId, setCancelingId] = useState(null)
  
  const [myRequests, setMyRequests] = useState([])
  const [myJobs, setMyJobs] = useState([])

  useEffect(() => {
    fetchActivity()
  }, [])

  const fetchActivity = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('orders')
      .select(`*, requester:requester_id(full_name, avatar_url), traveler:traveler_id(full_name, avatar_url)`)
      .or(`requester_id.eq.${user.id},traveler_id.eq.${user.id}`)
      .order('created_at', { ascending: false })

    if (!error) {
        setMyRequests(data.filter(o => o.requester_id === user.id))
        setMyJobs(data.filter(o => o.traveler_id === user.id))
    }
    setLoading(false)
  }

  // --- LOGIC BARU: CANCEL & REFUND ---
// 1. Fungsi Buka Modal
const openCancelModal = (e, order) => {
    e.stopPropagation()
    setSelectedOrder(order)
    setShowCancelModal(true)
}

// 2. Fungsi Eksekusi (Dipindah ke sini)
const onConfirmCancel = async () => {
    if (!selectedOrder) return

    // Tutup modal biar gak ganggu loading
    setShowCancelModal(false) 
    const toastId = toast.loading('Membatalkan pesanan...')
    setCancelingId(selectedOrder.id)

    try {
        const { error } = await supabase.rpc('cancel_order_refund', {
            p_order_id: selectedOrder.id,
            p_user_id: user.id
        })

        if (error) throw error

        toast.success("Pesanan dibatalkan. Saldo kembali! 💰", { id: toastId })
        await checkSession() 
        fetchActivity()

    } catch (error) {
        toast.error("Gagal: " + error.message, { id: toastId })
    } finally {
        setCancelingId(null)
    }
}

  const getStatusConfig = (status) => {
    switch(status) {
        case 'open': return { color: 'bg-gray-100 text-gray-500', icon: <Clock size={14}/>, label: 'Menunggu Traveler' }
        case 'taken': return { color: 'bg-blue-50 text-blue-600', icon: <Package size={14}/>, label: 'Diproses' }
        case 'bought': return { color: 'bg-purple-50 text-purple-600', icon: <ShoppingBag size={14}/>, label: 'Sudah Dibeli' }
        case 'otw': return { color: 'bg-orange-50 text-orange-600', icon: <Truck size={14}/>, label: 'Sedang Diantar' }
        case 'done': return { color: 'bg-green-50 text-green-600', icon: <CheckCircle2 size={14}/>, label: 'Selesai' }
        case 'cancelled': return { color: 'bg-red-50 text-red-500', icon: <AlertCircle size={14}/>, label: 'Dibatalkan' }
        default: return { color: 'bg-gray-100 text-gray-500', icon: <Clock size={14}/>, label: status }
    }
  }

  const formatRp = (num) => new Intl.NumberFormat('id-ID').format(num)

  const [showCancelModal, setShowCancelModal] = useState(false)
const [selectedOrder, setSelectedOrder] = useState(null)

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      
      {/* HEADER */}
      <div className="bg-white sticky top-0 z-20 shadow-sm pt-6 pb-0">
        <div className="px-6 flex justify-between items-center mb-4">
            <div>
                <button onClick={() => navigate('/')} className="flex items-center gap-1 text-sm font-bold text-gray-400 mb-1 hover:text-slate-900 transition-colors">
                    <ChevronLeft size={18}/> Kembali
                </button>
                <h1 className="text-2xl font-black text-slate-900">Aktivitas 📦</h1>
            </div>
            <button onClick={fetchActivity} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 active:scale-90 transition-all text-slate-600">
                <RefreshCw size={20} className={loading ? 'animate-spin' : ''}/>
            </button>
        </div>

        {/* TAB SWITCHER */}
        <div className="flex px-6 border-b border-gray-200">
            <button 
                onClick={() => setActiveTab('requests')}
                className={`flex-1 pb-4 text-sm font-bold transition-all border-b-2 ${activeTab === 'requests' ? 'border-slate-900 text-slate-900' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
            >
                Titipan Saya
            </button>
            <button 
                onClick={() => setActiveTab('jobs')}
                className={`flex-1 pb-4 text-sm font-bold transition-all border-b-2 ${activeTab === 'jobs' ? 'border-slate-900 text-slate-900' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
            >
                Pekerjaan
            </button>
        </div>
      </div>

      {/* CONTENT */}
      <div className="p-6 space-y-4">
        {loading ? (
             [1, 2].map((i) => <Skeleton key={i} className="h-32 w-full rounded-3xl" />)
        ) : (
            <>
                {(activeTab === 'requests' ? myRequests : myJobs).length === 0 ? (
                    /* EMPTY STATE */
                    <div className="flex flex-col items-center justify-center py-16 text-center opacity-60">
                        <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mb-4 text-gray-400">
                            {activeTab === 'requests' ? <Package size={32}/> : <Truck size={32}/>}
                        </div>
                        <h3 className="font-bold text-gray-600 text-lg">Kosong Melompong</h3>
                        <p className="text-xs text-gray-400 max-w-[200px] mb-6">
                            {activeTab === 'requests' ? 'Belum ada titipan aktif.' : 'Belum ada pekerjaan diambil.'}
                        </p>
                        <button 
                            onClick={() => navigate(activeTab === 'requests' ? '/penitip' : '/traveler')}
                            className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-lg flex items-center gap-2"
                        >
                            {activeTab === 'requests' ? <><Plus size={18}/> Buat Titipan</> : 'Cari Cuan'}
                        </button>
                    </div>
                ) : (
                    /* LIST ORDER */
                    (activeTab === 'requests' ? myRequests : myJobs).map((order) => {
                        const status = getStatusConfig(order.status)
                        const opponent = activeTab === 'requests' ? order.traveler : order.requester
                        
                        return (
                            <div 
                                key={order.id} 
                                // --- PERUBAHAN DI SINI: Navigasi ke Order Detail ---
                                onClick={() => order.status !== 'cancelled' && navigate(`/order-detail/${order.id}`)}
                                className={`bg-white p-5 rounded-[1.5rem] shadow-sm border border-slate-100 relative overflow-hidden group transition-all ${order.status === 'cancelled' ? 'opacity-60 grayscale' : 'hover:shadow-md cursor-pointer'}`}
                            >
                                {/* HEADER CARD */}
                                <div className="flex justify-between items-start mb-3">
                                    <h3 className={`font-bold text-lg line-clamp-1 ${order.status === 'cancelled' ? 'text-gray-400 line-through' : 'text-slate-900'}`}>
                                        {order.item}
                                    </h3>
                                    
                                    {/* STATUS BADGE */}
                                    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${status.color}`}>
                                        {status.icon} {status.label}
                                    </div>
                                </div>

                                {/* RUTE */}
                                <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                                    <div className="flex items-center gap-1 min-w-0">
                                        <span className="text-[10px] bg-gray-100 px-1.5 py-0.5 rounded font-bold">DARI</span>
                                        <span className="font-medium truncate max-w-[80px]">{order.from_location}</span>
                                    </div>
                                    <ArrowRight size={14} className="opacity-30 shrink-0"/>
                                    <div className="flex items-center gap-1 min-w-0">
                                        <span className="text-[10px] bg-gray-100 px-1.5 py-0.5 rounded font-bold">KE</span>
                                        <span className="font-medium truncate max-w-[80px]">{order.to_location}</span>
                                    </div>
                                </div>

                                <div className="h-px bg-gray-100 w-full mb-3"></div>

                                {/* FOOTER CARD */}
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                        {/* AVATAR LAWAN */}
                                        <div className="w-6 h-6 rounded-full bg-gray-200 overflow-hidden">
                                            {opponent ? <img src={opponent.avatar_url} className="w-full h-full object-cover"/> : <div className="w-full h-full bg-slate-300"/>}
                                        </div>
                                        <span className="text-xs font-bold text-gray-500">
                                            {opponent ? opponent.full_name.split(' ')[0] : '...'}
                                        </span>
                                    </div>

                                    {/* TOMBOL BATALKAN (Hanya muncul jika Tab Request, Status Open, dan Tidak Cancelled) */}
                                    {activeTab === 'requests' && order.status === 'open' ? (
                                        <button 
                                            onClick={(e) => openCancelModal(e, order)}
                                            disabled={cancelingId === order.id}
                                            className="flex items-center gap-1 text-red-500 bg-red-50 px-3 py-1.5 rounded-lg text-[10px] font-bold hover:bg-red-100 transition-colors z-20"
                                        >
                                            {cancelingId === order.id ? <Loader2 size={12} className="animate-spin"/> : <Trash2 size={12}/>}
                                            Batalkan
                                        </button>
                                    ) : (
                                        <div className="text-right">
                                            <p className="text-[10px] text-gray-400 font-bold uppercase">
                                                {activeTab === 'requests' ? 'Total' : 'Komisi'}
                                            </p>
                                            <p className={`text-sm font-black ${activeTab === 'requests' ? 'text-slate-800' : 'text-green-600'}`}>
                                                Rp {formatRp(activeTab === 'requests' ? (order.price + order.tip) : order.tip)}
                                            </p>
                                        </div>
                                    )}
                                <ConfirmModal 
    isOpen={showCancelModal}
    onClose={() => setShowCancelModal(false)}
    onConfirm={onConfirmCancel}
    // type="danger" // Merah karena berbahaya
    title="Batalkan Pesanan?"
    message={`Yakin batalkan "${selectedOrder?.item}"? Saldo akan dikembalikan ke dompetmu.`}
    confirmText="Ya, Batalkan"
/>
                                </div>

                            </div>
                        )
                    })
                )}
            </>
        )}
      </div>
    </div>
  )
}