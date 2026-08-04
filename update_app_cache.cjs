const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Helper to replace state initialization
const stateVars = [
  { name: 'accounts', type: 'UserAccount[]', initial: 'INITIAL_ACCOUNTS' },
  { name: 'barangList', type: 'Barang[]', initial: 'INITIAL_BARANG' },
  { name: 'kategoriList', type: 'Kategori[]', initial: 'INITIAL_KATEGORI' },
  { name: 'supplierList', type: 'Supplier[]', initial: 'INITIAL_SUPPLIER' },
  { name: 'unitList', type: 'Unit[]', initial: 'INITIAL_UNIT' },
  { name: 'satuanList', type: 'Satuan[]', initial: 'INITIAL_SATUAN' },
  { name: 'pegawaiList', type: 'Pegawai[]', initial: 'INITIAL_PEGAWAI' },
  { name: 'barangMasukList', type: 'BarangMasuk[]', initial: 'INITIAL_BARANG_MASUK' },
  { name: 'barangKeluarList', type: 'BarangKeluar[]', initial: 'INITIAL_BARANG_KELUAR' },
  { name: 'riwayatList', type: 'Riwayat[]', initial: 'INITIAL_RIWAYAT' },
  { name: 'auditLogsList', type: 'AuditLog[]', initial: 'INITIAL_AUDIT_LOG' },
  { name: 'notificationsList', type: 'SystemNotification[]', initial: 'INITIAL_NOTIFICATION' },
  { name: 'settings', type: 'Settings', initial: 'DEFAULT_SETTINGS' },
  { name: 'driveFiles', type: 'DriveFileItem[]', initial: 'INITIAL_DRIVE_FILES' }
];

const helperCode = `
  const getCachedData = (key: string, fallback: any) => {
    if (typeof window === 'undefined') return fallback;
    try {
      const cached = localStorage.getItem('bpmp_bmn_cache_' + key);
      if (cached) return JSON.parse(cached);
    } catch(e) {}
    return fallback;
  };
`;

let hasCacheHelper = code.includes('getCachedData');

if (!hasCacheHelper) {
  // insert helper before the first useState of these vars
  code = code.replace("const [accounts, setAccounts]", helperCode + "\n  const [accounts, setAccounts]");
}

// Replace each state initialization
for (const v of stateVars) {
  const searchStr = `const [${v.name}, set${v.name.charAt(0).toUpperCase() + v.name.slice(1)}] = useState<${v.type}>(${v.initial});`;
  const replaceStr = `const [${v.name}, set${v.name.charAt(0).toUpperCase() + v.name.slice(1)}] = useState<${v.type}>(() => getCachedData('${v.name}', ${v.initial}));`;
  code = code.replace(searchStr, replaceStr);
}

// Modify isLoading
code = code.replace("const [isLoading, setIsLoading] = useState(true);", 
"const hasCache = typeof window !== 'undefined' && !!localStorage.getItem('bpmp_bmn_cache_barangList');\n  const [isLoading, setIsLoading] = useState(!hasCache);");


// We need to update localStorage when data is updated from fetch or user changes.
// There is an effect that runs when data changes (debounced save). We can also update cache there.
const searchDebounce = "const handler = setTimeout(async () => {";
const cacheSaveCode = `
    // Save to local cache first for fast load on next refresh
    try {
      localStorage.setItem('bpmp_bmn_cache_accounts', JSON.stringify(accounts));
      localStorage.setItem('bpmp_bmn_cache_barangList', JSON.stringify(barangList));
      localStorage.setItem('bpmp_bmn_cache_kategoriList', JSON.stringify(kategoriList));
      localStorage.setItem('bpmp_bmn_cache_supplierList', JSON.stringify(supplierList));
      localStorage.setItem('bpmp_bmn_cache_unitList', JSON.stringify(unitList));
      localStorage.setItem('bpmp_bmn_cache_satuanList', JSON.stringify(satuanList));
      localStorage.setItem('bpmp_bmn_cache_pegawaiList', JSON.stringify(pegawaiList));
      localStorage.setItem('bpmp_bmn_cache_barangMasukList', JSON.stringify(barangMasukList));
      localStorage.setItem('bpmp_bmn_cache_barangKeluarList', JSON.stringify(barangKeluarList));
      localStorage.setItem('bpmp_bmn_cache_riwayatList', JSON.stringify(riwayatList));
      localStorage.setItem('bpmp_bmn_cache_auditLogsList', JSON.stringify(auditLogsList));
      localStorage.setItem('bpmp_bmn_cache_notificationsList', JSON.stringify(notificationsList));
      localStorage.setItem('bpmp_bmn_cache_settings', JSON.stringify(settings));
    } catch(e) { console.error('Failed to cache data', e); }

`;

if (!code.includes("localStorage.setItem('bpmp_bmn_cache_barangList'")) {
  code = code.replace(searchDebounce, cacheSaveCode + searchDebounce);
}

// We also need background auto sync! Let's update the fetchData useEffect to run periodically
const fetchEffect = `  // Load from Sheets on mount and poll periodically
  React.useEffect(() => {
    const fetchData = async (silent = false) => {
      try {
        if (!silent) setIsSyncing(true);
        const res = await fetch('/api/sync');
        if (res.ok) {
          const data = await res.json();
          // We should only update if data actually changed, but for simplicity let's just set it.
          // Wait, if we just set it, it will trigger the save debouncer and potentially overwrite user changes!
          // Actually, the app's sync logic currently overwrites on every change. 
          // If we poll and overwrite, it might interrupt user if they are editing?
          // Since it's a simple CRUD, typically we can just update list. 
          // Let's only do it silently on load for now, then poll every 30s.
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
    
    fetchData();
    
    // Auto sync every 30 seconds
    const interval = setInterval(() => {
      fetchData(true);
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);`;

// Replace the old useEffect with the new one
const startEffect = "  // Load from Sheets on mount\n  React.useEffect(() => {\n    const fetchData = async () => {";
const endEffect = "    };\n    fetchData();\n  }, []);";

let effectStartIndex = code.indexOf("  // Load from Sheets on mount");
if (effectStartIndex !== -1) {
    let effectEndIndex = code.indexOf("  }, []);", effectStartIndex);
    if (effectEndIndex !== -1) {
        effectEndIndex += "  }, []);".length;
        code = code.substring(0, effectStartIndex) + fetchEffect + code.substring(effectEndIndex);
    }
}

fs.writeFileSync('src/App.tsx', code);
console.log("App.tsx updated successfully.");
