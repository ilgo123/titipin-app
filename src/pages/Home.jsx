import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUserStore } from "../store/useUserStore";
import {
  Bell,
  Wallet,
  Plus,
  Package,
  Plane,
  List,
  Home as HomeIcon,
  User,
  // History icon kita hapus dari sini karena tidak dipakai lagi
} from "lucide-react";
import { supabase } from "../services/supabaseClient";

export default function Home() {
  const navigate = useNavigate();
  const { user, checkSession } = useUserStore();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    checkSession()
    fetchUnread()
  }, []);

  const fetchUnread = async () => {
    const { count } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user?.id)
      .eq("is_read", false);
    setUnreadCount(count || 0);
  };

  const formatRp = (num) => new Intl.NumberFormat("id-ID").format(num || 0);
  const getInitials = (name) => (name ? name.charAt(0).toUpperCase() : "U");

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-32 relative">
      {/* 1. BACKGROUND HEADER */}
      <div className="absolute top-0 left-0 w-full h-[280px] bg-white rounded-b-[3rem] shadow-sm z-0"></div>

      {/* 2. MAIN CONTENT */}
      <div className="relative z-10 px-6 pt-10 flex flex-col gap-8">
        {/* PROFILE BAR */}
        <div className="flex justify-between items-center">
          <div
            className="flex items-center gap-3"
            onClick={() => navigate("/profile")}
          >
            <div className="w-12 h-12 rounded-full bg-slate-100 border-2 border-white shadow-sm overflow-hidden flex items-center justify-center cursor-pointer">
              {user?.avatar_url ? (
                <img
                  src={user.avatar_url}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="font-bold text-slate-700 text-lg">
                  {getInitials(user?.full_name)}
                </span>
              )}
            </div>
            <div>
              <p className="text-xs text-slate-400 font-bold mb-0.5">
                Selamat Datang,
              </p>
              <h3 className="font-black text-slate-900 text-lg truncate max-w-[180px] leading-tight">
                {user?.full_name || "Tamu"}
              </h3>
            </div>
          </div>
          <button
            onClick={() => navigate("/notifications")}
            className="w-10 h-10 bg-white rounded-full border border-slate-100 text-slate-600 hover:bg-slate-50 transition-all flex items-center justify-center shadow-sm relative active:scale-95"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border border-white animate-pulse"></span>
            )}
          </button>
        </div>

        {/* WALLET CARD (VERSI LITE/SIMPLE) */}
        <div className="bg-slate-900 rounded-[2rem] p-6 text-white shadow-xl shadow-slate-200 relative overflow-hidden group">
          <div className="absolute top-[-50%] right-[-10%] w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-700"></div>

          <div className="relative z-10">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-2 text-slate-300">
                <div className="p-1.5 bg-white/10 rounded-lg">
                  <Wallet size={16} />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest">
                  TitipPay
                </span>
              </div>
            </div>

            <div className="mb-6">
              <h2 className="text-3xl font-black tracking-tight mb-1">
                Rp {formatRp(user?.balance)}
              </h2>
              <p className="text-xs text-slate-400 font-medium">
                Saldo aktif siap digunakan
              </p>
            </div>

            {/* ACTION SINGLE BUTTON (HANYA TOP UP) */}
            <button
                onClick={() => navigate("/topup")}
                className="w-full bg-white text-slate-900 py-3.5 rounded-xl font-bold text-xs hover:bg-gray-100 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-sm"
              >
                <Plus size={18} /> Isi Saldo Instan
              </button>
          </div>
        </div>

        {/* MAIN ACTIONS */}
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => navigate("/penitip")}
            className="bg-white p-5 rounded-[2rem] shadow-sm border border-slate-50 hover:shadow-md hover:border-blue-100 active:scale-95 transition-all text-left group"
          >
            <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 mb-3 group-hover:scale-110 transition-transform">
              <Package size={24} strokeWidth={2.5} />
            </div>
            <h4 className="font-black text-slate-900 text-base mb-1">
              Titip Barang
            </h4>
            <p className="text-xs text-gray-400 font-medium leading-relaxed">
              Cari traveler yang searah
            </p>
          </button>

          <button
            onClick={() => navigate("/traveler")}
            className="bg-white p-5 rounded-[2rem] shadow-sm border border-slate-50 hover:shadow-md hover:border-orange-100 active:scale-95 transition-all text-left group"
          >
            <div className="w-12 h-12 bg-orange-50 rounded-full flex items-center justify-center text-orange-600 mb-3 group-hover:scale-110 transition-transform">
              <Plane size={24} strokeWidth={2.5} />
            </div>
            <h4 className="font-black text-slate-900 text-base mb-1">
              Jadi Traveler
            </h4>
            <p className="text-xs text-gray-400 font-medium leading-relaxed">
              Dapat cuan saat jalan-jalan
            </p>
          </button>
        </div>

        {/* PROMO BANNER */}
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-[2rem] p-6 text-white shadow-lg shadow-emerald-100 relative overflow-hidden">
          <div className="absolute right-0 bottom-0 opacity-20 transform translate-x-4 translate-y-4">
            <Package size={120} />
          </div>
          <div className="relative z-10 max-w-[70%]">
            <div className="inline-block px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-bold mb-3 border border-white/30">
              PROMO
            </div>
            <h4 className="font-bold text-xl mb-2 leading-tight">
              Diskon Ongkir!
            </h4>
            <p className="text-xs text-emerald-100 mb-4 opacity-90 leading-relaxed">
              Titip barang dari Jepang hemat 50% minggu ini.
            </p>
          </div>
        </div>
      </div>

      {/* 3. BOTTOM NAVIGATION BAR */}
      <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-100 px-6 py-4 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] z-50">
        <div className="flex justify-around items-center max-w-md mx-auto">
          <NavButton
            icon={<HomeIcon size={24} />}
            label="Home"
            isActive
            onClick={() => navigate("/")}
          />
          <NavButton
            icon={<List size={24} />}
            label="Aktivitas"
            onClick={() => navigate("/activity")}
          />
          <NavButton
            icon={<User size={24} />}
            label="Akun"
            onClick={() => navigate("/profile")}
          />
        </div>
      </div>
    </div>
  );
}

// Komponen Tombol Navbar
function NavButton({ icon, label, isActive, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-1 transition-all w-16 ${
        isActive
          ? "text-slate-900 -translate-y-1" // Naik dikit kalau aktif
          : "text-gray-300 hover:text-slate-500"
      }`}
    >
      {/* Ikon */}
      <div className={`${isActive ? "drop-shadow-md" : ""}`}>
        {icon}
      </div>

      {/* Teks Selalu Muncul, Tidak Pakai Opacity Lagi */}
      <span className="text-[10px] font-bold tracking-wide">
        {label}
      </span>
      
      {/* Indikator Titik (Opsional, Pemanis) */}
      {isActive && (
          <div className="w-1 h-1 bg-slate-900 rounded-full mt-0.5 animate-in fade-in zoom-in"></div>
      )}
    </button>
  );
}