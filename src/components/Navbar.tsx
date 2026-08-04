/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Bell, Search, User, Shield, Menu, ChevronDown, Check, CheckSquare, LogOut, AlertTriangle, X,
  ArrowDownLeft, ArrowUpRight, ShieldAlert, UserPlus, Info, ChevronRight
} from 'lucide-react';
import { ActiveTab, SystemNotification, UserAccount } from '../types';

interface NavbarProps {
  activeTab: ActiveTab;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  currentUser: UserAccount | null;
  onLogout: () => void;
  notifications: SystemNotification[];
  setNotifications: React.Dispatch<React.SetStateAction<SystemNotification[]>>;
  onSelectNotification?: (notification: SystemNotification) => void;
}

export function filterNotificationsForUser(notifications: SystemNotification[], user: UserAccount | null): SystemNotification[] {
  if (!notifications) return [];
  if (!user || user.role === 'Administrator') {
    return notifications; // Admin sees all
  }
  return notifications.filter(n => {
    if (n.isAdminOnly) return false;
    if (n.actorRole === 'Administrator' && (n.tipe === 'sistem' || n.tipe === 'aktivitas')) {
      return false;
    }
    return true;
  });
}

export function isNotificationReadByUser(notification: SystemNotification, username: string | undefined): boolean {
  if (!username) return !!notification.read;
  if (notification.readByUsers !== undefined && notification.readByUsers !== null) {
    let list: string[] = [];
    if (typeof notification.readByUsers === 'string') {
      list = notification.readByUsers.split(',').map(s => s.trim()).filter(Boolean);
    } else if (Array.isArray(notification.readByUsers)) {
      list = notification.readByUsers;
    }
    return list.includes(username);
  }
  return !!notification.read;
}

export function markNotificationAsReadForUser(notification: SystemNotification, username: string): SystemNotification {
  if (!username) return { ...notification, read: true };
  let list: string[] = [];
  if (notification.readByUsers !== undefined && notification.readByUsers !== null) {
    if (typeof notification.readByUsers === 'string') {
      list = notification.readByUsers.split(',').map(s => s.trim()).filter(Boolean);
    } else if (Array.isArray(notification.readByUsers)) {
      list = [...notification.readByUsers];
    }
  }
  if (!list.includes(username)) {
    list.push(username);
  }
  return {
    ...notification,
    readByUsers: list.join(','),
    read: true
  };
}

export default function Navbar({
  activeTab,
  sidebarCollapsed,
  setSidebarCollapsed,
  currentUser,
  onLogout,
  notifications,
  setNotifications,
  onSelectNotification
}: NavbarProps) {
  const [showNotificationPopover, setShowNotificationPopover] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const getPageTitle = () => {
    switch (activeTab) {
      case 'dashboard':
        return 'Dashboard Pemantauan';
      case 'barang':
        return 'Data Master Barang';
      case 'kategori':
        return 'Kategori Barang';
      case 'supplier':
        return 'Daftar Supplier';
      case 'unit':
        return 'Daftar Unit Kerja';
      case 'satuan':
        return 'Satuan Barang';
      case 'pegawai':
        return 'Daftar Pegawai BMN';
      case 'barang_masuk':
        return 'Transaksi Barang Masuk';
      case 'barang_keluar':
        return 'Transaksi Barang Keluar';
      case 'riwayat':
        return 'Riwayat Mutasi Stok';
      case 'laporan':
        return 'Laporan & Analytics';
      case 'pengaturan':
        return 'Pengaturan Sistem';
      case 'audit_log':
        return 'Audit Log & Keamanan';
      case 'admin_control':
        return 'Admin Control Center';
      default:
        return 'Sistem Persediaan';
    }
  };

  const getBreadcrumbs = () => {
    const root = 'BPMP Sumsel';
    let child = '';
    switch (activeTab) {
      case 'dashboard':
        child = 'Dashboard';
        break;
      case 'barang':
      case 'kategori':
      case 'supplier':
      case 'unit':
      case 'satuan':
      case 'pegawai':
        child = `Data Master / ${getPageTitle()}`;
        break;
      case 'barang_masuk':
      case 'barang_keluar':
      case 'riwayat':
        child = `Transaksi / ${getPageTitle()}`;
        break;
      case 'laporan':
        child = 'Laporan';
        break;
      case 'pengaturan':
        child = 'Pengaturan';
        break;
      case 'audit_log':
        child = 'Keamanan';
        break;
      case 'admin_control':
        child = 'Admin Control';
        break;
    }
    return (
      <div className="hidden sm:flex items-center gap-1.5 text-xs text-gray-500 font-medium">
        <span>{root}</span>
        <span>/</span>
        <span className="text-gray-900 font-semibold">{child}</span>
      </div>
    );
  };

  const visibleNotifications = filterNotificationsForUser(notifications, currentUser);
  const unreadCount = visibleNotifications.filter(n => !isNotificationReadByUser(n, currentUser?.username)).length;

  const handleMarkAllRead = () => {
    if (!currentUser) return;
    setNotifications(prev => prev.map(n => markNotificationAsReadForUser(n, currentUser.username)));
  };

  const handleMarkOneRead = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUser) return;
    setNotifications(prev => prev.map(n => n.id === id ? markNotificationAsReadForUser(n, currentUser.username) : n));
  };

  const handleNotificationClick = (item: SystemNotification) => {
    setShowNotificationPopover(false);
    if (currentUser && !isNotificationReadByUser(item, currentUser.username)) {
      setNotifications(prev => prev.map(n => n.id === item.id ? markNotificationAsReadForUser(n, currentUser.username) : n));
    }
    if (onSelectNotification) {
      onSelectNotification(item);
    }
  };

  const getNotificationIcon = (tipe: string) => {
    switch (tipe) {
      case 'barang_masuk':
        return <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-600" />;
      case 'barang_keluar':
        return <ArrowUpRight className="w-3.5 h-3.5 text-blue-600" />;
      case 'stok_habis':
        return <ShieldAlert className="w-3.5 h-3.5 text-red-600" />;
      case 'stok_rendah':
        return <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />;
      case 'registrasi_user':
        return <UserPlus className="w-3.5 h-3.5 text-purple-600" />;
      default:
        return <Info className="w-3.5 h-3.5 text-slate-600" />;
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 h-16 sticky top-0 px-4 md:px-6 flex items-center justify-between z-20">
      {/* Title & Breadcrumbs */}
      <div className="flex items-center gap-3 min-w-0 flex-1 sm:flex-initial">
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-600 md:hidden flex-shrink-0"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex flex-col min-w-0">
          {getBreadcrumbs()}
          <h1 className="text-sm sm:text-lg font-bold text-gray-900 leading-tight truncate max-w-[115px] xs:max-w-[165px] sm:max-w-none" title={getPageTitle()}>
            {getPageTitle()}
          </h1>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0">
        {/* Active Profile Info */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 border border-blue-100 flex items-center justify-center font-bold text-xs">
            {currentUser ? currentUser.nama.charAt(0).toUpperCase() : 'P'}
          </div>
          <div className="hidden md:flex flex-col text-left">
            <span className="text-xs font-bold text-gray-900 truncate max-w-[120px]">
              {currentUser ? currentUser.nama : 'Petugas BMN'}
            </span>
            <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">
              {currentUser ? currentUser.role : 'Petugas'}
            </span>
          </div>
        </div>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotificationPopover(!showNotificationPopover);
            }}
            className="p-2 hover:bg-slate-50 border border-slate-200 rounded-xl text-slate-600 relative transition-all cursor-pointer"
            aria-label="Notifikasi"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-white animate-bounce" />
            )}
          </button>

          <AnimatePresence>
            {showNotificationPopover && (
              <>
                {/* Mobile Backdrop Overlay */}
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs z-40 sm:hidden" 
                  onClick={() => setShowNotificationPopover(false)} 
                />

                {/* Popover Card - Mobile Fixed Center-Top, Desktop Absolute Right */}
                <motion.div 
                  initial={{ opacity: 0, y: -10, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.96 }}
                  transition={{ duration: 0.15 }}
                  className="fixed inset-x-3 top-16 max-w-sm mx-auto sm:absolute sm:inset-auto sm:right-0 sm:top-full sm:mt-2 sm:w-86 sm:max-w-none bg-white border border-slate-200/90 rounded-2xl shadow-2xl z-50 overflow-hidden text-slate-700"
                >
                  <div className="p-3.5 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">Pemberitahuan Sistem</span>
                      {unreadCount > 0 && (
                        <span className="px-2 py-0.5 text-[10px] font-extrabold bg-red-100 text-red-700 rounded-full">
                          {unreadCount} baru
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {unreadCount > 0 && (
                        <button
                          onClick={handleMarkAllRead}
                          className="text-[10px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer bg-blue-50 px-2 py-1 rounded-lg transition-colors"
                        >
                          <CheckSquare className="w-3 h-3" /> Tandai Terbaca
                        </button>
                      )}
                      <button
                        onClick={() => setShowNotificationPopover(false)}
                        className="p-1 hover:bg-slate-200/60 rounded-lg text-slate-400 hover:text-slate-600 sm:hidden"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="max-h-[70vh] sm:max-h-80 overflow-y-auto divide-y divide-slate-100">
                    {visibleNotifications.length === 0 ? (
                      <div className="p-8 text-center text-xs text-slate-400 font-medium flex flex-col items-center justify-center gap-2">
                        <Bell className="w-8 h-8 text-slate-200" />
                        <span>Tidak ada pemberitahuan baru</span>
                      </div>
                    ) : (
                      visibleNotifications.map(n => {
                        const isRead = isNotificationReadByUser(n, currentUser?.username);
                        return (
                          <div
                            key={n.id}
                            onClick={() => handleNotificationClick(n)}
                            className={`p-3 text-xs flex gap-2.5 items-start transition-all cursor-pointer hover:bg-slate-50 group relative ${isRead ? 'bg-white' : 'bg-blue-50/60'}`}
                          >
                            <div className="mt-0.5 w-7 h-7 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-100 transition-colors shadow-xs">
                              {getNotificationIcon(n.tipe)}
                            </div>
                            <div className="flex-1 min-w-0 pr-1">
                              <p className={`text-slate-800 leading-snug break-words ${!isRead ? 'font-bold text-slate-900' : 'font-medium text-slate-700'}`}>
                                {n.pesan}
                              </p>
                              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-slate-400 mt-1">
                                <span>
                                  {new Date(n.tanggal).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} • {new Date(n.tanggal).toLocaleDateString('id-ID')}
                                </span>
                                {n.actorName && (
                                  <span className="font-semibold text-slate-600 truncate max-w-[120px]">
                                    • {n.actorName}
                                  </span>
                                )}
                              </div>
                            </div>
                            {!isRead && (
                              <button
                                onClick={(e) => handleMarkOneRead(n.id, e)}
                                className="p-1 hover:bg-blue-100 rounded-lg text-slate-400 hover:text-blue-700 transition-colors flex-shrink-0 mt-0.5"
                                title="Tandai terbaca"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* LOGOUT BUTTON */}
        <button
          onClick={() => setShowLogoutConfirm(true)}
          className="flex items-center gap-1 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
          title="Keluar Aplikasi"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Keluar</span>
        </button>
      </div>
    
      <AnimatePresence>
        {showLogoutConfirm && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowLogoutConfirm(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-white rounded-2xl shadow-xl z-50 overflow-hidden"
            >
              <div className="p-6">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4 mx-auto">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 text-center mb-2">Konfirmasi Keluar</h3>
                <p className="text-sm text-slate-500 text-center mb-6">
                  Apakah Anda yakin ingin keluar dari sesi saat ini? Anda harus masuk kembali untuk mengakses sistem.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowLogoutConfirm(false)}
                    className="flex-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    onClick={() => {
                      setShowLogoutConfirm(false);
                      onLogout();
                    }}
                    className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-sm transition-colors shadow-sm cursor-pointer"
                  >
                    Ya, Keluar
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </header>
  );
}
