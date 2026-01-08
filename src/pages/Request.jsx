import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../services/supabaseClient'
import { useUserStore } from '../store/useUserStore'
import { ChevronLeft, Package, MapPin, DollarSign, Send, Loader2, AlertCircle } from 'lucide-react'
import { toast } from 'react-hot-toast'

export default function Request() {
  const navigate = useNavigate()
  const { user, checkSession } = useUserStore()
  
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    item: '',
    price: '',
    tip: '',
    fromLoc: '',
    toLoc: ''
  })

  // Format Rupiah Helper
  const formatRp = (value) => {
    if (!value) return ''
    return new Intl.NumberFormat('id-ID').format(value)
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validasi Input
    if (!formData.item || !formData.price || !formData.tip || !formData.fromLoc || !formData.toLoc) {
      return toast.error("Mohon lengkapi semua data ya!")
      
    }

    // Konversi ke Angka (PENTING untuk Database)
    const priceInt = parseInt(formData.price.replace(/\D/g, '')) // Hapus titik/koma jika ada
    const tipInt = parseInt(formData.tip.replace(/\D/g, ''))

    if (isNaN(priceInt) || isNaN(tipInt)) return toast.error("Harga dan Tips harus angka")

    const totalBiaya = priceInt + tipInt

    // Cek Saldo Lokal Dulu (UX)
    if (user.balance < totalBiaya) {
        return toast.error(`Saldo tidak cukup! Total: Rp ${formatRp(totalBiaya)}, Saldo: Rp ${formatRp(user.balance)}. Yuk Top Up dulu!`)
    }

    setLoading(true)

    try {
        // Panggil RPC Database (Transaksi Aman)
        const { error } = await supabase.rpc('create_order_transaction', {
            p_item: formData.item,
            p_price: priceInt,
            p_tip: tipInt,
            p_from: formData.fromLoc,
            p_to: formData.toLoc,
            p_user_id: user.id
        })

        if (error) throw error

        toast.success("Titipan berhasil diposting! Saldo sudah dipotong sementara. 📦")
        await checkSession() // Update saldo di UI
        navigate('/activity') // Pindah ke halaman Aktivitas

    } catch (error) {
        toast.error("Gagal posting: " + error.message)
    } finally {
        setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      
      {/* HEADER */}
      <div className="bg-white px-6 pt-6 pb-4 sticky top-0 z-10 shadow-sm flex items-center gap-2">
        <button onClick={() => navigate('/')} className="p-2 -ml-2 hover:bg-gray-100 rounded-full text-slate-500 transition-colors">
            <ChevronLeft size={24}/>
        </button>
        <h1 className="text-xl font-black text-slate-900">Buat Titipan Baru</h1>
      </div>

      {/* INFO SALDO */}
      <div className="px-6 mt-4">
        <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl flex items-center gap-3">
            <div className="p-2 bg-blue-100 text-blue-600 rounded-full">
                <AlertCircle size={20}/>
            </div>
            <div>
                <p className="text-xs text-blue-600 font-bold mb-0.5">Saldo Kamu: Rp {formatRp(user?.balance)}</p>
                <p className="text-[10px] text-blue-400">Saldo akan ditahan sementara sampai barang diterima.</p>
            </div>
        </div>
      </div>

      {/* FORM INPUT */}
      <form onSubmit={handleSubmit} className="p-6 space-y-5">
        
        {/* Nama Barang */}
        <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase">Mau titip apa?</label>
            <div className="relative group">
                <Package className="absolute left-4 top-3.5 text-gray-400 group-focus-within:text-slate-900 transition-colors" size={20}/>
                <input 
                    type="text" 
                    name="item"
                    placeholder="Contoh: Kopi Tuku, Bakpia Pathok..."
                    className="w-full bg-white border border-gray-200 text-slate-900 font-bold rounded-xl pl-12 pr-4 py-3 outline-none focus:border-slate-900 focus:ring-4 focus:ring-gray-100 transition-all"
                    value={formData.item}
                    onChange={handleChange}
                />
            </div>
        </div>

        <div className="flex gap-4">
            {/* Dari Mana */}
            <div className="space-y-2 flex-1">
                <label className="text-xs font-bold text-gray-400 uppercase">Beli Di Mana?</label>
                <div className="relative group">
                    <MapPin className="absolute left-4 top-3.5 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={20}/>
                    <input 
                        type="text" 
                        name="fromLoc"
                        placeholder="Kota Asal"
                        className="w-full bg-white border border-gray-200 text-slate-900 font-bold rounded-xl pl-12 pr-4 py-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all"
                        value={formData.fromLoc}
                        onChange={handleChange}
                    />
                </div>
            </div>

            {/* Ke Mana */}
            <div className="space-y-2 flex-1">
                <label className="text-xs font-bold text-gray-400 uppercase">Antar Ke?</label>
                <div className="relative group">
                    <MapPin className="absolute left-4 top-3.5 text-gray-400 group-focus-within:text-green-500 transition-colors" size={20}/>
                    <input 
                        type="text" 
                        name="toLoc"
                        placeholder="Kota Tujuan"
                        className="w-full bg-white border border-gray-200 text-slate-900 font-bold rounded-xl pl-12 pr-4 py-3 outline-none focus:border-green-500 focus:ring-4 focus:ring-green-50 transition-all"
                        value={formData.toLoc}
                        onChange={handleChange}
                    />
                </div>
            </div>
        </div>

        {/* Estimasi Harga */}
        <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase">Estimasi Harga Barang</label>
            <div className="relative group">
                <span className="absolute left-4 top-3.5 text-gray-400 font-bold group-focus-within:text-slate-900">Rp</span>
                <input 
                    type="number" 
                    name="price"
                    placeholder="0"
                    className="w-full bg-white border border-gray-200 text-slate-900 font-bold rounded-xl pl-12 pr-4 py-3 outline-none focus:border-slate-900 focus:ring-4 focus:ring-gray-100 transition-all"
                    value={formData.price}
                    onChange={handleChange}
                />
            </div>
            <p className="text-[10px] text-gray-400">*Masukkan perkiraan harga asli barang</p>
        </div>

        {/* Tip / Komisi */}
        <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase">Tip untuk Traveler (Cuan)</label>
            <div className="relative group">
                <span className="absolute left-4 top-3.5 text-green-600 font-bold">Rp</span>
                <input 
                    type="number" 
                    name="tip"
                    placeholder="Min. 5000"
                    className="w-full bg-green-50 border border-green-200 text-green-700 font-black text-lg rounded-xl pl-12 pr-4 py-3 outline-none focus:border-green-600 focus:ring-4 focus:ring-green-100 transition-all placeholder:text-green-300/50"
                    value={formData.tip}
                    onChange={handleChange}
                />
            </div>
        </div>

        {/* SUBMIT BUTTON */}
        <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold text-lg shadow-xl shadow-slate-200 hover:bg-slate-800 active:scale-95 transition-all flex items-center justify-center gap-2 mt-4"
        >
            {loading ? <Loader2 className="animate-spin"/> : <><Send size={20}/> Posting Titipan</>}
        </button>

      </form>
    </div>
  )
}