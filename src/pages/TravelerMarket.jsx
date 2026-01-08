import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../services/supabaseClient'
import { useUserStore } from '../store/useUserStore'
import { 
  ChevronLeft, Package, MapPin, Search, ArrowRight, 
  Loader2, FilterX, Clock, SlidersHorizontal, X 
} from 'lucide-react'
import { Skeleton } from '../components/ui/Skeleton'
import { toast } from 'react-hot-toast'
import ConfirmModal from '../components/ConfirmModal'

export default function TravelerMarket() {
  const navigate = useNavigate()
  const { user } = useUserStore()
  
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  
  // STATE PENCARIAN & FILTER
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedTerm, setDebouncedTerm] = useState('')
  const [filterOpen, setFilterOpen] = useState(false)
  const [selectedFrom, setSelectedFrom] = useState('')
  const [selectedTo, setSelectedTo] = useState('')

  // DATA LOKASI UNIK (Untuk Dropdown Filter)
  const [locationsFrom, setLocationsFrom] = useState([])
  const [locationsTo, setLocationsTo] = useState([])

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedOrderId, setSelectedOrderId] = useState(null)

  // --- 1. EFEK DEBOUNCE (Biar gak request server tiap ketik huruf) ---
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedTerm(searchTerm), 500)
    return () => clearTimeout(timer)
  }, [searchTerm])

  // --- 2. FETCH DATA ---
  useEffect(() => {
    if (user) fetchOrders()
  }, [user, debouncedTerm, selectedFrom, selectedTo])

  const fetchOrders = async () => {
    setLoading(true)
    
    // Query Dasar
    let query = supabase
      .from('orders')
      .select(`*, requester:requester_id(full_name, avatar_url, rating)`)
      .eq('status', 'open')
      .neq('requester_id', user.id)
      .order('created_at', { ascending: false })

    // Filter Kata Kunci
    if (debouncedTerm) {
        query = query.or(`item.ilike.%${debouncedTerm}%,from_location.ilike.%${debouncedTerm}%,to_location.ilike.%${debouncedTerm}%`)
    }

    // Filter Lokasi Dropdown
    if (selectedFrom) query = query.eq('from_location', selectedFrom)
    if (selectedTo) query = query.eq('to_location', selectedTo)

    const { data, error } = await query

    if (error) {
        console.error(error)
    } else {
        setOrders(data || [])
        
        // Ambil semua lokasi unik dari data (untuk opsi filter)
        // Note: Idealnya ini diambil dari query terpisah agar lengkap, 
        // tapi ambil dari data yang ada sudah cukup untuk MVP.
        if (!debouncedTerm && !selectedFrom && !selectedTo) {
             const froms = [...new Set(data.map(o => o.from_location))]
             const tos = [...new Set(data.map(o => o.to_location))]
             setLocationsFrom(froms)
             setLocationsTo(tos)
        }
    }
    
    setLoading(false)
  }

  const handleTakeOrder = async (orderId) => {
    if (!confirm("Ambil pesanan ini? Pastikan kamu punya modal talangan.")) return;

    const toastId = toast.loading('Sedang memproses...')

    // 1. Update Status
    const { error } = await supabase
      .from('orders')
      .update({ status: 'taken', traveler_id: user.id })
      .eq('id', orderId)

    if (error) {
      toast.error('Gagal mengambil: ' + error.message, { id: toastId })
    } else {
      toast.success('Berhasil diambil! Mengarahkan ke chat...', { id: toastId })
      
      setTimeout(() => {
          navigate('/chat', { state: { orderId: orderId } })
      }, 1000)
    }
  }

  const formatRp = (num) => new Intl.NumberFormat('id-ID').format(num)

  // --- HELPER: TIME AGO (x menit yang lalu) ---
  const timeAgo = (dateString) => {
      const now = new Date()
      const past = new Date(dateString)
      const diffInSeconds = Math.floor((now - past) / 1000)

      if (diffInSeconds < 60) return 'Baru saja'
      
      const diffInMinutes = Math.floor(diffInSeconds / 60)
      if (diffInMinutes < 60) return `${diffInMinutes} menit lalu`

      const diffInHours = Math.floor(diffInMinutes / 60)
      if (diffInHours < 24) return `${diffInHours} jam lalu`

      const diffInDays = Math.floor(diffInHours / 24)
      return `${diffInDays} hari lalu`
  }

  // Fungsi 1: Saat tombol diklik, cuma buka modal & simpan ID
  const openConfirmModal = (orderId) => {
      setSelectedOrderId(orderId)
      setIsModalOpen(true)
  }

  // Fungsi 2: Ini yang jalan kalau user klik "Ya" di Modal
  const handleConfirmTakeOrder = async () => {
      if (!selectedOrderId) return

      // Kita pakai toast loading di sini biar keren
      const toastId = toast.loading('Memproses...')

      // (Logic ambil data sama seperti sebelumnya...)
      const { error } = await supabase
        .from('orders')
        .update({ status: 'taken', traveler_id: user.id })
        .eq('id', selectedOrderId)

      if (error) {
        toast.error('Gagal: ' + error.message, { id: toastId })
      } else {
        toast.success('Berhasil diambil!', { id: toastId })
        setIsModalOpen(false) // Tutup modal
        setTimeout(() => navigate('/chat', { state: { orderId: selectedOrderId } }), 1000)
      }
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      
      {/* HEADER + SEARCH BAR + FILTER */}
      <div className="bg-white sticky top-0 z-20 px-6 pt-6 pb-4 shadow-sm rounded-b-[2rem]">
        <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
                <button onClick={() => navigate('/')} className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors">
                    <ChevronLeft size={24} className="text-slate-900"/>
                </button>
                <h1 className="text-xl font-black text-slate-900">Cari Cuan 💰</h1>
            </div>
            
            {/* TOMBOL TOGGLE FILTER */}
            <button 
                onClick={() => setFilterOpen(!filterOpen)}
                className={`p-2.5 rounded-xl transition-all relative ${filterOpen || selectedFrom || selectedTo ? 'bg-slate-900 text-white' : 'bg-gray-100 text-slate-500'}`}
            >
                <SlidersHorizontal size={20}/>
                {(selectedFrom || selectedTo) && <div className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></div>}
            </button>
        </div>

        {/* INPUT PENCARIAN */}
        <div className="relative group">
            <div className="absolute left-4 top-3.5 text-gray-400 group-focus-within:text-slate-900 transition-colors">
                <Search size={20}/>
            </div>
            <input 
                type="text" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari barang (cth: Lumpia)"
                className="w-full bg-gray-100 border border-transparent text-slate-900 font-medium rounded-2xl pl-12 pr-10 py-3 outline-none focus:bg-white focus:border-slate-900 focus:ring-4 focus:ring-slate-100 transition-all placeholder:text-gray-400"
            />
            {searchTerm && (
                 <button onClick={() => setSearchTerm('')} className="absolute right-4 top-3.5 text-gray-400 hover:text-red-500">
                     <X size={18}/>
                 </button>
             )}
        </div>

        {/* PANEL FILTER (EXPANDABLE) */}
        {filterOpen && (
             <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 gap-3 animate-in slide-in-from-top-2">
                 <div>
                     <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Dari Kota</label>
                     <select 
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2 text-sm font-bold text-slate-900 outline-none"
                        value={selectedFrom}
                        onChange={(e) => setSelectedFrom(e.target.value)}
                     >
                         <option value="">Semua</option>
                         {locationsFrom.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                     </select>
                 </div>
                 <div>
                     <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Ke Kota</label>
                     <select 
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2 text-sm font-bold text-slate-900 outline-none"
                        value={selectedTo}
                        onChange={(e) => setSelectedTo(e.target.value)}
                     >
                         <option value="">Semua</option>
                         {locationsTo.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                     </select>
                 </div>
                 
                 {(selectedFrom || selectedTo) && (
                     <button 
                        onClick={() => { setSelectedFrom(''); setSelectedTo(''); }} 
                        className="col-span-2 text-xs font-bold text-red-500 py-1"
                     >
                         Reset Filter Lokasi
                     </button>
                 )}
             </div>
         )}
      </div>

      {/* LIST ORDERS */}
      <div className="p-6 space-y-4">
        {loading ? (
             [1, 2, 3].map(i => <Skeleton key={i} className="h-48 w-full rounded-[2rem]"/>)
        ) : orders.length === 0 ? (
            <div className="text-center py-20 opacity-50 flex flex-col items-center">
                <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mb-4 text-gray-400">
                    <FilterX size={32}/>
                </div>
                <h3 className="font-bold text-gray-600 text-lg">Tidak ditemukan</h3>
                <p className="text-xs text-gray-400 max-w-[200px]">
                    {searchTerm ? `Tidak ada orderan yang cocok dengan "${searchTerm}"` : "Belum ada titipan tersedia saat ini."}
                </p>
            </div>
        ) : (
            orders.map((order) => (
                <div key={order.id} className="bg-white p-5 rounded-[2rem] shadow-sm border border-slate-100 hover:shadow-md transition-shadow relative overflow-hidden group">
                    
                    {/* Header Card */}
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gray-100 overflow-hidden border border-white shadow-sm">
                                <img src={order.requester?.avatar_url} className="w-full h-full object-cover"/>
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-900 text-sm">{order.requester?.full_name}</h4>
                                <div className="flex items-center gap-2 text-[10px] text-gray-500 font-medium">
                                    <span className="flex items-center gap-1">
                                        ★ {order.requester?.rating ? order.requester.rating.toFixed(1) : 'New'}
                                    </span>
                                    <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                                    {/* TIME AGO DISPLAY */}
                                    <span className="flex items-center gap-1 text-slate-400">
                                        <Clock size={10}/> {timeAgo(order.created_at)}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="text-right">
                             <p className="text-[10px] text-gray-400 font-bold uppercase">Komisi</p>
                             <p className="text-lg font-black text-green-600">+Rp {formatRp(order.tip)}</p>
                        </div>
                    </div>

                    {/* Item Info */}
                    <div className="mb-4">
                        <div className="flex items-center gap-2 mb-1">
                            <Package size={18} className="text-blue-600"/>
                            <h3 className="font-bold text-lg text-slate-800 line-clamp-1">{order.item}</h3>
                        </div>
                        
                        {/* Route Chips */}
                        <div className="flex items-center gap-2 mt-3 text-xs font-medium text-gray-500">
                            <div className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-lg border border-gray-100">
                                <MapPin size={12}/> {order.from_location}
                            </div>
                            <ArrowRight size={12} className="opacity-30"/>
                            <div className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-lg border border-gray-100">
                                <MapPin size={12}/> {order.to_location}
                            </div>
                        </div>
                    </div>

                    {/* Footer / Action */}
                    <div className="pt-4 border-t border-gray-50 flex items-center justify-between">
                          <div>
                             <p className="text-[10px] text-gray-400 font-bold uppercase">Modal Talangan</p>
                             <p className="text-xs font-bold text-slate-700">Rp {formatRp(order.price)}</p>
                          </div>
                          <button 
                             onClick={() => openConfirmModal(order.id)}
                             className="bg-slate-900 text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-lg shadow-slate-200 hover:bg-slate-800 active:scale-95 transition-all flex items-center gap-2"
                          >
                             Ambil Order <ArrowRight size={14}/>
                          </button>
                    </div>

                </div>
            ))
            
        )}

        <ConfirmModal 
           isOpen={isModalOpen}
           onClose={() => setIsModalOpen(false)}
           onConfirm={handleConfirmTakeOrder}
           title="Ambil Pesanan Ini?"
           message="Pastikan kamu memiliki modal yang cukup untuk menalangi barang ini. Pembatalan sepihak akan mengurangi reputasimu."
           confirmText="Siap, Ambil!"
       />
      </div>
    </div>
  )
}