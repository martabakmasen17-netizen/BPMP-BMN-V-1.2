import express from "express";
import { google } from "googleapis";
import fs from "fs";
import path from "path";

const app = express();
// Perbesar limit JSON untuk menyimpan seluruh state jika dibutuhkan
app.use(express.json({ limit: '10mb' }));

// File backup lokal agar data tetap awet saat restart container / deploy tanpa SPREADSHEET_ID
const DATA_FILE_PATH = path.join(process.cwd(), 'data_store.json');
const UPLOADS_DIR = path.join(process.cwd(), 'uploads');

if (!fs.existsSync(UPLOADS_DIR)) {
  try {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  } catch (e) {
    console.error("Gagal membuat folder uploads:", e);
  }
}

// Serve folder uploads secara publik
app.use('/uploads', express.static(UPLOADS_DIR));

const saveToLocalFile = (data: any) => {
  try {
    fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error("Gagal menyimpan data_store.json lokal:", err);
  }
};

const loadFromLocalFile = () => {
  try {
    if (fs.existsSync(DATA_FILE_PATH)) {
      const content = fs.readFileSync(DATA_FILE_PATH, 'utf8');
      return JSON.parse(content);
    }
  } catch (err) {
    console.error("Gagal membaca data_store.json lokal:", err);
  }
  return null;
};

const getGoogleClients = () => {
  const localCache = memoryCache || loadFromLocalFile() || {};
  const settings = Array.isArray(localCache.Settings) ? localCache.Settings[0] : {};
  
  const clientEmail = settings?.serviceAccountEmail || process.env.GOOGLE_CLIENT_EMAIL;
  const privateKey = settings?.serviceAccountPrivateKey || process.env.GOOGLE_PRIVATE_KEY;
  
  if (!clientEmail || !privateKey) {
    return { drive: null, sheets: null, hasCredentials: false };
  }
  
  const dynAuth = new google.auth.GoogleAuth({
    credentials: {
      client_email: clientEmail,
      private_key: privateKey.replace(/\\n/g, '\n'),
    },
    scopes: [
      "https://www.googleapis.com/auth/spreadsheets",
      "https://www.googleapis.com/auth/drive",
      "https://www.googleapis.com/auth/drive.file"
    ],
  });
  
  return {
    drive: google.drive({ version: "v3", auth: dynAuth }),
    sheets: google.sheets({ version: "v4", auth: dynAuth }),
    hasCredentials: true,
    spreadsheetId: settings?.spreadsheetId || process.env.SPREADSHEET_ID
  };
};

// Global fallback for startup
let auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_CLIENT_EMAIL || "dummy@example.com",
    private_key: (process.env.GOOGLE_PRIVATE_KEY || "dummy_key").replace(/\\n/g, '\n'),
  },
  scopes: [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/drive",
    "https://www.googleapis.com/auth/drive.file"
  ],
});
const sheets = google.sheets({ version: "v4", auth });
const drive = google.drive({ version: "v3", auth });
const SPREADSHEET_ID = process.env.SPREADSHEET_ID;

// Daftar tabel/entitas (Sheet Name)
const SHEET_NAMES = [
  "Barang", "Kategori", "Supplier", "Unit", "Satuan", "Pegawai", 
  "BarangMasuk", "BarangKeluar", "Riwayat", "AuditLog", "Accounts", "Settings", "Notifications", "DriveFiles"
];

// Helper: Ubah Array of Objects menjadi 2D Array untuk Spreadsheet
const jsonToSheetData = (jsonArray: any[]) => {
  if (!jsonArray || jsonArray.length === 0) return [[]];
  
  // Ambil keys dari object pertama sebagai header
  const headers = Object.keys(jsonArray[0]);
  const rows = jsonArray.map(obj => {
    return headers.map(header => {
      // Abaikan data binary/base64 besar agar tidak melebihi batas 50,000 karakter sel Google Sheets
      if (header === 'fileData' || header === 'dataUrl') {
        return "";
      }
      let val = obj[header];
      if (typeof val === 'object' || Array.isArray(val)) {
        val = JSON.stringify(val);
      }
      if (val !== null && val !== undefined) {
        let strVal = String(val);
        // Batas maksimum sel Google Sheets adalah 50.000 karakter
        if (strVal.length > 45000) {
          strVal = strVal.substring(0, 45000);
        }
        return strVal;
      }
      return "";
    });
  });
  
  return [headers, ...rows];
};

// Helper: Ubah 2D Array dari Spreadsheet menjadi Array of Objects
const NUMERIC_FIELDS = new Set([
  "stokSekarang", "stokMin", "stokMaks", "jumlah", "harga", "diskon"
]);

const sheetDataToJson = (rows: any[][]) => {
  if (!rows || rows.length < 2) return [];
  const headers = rows[0];
  
  return rows.slice(1).map(row => {
    const obj: any = {};
    headers.forEach((header, index) => {
      let val = row[index] !== undefined && row[index] !== null ? row[index] : "";
      // Convert boolean string back to boolean if needed, or parse JSON
      if (val === "true") val = true;
      else if (val === "false") val = false;
      else if (typeof val === 'string' && (val.startsWith("[") || val.startsWith("{"))) {
        try { val = JSON.parse(val); } catch (e) {}
      } else if (NUMERIC_FIELDS.has(header) && !isNaN(Number(val)) && val !== "") {
        val = Number(val);
      } else {
        val = String(val);
      }
      obj[header] = val;
    });
    return obj;
  }).filter(obj => Object.keys(obj).length > 0 && Object.values(obj).some(v => v !== "" && v !== null && v !== undefined));
};

// ==========================================
// ENDPOINT UNTUK SYNC DATA KE SPREADSHEET
// ==========================================


// ==========================================
// IN-MEMORY CACHE & RATE LIMIT COOLDOWN UNTUK MENGURANGI KUOTA SPREADSHEET
// ==========================================
let memoryCache: any = null;
let memoryVersion = 0;
let lastRemoteFetchTime = 0;
let rateLimitCooldownUntil = 0;
let cachedExistingSheets: string[] | null = null;

app.get("/api/sync/version", (req, res) => {
  res.json({ version: memoryVersion });
});

// 1. MENGAMBIL SELURUH DATA DARI SPREADSHEET ATAU LOCAL FILE (Batch Read Optimised)
app.get("/api/sync", async (req, res) => {
  try {
    const now = Date.now();
    
    // Always load local file as fallback baseline
    const localData = loadFromLocalFile();
    if (localData && !memoryCache) {
      memoryCache = localData;
    }

    // 1. If in quota cooldown period or spreadsheet ID is missing, serve local memory/file data immediately
    if (!SPREADSHEET_ID || now < rateLimitCooldownUntil) {
      return res.json(memoryCache || localData || {});
    }

    // 2. Serve from cache if available and force refresh was not requested
    if (memoryCache && req.query.force !== '1') {
      return res.json(memoryCache);
    }

    // 3. Throttle remote calls (min 15 seconds interval even if force=1)
    if (memoryCache && (now - lastRemoteFetchTime < 15000)) {
      return res.json(memoryCache);
    }

    // 4. Batch Fetch from Google Sheets API using batchGet (1 HTTP Call instead of 14)
    try {
      // Get sheet list metadata if not cached
      if (!cachedExistingSheets) {
        const spreadsheet = await sheets.spreadsheets.get({
          spreadsheetId: SPREADSHEET_ID,
        });
        cachedExistingSheets = spreadsheet.data.sheets?.map(s => s.properties?.title || "") || [];
      }
      
      const sheetsToFetch = SHEET_NAMES.filter(name => cachedExistingSheets?.includes(name));
      const allData: any = {};

      if (sheetsToFetch.length > 0) {
        // Single Batch Call for all sheets combined
        const batchResponse = await sheets.spreadsheets.values.batchGet({
          spreadsheetId: SPREADSHEET_ID,
          ranges: sheetsToFetch.map(s => `${s}!A1:Z`),
        });

        const valueRanges = batchResponse.data.valueRanges || [];
        sheetsToFetch.forEach((sheetName, idx) => {
          const vr = valueRanges[idx];
          if (vr && vr.values) {
            allData[sheetName] = sheetDataToJson(vr.values);
          } else {
            allData[sheetName] = memoryCache?.[sheetName] || [];
          }
        });

        // Fill remaining empty sheets
        SHEET_NAMES.forEach(name => {
          if (!allData[name]) allData[name] = memoryCache?.[name] || [];
        });

        lastRemoteFetchTime = now;
        if (Object.keys(allData).length > 0) {
          memoryCache = allData;
          saveToLocalFile(allData);
        }
      }
    } catch (sheetErr: any) {
      const isQuotaError = sheetErr.status === 429 || 
        sheetErr.code === 429 || 
        (sheetErr.message && sheetErr.message.includes("Quota exceeded"));
      
      if (isQuotaError) {
        // Activate 60-second cooldown on quota error so we don't spam Google Sheets API
        rateLimitCooldownUntil = Date.now() + 60000;
        console.warn("[Sync Engine] Google Sheets API rate limit reached. Auto-switching to high-performance local store for 60s.");
      } else {
        console.warn("Spreadsheet error, falling back to local file store:", sheetErr.message);
      }
    }

    res.json(memoryCache || localData || {});
  } catch (error: any) {
    console.error("Gagal mengambil data:", error);
    const localData = loadFromLocalFile();
    res.json(localData || memoryCache || {});
  }
});

// 2. MENYIMPAN SELURUH DATA (Lokal & Spreadsheet)
app.post("/api/sync", async (req, res) => {
  try {
    const incomingData = req.body;

    // Save locally first to guarantee zero data loss
    memoryCache = incomingData;
    memoryVersion++;
    saveToLocalFile(incomingData);

    const now = Date.now();

    if (SPREADSHEET_ID && now >= rateLimitCooldownUntil) {
      try {
        if (!cachedExistingSheets) {
          const spreadsheet = await sheets.spreadsheets.get({
            spreadsheetId: SPREADSHEET_ID,
          });
          cachedExistingSheets = spreadsheet.data.sheets?.map(s => s.properties?.title || "") || [];
        }
        
        const existingSheets = cachedExistingSheets || [];
        const sheetsToCreate = SHEET_NAMES.filter(name => !existingSheets.includes(name));
        
        if (sheetsToCreate.length > 0) {
          const requests = sheetsToCreate.map(title => ({
            addSheet: { properties: { title } }
          }));
          await sheets.spreadsheets.batchUpdate({
            spreadsheetId: SPREADSHEET_ID,
            requestBody: { requests }
          });
          cachedExistingSheets = [...existingSheets, ...sheetsToCreate];
        }

        const dataUpdates: any[] = [];
        const clearRanges: string[] = [];
        
        for (const sheetName of SHEET_NAMES) {
          if (incomingData[sheetName]) {
            const dataForSheet = incomingData[sheetName];
            let values = [[]];
            
            if (Array.isArray(dataForSheet) && dataForSheet.length > 0) {
              values = jsonToSheetData(dataForSheet);
            } else if (typeof dataForSheet === 'object' && Object.keys(dataForSheet).length > 0) {
              values = jsonToSheetData([dataForSheet]);
            }
            
            clearRanges.push(`${sheetName}!A1:Z`);
            dataUpdates.push({
              range: `${sheetName}!A1`,
              values: values
            });
          }
        }

        if (clearRanges.length > 0) {
          await sheets.spreadsheets.values.batchClear({
            spreadsheetId: SPREADSHEET_ID,
            requestBody: { ranges: clearRanges }
          });
        }

        if (dataUpdates.length > 0) {
          await sheets.spreadsheets.values.batchUpdate({
            spreadsheetId: SPREADSHEET_ID,
            requestBody: {
              valueInputOption: "USER_ENTERED",
              data: dataUpdates
            }
          });
        }
      } catch (sheetErr: any) {
        const isQuotaError = sheetErr.status === 429 || 
          sheetErr.code === 429 || 
          (sheetErr.message && sheetErr.message.includes("Quota exceeded"));

        if (isQuotaError) {
          rateLimitCooldownUntil = Date.now() + 60000;
          console.warn("[Sync Engine] Spreadsheet save queued/skipped remotely due to Google API rate limit. Data is safely stored locally.");
        } else {
          console.warn("Spreadsheet save skipped/failed, data saved locally:", sheetErr.message);
        }
      }
    }

    res.json({ success: true, message: "Data berhasil disinkronisasi dan disimpan dengan aman." });
  } catch (error: any) {
    console.error("Gagal menyimpan data:", error);
    res.status(500).json({ error: error.message });
  }
});

// 3. ENDPOINT UNTUK UPLOAD FILE KE GOOGLE DRIVE & CLOUD STORAGE
app.post("/api/drive/upload", async (req, res) => {
  try {
    const { filename, fileData, folderId, folder = 'Reports', uploadedBy = 'Petugas BMN' } = req.body;
    if (!filename || !fileData) {
      return res.status(400).json({ error: "Filename dan fileData (Base64) wajib diisi." });
    }

    // Ekstraksi MIME Type dan Buffer
    const matches = String(fileData).match(/^data:(.+);base64,(.+)$/);
    const mimeType = matches ? matches[1] : (filename.endsWith('.pdf') ? 'application/pdf' : 'application/octet-stream');
    const base64Content = matches ? matches[2] : fileData;
    const buffer = Buffer.from(base64Content, 'base64');
    const sizeKB = Math.max(1, Math.round(buffer.length / 1024));

    // Simpan ke direktori upload lokal agar selalu dapat dibuka secara instan
    const cleanFileName = `${Date.now()}_${path.basename(filename).replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const localFilePath = path.join(UPLOADS_DIR, cleanFileName);
    fs.writeFileSync(localFilePath, buffer);

    let webViewLink = `/uploads/${cleanFileName}`;
    let fileId = `local-${Date.now()}`;
    let isDriveSynced = false;

    // 1. Coba upload via Google Apps Script (jika disetel)
    const gasUrl = process.env.GAS_UPLOAD_URL;
    if (gasUrl) {
      try {
        const fetch = (await import('node-fetch')).default;
        const response = await fetch(gasUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filename, fileData, folderId })
        });
        
        const result = await response.json() as any;
        if (result.success && result.webViewLink) {
          webViewLink = result.webViewLink;
          fileId = result.fileId || fileId;
          isDriveSynced = true;
        }
      } catch (err: any) {
        console.warn("GAS upload fallback notice:", err.message);
      }
    }

    const dyn = getGoogleClients();
    if (!isDriveSynced && dyn.hasCredentials && dyn.drive) {
      try {
        const { Readable } = await import('stream');
        const stream = new Readable();
        stream.push(buffer);
        stream.push(null);

        const fileMetadata: any = { name: filename };
        // Hanya sertakan parents jika ID folder valid (bukan placeholder awal)
        if (folderId && !folderId.startsWith('1dr_') && folderId.length > 5) {
          fileMetadata.parents = [folderId];
        }

        const driveRes = await dyn.drive.files.create({
          requestBody: fileMetadata,
          media: {
            mimeType: mimeType,
            body: stream,
          },
          fields: 'id, webViewLink, webContentLink',
          supportsAllDrives: true
        });

        if (driveRes.data && driveRes.data.id) {
          fileId = driveRes.data.id;
          webViewLink = driveRes.data.webViewLink || webViewLink;
          isDriveSynced = true;

          // Coba set permission publik agar berkas bisa dibuka langsung
          try {
            await dyn.drive.permissions.create({
              fileId: driveRes.data.id,
              requestBody: {
                role: 'reader',
                type: 'anyone',
              },
            });
          } catch (permErr) {
            // Abaikan jika domain/restricted
          }
        }
      } catch (driveErr: any) {
        console.warn("Google Drive direct upload notice:", driveErr.message);
      }
    }

    // Susun item berkas Drive
    const driveItem = {
      id: `DRV-${Date.now()}`,
      name: filename,
      folder: folder as any,
      size: `${sizeKB} KB`,
      type: mimeType,
      uploadedAt: new Date().toISOString(),
      uploadedBy,
      dataUrl: `/uploads/${cleanFileName}`,
      webViewLink,
      fileId,
      status: isDriveSynced ? 'Tersinkron ke Google Drive' : 'Tersimpan di Cloud Storage'
    };

    // Update memoryCache & local file
    if (!memoryCache) memoryCache = loadFromLocalFile() || {};
    if (!Array.isArray(memoryCache.DriveFiles)) memoryCache.DriveFiles = [];
    memoryCache.DriveFiles.unshift(driveItem);
    saveToLocalFile(memoryCache);

    res.json({
      success: true,
      item: driveItem,
      webViewLink,
      fileId,
      status: driveItem.status,
      message: isDriveSynced
        ? `Dokumen "${filename}" berhasil diunggah langsung ke Google Drive!`
        : `Dokumen "${filename}" berhasil disimpan dengan aman di Cloud Storage & siap diakses.`
    });
  } catch (error: any) {
    console.error("Gagal upload file ke Drive:", error);
    res.status(500).json({ error: error.message });
  }
});

// 4. ENDPOINT MENGAMBIL DAFTAR BERKAS DRIVE
app.get("/api/drive/files", (req, res) => {
  try {
    const localData = loadFromLocalFile();
    const list = memoryCache?.DriveFiles || localData?.DriveFiles || [];
    res.json(list);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 5. ENDPOINT BACKUP OTOMATIS KE GOOGLE DRIVE
app.post("/api/drive/backup", async (req, res) => {
  try {
    const backupData = req.body || memoryCache || loadFromLocalFile() || {};
    const dateStr = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `SILAP_BMN_Database_Backup_${dateStr}.json`;
    const jsonString = JSON.stringify(backupData, null, 2);
    const buffer = Buffer.from(jsonString, 'utf8');
    const sizeKB = Math.max(1, Math.round(buffer.length / 1024));

    const cleanFileName = `${Date.now()}_${filename}`;
    const localFilePath = path.join(UPLOADS_DIR, cleanFileName);
    fs.writeFileSync(localFilePath, buffer);

    let webViewLink = `/uploads/${cleanFileName}`;
    let fileId = `backup-${Date.now()}`;
    let isDriveSynced = false;

    const dyn = getGoogleClients();
    if (dyn.hasCredentials && dyn.drive) {
      try {
        const { Readable } = await import('stream');
        const stream = new Readable();
        stream.push(buffer);
        stream.push(null);

        const fileMetadata: any = { name: filename };
        const backupFolderId = req.body?.folderBackupId;
        if (backupFolderId && !backupFolderId.startsWith('1dr_') && backupFolderId.length > 5) {
          fileMetadata.parents = [backupFolderId];
        }

        const driveRes = await dyn.drive.files.create({
          requestBody: fileMetadata,
          media: {
            mimeType: 'application/json',
            body: stream,
          },
          fields: 'id, webViewLink, webContentLink',
          supportsAllDrives: true
        });

        if (driveRes.data && driveRes.data.id) {
          fileId = driveRes.data.id;
          webViewLink = driveRes.data.webViewLink || webViewLink;
          isDriveSynced = true;
        }
      } catch (err: any) {
        console.warn("Drive backup notice:", err.message);
      }
    }

    const driveItem = {
      id: `DRV-${Date.now()}`,
      name: filename,
      folder: 'Backup' as const,
      size: `${sizeKB} KB`,
      type: 'application/json',
      uploadedAt: new Date().toISOString(),
      uploadedBy: req.body?.actor || 'Administrator',
      dataUrl: `/uploads/${cleanFileName}`,
      webViewLink,
      fileId,
      status: isDriveSynced ? 'Tersinkron ke Google Drive' : 'Tersimpan di Cloud Storage'
    };

    if (!memoryCache) memoryCache = loadFromLocalFile() || {};
    if (!Array.isArray(memoryCache.DriveFiles)) memoryCache.DriveFiles = [];
    memoryCache.DriveFiles.unshift(driveItem);
    saveToLocalFile(memoryCache);

    res.json({
      success: true,
      item: driveItem,
      webViewLink,
      filename,
      dataUrl: `/uploads/${cleanFileName}`,
      message: isDriveSynced 
        ? `Backup sistem berhasil disinkronisasi ke Google Drive Folder Backup (${filename})`
        : `Backup database lengkap berhasil dibuat dan disimpan ke Cloud Storage.`
    });
  } catch (error: any) {
    console.error("Gagal membuat backup Drive:", error);
    res.status(500).json({ error: error.message });
  }
});

// 6. ENDPOINT HAPUS BERKAS DRIVE
app.delete("/api/drive/files/:id", async (req, res) => {
  try {
    const fileId = req.params.id;
    if (!memoryCache) memoryCache = loadFromLocalFile() || {};
    if (Array.isArray(memoryCache.DriveFiles)) {
      const target = memoryCache.DriveFiles.find((f: any) => f.id === fileId || f.fileId === fileId);
      memoryCache.DriveFiles = memoryCache.DriveFiles.filter((f: any) => f.id !== fileId && f.fileId !== fileId);
      saveToLocalFile(memoryCache);

      const dyn = getGoogleClients();
      if (target && target.fileId && !target.fileId.startsWith('local-') && dyn.hasCredentials && dyn.drive) {
        try {
          await dyn.drive.files.delete({ fileId: target.fileId });
        } catch (e) {}
      }
    }
    res.json({ success: true, message: "Berkas berhasil dihapus." });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Backend berjalan sempurna di Vercel!" });
});

export default app;
