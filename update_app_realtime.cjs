const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const newEffectBody = `  const serverVersionRef = React.useRef(0);

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
          if (data.Barang && data.Barang.length > 0) setBarangList(data.Barang);
          if (data.Kategori && data.Kategori.length > 0) setKategoriList(data.Kategori);
          if (data.Supplier && data.Supplier.length > 0) setSupplierList(data.Supplier);
          if (data.Unit && data.Unit.length > 0) setUnitList(data.Unit);
          if (data.Satuan && data.Satuan.length > 0) setSatuanList(data.Satuan);
          if (data.Pegawai && data.Pegawai.length > 0) setPegawaiList(data.Pegawai);
          if (data.BarangMasuk && data.BarangMasuk.length > 0) setBarangMasukList(data.BarangMasuk);
          if (data.BarangKeluar && data.BarangKeluar.length > 0) setBarangKeluarList(data.BarangKeluar);
          if (data.Riwayat && data.Riwayat.length > 0) setRiwayatList(data.Riwayat);
          if (data.AuditLog && data.AuditLog.length > 0) setAuditLogsList(data.AuditLog);
          if (data.Accounts && data.Accounts.length > 0) {
            const updatedAccs = data.Accounts.map((a: UserAccount) =>
              a.username === 'admin'
                ? { ...a, nama: 'Ilham Muharrama', nip: '-', jabatan: 'Magang/KP', telepon: '08981741680' }
                : a
            );
            setAccounts(updatedAccs);
          }
          if (data.Settings && data.Settings.length > 0) setSettings(data.Settings[0]);
          if (data.Notifications && data.Notifications.length > 0) setNotificationsList(data.Notifications);
        } else {
          if (!silent) {
            const errData = await res.json();
            setSyncError(\`Gagal memuat data: \${errData.error || 'Server error'}\`);
          }
        }
      } catch (e: any) {
        console.error("Gagal sinkronisasi data awal:", e);
        if (!silent) setSyncError(\`Gagal memuat data: \${e.message}\`);
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
  }, []);`;

const startIdx = code.indexOf("  // Load from Sheets on mount and poll periodically");
const endIdx = code.indexOf("  }, []);", startIdx) + "  }, []);".length;

if (startIdx !== -1 && endIdx !== -1) {
  code = code.substring(0, startIdx) + newEffectBody + code.substring(endIdx);
  fs.writeFileSync('src/App.tsx', code);
  console.log("App.tsx updated for realtime polling.");
} else {
  console.log("Could not find effect block.");
}
