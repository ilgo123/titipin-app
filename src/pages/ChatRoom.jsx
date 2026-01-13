import { useEffect, useState, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../services/supabaseClient'
import { useUserStore } from '../store/useUserStore'
import { 
  Send, ChevronLeft, Package, CheckCircle2, Phone, MoreVertical, 
  Loader2, ShoppingBag, Truck, Camera, Image as ImageIcon, X, WifiOff, RefreshCw
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import ConfirmModal from '../components/ConfirmModal'

export default function ChatRoom() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useUserStore()
  const orderId = location.state?.orderId

  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // STATE UPLOAD
  const [uploading, setUploading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState('') 
  const [showAttachMenu, setShowAttachMenu] = useState(false)
  
  // STATE MODAL (YANG HILANG TADI)
  const [showFinishModal, setShowFinishModal] = useState(false) // <--- SUDAH DITAMBAH

  const cameraInputRef = useRef(null)
  const galleryInputRef = useRef(null)
  const messagesEndRef = useRef(null)

  // State Rating
  const [rating, setRating] = useState(0)
  const [review, setReview] = useState('')
  const [hasRated, setHasRated] = useState(false)

  useEffect(() => {
    if (!orderId) return navigate('/')

    const fetchData = async () => {
      const { data: orderData } = await supabase
        .from('orders')
        .select(`*, requester:requester_id(full_name, avatar_url), traveler:traveler_id(full_name, avatar_url)`)
        .eq('id', orderId)
        .single()

      setOrder(orderData)

      const { data: msgData } = await supabase
        .from('messages')
        .select('*')
        .eq('order_id', orderId)
        .order('created_at', { ascending: true })

      setMessages(msgData || [])

      if (orderData?.status === 'done') {
        const { data: reviewData } = await supabase
            .from('reviews')
            .select('id')
            .eq('order_id', orderId)
            .eq('reviewer_id', user.id)
            .maybeSingle()
        if (reviewData) setHasRated(true)
      }

      setLoading(false)
    }

    fetchData()

    const channel = supabase
      .channel('room-updates')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `order_id=eq.${orderId}` }, (payload) => {
        setMessages((prev) => [...prev, payload.new])
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${orderId}` }, (payload) => {
        setOrder((prev) => ({ ...prev, status: payload.new.status }))
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [orderId, navigate, user.id])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async (e) => {
    e?.preventDefault()
    if (!newMessage.trim()) return
    await supabase.from('messages').insert({ 
        order_id: orderId, sender_id: user.id, content: newMessage, type: 'text'
    })
    setNewMessage('')
    setShowAttachMenu(false)
  }

  // --- 1. KOMPRESI KE ARRAY BUFFER ---
  const compressImageToArrayBuffer = (file) => {
    return new Promise((resolve, reject) => {
        const objectUrl = URL.createObjectURL(file)
        const img = new Image()
        img.src = objectUrl
        
        img.onload = () => {
            URL.revokeObjectURL(objectUrl)
            
            const canvas = document.createElement('canvas')
            const MAX_WIDTH = 500
            let width = img.width
            let height = img.height

            if (width > height) {
                if (width > MAX_WIDTH) {
                    height *= MAX_WIDTH / width
                    width = MAX_WIDTH
                }
            } else {
                if (height > MAX_WIDTH) {
                    width *= MAX_WIDTH / height
                    height = MAX_WIDTH
                }
            }

            canvas.width = width
            canvas.height = height
            const ctx = canvas.getContext('2d')
            ctx.drawImage(img, 0, 0, width, height)
            
            canvas.toBlob(async (blob) => {
                if (blob) {
                    try {
                        const arrayBuffer = await blob.arrayBuffer()
                        resolve({ buffer: arrayBuffer, type: blob.type })
                    } catch (err) {
                        reject(err)
                    }
                } else {
                    reject(new Error("Gagal kompresi"))
                }
            }, 'image/jpeg', 0.6)
        }
        
        img.onerror = (err) => {
            URL.revokeObjectURL(objectUrl)
            reject(err)
        }
    })
  }

  // --- 2. RETRY STRATEGY ---
  const uploadWithBackoff = async (arrayBuffer, path, contentType, attempt = 1) => {
      try {
          const { error } = await supabase.storage
              .from('chat-uploads')
              .upload(path, arrayBuffer, { 
                  contentType: contentType,
                  upsert: false 
              })
          
          if (error) throw error
          return true 

      } catch (error) {
          if (attempt <= 3) {
              const delay = attempt * 2000
              console.warn(`Gagal (Percobaan ${attempt}). Retry dalam ${delay/1000}s...`)
              setUploadStatus(`Sinyal putus. Mencoba lagi (${attempt}/3)...`)
              
              await new Promise(r => setTimeout(r, delay))
              return uploadWithBackoff(arrayBuffer, path, contentType, attempt + 1)
          } else {
              throw error 
          }
      }
  }

  const handleImageUpload = async (e) => {
    try {
        setShowAttachMenu(false)
        const file = e.target.files[0]
        if (!file) return

        if (!navigator.onLine) {
            toast.error("Kamu sedang offline. Nyalakan internet dulu.")
            return
        }

        setUploading(true)
        setUploadStatus('Memproses...') 

        const { buffer, type } = await compressImageToArrayBuffer(file)

        setUploadStatus('Mengirim...') 

        const fileName = `${orderId}-${Date.now()}-${Math.random().toString(36).substr(2, 4)}.jpg`
        const filePath = `${fileName}`

        await uploadWithBackoff(buffer, filePath, type)

        const { data } = supabase.storage.from('chat-uploads').getPublicUrl(filePath)

        await supabase.from('messages').insert({
            order_id: orderId,
            sender_id: user.id,
            content: data.publicUrl,
            type: 'image'
        })

    } catch (error) {
        console.error("Upload Fatal Error:", error)
        toast.error(`Gagal kirim gambar: ${error.message}`)
    } finally {
        setUploading(false)
        setUploadStatus('')
        if(galleryInputRef.current) galleryInputRef.current.value = ""
        if(cameraInputRef.current) cameraInputRef.current.value = ""
    }
  }

  const updateOrderStatus = async (newStatus, customMessage) => {
    setIsSubmitting(true)
    const { error } = await supabase.from('orders').update({ status: newStatus }).eq('id', orderId)
    if (!error) await supabase.from('messages').insert({ order_id: orderId, sender_id: user.id, content: customMessage, type: 'text' })
    setIsSubmitting(false)
  }

  // 1. Buka Modal
  const handleFinishClick = () => {
    setShowFinishModal(true) // Ini sekarang sudah aman karena state-nya ada
  }

  // 2. Eksekusi
  const onConfirmFinish = async () => {
    setShowFinishModal(false)
    const toastId = toast.loading('Menyelesaikan transaksi...')
    setIsSubmitting(true)

    try {
        await supabase.rpc('complete_order_transaction', { order_id_input: orderId })
        toast.success("Transaksi Selesai! Terima kasih 🎉", { id: toastId })
        window.location.reload() 
    } catch(e) {
        toast.error('Gagal: ' + e.message, { id: toastId })
    } finally {
        setIsSubmitting(false)
    }
  }

  const submitReview = async () => {
    if (rating === 0) return toast.error("Bintangnya mana?")
    setIsSubmitting(true)
    await supabase.from('reviews').insert({ order_id: orderId, reviewer_id: user.id, target_id: order.traveler_id, rating: rating, comment: review })
    setHasRated(true)
    setIsSubmitting(false)
  }

  const isRequester = user?.id === order?.requester_id
  const opponent = isRequester ? order?.traveler : order?.requester
  const roleLabel = isRequester ? 'Traveler' : 'Penitip'

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-slate-300"/></div>

  return (
    <div className="flex flex-col h-[100dvh] bg-[#F0F2F5] relative">
      
      {/* HEADER */}
      <div className="bg-white px-4 py-3 shadow-sm flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="text-slate-500 hover:bg-slate-50 p-1 rounded-full"><ChevronLeft size={24} /></button>
            <div className="relative">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200">
                    <img src={opponent?.avatar_url} className="w-full h-full object-cover" />
                </div>
            </div>
            <div>
                <h2 className="font-bold text-slate-900 text-sm">{opponent?.full_name}</h2>
                <p className="text-xs text-slate-500">{roleLabel}</p>
            </div>
        </div>
        <div className="flex gap-2 text-slate-400">
            <Phone size={20}/> <MoreVertical size={20}/>
        </div>
      </div>

      {/* CONTEXT BAR */}
      <div className="bg-white/90 backdrop-blur-md border-b border-slate-100 px-4 py-2 flex items-center justify-between shrink-0 z-10 text-xs shadow-sm">
          <div className="flex items-center gap-2">
              <Package size={14} className="text-orange-500"/>
              <span className="font-bold text-slate-700 max-w-[180px] truncate">{order?.item}</span>
          </div>
          <div className={`px-2 py-0.5 rounded-md border font-bold text-[10px] uppercase
            ${order?.status === 'taken' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-gray-100 text-gray-500'}`}>
             {order?.status}
          </div>
      </div>

      {/* CHAT AREA */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4" onClick={() => setShowAttachMenu(false)}>
        {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.sender_id === user.id ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] px-4 py-2 rounded-2xl text-sm shadow-sm relative ${
                        msg.sender_id === user.id ? 'bg-slate-900 text-white rounded-tr-none' : 'bg-white text-slate-800 border border-slate-100 rounded-tl-none'
                    }`}>
                    
                    {msg.type === 'image' ? (
                        <div className="mb-1">
                            <img 
                                src={msg.content} 
                                alt="Attachment" 
                                className="rounded-lg w-full max-w-[200px] h-auto object-cover border border-white/20 cursor-pointer"
                                onClick={() => window.open(msg.content, '_blank')}
                            />
                        </div>
                    ) : (
                        <p>{msg.content}</p>
                    )}

                    <span className={`text-[9px] block text-right mt-1 ${msg.sender_id === user.id ? 'opacity-70 text-slate-300' : 'opacity-50 text-slate-500'}`}>
                        {new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
                </div>
            </div>
        ))}
        {uploading && (
             <div className="flex justify-end">
                <div className={`px-4 py-2 rounded-2xl rounded-tr-none text-xs flex items-center gap-2 animate-pulse transition-colors ${uploadStatus.includes('putus') ? 'bg-red-100 text-red-700' : 'bg-slate-900 text-white'}`}>
                    {uploadStatus.includes('putus') ? <RefreshCw size={12} className="animate-spin"/> : <Loader2 size={12} className="animate-spin"/>} 
                    {uploadStatus}
                </div>
             </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* MENU PILIHAN */}
      {showAttachMenu && (
        <div className="absolute bottom-20 left-4 z-50 animate-in slide-in-from-bottom-2">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-2 flex flex-col gap-1 w-40">
                <button 
                    onClick={() => cameraInputRef.current.click()} 
                    className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 rounded-xl text-slate-700 font-bold text-sm transition-colors text-left"
                >
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-full"><Camera size={16}/></div>
                    Kamera
                </button>
                <button 
                    onClick={() => galleryInputRef.current.click()}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 rounded-xl text-slate-700 font-bold text-sm transition-colors text-left"
                >
                    <div className="p-2 bg-purple-50 text-purple-600 rounded-full"><ImageIcon size={16}/></div>
                    Galeri
                </button>
            </div>
            <div className="w-3 h-3 bg-white border-b border-r border-gray-100 transform rotate-45 absolute -bottom-1.5 left-6"></div>
        </div>
      )}

      {/* FOOTER INPUT */}
      <div className="px-4 pb-2 bg-[#F0F2F5]">
        <input type="file" accept="image/*" ref={galleryInputRef} onChange={handleImageUpload} className="hidden" />
        <input type="file" accept="image/*" capture="environment" ref={cameraInputRef} onChange={handleImageUpload} className="hidden" />

        {order?.status !== 'done' && (
             <div className="flex gap-2 mb-2">
                 {!isRequester ? (
                    <>
                        {order?.status === 'taken' && (
                             <button onClick={() => updateOrderStatus('bought', '📸 Barang sudah dibeli!')} disabled={isSubmitting} className="flex-1 bg-purple-600 text-white py-2.5 rounded-xl text-xs font-bold shadow-md hover:bg-purple-700 flex items-center justify-center gap-2"><ShoppingBag size={16}/> Sudah Dibelikan</button>
                        )}
                        {order?.status === 'bought' && (
                            <button onClick={() => updateOrderStatus('otw', '🛵 OTW Antar!')} disabled={isSubmitting} className="flex-1 bg-orange-500 text-white py-2.5 rounded-xl text-xs font-bold shadow-md hover:bg-orange-600 flex items-center justify-center gap-2"><Truck size={16}/> Antar Sekarang</button>
                        )}
                    </>
                 ) : (
                    (order?.status === 'bought' || order?.status === 'otw') && (
                        <button onClick={handleFinishClick} disabled={isSubmitting} className="flex-1 bg-green-600 text-white py-2.5 rounded-xl text-xs font-bold shadow-md hover:bg-green-700 flex items-center justify-center gap-2"><CheckCircle2 size={16}/> Terima Barang</button>
                    )
                 )}
             </div>
        )}

        <form onSubmit={sendMessage} className="bg-white p-2 border border-slate-200 rounded-full flex items-center gap-2 shadow-sm relative">
            <button 
                type="button" 
                onClick={() => setShowAttachMenu(!showAttachMenu)} 
                className={`p-2 rounded-full transition-all ${showAttachMenu ? 'bg-slate-900 text-white rotate-45' : 'text-slate-400 hover:bg-gray-100'}`}
            >
                {showAttachMenu ? <X size={20}/> : <MoreVertical size={20} className="rotate-90"/>} 
            </button>

            <input 
                type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Ketik pesan..."
                className="flex-1 bg-transparent outline-none text-sm font-medium text-slate-800"
                onFocus={() => setShowAttachMenu(false)}
            />
            <button type="submit" disabled={!newMessage.trim()} className="p-2 bg-slate-900 text-white rounded-full hover:bg-slate-800 disabled:opacity-50">
                <Send size={16} />
            </button>
        </form>
      </div>

      {/* 👇👇 MODAL YANG TADI HILANG SUDAH DITAMBAHKAN 👇👇 */}
      <ConfirmModal 
        isOpen={showFinishModal}
        onClose={() => setShowFinishModal(false)}
        onConfirm={onConfirmFinish}
        title="Terima Barang?"
        message="Pastikan barang sudah kamu terima dengan baik. Dana akan diteruskan ke Traveler dan tidak bisa ditarik kembali."
      />
    </div>
  )
}