import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Bell, 
  ArrowDownLeft, 
  ArrowUpRight, 
  AlertTriangle, 
  ShieldAlert, 
  UserPlus, 
  X, 
  ChevronRight 
} from 'lucide-react';
import { SystemNotification } from '../types';

interface NotificationToastProps {
  notification?: SystemNotification | null;
  toast?: SystemNotification | null;
  onClose: () => void;
  onClickDetail?: (notification: SystemNotification) => void;
  onClick?: () => void;
}

export default function NotificationToast({
  notification,
  toast: toastProp,
  onClose,
  onClickDetail,
  onClick
}: NotificationToastProps) {
  const activeNotif = notification || toastProp;
  if (!activeNotif) return null;

  const handleContainerClick = () => {
    if (onClick) {
      onClick();
    } else if (onClickDetail && activeNotif) {
      onClickDetail(activeNotif);
    }
  };

  const getToastIcon = () => {
    switch (activeNotif.tipe) {
      case 'barang_masuk':
        return <ArrowDownLeft className="w-5 h-5 text-emerald-600" />;
      case 'barang_keluar':
        return <ArrowUpRight className="w-5 h-5 text-blue-600" />;
      case 'stok_habis':
        return <ShieldAlert className="w-5 h-5 text-red-600" />;
      case 'stok_rendah':
        return <AlertTriangle className="w-5 h-5 text-amber-600" />;
      case 'registrasi_user':
        return <UserPlus className="w-5 h-5 text-purple-600" />;
      default:
        return <Bell className="w-5 h-5 text-blue-600" />;
    }
  };

  const getBadgeText = () => {
    switch (activeNotif.tipe) {
      case 'barang_masuk':
        return 'BARANG MASUK';
      case 'barang_keluar':
        return 'BARANG KELUAR';
      case 'stok_habis':
        return 'STOK HABIS';
      case 'stok_rendah':
        return 'STOK MINIMUM';
      case 'registrasi_user':
        return 'USER BARU';
      default:
        return 'AKTIVITAS BARU';
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed top-18 sm:top-20 left-3 right-3 sm:left-auto sm:right-4 z-50 max-w-sm w-auto sm:w-full ml-auto pointer-events-none">
        <motion.div
          initial={{ opacity: 0, x: 80, scale: 0.9 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 80, scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 350, damping: 25 }}
          className="pointer-events-auto bg-white border border-slate-200/90 shadow-2xl rounded-2xl p-4 flex items-start gap-3 relative overflow-hidden group hover:border-blue-300 transition-all cursor-pointer"
          onClick={handleContainerClick}
        >
          {/* Left accent bar */}
          <div className="absolute top-0 bottom-0 left-0 w-1.5 bg-blue-600 rounded-l-2xl" />

          {/* Icon container */}
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:bg-blue-50 transition-colors">
            {getToastIcon()}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 pr-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-extrabold px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full tracking-wider uppercase">
                {getBadgeText()}
              </span>
              <span className="text-[10px] text-slate-400 font-medium">Baru saja</span>
            </div>
            <p className="text-xs font-bold text-slate-900 line-clamp-2 leading-snug">
              {activeNotif.pesan}
            </p>
            {activeNotif.actorName && (
              <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1 font-medium">
                <span>Oleh:</span>
                <span className="font-semibold text-slate-700">{activeNotif.actorName}</span>
              </p>
            )}
            <div className="mt-2 flex items-center text-[11px] font-bold text-blue-600 group-hover:text-blue-800">
              <span>Klik untuk lihat detail</span>
              <ChevronRight className="w-3.5 h-3.5 ml-0.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Close button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
