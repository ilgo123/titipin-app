import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../services/supabaseClient'
import { useUserStore } from '../store/useUserStore'
import { ChevronLeft, Building2, CreditCard, Wallet, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { toast } from 'react-hot-toast'

export default function Withdraw() {
  const navigate = useNavigate()
  const { user, checkSession } = useUserStore()
  
  const [step, setStep] = useState(1) // 1: Form, 2: Success
  const [loading, setLoading] = useState(false)
  
  const [form, setForm] = useState({
    bank: '',
    number: '',
    holder: '', // Nama pemilik rekening
    amount: ''
  })

  // Format Rupiah
  const formatRp = (num) => new Intl.NumberFormat('id-ID').format(num || 0)

  const handleWithdraw = async () => {
    // Validasi
    if (!form.bank || !form.number || !form.holder || !form.amount) return toast.error("Lengkapi data dulu ya!")
    if (parseInt(form.amount) < 50000) return toast.error("Minimal penarikan Rp 50.000")
    if (parseInt(form.amount) > user.balance) return toast.error("Saldo kamu gak cukup!")

    setLoading(true)

    try {
        const { error } = await supabase.rpc('request_withdraw', {
            p_user_id: user.id,
            p_amount: parseInt(form.amount),
            p_bank_name: form.bank,
            p_account_number: form.number,
            p_account_holder: form.holder
        })

        if (error) throw error

        await checkSession() // Update saldo di UI
        setStep(2) // Tampilkan layar sukses

    } catch (error) {
        toast.error("Gagal: " + error.message)
    } finally {
        setLoading(false)
    }
  }

  // SCREEN SUCCESS
  if (step === 2) {
      return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8 text-center">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6 text-green-600">
                <CheckCircle2 size={40}/>
            </motion.div>
            <h2 className="text-2xl font-black text-slate-900 mb-2">Permintaan Terkirim!</h2>
            <p className="text-gray-500 text-sm mb-8 leading-relaxed">
                Dana sebesar <b>Rp {formatRp(form.amount)}</b> akan masuk ke rekening <b>{form.bank}</b> kamu dalam 1x24 jam kerja.
            </p>
            <button onClick={() => navigate('/')} className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold">
                Kembali ke Home
            </button>
        </div>
      )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      
      {/* HEADER */}
      <div className="bg-white px-6 pt-6 pb-4 shadow-sm z-10">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-500 font-bold hover:text-slate-900 transition-colors">
            <ChevronLeft size={24}/> Batal
        </button>
      </div>

      <div className="flex-1 p-6 flex flex-col max-w-md mx-auto w-full">
        <h1 className="text-2xl font-black text-slate-900 mb-1">Tarik Saldo 💸</h1>
        <p className="text-gray-400 text-sm mb-6">Cairkan hasil kerjamu ke rekening bank.</p>

        {/* INFO SALDO */}
        <div className="bg-slate-900 text-white p-5 rounded-2xl mb-6 flex items-center justify-between shadow-lg shadow-slate-200">
            <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Saldo Bisa Ditarik</p>
                <p className="text-2xl font-black">Rp {formatRp(user?.balance)}</p>
            </div>
            <div className="p-3 bg-white/10 rounded-full">
                <Wallet size={24}/>
            </div>
        </div>

        {/* FORM INPUT */}
        <div className="bg-white p-6 rounded-3xl shadow-sm space-y-5 border border-slate-100">
            
            {/* Bank */}
            <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase">Nama Bank / E-Wallet</label>
                <div className="relative">
                    <Building2 className="absolute left-4 top-3.5 text-gray-400" size={20}/>
                    <select 
                        className="w-full bg-gray-50 border border-gray-200 text-slate-800 font-bold rounded-xl pl-12 pr-4 py-3 outline-none focus:ring-2 focus:ring-slate-900 appearance-none"
                        value={form.bank}
                        onChange={(e) => setForm({...form, bank: e.target.value})}
                    >
                        <option value="">Pilih Bank Tujuan</option>
                        <option value="BCA">Bank BCA</option>
                        <option value="Mandiri">Bank Mandiri</option>
                        <option value="BRI">Bank BRI</option>
                        <option value="BNI">Bank BNI</option>
                        <option value="GoPay">GoPay</option>
                        <option value="OVO">OVO</option>
                        <option value="Dana">Dana</option>
                    </select>
                </div>
            </div>

            {/* No Rekening */}
            <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase">Nomor Rekening</label>
                <div className="relative">
                    <CreditCard className="absolute left-4 top-3.5 text-gray-400" size={20}/>
                    <input 
                        type="number" 
                        placeholder="Contoh: 1234567890"
                        className="w-full bg-gray-50 border border-gray-200 text-slate-800 font-bold rounded-xl pl-12 pr-4 py-3 outline-none focus:ring-2 focus:ring-slate-900"
                        value={form.number}
                        onChange={(e) => setForm({...form, number: e.target.value})}
                    />
                </div>
            </div>

            {/* Nama Pemilik */}
            <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase">Atas Nama (Pemilik)</label>
                <input 
                    type="text" 
                    placeholder="Nama sesuai buku tabungan"
                    className="w-full bg-gray-50 border border-gray-200 text-slate-800 font-bold rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-slate-900"
                    value={form.holder}
                    onChange={(e) => setForm({...form, holder: e.target.value})}
                />
            </div>

            <div className="h-px bg-gray-100 my-2"></div>

            {/* Nominal */}
            <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase">Nominal Penarikan</label>
                <div className="relative">
                    <span className="absolute left-4 top-3 text-slate-900 font-bold text-lg">Rp</span>
                    <input 
                        type="number" 
                        placeholder="0"
                        className="w-full bg-white border-2 border-slate-100 text-slate-900 font-black text-xl rounded-xl pl-12 pr-4 py-3 outline-none focus:border-slate-900 transition-colors"
                        value={form.amount}
                        onChange={(e) => setForm({...form, amount: e.target.value})}
                    />
                </div>
                {/* Tombol Max */}
                <div className="flex justify-end">
                    <button 
                        onClick={() => setForm({...form, amount: user.balance})}
                        className="text-xs font-bold text-blue-600 hover:underline"
                    >
                        Tarik Semua Saldo
                    </button>
                </div>
            </div>

        </div>

        {/* TOMBOL ACTION */}
        <button 
            onClick={handleWithdraw}
            disabled={loading || !form.amount}
            className="mt-6 w-full bg-slate-900 text-white py-4 rounded-2xl font-bold text-lg shadow-xl hover:bg-slate-800 active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
        >
            {loading ? <Loader2 className="animate-spin"/> : <>Cairkan Dana <ArrowRight/></>}
        </button>

      </div>
    </div>
  )
}