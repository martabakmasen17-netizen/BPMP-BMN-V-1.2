/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Papa from 'papaparse';
import { ShieldAlert, X, RefreshCw, CheckCircle2, Database } from 'lucide-react';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import DashboardView from './components/DashboardView';
import BarangView from './components/BarangView';
import KategoriView from './components/KategoriView';
import SupplierView from './components/SupplierView';
import UnitView from './components/UnitView';
import SatuanView from './components/SatuanView';
import TransaksiMasukView from './components/TransaksiMasukView';
import TransaksiKeluarView from './components/TransaksiKeluarView';
import RiwayatView from './components/RiwayatView';
import LaporanView from './components/LaporanView';
import PengaturanView from './components/PengaturanView';
import AuditLogView from './components/AuditLogView';
import PegawaiView from './components/PegawaiView';
import LoginView from './components/LoginView';
import AdminControlView from './components/AdminControlView';
import LogoImage from './components/LogoImage';
import ErrorBoundary from './components/ErrorBoundary';
import NotificationDetailModal from './components/NotificationDetailModal';
import NotificationToast from './components/NotificationToast';
import { filterNotificationsForUser, isNotificationReadByUser, markNotificationAsReadForUser } from './components/Navbar';
import { playNotificationSound } from './utils/sound';

import { compressImage } from './utils/imageCompressor';
import {
  INITIAL_BARANG,
  INITIAL_KATEGORI,
  INITIAL_SUPPLIER,
  INITIAL_UNIT,
  INITIAL_SATUAN,
  INITIAL_BARANG_MASUK,
  INITIAL_BARANG_KELUAR,
  INITIAL_RIWAYAT,
  INITIAL_AUDIT_LOG,
  INITIAL_NOTIFICATION,
  DEFAULT_SETTINGS,
  INITIAL_PEGAWAI,
  INITIAL_DRIVE_FILES
} from './data';

import {
  Barang,
  Kategori,
  Supplier,
  Unit,
  Satuan,
  BarangMasuk,
  BarangKeluar,
  Riwayat,
  AuditLog,
  SystemNotification,
  Settings,
  ActiveTab,
  Pegawai,
  UserAccount,
  DriveFileItem
} from './types';

const INITIAL_ACCOUNTS: UserAccount[] = [];

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 1024;
    }
    return false;
  });

  // Core Authentication states
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    try {
      const stored = localStorage.getItem('bpmp_bmn_session');
      if (stored) {
        const parsed = JSON.parse(stored);
        const loginTime = new Date(parsed.timestamp).getTime();
        const now = new Date().getTime();
        // 12 hours = 12 * 60 * 60 * 1000 = 43200000 ms
        if (now - loginTime < 43200000) {
          const freshUser = INITIAL_ACCOUNTS.find(a => a.username === parsed.user.username);
          if (freshUser) {
             return freshUser;
          }
          return parsed.user;
        } else {
          localStorage.removeItem('bpmp_bmn_session');
        }
      }
    } catch (e) {
      console.error('Failed to parse session:', e);
    }
    return null;
  });

  const handleSetCurrentUser = (user: UserAccount | null) => {
    setCurrentUser(user);
    if (user) {
      localStorage.setItem('bpmp_bmn_session', JSON.stringify({
        user,
        timestamp: new Date().toISOString()
      }));
    } else {
      localStorage.removeItem('bpmp_bmn_session');
    }
  };
  
  const getCachedData = (key: string, fallback: any) => {
    if (typeof window === 'undefined') return fallback;
    try {
      const cached = localStorage.getItem('bpmp_bmn_prod_clean_v4_cache_' + key);
      if (cached) return JSON.parse(cached);
    } catch(e) {}
    return fallback;
  };

  const [accounts, setAccounts] = useState<UserAccount[]>(() => getCachedData('accounts', INITIAL_ACCOUNTS));

  // Core database states
  const [barangList, setBarangList] = useState<Barang[]>(() => getCachedData('barangList', INITIAL_BARANG));
  const [kategoriList, setKategoriList] = useState<Kategori[]>(() => getCachedData('kategoriList', INITIAL_KATEGORI));
  const [supplierList, setSupplierList] = useState<Supplier[]>(() => getCachedData('supplierList', INITIAL_SUPPLIER));
  const [unitList, setUnitList] = useState<Unit[]>(() => getCachedData('unitList', INITIAL_UNIT));
  const [satuanList, setSatuanList] = useState<Satuan[]>(() => getCachedData('satuanList', INITIAL_SATUAN));
  const [pegawaiList, setPegawaiList] = useState<Pegawai[]>(() => getCachedData('pegawaiList', INITIAL_PEGAWAI));
  const [barangMasukList, setBarangMasukList] = useState<BarangMasuk[]>(() => getCachedData('barangMasukList', INITIAL_BARANG_MASUK));
  const [barangKeluarList, setBarangKeluarList] = useState<BarangKeluar[]>(() => getCachedData('barangKeluarList', INITIAL_BARANG_KELUAR));
  const [riwayatList, setRiwayatList] = useState<Riwayat[]>(() => getCachedData('riwayatList', INITIAL_RIWAYAT));
  const [auditLogsList, setAuditLogsList] = useState<AuditLog[]>(() => getCachedData('auditLogsList', INITIAL_AUDIT_LOG));
  const [notificationsList, setNotificationsList] = useState<SystemNotification[]>(() => getCachedData('notificationsList', INITIAL_NOTIFICATION));
  const [settings, setSettings] = useState<Settings>(() => {
    const cached = getCachedData('settings', DEFAULT_SETTINGS);
    if (!cached.logoUrl || cached.logoUrl.includes('upload.wikimedia.org')) {
      cached.logoUrl = '/logo.png';
    }
    return cached;
  });
  const [driveFiles, setDriveFiles] = useState<DriveFileItem[]>(() => getCachedData('driveFiles', INITIAL_DRIVE_FILES));

  const [selectedNotificationForModal, setSelectedNotificationForModal] = useState<SystemNotification | null>(null);
  const [activeToast, setActiveToast] = useState<SystemNotification | null>(null);
  const knownNotifIdsRef = React.useRef<Set<string>>(new Set());

  // Auto-dismiss toast after 6 seconds
  React.useEffect(() => {
    if (!activeToast) return;
    const timer = setTimeout(() => {
      setActiveToast(null);
    }, 6000);
    return () => clearTimeout(timer);
  }, [activeToast]);

  const hasCache = typeof window !== 'undefined' && !!localStorage.getItem('bpmp_bmn_prod_clean_v4_cache_barangList');
  const [isLoading, setIsLoading] = useState(!hasCache);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showSyncSuccess, setShowSyncSuccess] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const firstLoadRef = React.useRef(true);
  const skipNextSaveRef = React.useRef(false);

  const serverVersionRef = React.useRef(0);

  // Load from Sheets on mount and poll periodically
  React.useEffect(() => {
    const fetchData = async (silent = false, force = false) => {
      try {
        if (!silent) setIsSyncing(true);
        const url = force ? '/api/sync?force=1' : '/api/sync';
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          skipNextSaveRef.current = true;
          
          const rawBarang = Array.isArray(data.Barang) ? data.Barang : [];
          // MIGRASI STRUKTUR PROFESIONAL: Pastikan ID / Kode Barang unik secara global dengan menggabungkan Kategori + Sequence
          const migratedBarang = rawBarang.map((b: Barang) => {
             // Jika id masih format lama yang hanya sequence (misal "000001") dan tidak ada tanda hubung, kita perbarui
             if (b.id && !b.id.includes('-') && b.kategoriId) {
               return { ...b, id: `${b.kategoriId}-${b.id}` };
             }
             return b;
          });
          
          const fixTransId = (t: any) => {
             if (t.barangId && !t.barangId.includes('-')) {
                // Temukan barang yang cocok berdasarkan nama untuk disambiguasi jika ID lama bentrok
                const matched = migratedBarang.find(b => b.nama === t.namaBarang && b.id.endsWith(`-${t.barangId}`));
                if (matched) {
                   return { ...t, barangId: matched.id };
                }
             }
             return t;
          };

          if (Array.isArray(data.Barang)) setBarangList(migratedBarang);
          if (Array.isArray(data.Kategori)) setKategoriList(data.Kategori);
          if (Array.isArray(data.Supplier)) setSupplierList(data.Supplier);
          if (Array.isArray(data.Unit)) setUnitList(data.Unit);
          if (Array.isArray(data.Satuan)) setSatuanList(data.Satuan);
          if (Array.isArray(data.Pegawai)) setPegawaiList(data.Pegawai);
          
          if (Array.isArray(data.BarangMasuk)) setBarangMasukList(data.BarangMasuk.map(fixTransId));
          if (Array.isArray(data.BarangKeluar)) setBarangKeluarList(data.BarangKeluar.map(fixTransId));
          if (Array.isArray(data.Riwayat)) setRiwayatList(data.Riwayat.map(fixTransId));

          if (Array.isArray(data.AuditLog)) setAuditLogsList(data.AuditLog);
          if (Array.isArray(data.Accounts)) {
            const updatedAccs = data.Accounts.map((a: UserAccount) =>
              a.username === 'admin'
                ? { ...a, nama: 'Ilham Muharrama', nip: '-', jabatan: 'Magang/KP', telepon: '08981741680' }
                : a
            );
            setAccounts(updatedAccs);
          }
          if (Array.isArray(data.Settings) && data.Settings.length > 0) setSettings(data.Settings[0]);
          if (Array.isArray(data.Notifications)) {
            const remoteNotifs = data.Notifications as SystemNotification[];
            setNotificationsList(prevNotifs => {
              const existingSet = knownNotifIdsRef.current;
              if (existingSet.size > 0) {
                const newlyArrived = remoteNotifs.filter(n => !existingSet.has(n.id));
                if (newlyArrived.length > 0) {
                  const newest = newlyArrived[0];
                  const isRecent = (Date.now() - new Date(newest.tanggal).getTime()) < 60000;
                  const currentAcc = currentUser;
                  const visible = filterNotificationsForUser([newest], currentAcc).length > 0;
                  const currentActorName = currentUser ? currentUser.nama : '';

                  const isUnreadForMe = !isNotificationReadByUser(newest, currentUser?.username);

                  if (isRecent && visible && isUnreadForMe && newest.actorName !== currentActorName) {
                    playNotificationSound();
                    setActiveToast(newest);
                  }
                }
              }

              const nextSet = new Set<string>();
              remoteNotifs.forEach(n => nextSet.add(n.id));
              knownNotifIdsRef.current = nextSet;

              return remoteNotifs;
            });
          }
        } else {
          if (!silent) {
            const errData = await res.json();
            setSyncError(`Gagal memuat data: ${errData.error || 'Server error'}`);
          }
        }
      } catch (e: any) {
        console.error("Gagal sinkronisasi data awal:", e);
        if (!silent) setSyncError(`Gagal memuat data: ${e.message}`);
      } finally {
        setIsLoading(false);
        if (!silent) {
           setIsSyncing(false);
        }
      }
    };
    
    // Initial fetch from Google Sheets
    fetchData(false, true);
    
    // Realtime polling endpoint
    const pollVersion = async () => {
      try {
        const res = await fetch('/api/sync/version');
        if (res.ok) {
          const data = await res.json();
          // If server version is greater than our known version, we need to fetch updates!
          if (data.version > serverVersionRef.current) {
            serverVersionRef.current = data.version;
            // Fetch updates silently from server memory cache
            fetchData(true, false);
          }
        }
      } catch(e) {}
    };

    // Auto sync check every 2.5 seconds for snappy realtime feeling
    const interval = setInterval(pollVersion, 2500);
    
    return () => clearInterval(interval);
  }, []);

  // Ensure admin user profile always matches Ilham Muharrama
  React.useEffect(() => {
    if (currentUser && currentUser.username === 'admin') {
      if (currentUser.nama !== 'Ilham Muharrama' || currentUser.jabatan !== 'Magang/KP' || currentUser.telepon !== '08981741680' || currentUser.nip !== '-') {
        const updated = {
          ...currentUser,
          nama: 'Ilham Muharrama',
          nip: '-',
          jabatan: 'Magang/KP',
          telepon: '08981741680'
        };
        setCurrentUser(updated);
        localStorage.setItem('bpmp_bmn_session', JSON.stringify({
          user: updated,
          timestamp: new Date().toISOString()
        }));
      }
    }
  }, [currentUser]);

  // Save to Sheets on change (debounced)
  React.useEffect(() => {
    if (isLoading) return; // Jangan save saat masih loading awal
    if (firstLoadRef.current) {
      firstLoadRef.current = false;
      return; 
    }
    if (skipNextSaveRef.current) {
      skipNextSaveRef.current = false;
      return;
    }

    
    // Save to local cache first for fast load on next refresh
    try {
      localStorage.setItem('bpmp_bmn_prod_clean_v4_cache_accounts', JSON.stringify(accounts));
      localStorage.setItem('bpmp_bmn_prod_clean_v4_cache_barangList', JSON.stringify(barangList));
      localStorage.setItem('bpmp_bmn_prod_clean_v4_cache_kategoriList', JSON.stringify(kategoriList));
      localStorage.setItem('bpmp_bmn_prod_clean_v4_cache_supplierList', JSON.stringify(supplierList));
      localStorage.setItem('bpmp_bmn_prod_clean_v4_cache_unitList', JSON.stringify(unitList));
      localStorage.setItem('bpmp_bmn_prod_clean_v4_cache_satuanList', JSON.stringify(satuanList));
      localStorage.setItem('bpmp_bmn_prod_clean_v4_cache_pegawaiList', JSON.stringify(pegawaiList));
      localStorage.setItem('bpmp_bmn_prod_clean_v4_cache_barangMasukList', JSON.stringify(barangMasukList));
      localStorage.setItem('bpmp_bmn_prod_clean_v4_cache_barangKeluarList', JSON.stringify(barangKeluarList));
      localStorage.setItem('bpmp_bmn_prod_clean_v4_cache_riwayatList', JSON.stringify(riwayatList));
      localStorage.setItem('bpmp_bmn_prod_clean_v4_cache_auditLogsList', JSON.stringify(auditLogsList));
      localStorage.setItem('bpmp_bmn_prod_clean_v4_cache_notificationsList', JSON.stringify(notificationsList));
      localStorage.setItem('bpmp_bmn_prod_clean_v4_cache_settings', JSON.stringify(settings));
    } catch(e) { console.error('Failed to cache data', e); }

const handler = setTimeout(async () => {
      setIsSyncing(true);
      setShowSyncSuccess(false);
      setSyncError(null);
      let saveOk = false;
      try {
        // Ensure image base64 never exceeds Google Sheets 50k cell limit
        const sanitizedBarang = await Promise.all(
          (barangList || []).map(async (item) => {
            if (item.imageUrl && item.imageUrl.startsWith('data:image') && item.imageUrl.length > 300000) {
              try {
                const compressed = await compressImage(item.imageUrl, 300, 300, 0.5);
                return { 
                  ...item, 
                  imageUrl: compressed && compressed.length < 40000 
                    ? compressed 
                    : 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?auto=format&fit=crop&q=80&w=200' 
                };
              } catch (e) {
                return { ...item, imageUrl: 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?auto=format&fit=crop&q=80&w=200' };
              }
            }
            return item;
          })
        );

        // Strip heavy base64 fileData from BarangMasuk and BarangKeluar before sending to Sheets
        const sanitizedBarangMasuk = (barangMasukList || []).map(item => {
          const { fileData, ...rest } = item as any;
          return rest;
        });

        const sanitizedBarangKeluar = (barangKeluarList || []).map(item => {
          const { fileData, ...rest } = item as any;
          return rest;
        });

        const res = await fetch('/api/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            Barang: sanitizedBarang,
            Kategori: kategoriList,
            Supplier: supplierList,
            Unit: unitList,
            Satuan: satuanList,
            Pegawai: pegawaiList,
            BarangMasuk: sanitizedBarangMasuk,
            BarangKeluar: sanitizedBarangKeluar,
            Riwayat: riwayatList,
            AuditLog: auditLogsList,
            Accounts: accounts,
            Settings: settings,
            Notifications: notificationsList
          })
        });
        
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || 'Server error');
        }
        saveOk = true;
      } catch (e: any) {
        console.error("Gagal menyimpan ke spreadsheet:", e);
        setSyncError(`Gagal menyimpan: ${e.message}`);
      } finally {
        setIsSyncing(false);
        if (saveOk) {
          setShowSyncSuccess(true);
          setTimeout(() => {
            setShowSyncSuccess(false);
          }, 1800);
        }
      }
    }, 1500); // Debounce 1.5 detik

    return () => clearTimeout(handler);
  }, [
    barangList, kategoriList, supplierList, unitList, satuanList, pegawaiList,
    barangMasukList, barangKeluarList, riwayatList, auditLogsList, accounts, settings, notificationsList, isLoading
  ]);

  // State for item quick mutation from dashboard
  const [quickAddBarangId, setQuickAddBarangId] = useState<string>('');

  const currentRole = currentUser ? currentUser.role : 'Petugas BMN';
  const currentUserActor = currentUser ? currentUser.nama : 'Tamu Pengunjung';

  // Audit Logging Helper
  const writeAuditLog = (aksi: string, detail: string) => {
    const newLog: AuditLog = {
      id: `LOG-${Date.now().toString().slice(-6)}`,
      tanggal: new Date().toISOString(),
      aktor: currentUserActor,
      role: currentRole,
      aksi,
      detail
    };
    setAuditLogsList(prev => [newLog, ...prev]);
  };

  // Add Notification Helper
  const sendSystemNotification = (
    tipe: SystemNotification['tipe'],
    pesan: string,
    details?: SystemNotification['details'],
    bId?: string,
    transId?: string,
    isAdminOnly?: boolean
  ) => {
    const newNotif: SystemNotification = {
      id: `NOT-${Date.now().toString().slice(-6)}`,
      tipe,
      pesan,
      tanggal: new Date().toISOString(),
      read: false,
      barangId: bId,
      transaksiId: transId,
      actorName: currentUserActor,
      actorRole: currentRole,
      isAdminOnly,
      details
    };
    setNotificationsList(prev => [newNotif, ...prev]);
    playNotificationSound();
    setActiveToast(newNotif);
  };

  // --- CATALOG CRUD CONTROLLERS ---

  const handleImportCsv = (file: File) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const data = results.data as any[];
        if (!data || data.length === 0) return;

        setBarangList(prev => {
          const newBarangList = [...prev];
          
          data.forEach(row => {
            const rawId = row.id;
            const kategoriId = row.kategoriId || '1010301001';
            const kategori = row.kategori || 'Kategori Default';
            const nama = row.nama || 'Barang Tanpa Nama';
            
            // Format ID jika belum digabungkan
            const newId = rawId && rawId.includes('-') ? rawId : `${kategoriId}-${rawId}`;
            
            // Cek apakah ID sudah ada
            const existingIndex = newBarangList.findIndex(b => b.id === newId);
            const newItem: Barang = {
              id: newId,
              kategoriId,
              kategori,
              nama,
              supplier: row.supplier || 'PT Internal',
              satuan: row.satuan || 'Buah',
              stokSekarang: Number(row.stokSekarang) || 0,
              stokMin: Number(row.stokMin) || 0,
              stokMaks: Number(row.stokMaks) || 100,
              deskripsi: row.deskripsi || '',
              imageUrl: row.imageUrl || 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?auto=format&fit=crop&q=80&w=200',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            };

            if (existingIndex > -1) {
              newBarangList[existingIndex] = { ...newBarangList[existingIndex], ...newItem, updatedAt: new Date().toISOString() };
            } else {
              newBarangList.push(newItem);
            }
          });
          
          writeAuditLog('Import CSV', `Mengimpor ${data.length} barang dari file ${file.name}`);
          return newBarangList;
        });

        // Tambahkan Kategori jika belum ada
        setKategoriList(prev => {
          const newCatList = [...prev];
          data.forEach(row => {
            const kategoriId = row.kategoriId;
            const kategori = row.kategori;
            if (kategoriId && kategori && !newCatList.some(k => k.id === kategoriId)) {
              newCatList.push({
                id: kategoriId,
                nama: kategori,
                deskripsi: `Kategori ${kategori} hasil import`,
                qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${kategoriId}`
              });
            }
          });
          return newCatList;
        });
      },
      error: (err) => {
        console.error("Gagal parse CSV:", err);
        setSyncError(`Gagal parse CSV: ${err.message}`);
      }
    });
  };

  const handleAddBarang = (item: Omit<Barang, 'createdAt' | 'updatedAt'> & { id?: string }) => {
    const cat = kategoriList.find(k => k.nama === item.kategori || k.id === item.kategoriId);
    const catCode = cat ? cat.id : (item.kategoriId || '1010301001');

    const sameCatItems = barangList.filter(b => b.kategoriId === catCode || b.kategori === item.kategori);
    
    let maxSequence = 0;
    sameCatItems.forEach(b => {
      const parts = b.id.split('-');
      const seqStr = parts.length > 1 ? parts[1] : b.id;
      const seq = parseInt(seqStr, 10);
      if (!isNaN(seq) && seq > maxSequence) {
        maxSequence = seq;
      }
    });
    const sequence = String(maxSequence + 1).padStart(6, '0');
    // Jika ID dari input form (item.id) sudah menyertakan kategori, gunakan itu, jika tidak buat yang unik secara global
    const newId = item.id && item.id.includes('-') ? item.id : (item.id ? `${catCode}-${item.id}` : `${catCode}-${sequence}`);

    const newBarang: Barang = {
      ...item,
      id: newId,
      kategoriId: catCode,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setBarangList(prev => [...prev, newBarang]);
    writeAuditLog('Tambah Barang', `Mendaftarkan barang baru ke katalog BMN: "${item.nama}" (${newId}) di Kategori ${item.kategori} (${catCode})`);
  };

  const handleEditBarang = (id: string, updated: Partial<Barang>) => {
    setBarangList(prev => prev.map(b => (b.id === id ? { ...b, ...updated, updatedAt: new Date().toISOString() } : b)));
    writeAuditLog('Ubah Barang', `Mengubah spesifikasi katalog barang: "${updated.nama || id}"`);
  };

  const handleDeleteBarang = (id: string) => {
    setBarangList(prev => prev.filter(b => b.id !== id));
    writeAuditLog('Hapus Barang', `Menghapus item barang BMN dari katalog: ID ${id}`);
  };

  const handleAddKategori = (kat: Omit<Kategori, 'id'> & { id?: string }) => {
    const newId = kat.id || `1010301${String(kategoriList.length + 1).padStart(3, '0')}`;
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${newId}`;
    setKategoriList(prev => [...prev, { ...kat, id: newId, qrCodeUrl }]);
    writeAuditLog('Tambah Kategori', `Mendaftarkan kategori baru: "${kat.nama}" (${newId})`);
  };

  const handleEditKategori = (id: string, updated: Partial<Kategori>) => {
    setKategoriList(prev => prev.map(k => (k.id === id ? { ...k, ...updated } : k)));
    writeAuditLog('Ubah Kategori', `Mengubah kategori: "${updated.nama || id}"`);
  };

  const handleDeleteKategori = (id: string) => {
    setKategoriList(prev => prev.filter(k => k.id !== id));
    writeAuditLog('Hapus Kategori', `Menghapus kategori: ID ${id}`);
  };

  const handleAddSupplier = (sup: Omit<Supplier, 'id'>) => {
    const newId = `SUP-${String(supplierList.length + 1).padStart(3, '0')}`;
    setSupplierList(prev => [...prev, { ...sup, id: newId }]);
    writeAuditLog('Tambah Supplier', `Mendaftarkan supplier penyedia baru: "${sup.nama}" (${newId})`);
  };

  const handleEditSupplier = (id: string, updated: Partial<Supplier>) => {
    setSupplierList(prev => prev.map(s => (s.id === id ? { ...s, ...updated } : s)));
    writeAuditLog('Ubah Supplier', `Mengubah rincian supplier: "${updated.nama || id}"`);
  };

  const handleDeleteSupplier = (id: string) => {
    setSupplierList(prev => prev.filter(s => s.id !== id));
    writeAuditLog('Hapus Supplier', `Menghapus supplier: ID ${id}`);
  };

  const handleAddUnit = (un: Omit<Unit, 'id'>) => {
    const newId = `UNT-${String(unitList.length + 1).padStart(3, '0')}`;
    setUnitList(prev => [...prev, { ...un, id: newId }]);
    writeAuditLog('Tambah Unit Kerja', `Mendaftarkan unit kerja baru: "${un.nama}" (${newId})`);
  };

  const handleEditUnit = (id: string, updated: Partial<Unit>) => {
    setUnitList(prev => prev.map(u => (u.id === id ? { ...u, ...updated } : u)));
    writeAuditLog('Ubah Unit Kerja', `Mengubah unit kerja: "${updated.nama || id}"`);
  };

  const handleDeleteUnit = (id: string) => {
    setUnitList(prev => prev.filter(u => u.id !== id));
    writeAuditLog('Hapus Unit Kerja', `Menghapus unit kerja: ID ${id}`);
  };

  const handleAddSatuan = (sat: Omit<Satuan, 'id'>) => {
    const newId = `SAT-${String(satuanList.length + 1).padStart(3, '0')}`;
    setSatuanList(prev => [...prev, { ...sat, id: newId }]);
    writeAuditLog('Tambah Satuan', `Mendaftarkan satuan ukuran baru: "${sat.nama}" (${newId})`);
  };

  const handleEditSatuan = (id: string, updated: Partial<Satuan>) => {
    setSatuanList(prev => prev.map(s => (s.id === id ? { ...s, ...updated } : s)));
    writeAuditLog('Ubah Satuan', `Mengubah satuan ukuran: "${updated.nama || id}"`);
  };

  const handleDeleteSatuan = (id: string) => {
    setSatuanList(prev => prev.filter(s => s.id !== id));
    writeAuditLog('Hapus Satuan', `Menghapus satuan ukuran: ID ${id}`);
  };

  const handleAddPegawai = (peg: Omit<Pegawai, 'id'>) => {
    const newId = `PGW-${String(pegawaiList.length + 1).padStart(3, '0')}`;
    setPegawaiList(prev => [...prev, { ...peg, id: newId }]);
    writeAuditLog('Tambah Pegawai BMN', `Mendaftarkan pegawai BMN baru: "${peg.nama}" (${newId})`);
  };

  const handleEditPegawai = (id: string, updated: Partial<Pegawai>) => {
    setPegawaiList(prev => prev.map(p => (p.id === id ? { ...p, ...updated } : p)));
    writeAuditLog('Ubah Pegawai BMN', `Mengubah informasi pegawai BMN: "${updated.nama || id}"`);
  };

  const handleDeletePegawai = (id: string) => {
    setPegawaiList(prev => prev.filter(p => p.id !== id));
    writeAuditLog('Hapus Pegawai BMN', `Menghapus pegawai BMN: ID ${id}`);
  };

  // --- TRANS MUTATION CONTROLLERS ---

  const handleProcessTransaksiMasuk = (
    trans: Omit<BarangMasuk, 'id'> & { id?: string; tanggal?: string },
    langsungKeluar?: { unitId: string, keperluan: string, petugas: string, catatan: string, tanggal?: string }
  ) => {
    const timestamp = trans.tanggal || new Date().toISOString();
    const dateObj = new Date(timestamp);
    const dateStr = !isNaN(dateObj.getTime()) 
      ? dateObj.toISOString().slice(2, 10).replace(/-/g, '') 
      : new Date().toISOString().slice(2, 10).replace(/-/g, '');
    
    // Ensure uniqueness for fallback ID by appending random chars
    const fallbackId = `TRM-${dateStr}-${String(barangMasukList.length + 1).padStart(2, '0')}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const newId = trans.id || fallbackId;

    const newTrans: BarangMasuk = {
      ...trans,
      id: newId,
      tanggal: timestamp,
      isSusulan: trans.isSusulan || false,
      keteranganSusulan: trans.keteranganSusulan,
      waktuInputSistem: trans.waktuInputSistem || new Date().toISOString()
    };

    // 1. Append inbound history
    setBarangMasukList(prev => [newTrans, ...prev]);

    // 2. Increase stock
    setBarangList(prev =>
      prev.map(b => (b.id === trans.barangId ? { ...b, stokSekarang: b.stokSekarang + trans.jumlah } : b))
    );

    // 3. Save uploaded Surat Jalan document to Drive Storage
    if (trans.fileDokumen) {
      const newDriveFile: DriveFileItem = {
        id: `DRV-${Date.now()}`,
        name: trans.fileDokumen,
        folder: 'Reports',
        size: trans.fileData ? `${Math.round((trans.fileData.length * 3) / 4 / 1024)} KB` : '185 KB',
        type: 'application/pdf',
        uploadedAt: timestamp,
        uploadedBy: trans.petugas || 'Petugas BMN',
        dataUrl: trans.fileData
      };
      setDriveFiles(prev => [newDriveFile, ...prev]);
    }

    // 4. Log mutation timeline
    const newRiwayat: Riwayat = {
      id: newId,
      tanggal: timestamp,
      tipe: 'Masuk',
      barangId: trans.barangId,
      namaBarang: trans.namaBarang,
      jumlah: trans.jumlah,
      petugas: trans.petugas,
      keterangan: trans.isSusulan
        ? `[DATA SUSULAN/BACKDATED] Barang masuk penyedia ${trans.supplier}. Alasan: ${trans.keteranganSusulan || '-'}. ${trans.catatan || ''}`
        : `Barang masuk penyedia ${trans.supplier}. ${trans.catatan || ''}`
    };
    setRiwayatList(prev => [newRiwayat, ...prev]);

    writeAuditLog(
      trans.isSusulan ? 'Transaksi Masuk Susulan' : 'Transaksi Masuk',
      `${trans.isSusulan ? '[DATA SUSULAN] ' : ''}Menerima barang masuk: ${trans.jumlah} unit "${trans.namaBarang}" dari ${trans.supplier} (${newId})${trans.isSusulan ? ` (Waktu Fisik: ${new Date(timestamp).toLocaleString('id-ID')})` : ''}`
    );

    // Handle Langsung Keluar jika ada
    if (langsungKeluar) {
       handleProcessTransaksiKeluar({
         barangId: trans.barangId,
         namaBarang: trans.namaBarang,
         jumlah: trans.jumlah,
         unitId: langsungKeluar.unitId,
         petugas: langsungKeluar.petugas,
         keperluan: langsungKeluar.keperluan,
         catatan: langsungKeluar.catatan,
         tanggal: langsungKeluar.tanggal || timestamp,
         isSusulan: trans.isSusulan,
         keteranganSusulan: trans.keteranganSusulan
       });
    }

    // 5. Trigger system notification
    sendSystemNotification(
      'barang_masuk',
      `${trans.isSusulan ? '[SUSULAN] ' : ''}Barang Masuk: ${trans.jumlah} unit "${trans.namaBarang}" diterima dari penyedia ${trans.supplier}`,
      {
        namaBarang: trans.namaBarang,
        jumlah: trans.jumlah,
        satuan: 'Pcs',
        unitAtauSupplier: trans.supplier,
        petugas: trans.petugas,
        catatan: trans.catatan,
        tipeTransaksi: 'Masuk',
        status: 'Selesai',
        barangId: trans.barangId,
        noDokumen: trans.fileDokumen
      },
      trans.barangId,
      newId
    );
  };

  const handleProcessTransaksiKeluar = (
    trans: Omit<BarangKeluar, 'id' | 'statusPersetujuan'> & { id?: string; tanggal?: string }
  ) => {
    const timestamp = trans.tanggal || new Date().toISOString();
    const dateObj = new Date(timestamp);
    const dateStr = !isNaN(dateObj.getTime()) 
      ? dateObj.toISOString().slice(2, 10).replace(/-/g, '') 
      : new Date().toISOString().slice(2, 10).replace(/-/g, '');
      
    // Ensure uniqueness for fallback ID by appending random chars
    const fallbackId = `TRK-${dateStr}-${String(barangKeluarList.length + 1).padStart(2, '0')}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const newId = trans.id || fallbackId;

    const newTrans: BarangKeluar = {
      ...trans,
      id: newId,
      tanggal: timestamp,
      statusPersetujuan: 'Disetujui',
      isSusulan: trans.isSusulan || false,
      keteranganSusulan: trans.keteranganSusulan,
      waktuInputSistem: trans.waktuInputSistem || new Date().toISOString()
    };

    // 1. Append to outbound list with "Disetujui" status
    setBarangKeluarList(prev => [newTrans, ...prev]);

    // 2. Decrease stock immediately
    const vol = trans.jumlah;
    const bId = trans.barangId;
    setBarangList(prev =>
      prev.map(b => {
        if (b.id === bId) {
          const nextStock = Math.max(0, b.stokSekarang - vol);

          // Trigger stock level warnings
          if (nextStock === 0) {
            sendSystemNotification(
              'stok_habis',
              `PERINGATAN KRITIS: Stok "${b.nama}" habis (0 unit)!`,
              {
                namaBarang: b.nama,
                jumlah: 0,
                petugas: 'Sistem Otomatis',
                tipeTransaksi: 'Stok Alert',
                status: 'Stok Habis'
              },
              bId
            );
          } else if (nextStock < b.stokMin) {
            sendSystemNotification(
              'stok_rendah',
              `Peringatan Stok Minimum: Stok "${b.nama}" sisa ${nextStock} unit (dibawah minimum ${b.stokMin}).`,
              {
                namaBarang: b.nama,
                jumlah: nextStock,
                petugas: 'Sistem Otomatis',
                tipeTransaksi: 'Stok Alert',
                status: 'Stok Minimum'
              },
              bId
            );
          }

          return { ...b, stokSekarang: nextStock };
        }
        return b;
      })
    );

    // 3. Log mutation timeline immediately
    const newRiwayat: Riwayat = {
      id: newId,
      tanggal: timestamp,
      tipe: 'Keluar',
      barangId: bId,
      namaBarang: trans.namaBarang,
      jumlah: vol,
      petugas: trans.petugas,
      keterangan: trans.isSusulan
        ? `[DATA SUSULAN/BACKDATED] Didistribusikan ke unit ${trans.unitId}. Keperluan: ${trans.keperluan}. Alasan: ${trans.keteranganSusulan || '-'}. ${trans.catatan || ''}`
        : `Didistribusikan ke unit ${trans.unitId}. Keperluan: ${trans.keperluan}. ${trans.catatan || ''}`
    };
    setRiwayatList(prev => [newRiwayat, ...prev]);

    writeAuditLog(
      trans.isSusulan ? 'Transaksi Keluar Susulan' : 'Transaksi Keluar',
      `${trans.isSusulan ? '[DATA SUSULAN] ' : ''}Mengeluarkan barang persediaan: ${trans.jumlah} unit "${trans.namaBarang}" untuk ${trans.unitId} (${newId})${trans.isSusulan ? ` (Waktu Fisik: ${new Date(timestamp).toLocaleString('id-ID')})` : ''}`
    );

    // 4. Trigger system notification
    sendSystemNotification(
      'barang_keluar',
      `${trans.isSusulan ? '[SUSULAN] ' : ''}Barang Keluar: ${trans.jumlah} unit "${trans.namaBarang}" dikeluarkan untuk unit ${trans.unitId}`,
      {
        namaBarang: trans.namaBarang,
        jumlah: trans.jumlah,
        satuan: 'Pcs',
        unitAtauSupplier: trans.unitId,
        petugas: trans.petugas,
        catatan: trans.catatan,
        keperluan: trans.keperluan,
        tipeTransaksi: 'Keluar',
        status: 'Disetujui',
        barangId: trans.barangId
      },
      trans.barangId,
      newId
    );
  };

  const handleApproveRejectTransaksiKeluar = (id: string, status: 'Disetujui' | 'Ditolak') => {
    const timestamp = new Date().toISOString();
    let transObj: BarangKeluar | undefined;

    setBarangKeluarList(prev =>
      prev.map(t => {
        if (t.id === id) {
          transObj = t;
          return { ...t, statusPersetujuan: status };
        }
        return t;
      })
    );

    if (!transObj) return;

    if (status === 'Disetujui') {
      const vol = transObj.jumlah;
      const bId = transObj.barangId;

      // 1. Decrease inventory catalog stock
      setBarangList(prev => {
        return prev.map(b => {
          if (b.id === bId) {
            const nextStock = Math.max(0, b.stokSekarang - vol);

            // Trigger stock level warnings
            if (nextStock === 0) {
              sendSystemNotification(
                'stok_habis',
                `PERINGATAN KRITIS: Stok "${b.nama}" habis (0 unit)!`,
                {
                  namaBarang: b.nama,
                  jumlah: 0,
                  petugas: 'Sistem Otomatis',
                  tipeTransaksi: 'Stok Alert',
                  status: 'Stok Habis'
                },
                bId
              );
            } else if (nextStock < b.stokMin) {
              sendSystemNotification(
                'stok_rendah',
                `Peringatan: Stok "${b.nama}" sisa ${nextStock} unit (dibawah minimum ${b.stokMin}).`,
                {
                  namaBarang: b.nama,
                  jumlah: nextStock,
                  petugas: 'Sistem Otomatis',
                  tipeTransaksi: 'Stok Alert',
                  status: 'Stok Minimum'
                },
                bId
              );
            }

            return { ...b, stokSekarang: nextStock };
          }
          return b;
        });
      });

      // 2. Log mutation timeline
      const newRiwayat: Riwayat = {
        id,
        tanggal: timestamp,
        tipe: 'Keluar',
        barangId: bId,
        namaBarang: transObj.namaBarang,
        jumlah: vol,
        petugas: currentUserActor,
        keterangan: `Didistribusikan ke unit ${transObj.unitId}. Keperluan: ${transObj.keperluan}`
      };
      setRiwayatList(prev => [newRiwayat, ...prev]);
    }

    writeAuditLog(
      `Approval ${status}`,
      `Keputusan otorisasi barang keluar ${id}: status "${status}" oleh ${currentUserActor}`
    );

    sendSystemNotification(
      'barang_keluar',
      `Otorisasi Barang Keluar: Pengajuan ${id} (${transObj.namaBarang}) telah ${status}`,
      {
        namaBarang: transObj.namaBarang,
        jumlah: transObj.jumlah,
        unitAtauSupplier: transObj.unitId,
        petugas: currentUserActor,
        status,
        tipeTransaksi: 'Persetujuan',
        catatan: `Keperluan: ${transObj.keperluan}`
      },
      transObj.barangId,
      id
    );
  };

  // --- GENERAL ACTIONS ---

  const handleSaveSettings = (updated: Settings) => {
    setSettings(updated);
    writeAuditLog('Ubah Setelan', 'Memperbarui konfigurasi parameter sistem BMN dan Google Drive Sync ID.');
  };

  const handleResetDatabase = () => {
    setBarangList(INITIAL_BARANG);
    setKategoriList(INITIAL_KATEGORI);
    setSupplierList(INITIAL_SUPPLIER);
    setUnitList(INITIAL_UNIT);
    setSatuanList(INITIAL_SATUAN);
    setPegawaiList(INITIAL_PEGAWAI);
    setBarangMasukList(INITIAL_BARANG_MASUK);
    setBarangKeluarList(INITIAL_BARANG_KELUAR);
    setRiwayatList(INITIAL_RIWAYAT);
    setNotificationsList(INITIAL_NOTIFICATION);
    setSettings(DEFAULT_SETTINGS);

    // Reset logs with single starting row
    const starterLog: AuditLog = {
      id: `LOG-${Date.now().toString().slice(-6)}`,
      tanggal: new Date().toISOString(),
      aktor: currentUserActor,
      role: currentRole,
      aksi: 'Sistem Reset',
      detail: 'Seluruh basis data utama di-restore ke kondisi awal lembaga.'
    };
    setAuditLogsList([starterLog]);
  };

  const handleSimulateBackup = () => {
    writeAuditLog(
      'Backup Database',
      `Berhasil mengekspor cadangan database lengkap ke Google Drive file "backup_bpmp_${new Date().toISOString().slice(0, 10)}.json"`
    );
  };

  const handleClearNotifications = () => {
    setNotificationsList([]);
  };

  const handleDeleteBarangMasuk = (ids: string[]) => {
    setBarangMasukList(prev => prev.filter(item => !ids.includes(item.id)));
    writeAuditLog(
      'Pembersihan Database',
      `Menghapus ${ids.length} catatan riwayat barang masuk dari database.`
    );
  };

  const handleDeleteBarangKeluar = (ids: string[]) => {
    setBarangKeluarList(prev => prev.filter(item => !ids.includes(item.id)));
    writeAuditLog(
      'Pembersihan Database',
      `Menghapus ${ids.length} catatan riwayat barang keluar dari database.`
    );
  };

  const handleDeleteRiwayat = (ids: string[]) => {
    setRiwayatList(prev => prev.filter(item => !ids.includes(item.id)));
    writeAuditLog(
      'Pembersihan Database',
      `Menghapus ${ids.length} catatan riwayat mutasi umum dari database.`
    );
  };

  const handleDeleteAuditLogs = (ids: string[]) => {
    setAuditLogsList(prev => prev.filter(item => !ids.includes(item.id)));
    writeAuditLog(
      'Pembersihan Database',
      `Menghapus ${ids.length} catatan log audit aktivitas dari database.`
    );
  };

  const handleMarkNotificationRead = (id: string) => {
    if (!currentUser) return;
    setNotificationsList(prev => prev.map(n => (n.id === id ? markNotificationAsReadForUser(n, currentUser.username) : n)));
  };

  const handleQuickAddStock = (barangId: string) => {
    setQuickAddBarangId(barangId);
    setActiveTab('barang_masuk');
  };

  // Stats today count
  const todayStr = new Date().toISOString().slice(0, 10);
  const monthStr = new Date().toISOString().slice(0, 7);
  const barangMasukToday = barangMasukList.filter(t => t.tanggal.startsWith(todayStr)).length;
  const barangKeluarToday = barangKeluarList.filter(t => t.tanggal.startsWith(todayStr)).length;
  const barangMasukBulanIni = barangMasukList.filter(t => t.tanggal.startsWith(monthStr)).length;
  const barangKeluarBulanIni = barangKeluarList.filter(t => t.tanggal.startsWith(monthStr)).length;

  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-900 text-white">
        <div className="flex flex-col items-center">
          <div className="relative w-16 h-16 flex items-center justify-center mb-4">
            <div className="absolute inset-0 border-4 border-indigo-500/30 rounded-full animate-ping"></div>
            <div className="absolute inset-0 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            <Database className="w-6 h-6 text-indigo-400 animate-pulse" />
          </div>
          <p className="font-bold text-lg animate-pulse tracking-wide text-indigo-100">Menghubungkan ke Database...</p>
          <p className="text-xs text-indigo-300 mt-2 font-medium">Memuat profil dan data inventaris</p>
        </div>
      </div>
    );
  }

    if (!currentUser) {
    return (
      <>
        <LoginView
          accounts={accounts}
          logoUrl={settings?.logoUrl}
          onLoginSuccess={(acc) => {
            setIsTransitioning(true);
            setTimeout(() => {
              handleSetCurrentUser(acc);
              setActiveTab('dashboard');
              // Write login log
              const newLog: AuditLog = {
                id: `LOG-${Date.now().toString().slice(-6)}`,
                tanggal: new Date().toISOString(),
                aktor: acc.nama,
                role: acc.role,
                aksi: 'Login',
                detail: `Sesi login baru dimulai oleh ${acc.nama} (${acc.role}) pada peranti desktop`
              };
              setAuditLogsList(prev => [newLog, ...prev]);
              setIsTransitioning(false);
            }, 2000);
          }}
          onRegisterAccount={(newAcc) => {
            setAccounts(prev => [...prev, newAcc]);
            sendSystemNotification(
              'registrasi_user',
              `Pendaftaran Pegawai Baru: ${newAcc.nama} (${newAcc.username}) mengajukan pendaftaran akun`,
              {
                petugas: newAcc.nama,
                catatan: `NIP: ${newAcc.nip || '-'}, Jabatan: ${newAcc.jabatan}, Telp: ${newAcc.telepon || '-'}`,
                tipeTransaksi: 'Registrasi',
                status: 'Pending'
              },
              undefined,
              undefined,
              true // Admin only notification
            );
          }}
        />

        {/* Transition Overlay */}
        <AnimatePresence>
          {isTransitioning && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] bg-slate-900 flex flex-col items-center justify-center overflow-hidden"
            >
              {/* Decorative Background Elements */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <motion.div
                  animate={{ 
                    scale: [1, 1.2, 1],
                    opacity: [0.3, 0.5, 0.3],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="absolute -top-[20%] -right-[10%] w-[70vw] h-[70vw] rounded-full bg-blue-600/20 blur-3xl"
                />
                <motion.div
                  animate={{ 
                    scale: [1, 1.5, 1],
                    opacity: [0.2, 0.4, 0.2],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 1
                  }}
                  className="absolute -bottom-[20%] -left-[10%] w-[60vw] h-[60vw] rounded-full bg-indigo-600/20 blur-3xl"
                />
              </div>

              {/* Main Loader Content */}
              <div className="relative z-10 flex flex-col items-center">
                <div className="w-20 h-20 bg-white rounded-2xl shadow-2xl p-4 mb-8 relative flex items-center justify-center">
                  <LogoImage 
                    logoUrl={settings?.logoUrl}
                    alt="Logo" 
                    className="w-full h-full object-contain"
                  />
                  {/* Outer spinning ring */}
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-[-12px] rounded-[1.25rem] border-2 border-transparent border-t-blue-500 border-r-blue-500 opacity-80"
                  />
                  <motion.div
                    animate={{ rotate: -360 }}
                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-[-20px] rounded-[1.5rem] border-2 border-transparent border-b-indigo-500 border-l-indigo-500 opacity-60"
                  />
                </div>
                
                <h2 className="text-2xl font-bold text-white tracking-tight mb-2">
                  Menyiapkan Ruang Kerja Anda
                </h2>
                <div className="flex items-center gap-2">
                  <div className="flex gap-1.5">
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        animate={{ y: [0, -6, 0] }}
                        transition={{
                          duration: 0.6,
                          repeat: Infinity,
                          delay: i * 0.15,
                          ease: "easeInOut"
                        }}
                        className="w-2 h-2 bg-blue-400 rounded-full"
                      />
                    ))}
                  </div>
                  <span className="text-sm font-medium text-blue-200 tracking-wide ml-2">
                    Mengautentikasi pengguna...
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden text-slate-800 font-sans antialiased select-none">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
        instituteName={settings.namaInstitusi}
        currentUser={currentUser}
        logoUrl={settings?.logoUrl}
      />

      {/* Main Container */}
      <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0">
        {/* Navbar */}
        <Navbar
          activeTab={activeTab}
          sidebarCollapsed={sidebarCollapsed}
          setSidebarCollapsed={setSidebarCollapsed}
          currentUser={currentUser}
          onLogout={() => {
            writeAuditLog('Logout', `Sesi diakhiri oleh ${currentUser.nama}`);
            handleSetCurrentUser(null);
          }}
          notifications={notificationsList}
          setNotifications={setNotificationsList}
          onSelectNotification={(notif) => setSelectedNotificationForModal(notif)}
        />

        {/* Content Body */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 scrollbar-thin">
          <ErrorBoundary>
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                className="h-full"
              >
              {activeTab === 'dashboard' && (
                <DashboardView
                  barang={barangList}
                  kategoriList={kategoriList}
                  satuanList={satuanList}
                  categoriesCount={kategoriList.length}
                  suppliersCount={supplierList.length}
                  barangMasukCountToday={barangMasukToday}
                  barangKeluarCountToday={barangKeluarToday}
                  barangMasukCountBulanIni={barangMasukBulanIni}
                  barangKeluarCountBulanIni={barangKeluarBulanIni}
                  recentLogs={auditLogsList.slice(0, 5)}
                  setActiveTab={setActiveTab}
                  setQuickAddBarangId={handleQuickAddStock}
                  unitList={unitList}
                  pegawaiList={pegawaiList}
                  onProcessTransaksi={handleProcessTransaksiKeluar}
                />
              )}

              {activeTab === 'barang' && (
                <BarangView
                  barang={barangList}
                  kategoriList={kategoriList}
                  supplierList={supplierList}
                  satuanList={satuanList}
                  onAddBarang={handleAddBarang}
                  onEditBarang={handleEditBarang}
                  onDeleteBarang={handleDeleteBarang}
                  onImportCsv={handleImportCsv}
                  currentUserRole={currentRole}
                  logoUrl={settings?.logoUrl}
                />
              )}

              {activeTab === 'kategori' && (
                <KategoriView
                  kategoriList={kategoriList}
                  barang={barangList}
                  onAddKategori={handleAddKategori}
                  onEditKategori={handleEditKategori}
                  onDeleteKategori={handleDeleteKategori}
                  currentUserRole={currentRole}
                />
              )}

              {activeTab === 'supplier' && (
                <SupplierView
                  supplierList={supplierList}
                  onAddSupplier={handleAddSupplier}
                  onEditSupplier={handleEditSupplier}
                  onDeleteSupplier={handleDeleteSupplier}
                  currentUserRole={currentRole}
                />
              )}

              {activeTab === 'unit' && (
                <UnitView
                  unitList={unitList}
                  onAddUnit={handleAddUnit}
                  onEditUnit={handleEditUnit}
                  onDeleteUnit={handleDeleteUnit}
                  currentUserRole={currentRole}
                  pegawaiList={pegawaiList}
                />
              )}

              {activeTab === 'satuan' && (
                <SatuanView
                  satuanList={satuanList}
                  onAddSatuan={handleAddSatuan}
                  onEditSatuan={handleEditSatuan}
                  onDeleteSatuan={handleDeleteSatuan}
                  currentUserRole={currentRole}
                />
              )}

              {activeTab === 'pegawai' && (
                <PegawaiView
                  pegawaiList={pegawaiList}
                  onAddPegawai={handleAddPegawai}
                  onEditPegawai={handleEditPegawai}
                  onDeletePegawai={handleDeletePegawai}
                  currentUserRole={currentRole}
                />
              )}

              {activeTab === 'barang_masuk' && (
                <TransaksiMasukView
                  barangList={barangList}
                  kategoriList={kategoriList}
                  supplierList={supplierList}
                  transaksiList={barangMasukList}
                  onProcessTransaksi={handleProcessTransaksiMasuk}
                  unitList={unitList}
                  pegawaiList={pegawaiList}
                  onDeleteTransaksi={handleDeleteBarangMasuk}
                  currentUserRole={currentRole}
                  quickAddBarangId={quickAddBarangId}
                  clearQuickAdd={() => setQuickAddBarangId('')}
                  folderId={settings?.folderDokumenId || settings?.folderReportsId}
                />
              )}

              {activeTab === 'barang_keluar' && (
                <TransaksiKeluarView
                  barangList={barangList}
                  kategoriList={kategoriList}
                  unitList={unitList}
                  transaksiList={barangKeluarList}
                  onProcessTransaksi={handleProcessTransaksiKeluar}
                  onApproveRejectTransaksi={handleApproveRejectTransaksiKeluar}
                  onDeleteTransaksi={handleDeleteBarangKeluar}
                  currentUserRole={currentRole}
                  quickAddBarangId={quickAddBarangId}
                  clearQuickAdd={() => setQuickAddBarangId('')}
                  pegawaiList={pegawaiList}
                />
              )}

              {activeTab === 'riwayat' && (
                <RiwayatView
                  riwayat={riwayatList}
                  barang={barangList}
                  settings={settings}
                  currentUserRole={currentRole}
                  onDeleteRiwayat={handleDeleteRiwayat}
                />
              )}

              {activeTab === 'laporan' && (
                <LaporanView 
                  barang={barangList} 
                  riwayat={riwayatList} 
                  barangMasukList={barangMasukList}
                  barangKeluarList={barangKeluarList}
                  instituteName={settings.namaInstitusi} 
                  settings={settings} 
                />
              )}

              {activeTab === 'pengaturan' && (
                (currentUser?.role === 'Administrator' || currentUser?.username === 'admin') ? (
                  <PengaturanView
                    settings={settings}
                    onSaveSettings={handleSaveSettings}
                    onResetDatabase={handleResetDatabase}
                    onSimulateBackup={handleSimulateBackup}
                    driveFiles={driveFiles}
                    currentUserRole={currentRole}
                    currentUser={currentUser || undefined}
                    stats={{
                      totalBarang: barangList.length,
                      totalMasuk: barangMasukList.length,
                      totalKeluar: barangKeluarList.length,
                      totalAuditLogs: auditLogsList.length
                    }}
                  />
                ) : (
                  <div className="bg-white p-8 rounded-2xl border border-gray-200 text-center space-y-4 max-w-lg mx-auto mt-10 shadow-xs">
                    <div className="w-12 h-12 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto">
                      <ShieldAlert className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-base font-bold text-gray-900">Akses Terbatas — Halaman Khusus Administrator</h3>
                      <p className="text-xs text-gray-500 leading-relaxed">
                        Halaman Pengaturan Sistem hanya dapat diakses oleh akun Administrator (Super Admin). Silakan hubungi Administrator jika Anda memerlukan perubahan konfigurasi sistem.
                      </p>
                    </div>
                  </div>
                )
              )}

              {activeTab === 'audit_log' && (
                <AuditLogView
                  logs={auditLogsList}
                  onClearLogs={() => setAuditLogsList([])}
                  onDeleteLogs={handleDeleteAuditLogs}
                  currentUser={currentUser!}
                />
              )}

              {activeTab === 'admin_control' && (
                (currentUser?.role === 'Administrator' || currentUser?.username === 'admin') ? (
                  <AdminControlView
                    accounts={accounts}
                    barangList={barangList}
                    riwayatList={riwayatList}
                    settings={settings}
                    onApproveAccount={(username) => {
                      setAccounts(prev => prev.map(acc => acc.username === username ? { ...acc, status: 'Disetujui' } : acc));
                      writeAuditLog('Konfirmasi Akun', `Menyetujui pembuatan akun pegawai: ${username}`);
                    }}
                    onRejectAccount={(username) => {
                      setAccounts(prev => prev.map(acc => acc.username === username ? { ...acc, status: 'Ditolak' } : acc));
                      writeAuditLog('Penolakan Akun', `Menolak pendaftaran akun pegawai: ${username}`);
                    }}
                    onDeleteAccount={(username) => {
                      setAccounts(prev => prev.filter(acc => acc.username !== username));
                      writeAuditLog('Hapus Akun', `Menghapus pendaftaran akun pegawai: ${username}`);
                    }}
                    onUpdateAccount={(username, updatedAccount) => {
                      setAccounts(prev => prev.map(acc => acc.username === username ? { ...acc, ...updatedAccount } : acc));
                      writeAuditLog('Ubah Akun', `Memperbarui data akun pegawai: ${username}`);
                    }}
                    onUpdatePassword={(username, newPassword) => {
                      setAccounts(prev => prev.map(acc => acc.username === username ? { ...acc, password: newPassword } : acc));
                      writeAuditLog('Ubah Sandi', `Mengubah kata sandi untuk pegawai: ${username}`);
                    }}
                    onMigrateBackup={() => {
                      setBarangMasukList([]);
                      setBarangKeluarList([]);
                      setRiwayatList([]);
                      setAuditLogsList([]);
                      setNotificationsList([]);
                      writeAuditLog('Migrasi Database', 'Telah melakukan backup & migrasi spreadsheet, membersihkan transaksi, riwayat, dan notifikasi.');
                    }}
                  />
                ) : (
                  <div className="bg-white p-8 border border-red-200 rounded-2xl shadow-sm text-center space-y-4 max-w-lg mx-auto my-12">
                    <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
                      <ShieldAlert className="w-8 h-8 text-red-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">Akses Khusus Administrator</h3>
                      <p className="text-xs text-gray-500 mt-1">
                        Halaman Admin Control Center hanya dapat diakses oleh akun dengan otorisasi Administrator (admin).
                      </p>
                    </div>
                    <button
                      onClick={() => setCurrentUser(null)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs cursor-pointer transition-colors"
                    >
                      Login Sebagai Admin
                    </button>
                  </div>
                )
              )}
            </motion.div>
          </AnimatePresence>
          </ErrorBoundary>
        </main>
      </div>

      {/* Centered Modern Pop-Up Loading & Save Status Overlay */}
      <AnimatePresence>
        {isSyncing && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: -20 }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 bg-slate-900/95 backdrop-blur-xl text-white shadow-[0_12px_40px_rgba(0,0,0,0.5)] rounded-2xl px-6 py-3.5 flex items-center gap-3.5 border border-blue-500/30 z-50 pointer-events-none"
          >
            <div className="relative flex items-center justify-center">
              <RefreshCw className="w-5 h-5 text-blue-400 animate-spin" />
              <div className="absolute inset-0 rounded-full bg-blue-500/20 animate-ping pointer-events-none" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold tracking-wide text-white">Menyimpan data...</span>
              <span className="text-[10px] text-slate-400 font-medium">Memproses pembaruan sistem</span>
            </div>
          </motion.div>
        )}

        {showSyncSuccess && !isSyncing && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: -20 }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 bg-slate-900/95 backdrop-blur-xl text-white shadow-[0_12px_40px_rgba(0,0,0,0.5)] rounded-2xl px-6 py-3.5 flex items-center gap-3.5 border border-emerald-500/40 z-50 pointer-events-none"
          >
            <div className="w-7 h-7 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold tracking-wide text-white">Data Berhasil Disimpan!</span>
              <span className="text-[10px] text-emerald-400/90 font-medium">Tersimpan ke sistem</span>
            </div>
          </motion.div>
        )}
        
        {syncError && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: -20 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 bg-slate-900/95 backdrop-blur-xl text-white shadow-2xl rounded-2xl px-5 py-3.5 flex items-center gap-3.5 border border-red-500/40 z-50 max-w-md w-full"
          >
            <div className="w-8 h-8 rounded-xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400 shrink-0">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div className="flex flex-col flex-1 min-w-0">
              <span className="text-xs font-bold text-red-300">Gagal Menyimpan Data</span>
              <span className="text-[11px] text-slate-300 truncate">{syncError}</span>
            </div>
            <button 
              onClick={() => setSyncError(null)}
              className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Real-Time Floating Notification Toast */}
      <NotificationToast
        notification={activeToast}
        onClose={() => setActiveToast(null)}
        onClick={() => {
          if (activeToast) {
            setSelectedNotificationForModal(activeToast);
            setActiveToast(null);
          }
        }}
      />

      {/* Structured Notification Detail Modal */}
      <NotificationDetailModal
        notification={selectedNotificationForModal}
        onClose={() => setSelectedNotificationForModal(null)}
      />
    </div>
  );
}
