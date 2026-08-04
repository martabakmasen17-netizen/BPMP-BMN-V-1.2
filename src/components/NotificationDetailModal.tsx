import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  ArrowDownLeft, 
  ArrowUpRight, 
  AlertTriangle, 
  UserPlus, 
  Bell, 
  Package, 
  Calendar, 
  User, 
  FileText, 
  Building2, 
  CheckCircle2, 
  ExternalLink,
  ShieldAlert,
  Tag
} from 'lucide-react';
import { SystemNotification, ActiveTab } from '../types';

interface NotificationDetailModalProps {
  notification: SystemNotification | null;
  onClose: () => void;
  onNavigateTab?: (tab: ActiveTab) => void;
  onMarkRead?: (id: string) => void;
}

export default function NotificationDetailModal({
  notification,
  onClose,
  onNavigateTab,
  onMarkRead
}: NotificationDetailModalProps) {
  if (!notification) return null;

  const handleMarkAndClose = () => {
    if (onMarkRead && !notification.read) {
      onMarkRead(notification.id);
    }
    onClose();
  };

  const handleNavigate = () => {
    if (onMarkRead && !notification.read) {
      onMarkRead(notification.id);
    }
    if (onNavigateTab) {
      if (notification.tipe === 'barang_masuk') {
        onNavigateTab('barang_masuk');
      } else if (notification.tipe === 'barang_keluar') {
        onNavigateTab('barang_keluar');
      } else if (notification.tipe === 'stok_rendah' || notification.tipe === 'stok_habis') {
        onNavigateTab('barang');
      } else if (notification.tipe === 'registrasi_user') {
        onNavigateTab('admin_control');
      } else {
        onNavigateTab('riwayat');
      }
    }
    onClose();
  };

  const getHeaderStyle = () => {
    switch (notification.tipe) {
      case 'barang_masuk':
        return {
          bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
          badgeBg: 'bg-emerald-100 text-emerald-800',
          iconBg: 'bg-emerald-500 text-white',
          Icon: ArrowDownLeft,
          title: 'Transaksi Barang Masuk'
        };
      case 'barang_keluar':
        return {
          bg: 'bg-blue-50 text-blue-800 border-blue-200',
          badgeBg: 'bg-blue-100 text-blue-800',
          iconBg: 'bg-blue-600 text-white',
          Icon: ArrowUpRight,
          title: 'Transaksi Barang Keluar'
        };
      case 'stok_habis':
        return {
          bg: 'bg-red-50 text-red-800 border-red-200',
          badgeBg: 'bg-red-100 text-red-800',
          iconBg: 'bg-red-600 text-white',
          Icon: ShieldAlert,
          title: 'Peringatan Stok Habis'
        };
      case 'stok_rendah':
        return {
          bg: 'bg-amber-50 text-amber-800 border-amber-200',
          badgeBg: 'bg-amber-100 text-amber-800',
          iconBg: 'bg-amber-500 text-white',
          Icon: AlertTriangle,
          title: 'Peringatan Stok Minimum'
        };
      case 'registrasi_user':
        return {
          bg: 'bg-purple-50 text-purple-800 border-purple-200',
          badgeBg: 'bg-purple-100 text-purple-800',
          iconBg: 'bg-purple-600 text-white',
          Icon: UserPlus,
          title: 'Pendaftaran Pengguna Baru'
        };
      default:
        return {
          bg: 'bg-slate-50 text-slate-800 border-slate-200',
          badgeBg: 'bg-slate-200 text-slate-800',
          iconBg: 'bg-slate-700 text-white',
          Icon: Bell,
          title: 'Pemberitahuan Aktivitas Sistem'
        };
    }
  };

  const style = getHeaderStyle();
  const IconComponent = style.Icon;
  const d = notification.details;

  const formattedDate = new Date(notification.tanggal).toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden flex flex-col"
        >
          {/* Modal Header */}
          <div className={`p-5 border-b ${style.bg} flex items-center justify-between relative`}>
            <div className="flex items-center gap-3">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center shadow-md ${style.iconBg}`}>
                <IconComponent className="w-6 h-6" />
              </div>
              <div>
                <span className={`inline-block px-2.5 py-0.5 text-[11px] font-bold rounded-full uppercase tracking-wider mb-0.5 ${style.badgeBg}`}>
                  {style.title}
                </span>
                <h3 className="text-base font-extrabold text-slate-900 leading-tight">
                  Detail Pemberitahuan
                </h3>
              </div>
            </div>
            <button
              onClick={handleMarkAndClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
            {/* Main Message Callout */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 flex items-start gap-3">
              <Bell className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="space-y-1">
                <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Ringkasan Pesan</p>
                <p className="text-sm font-semibold text-slate-800 leading-relaxed">
                  {notification.pesan}
                </p>
              </div>
            </div>

            {/* Structured Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="bg-white p-3 rounded-xl border border-slate-200 flex items-center gap-2.5">
                <Calendar className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <div className="min-w-0">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase block">Waktu Transaksi</span>
                  <span className="font-bold text-slate-800 truncate block">{formattedDate}</span>
                </div>
              </div>

              <div className="bg-white p-3 rounded-xl border border-slate-200 flex items-center gap-2.5">
                <User className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <div className="min-w-0">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase block">Inisiator / Aktor</span>
                  <span className="font-bold text-slate-800 truncate block">
                    {notification.actorName || d?.petugas || 'Sistem BMN'}
                    {notification.actorRole ? ` (${notification.actorRole})` : ''}
                  </span>
                </div>
              </div>

              {d?.namaBarang && (
                <div className="bg-white p-3 rounded-xl border border-slate-200 flex items-center gap-2.5 sm:col-span-2">
                  <Package className="w-4 h-4 text-blue-500 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] text-slate-400 font-semibold uppercase block">Nama Barang</span>
                    <span className="font-extrabold text-slate-900 text-sm truncate block">{d.namaBarang}</span>
                  </div>
                </div>
              )}

              {d?.jumlah !== undefined && (
                <div className="bg-white p-3 rounded-xl border border-slate-200 flex items-center gap-2.5">
                  <Tag className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  <div>
                    <span className="text-[10px] text-slate-400 font-semibold uppercase block">Jumlah Mutasi</span>
                    <span className="font-black text-slate-900 text-sm">{d.jumlah} {d.satuan || 'Pcs'}</span>
                  </div>
                </div>
              )}

              {d?.unitAtauSupplier && (
                <div className="bg-white p-3 rounded-xl border border-slate-200 flex items-center gap-2.5">
                  <Building2 className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                  <div className="min-w-0">
                    <span className="text-[10px] text-slate-400 font-semibold uppercase block">
                      {notification.tipe === 'barang_masuk' ? 'Penyedia / Supplier' : 'Unit Kerja Tujuan'}
                    </span>
                    <span className="font-bold text-slate-800 truncate block">{d.unitAtauSupplier}</span>
                  </div>
                </div>
              )}

              {d?.status && (
                <div className="bg-white p-3 rounded-xl border border-slate-200 flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <div>
                    <span className="text-[10px] text-slate-400 font-semibold uppercase block">Status Persetujuan</span>
                    <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[11px]">
                      {d.status}
                    </span>
                  </div>
                </div>
              )}

              {d?.noDokumen && (
                <div className="bg-white p-3 rounded-xl border border-slate-200 flex items-center gap-2.5">
                  <FileText className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <div className="min-w-0">
                    <span className="text-[10px] text-slate-400 font-semibold uppercase block">Nomor Dokumen</span>
                    <span className="font-bold text-slate-800 truncate block">{d.noDokumen}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Catatan / Keterangan Tambahan */}
            {d?.catatan && (
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
                <span className="text-[10px] text-slate-400 font-semibold uppercase block mb-1">Catatan / Keperluan</span>
                <p className="text-slate-700 italic">"{d.catatan}"</p>
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between gap-3">
            <button
              onClick={handleMarkAndClose}
              className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold rounded-xl text-xs transition-all shadow-sm"
            >
              Tandai Terbaca & Tutup
            </button>

            {onNavigateTab && (
              <button
                onClick={handleNavigate}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-all shadow-md hover:shadow-lg flex items-center gap-1.5"
              >
                <span>Buka Menu Terkait</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
