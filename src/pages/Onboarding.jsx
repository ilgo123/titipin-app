import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Map, Wallet, ShieldCheck, ChevronRight } from 'lucide-react';

export default function Onboarding({ onFinish }) {
//   const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      id: 1,
      icon: <Wallet size={80} className="text-white" />,
      bg: "bg-green-500",
      title: "Ongkir Mahal? Itu Kuno!",
      desc: "Titip barang apa saja dengan 'Uang Tip' sesukamu. Hemat biaya pengiriman hingga 50%."
    },
    {
      id: 2,
      icon: <Map size={80} className="text-white" />,
      bg: "bg-blue-500",
      title: "Manfaatkan Rute Searah",
      desc: "Hubungkan kebutuhanmu dengan Traveler yang kebetulan lewat. Kurangi polusi, tambah koneksi."
    },
    {
      id: 3,
      icon: <ShieldCheck size={80} className="text-white" />,
      bg: "bg-slate-900",
      title: "Aman & Terpercaya",
      desc: "Setiap Traveler terverifikasi KTP. Uangmu aman di Rekening Bersama sampai barang diterima."
    }
  ];

  const finishOnboarding = () => {
    if (onFinish) onFinish();
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      finishOnboarding();
    }
  };

  return (
    // PERUBAHAN UTAMA DI SINI:
    // Gunakan h-[100dvh] (Dynamic Viewport Height) agar pas layar HP
    // max-w-md mx-auto agar tampilan di laptop tetap seperti HP (di tengah)
    <div className="h-[100dvh] w-full max-w-md mx-auto bg-white flex flex-col relative overflow-hidden">
      
      {/* 1. TOP BAR (Fixed Height) */}
      <div className="h-20 flex items-center justify-end px-6 z-20 shrink-0">
        <button 
          onClick={finishOnboarding} 
          className="text-sm font-bold text-gray-400 hover:text-slate-900 transition-colors py-2 px-4"
        >
          Lewati
        </button>
      </div>

      {/* 2. MAIN CONTENT (Flex Grow - Mengisi sisa ruang tengah) */}
      <div className="flex-1 w-full relative">
        <AnimatePresence mode='wait'>
          <motion.div
            key={currentStep}
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -50, opacity: 0 }}
            transition={{ duration: 0.4, ease: "circOut" }}
            className="absolute inset-0 flex flex-col items-center justify-center px-8 text-center"
          >
            {/* Illustration Blob (Responsive Size) */}
            <div className={`w-[65vw] h-[65vw] max-w-[280px] max-h-[280px] ${steps[currentStep].bg} rounded-[3rem] rotate-3 flex items-center justify-center shadow-xl shadow-gray-200 mb-8 relative transition-colors duration-500 shrink-0`}>
               <div className="absolute inset-0 bg-white/10 rounded-[3rem] rotate-6 transform scale-90"></div>
               <div className="relative z-10 transform -rotate-3">
                 {steps[currentStep].icon}
               </div>
               {/* Hiasan Blur */}
               <div className={`absolute -z-10 w-full h-full ${steps[currentStep].bg} blur-3xl opacity-20 rounded-full`}></div>
            </div>

            {/* Text Content */}
            <div className="space-y-4">
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight">
                {steps[currentStep].title}
              </h1>
              <p className="text-gray-500 leading-relaxed text-sm sm:text-base">
                {steps[currentStep].desc}
              </p>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* 3. BOTTOM NAVIGATION (Fixed Height) */}
      <div className="h-28 flex items-center justify-between px-8 shrink-0">
        
        {/* Dots Indicator */}
        <div className="flex gap-2">
          {steps.map((_, index) => (
            <motion.div
              key={index}
              animate={{ 
                width: index === currentStep ? 32 : 8,
                backgroundColor: index === currentStep ? '#0f172a' : '#cbd5e1'
              }}
              className="h-2 rounded-full transition-all duration-300"
            />
          ))}
        </div>

        {/* Next Button */}
        <button 
          onClick={handleNext}
          className="w-16 h-16 bg-slate-900 text-white rounded-full flex items-center justify-center hover:bg-slate-800 active:scale-90 transition-transform shadow-xl shadow-slate-200"
        >
          {currentStep === steps.length - 1 ? <CheckCircle2 size={24}/> : <ChevronRight size={28}/>}
        </button>
      </div>

    </div>
  )
}