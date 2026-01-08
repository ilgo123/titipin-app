import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../services/supabaseClient'
import { useUserStore } from '../store/useUserStore'
import { ChevronLeft, MapPin, Wallet, Loader2, ArrowRight, Package } from 'lucide-react'
import toast from 'react-hot-toast'

export default function PenitipForm() {
  const navigate = useNavigate()
  const { user } = useUserStore()
  const [loading, setLoading] = useState(false)
  
  const [form, setForm] = useState({
    item: '', from: '', to: '', price: '', tip: ''
  })

  // Hitung Total Realtime
  const totalPrice = (parseInt(form.price) || 0) + (parseInt(form.tip) || 0)
  const formatRp = (num) => new Intl.NumberFormat('id-ID').format(num)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    const priceInt = parseInt(form.price)
    const tipInt = parseInt(form.tip)

    if (!form.item || !priceInt || !tipInt || !form.from || !form.to) {
        toast.error("Mohon lengkapi data dulu ya!")
        setLoading(false)
        return
    }

    try {
        const { error } = await supabase.rpc('create_order_transaction', {
            p_item: form.item,
            p_price: priceInt,
            p_tip: tipInt,
            p_from: form.from,
            p_to: form.to,
            p_user_id: user.id
        })

        if (error) throw error

        toast.success("Berhasil! Saldo terpotong & Order dibuat.")
        navigate('/activity')

    } catch (error) {
        toast.error("Gagal: " + error.message)
    } finally {
        setLoading(false)
    }
  }

  return (
    // pb-32 penting agar konten paling bawah tidak tertutup Sticky Footer
    <div className="min-h-screen bg-gray-50 flex flex-col p-6 pb-32">
      
      {/* Header */}
      <button onClick={() => navigate('/')} className="mb-6 flex items-center gap-2 font-bold text-gray-500 hover:text-slate-900 transition-colors">
        <ChevronLeft size={20}/> Batal
      </button>

      <h1 className="text-3xl font-black text-slate-900 mb-6">Buat Titipan</h1>

      {/* FORM CONTAINER (Style Pilihanmu) */}
      <form className="bg-white p-6 rounded-[2rem] shadow-sm space-y-6">
        
        {/* Input Barang */}
        <div>
          <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Barang Apa?</label>
          <div className="relative">
             <Package className="absolute left-4 top-4 text-slate-400" size={20}/>
             <input 
                type="text" required placeholder="Contoh: Kopi Kenangan"
                className="w-full pl-12 pr-4 py-4 bg-gray-50 rounded-2xl font-bold text-slate-800 outline-none focus:ring-2 focus:ring-slate-900 transition-all placeholder:font-normal"
                value={form.item} onChange={e => setForm({...form, item: e.target.value})}
            />
          </div>
        </div>

        {/* Grid Harga & Tip */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Harga Barang</label>
            <input 
              type="number" required placeholder="Rp 0"
              className="w-full p-4 bg-gray-50 rounded-2xl font-bold text-slate-800 outline-none focus:ring-2 focus:ring-slate-900 transition-all"
              value={form.price} onChange={e => setForm({...form, price: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-green-600 uppercase mb-2">Tip Traveler</label>
            <input 
              type="number" required placeholder="Rp 5.000"
              className="w-full p-4 bg-green-50 text-green-700 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-green-500 transition-all placeholder:text-green-300 placeholder:font-normal"
              value={form.tip} onChange={e => setForm({...form, tip: e.target.value})}
            />
          </div>
        </div>

        {/* Input Lokasi */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-2xl border border-transparent focus-within:border-red-200 focus-within:bg-red-50 transition-colors">
            <MapPin size={24} className="text-red-500 shrink-0"/>
            <input 
              type="text" required placeholder="Beli di mana?"
              className="bg-transparent w-full outline-none font-bold text-slate-700 placeholder:font-normal"
              value={form.from} onChange={e => setForm({...form, from: e.target.value})}
            />
          </div>
          <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-2xl border border-transparent focus-within:border-green-200 focus-within:bg-green-50 transition-colors">
            <MapPin size={24} className="text-green-500 shrink-0"/>
            <input 
              type="text" required placeholder="Antar ke mana?"
              className="bg-transparent w-full outline-none font-bold text-slate-700 placeholder:font-normal"
              value={form.to} onChange={e => setForm({...form, to: e.target.value})}
            />
          </div>
        </div>

      </form>

      {/* STICKY FOOTER (Fitur Tambahan) */}
      <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-100 p-5 shadow-[0_-5px_30px_-10px_rgba(0,0,0,0.1)] z-30">
        <div className="max-w-md mx-auto flex items-center justify-between gap-4">
            <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Total Estimasi</p>
                <p className="text-xl font-black text-slate-900">Rp {formatRp(totalPrice)}</p>
            </div>
            <button 
                onClick={handleSubmit}
                disabled={loading || totalPrice === 0}
                className="bg-slate-900 text-white px-6 py-4 rounded-xl font-bold shadow-xl shadow-slate-200 hover:bg-slate-800 active:scale-95 disabled:opacity-50 disabled:shadow-none transition-all flex items-center gap-2"
            >
                {loading ? <Loader2 className="animate-spin" /> : <>Posting <ArrowRight size={18}/></>}
            </button>
        </div>
      </div>

    </div>
  )
}