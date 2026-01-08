import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom' 
import { supabase } from '../services/supabaseClient'
import { useUserStore } from '../store/useUserStore'
import { 
  ChevronLeft, MessageCircle, CheckCircle2, Package, 
  MapPin, Clock, User, Loader2, Copy, AlertTriangle, ShieldCheck
} from 'lucide-react'

export default function OrderDetail() {
  const navigate = useNavigate()
  const { id } = useParams() 
  const { user } = useUserStore()
  
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    if (id) fetchOrderDetail()
  }, [id])

  const fetchOrderDetail = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          requester:profiles!requester_id(full_name, avatar_url),
          traveler:profiles!traveler_id(full_name, avatar_url)
        `)
        .eq('id', id)
        .single()

      if (error) throw error
      setOrder(data)
      
    } catch (err) {
      console.error("Gagal ambil detail:", err)
      setErrorMsg(err.message || "Terjadi kesalahan sistem")
    } finally {
      setLoading(false)
    }
  }

  const formatRp = (num) => new Intl.NumberFormat('id-ID').format(num || 0)

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-slate-300"/></div>

  if (errorMsg || !order) return (
    <div className="h-screen flex flex-col items-center justify-center p-6 text-center">
        <AlertTriangle size={48} className="text-red-500 mb-4"/>
        <h3 className="font-bold text-lg text-slate-900">Gagal Memuat Data</h3>
        <p className="text-sm text-red-500 bg-red-50 p-3 rounded-lg mt-2 mb-6 font-mono border border-red-100">
            {errorMsg || "Data tidak ditemukan"}
        </p>
        <button onClick={() => navigate('/activity')} className="bg-slate-900 text-white px-6 py-2 rounded-xl text-sm font-bold">
            Kembali
        </button>
    </div>
  )

  const steps = ['open', 'taken', 'bought', 'otw', 'done']
  const currentStepIndex = steps.indexOf(order.status)
  
  const isRequester = user.id === order.requester_id
  const opponent = isRequester ? order.traveler : order.requester
  const roleLabel = isRequester ? 'Traveler Kamu' : 'Pemilik Titipan'

  return (
    <div className="min-h-screen bg-gray-50 pb-24 relative">
      
      {/* HEADER */}
      <div className="bg-slate-900 text-white pt-8 pb-20 px-6 rounded-b-[2.5rem] relative overflow-hidden shadow-lg">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
          
          <div className="flex items-center gap-3 relative z-10 mb-6">
              <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-white/20 rounded-full transition-colors">
                  <ChevronLeft/>
              </button>
              <h1 className="font-bold text-lg">Detail Pesanan</h1>
          </div>

          <div className="text-center relative z-10">
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Total Biaya</p>
              <h2 className="text-3xl font-black">Rp {formatRp(order.price + order.tip)}</h2>
              
              {/* PERBAIKAN DI SINI: Pakai String() agar aman untuk ID angka */}
              <div className="flex items-center justify-center gap-1 mt-2 text-xs text-slate-300 bg-white/10 py-1 px-3 rounded-full w-fit mx-auto">
                  <span className="opacity-70">ID: {String(order.id).slice(0, 8)}</span>
                  <button onClick={() => navigator.clipboard.writeText(String(order.id))}><Copy size={10}/></button>
              </div>
          </div>
      </div>

      {/* CARD CONTENT */}
      <div className="px-6 -mt-12 relative z-20 space-y-4">
          
          {/* STATUS TRACKER */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
              <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Clock size={18} className="text-blue-500"/> Status Pesanan
              </h3>
              
              <div className="relative flex justify-between items-center text-[10px] font-bold text-gray-400">
                  <div className="absolute top-3 left-0 w-full h-1 bg-gray-100 -z-10 rounded-full"></div>
                  <div className="absolute top-3 left-0 h-1 bg-green-500 -z-10 rounded-full transition-all duration-500" style={{ width: `${(currentStepIndex / (steps.length - 1)) * 100}%` }}></div>

                  {steps.map((step, idx) => (
                      <div key={step} className={`flex flex-col items-center gap-1 ${currentStepIndex >= idx ? 'text-green-600' : ''}`}>
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center border-2 ${currentStepIndex >= idx ? 'bg-green-500 border-green-500 text-white' : 'bg-white border-gray-200'}`}>
                              {step === 'done' ? <CheckCircle2 size={14}/> : idx + 1}
                          </div>
                          <span className="uppercase">{step === 'otw' ? 'OTW' : step}</span>
                      </div>
                  ))}
              </div>
          </div>

          {/* ITEM INFO */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
              <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Package size={18} className="text-orange-500"/> Detail Barang
              </h3>
              <div className="space-y-3">
                  <div className="flex justify-between border-b border-gray-50 pb-2">
                      <span className="text-gray-500 text-sm">Nama Barang</span>
                      <span className="font-bold text-slate-900 text-right max-w-[60%]">{order.item}</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-50 pb-2">
                      <span className="text-gray-500 text-sm">Lokasi Pembelian</span>
                      <span className="font-bold text-slate-900 text-sm flex items-center gap-1"><MapPin size={12}/> {order.from_location}</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-50 pb-2">
                      <span className="text-gray-500 text-sm">Tujuan Antar</span>
                      <span className="font-bold text-slate-900 text-sm flex items-center gap-1"><MapPin size={12}/> {order.to_location}</span>
                  </div>
              </div>
          </div>

          {/* OPPONENT PROFILE */}
          {opponent && (
            <div className="bg-white p-4 rounded-2xl border border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-full overflow-hidden">
                        <img src={opponent.avatar_url} className="w-full h-full object-cover"/>
                    </div>
                    <div>
                        <p className="text-xs text-gray-400 font-bold uppercase">{roleLabel}</p>
                        <h4 className="font-bold text-slate-900 flex items-center gap-1">
                            {opponent.full_name}
                        </h4>
                    </div>
                </div>
                <button 
                    onClick={() => navigate('/chat', { state: { orderId: order.id } })}
                    className="bg-blue-50 text-blue-600 p-2 rounded-xl hover:bg-blue-100 transition-colors"
                >
                    <MessageCircle size={20}/>
                </button>
            </div>
          )}
      </div>

      <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-100 p-4 pb-6 z-30">
          <button 
             onClick={() => navigate('/chat', { state: { orderId: order.id } })}
             className="w-full bg-slate-900 text-white py-3.5 rounded-xl font-bold text-sm shadow-lg shadow-slate-200 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
             <MessageCircle size={18}/> Buka Percakapan
          </button>
      </div>
    </div>
  )
}