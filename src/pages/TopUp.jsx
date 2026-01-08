import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../services/supabaseClient'
import { useUserStore } from '../store/useUserStore'
import { ChevronLeft, Wallet, CheckCircle2, Loader2, CreditCard } from 'lucide-react'
import { motion } from 'framer-motion'
import { toast } from 'react-hot-toast'

export default function TopUp() {
  const navigate = useNavigate()
  const { user, checkSession } = useUserStore()
  
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState('input') // 'input', 'processing', 'success'

  // Pilihan Nominal Cepat
  const chips = [10000, 20000, 50000, 100000, 200000, 500000]

  const handleTopUp = async () => {
    if (!amount || amount < 10000) return toast.error("Minimal Top Up Rp 10.000 ya!")
    
    setStatus('processing')
    setLoading(true)

    // Simulasi delay bank (biar terasa real)
    setTimeout(async () => {
        try {
            // Panggil RPC Supabase
            const { error } = await supabase.rpc('topup_balance', {
                p_user_id: user.id,
                p_amount: parseInt(amount)
            })

            if (error) throw error

            await checkSession() // Refresh saldo di state global
            setStatus('success')
        
        } catch (error) {
            toast.error(error.message)
            setStatus('input')
        } finally {
            setLoading(false)
        }
    }, 2000) // Delay 2 detik
  }

  const formatRp = (num) => new Intl.NumberFormat('id-ID').format(num)

  // TAMPILAN SUKSES
  if (status === 'success') {
      return (
          <div className="min-h-screen bg-green-500 flex flex-col items-center justify-center p-6 text-white text-center">
              <motion.div 
                initial={{ scale: 0 }} animate={{ scale: 1 }}
                className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-6 shadow-xl"
              >
                  <CheckCircle2 size={48} className="text-green-500" />
              </motion.div>
              <h1 className="text-3xl font-black mb-2">Top Up Berhasil!</h1>
              <p className="opacity-90 mb-8">Saldo Rp {formatRp(amount)} telah ditambahkan.</p>
              
              <button 
                onClick={() => navigate('/')}
                className="w-full max-w-xs bg-white text-green-600 font-bold py-4 rounded-2xl shadow-lg active:scale-95 transition-all"
              >
                  Kembali ke Home
              </button>
          </div>
      )
  }

  // TAMPILAN INPUT UTAMA
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      
      {/* HEADER */}
      <div className="bg-white px-6 pt-6 pb-4 shadow-sm z-10">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-500 font-bold hover:text-slate-900 transition-colors">
            <ChevronLeft size={24}/> Batal
        </button>
      </div>

      <div className="flex-1 p-6 flex flex-col max-w-md mx-auto w-full">
        
        <h1 className="text-2xl font-black text-slate-900 mb-1">Isi Saldo 💳</h1>
        <p className="text-gray-400 text-sm mb-8">Pilih nominal atau ketik sendiri.</p>

        {/* INPUT MANUAL */}
        <div className="bg-white p-6 rounded-[2rem] shadow-sm mb-6 border border-slate-100">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Nominal Top Up</label>
            <div className="relative">
                <span className="absolute left-0 top-2 text-2xl font-black text-slate-300">Rp</span>
                <input 
                    type="number" 
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0"
                    disabled={status === 'processing'}
                    className="w-full pl-10 py-2 text-4xl font-black text-slate-900 outline-none border-b-2 border-gray-100 focus:border-slate-900 transition-colors placeholder:text-gray-200 bg-transparent"
                />
            </div>
        </div>

        {/* CHIPS NOMINAL */}
        <div className="grid grid-cols-3 gap-3 mb-8">
            {chips.map((chip) => (
                <button
                    key={chip}
                    onClick={() => setAmount(chip)}
                    className={`py-3 rounded-xl font-bold text-sm border transition-all active:scale-95
                        ${parseInt(amount) === chip 
                            ? 'bg-slate-900 text-white border-slate-900 shadow-md' 
                            : 'bg-white text-slate-600 border-gray-200 hover:border-slate-300'
                        }`}
                >
                    {formatRp(chip)}
                </button>
            ))}
        </div>

        {/* INFO CARD */}
        <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl flex gap-3 items-start mb-auto">
            <div className="p-2 bg-white rounded-full text-blue-600 shadow-sm">
                <Wallet size={18}/>
            </div>
            <div>
                <h4 className="font-bold text-slate-800 text-sm">Metode Pembayaran</h4>
                <p className="text-xs text-slate-500 mt-1">Ini hanya simulasi. Saldo akan langsung bertambah tanpa potong pulsa/bank beneran.</p>
            </div>
        </div>

        {/* TOMBOL BAYAR */}
        <button 
            onClick={handleTopUp}
            disabled={!amount || status === 'processing'}
            className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold text-lg shadow-xl shadow-slate-200 hover:bg-slate-800 active:scale-95 disabled:opacity-50 disabled:shadow-none transition-all flex items-center justify-center gap-2 mt-6"
        >
            {status === 'processing' ? (
                <> <Loader2 className="animate-spin" /> Memproses... </>
            ) : (
                <> <CreditCard size={20}/> Bayar Sekarang </>
            )}
        </button>

      </div>
    </div>
  )
}