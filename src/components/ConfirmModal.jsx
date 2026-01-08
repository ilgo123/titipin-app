import { X, AlertTriangle, Loader2 } from 'lucide-react'

export default function ConfirmModal({ isOpen, onClose, onConfirm, title, message, loading, confirmText = "Ya, Lanjutkan", type = "default" }) {
  if (!isOpen) return null

  // Warna tombol berdasarkan tipe (bahaya/biasa)
  const btnColor = type === 'danger' ? 'bg-red-500 hover:bg-red-600' : 'bg-slate-900 hover:bg-slate-800'
  const iconColor = type === 'danger' ? 'text-red-500 bg-red-50' : 'text-slate-900 bg-slate-100'

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop Gelap */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" 
        onClick={!loading ? onClose : undefined}
      ></div>

      {/* Modal Box */}
      <div className="bg-white w-full max-w-sm rounded-3xl p-6 relative z-10 shadow-2xl animate-in zoom-in-95 duration-200">
        
        {/* Tombol Close (Pojok Kanan) */}
        {!loading && (
            <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-slate-900 transition-colors">
                <X size={20}/>
            </button>
        )}

        <div className="text-center">
            {/* Ikon Besar */}
            <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 ${iconColor}`}>
                <AlertTriangle size={28}/>
            </div>

            <h3 className="text-lg font-black text-slate-900 mb-2">
                {title}
            </h3>
            
            <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                {message}
            </p>

            <div className="flex gap-3">
                <button 
                    onClick={onClose}
                    disabled={loading}
                    className="flex-1 py-3 rounded-xl font-bold text-sm text-slate-600 bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                    Batal
                </button>
                <button 
                    onClick={onConfirm}
                    disabled={loading}
                    className={`flex-1 py-3 rounded-xl font-bold text-sm text-white shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 ${btnColor}`}
                >
                    {loading ? <Loader2 size={16} className="animate-spin"/> : confirmText}
                </button>
            </div>
        </div>
      </div>
    </div>
  )
}