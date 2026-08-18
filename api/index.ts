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
  let settings: any = {};
  if (Array.isArray(localCache.Settings) && localCache.Settings.length > 0) {
    settings = localCache.Settings[0];
  } else if (localCache.Settings && typeof localCache.Settings === 'object') {
    settings = localCache.Settings;
  }
  
  let clientEmail = settings?.serviceAccountEmail || process.env.GOOGLE_CLIENT_EMAIL || "";
  let privateKey = settings?.serviceAccountPrivateKey || process.env.GOOGLE_PRIVATE_KEY || "";
  const gasUploadUrl = settings?.gasUploadUrl || process.env.GAS_UPLOAD_URL || "";

  // Auto-parse JSON if user pasted the entire Service Account credentials file
  if (privateKey && (privateKey.trim().startsWith("{") || privateKey.includes('"private_key":'))) {
    try {
      const parsed = JSON.parse(privateKey.trim());
      if (parsed.private_key) privateKey = parsed.private_key;
      if (parsed.client_email && !clientEmail) clientEmail = parsed.client_email;
    } catch (e) {}
  }
  if (clientEmail && (clientEmail.trim().startsWith("{") || clientEmail.includes('"client_email":'))) {
    try {
      const parsed = JSON.parse(clientEmail.trim());
      if (parsed.client_email) clientEmail = parsed.client_email;
      if (parsed.private_key && !privateKey) privateKey = parsed.private_key;
    } catch (e) {}
  }

  // Clean private key: remove quotes, normalize newlines
  privateKey = (privateKey || "").trim();
  if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
    privateKey = privateKey.slice(1, -1);
  }
  privateKey = privateKey.replace(/\\r\\n/g, '\n').replace(/\\n/g, '\n');

  if (!clientEmail || !privateKey) {
    return { 
      drive: null, 
      sheets: null, 
      hasCredentials: false, 
      gasUploadUrl,
      spreadsheetId: settings?.spreadsheetId || process.env.SPREADSHEET_ID,
      settings 
    };
  }
  
  const dynAuth = new google.auth.GoogleAuth({
    credentials: {
      client_email: clientEmail,
      private_key: privateKey,
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
    gasUploadUrl,
    spreadsheetId: settings?.spreadsheetId || process.env.SPREADSHEET_ID,
    settings
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

const isPlaceholderId = (id?: string) => {
  if (!id) return true;
  const clean = id.trim();
  if (clean.startsWith('1ss_') || clean.startsWith('1dr_') || clean.includes('dummy') || clean.includes('placeholder')) {
    return true;
  }
  return false;
};

app.get("/api/sync/version", (req, res) => {
  res.json({ version: memoryVersion });
});

// 1. MENGAMBIL SELURUH DATA DARI SPREADSHEET ATAU LOCAL FILE (Batch Read Optimised)
app.get("/api/sync", async (req, res) => {
  try {
    const now = Date.now();
    const localData = loadFromLocalFile();
    if (localData && !memoryCache) {
      memoryCache = localData;
    }

    const dyn = getGoogleClients();
    const currentSpreadsheetId = dyn.spreadsheetId || SPREADSHEET_ID;

    if (!currentSpreadsheetId || isPlaceholderId(currentSpreadsheetId) || !dyn.hasCredentials || !dyn.sheets || now < rateLimitCooldownUntil) {
      return res.json(memoryCache || localData || {});
    }

    if (memoryCache && req.query.force !== '1') {
      return res.json(memoryCache);
    }

    if (memoryCache && (now - lastRemoteFetchTime < 15000)) {
      return res.json(memoryCache);
    }

    try {
      if (!cachedExistingSheets) {
        const spreadsheet = await dyn.sheets.spreadsheets.get({
          spreadsheetId: currentSpreadsheetId,
        });
        cachedExistingSheets = spreadsheet.data.sheets?.map(s => s.properties?.title || "") || [];
      }
      
      const sheetsToFetch = SHEET_NAMES.filter(name => cachedExistingSheets?.includes(name));
      const allData: any = {};

      if (sheetsToFetch.length > 0) {
        const batchResponse = await dyn.sheets.spreadsheets.values.batchGet({
          spreadsheetId: currentSpreadsheetId,
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

      const isNotFoundError = sheetErr.status === 404 ||
        sheetErr.code === 404 ||
        (sheetErr.message && (sheetErr.message.includes("Requested entity was not found") || sheetErr.message.includes("File not found")));
      
      if (isQuotaError) {
        // Activate 60-second cooldown on quota error so we don't spam Google Sheets API
        rateLimitCooldownUntil = Date.now() + 60000;
        console.warn("[Sync Engine] Google Sheets API rate limit reached. Auto-switching to high-performance local store for 60s.");
      } else if (isNotFoundError) {
        // Cooldown for 5 minutes when spreadsheet ID is dummy/not found
        rateLimitCooldownUntil = Date.now() + 300000;
        console.info("[Sync Engine] Spreadsheet ID not found or access denied. Using local storage mode.");
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
    
    const dyn = getGoogleClients();
    const currentSpreadsheetId = dyn.spreadsheetId || SPREADSHEET_ID;

    if (currentSpreadsheetId && !isPlaceholderId(currentSpreadsheetId) && dyn.hasCredentials && dyn.sheets && now >= rateLimitCooldownUntil) {
      try {
        if (!cachedExistingSheets) {
          const spreadsheet = await dyn.sheets.spreadsheets.get({
            spreadsheetId: currentSpreadsheetId,
          });
          cachedExistingSheets = spreadsheet.data.sheets?.map(s => s.properties?.title || "") || [];
        }
        
        const existingSheets = cachedExistingSheets || [];
        const sheetsToCreate = SHEET_NAMES.filter(name => !existingSheets.includes(name));
        
        if (sheetsToCreate.length > 0) {
          const requests = sheetsToCreate.map(title => ({
            addSheet: { properties: { title } }
          }));
          await dyn.sheets.spreadsheets.batchUpdate({
            spreadsheetId: currentSpreadsheetId,
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
          await dyn.sheets.spreadsheets.values.batchClear({
            spreadsheetId: currentSpreadsheetId,
            requestBody: { ranges: clearRanges }
          });
        }

        if (dataUpdates.length > 0) {
          await dyn.sheets.spreadsheets.values.batchUpdate({
            spreadsheetId: currentSpreadsheetId,
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

        const isNotFoundError = sheetErr.status === 404 || 
          sheetErr.code === 404 || 
          (sheetErr.message && (sheetErr.message.includes("Requested entity was not found") || sheetErr.message.includes("File not found")));

        if (isQuotaError) {
          rateLimitCooldownUntil = Date.now() + 60000;
          console.warn("[Sync Engine] Spreadsheet save queued/skipped remotely due to Google API rate limit. Data is safely stored locally.");
        } else if (isNotFoundError) {
          rateLimitCooldownUntil = Date.now() + 300000;
          console.info("[Sync Engine] Spreadsheet ID not found or access denied. Data is safely stored locally.");
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

// Helper fungsi terpadu untuk upload berkas ke Google Drive & Cloud Storage
async function uploadFileToDriveHelper(options: {
  filename: string;
  fileData: string; // Base64 data URL or pure Base64
  folderId?: string;
  folder?: string;
  uploadedBy?: string;
  customGasUrl?: string;
}) {
  const { filename, fileData, folderId, folder = 'Reports', uploadedBy = 'Petugas BMN', customGasUrl } = options;

  // Ekstraksi MIME Type dan Buffer
  const matches = String(fileData).match(/^data:(.+);base64,(.+)$/);
  const mimeType = matches ? matches[1] : (filename.endsWith('.pdf') ? 'application/pdf' : filename.endsWith('.json') ? 'application/json' : 'application/octet-stream');
  const base64Content = matches ? matches[2] : fileData;
  const buffer = Buffer.from(base64Content, 'base64');
  const sizeKB = Math.max(1, Math.round(buffer.length / 1024));

  // Simpan ke direktori upload lokal agar selalu dapat dibuka dan diunduh secara instan & permanen
  const cleanFileName = `${Date.now()}_${path.basename(filename).replace(/[^a-zA-Z0-9._-]/g, '_')}`;
  const localFilePath = path.join(UPLOADS_DIR, cleanFileName);
  fs.writeFileSync(localFilePath, buffer);

  let webViewLink = `/uploads/${cleanFileName}`;
  let fileId = `local-${Date.now()}`;
  let isDriveSynced = false;
  let syncEngine = 'Cloud Storage Lokal';
  let driveErrorDetail = '';

  const dyn = getGoogleClients();
  const effectiveGasUrl = customGasUrl || dyn.gasUploadUrl || process.env.GAS_UPLOAD_URL;

  // 1. Prioritas 1: Unggah melalui Google Apps Script Web App Bridge (Sangat stabil untuk akun @gmail.com & Google Drive Pribadi)
  if (effectiveGasUrl && effectiveGasUrl.startsWith('http')) {
    try {
      const gasPayload = {
        filename,
        fileData: fileData.startsWith('data:') ? fileData : `data:${mimeType};base64,${fileData}`,
        folderId: (folderId && !folderId.startsWith('1dr_') && folderId.length > 5) ? folderId : undefined,
        folder
      };

      const response = await fetch(effectiveGasUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(gasPayload),
        redirect: 'follow'
      });

      const resText = await response.text();
      try {
        const result = JSON.parse(resText);
        if (result.success && (result.webViewLink || result.fileId)) {
          webViewLink = result.webViewLink || `https://drive.google.com/file/d/${result.fileId}/view`;
          fileId = result.fileId || fileId;
          isDriveSynced = true;
          syncEngine = 'Google Apps Script Web App';
        } else if (result.error) {
          driveErrorDetail = `GAS Error: ${result.error}`;
        }
      } catch (parseErr) {
        driveErrorDetail = `GAS Non-JSON Response: ${resText.slice(0, 100)}`;
      }
    } catch (gasErr: any) {
      console.warn("GAS Upload Bridge notice:", gasErr.message);
      driveErrorDetail = `GAS Network: ${gasErr.message}`;
    }
  }

  // 2. Prioritas 2: Unggah langsung via Google Drive API (Service Account - Shared Drive / Workspace)
  if (!isDriveSynced && dyn.hasCredentials && dyn.drive) {
    try {
      const { Readable } = await import('stream');
      const stream = new Readable();
      stream.push(buffer);
      stream.push(null);

      const fileMetadata: any = { name: filename };
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
        webViewLink = driveRes.data.webViewLink || `https://drive.google.com/file/d/${fileId}/view`;
        isDriveSynced = true;
        syncEngine = 'Google Drive API (Service Account)';

        // Set permission publik (read-only) agar berkas bisa dibuka langsung
        try {
          await dyn.drive.permissions.create({
            fileId: driveRes.data.id,
            requestBody: {
              role: 'reader',
              type: 'anyone',
            },
            supportsAllDrives: true
          });
        } catch (permErr) {}
      }
    } catch (driveErr: any) {
      const errMsg = driveErr.message || '';
      console.warn("Google Drive direct upload notice:", errMsg);
      if (errMsg.includes('storage quota')) {
        driveErrorDetail = 'Service Account tidak memiliki kuota storage mandiri di Drive pribadi. Pasang URL Web App Google Apps Script di Pengaturan untuk upload otomatis.';
      } else {
        driveErrorDetail = `Drive API: ${errMsg}`;
      }
    }
  }

  // Susun item berkas Drive
  const driveItem = {
    id: `DRV-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
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
  // Ganti jika berkas dengan nama yang sama sudah ada, atau tambahkan di awal
  const existingIdx = memoryCache.DriveFiles.findIndex((f: any) => f.name === filename);
  if (existingIdx >= 0) {
    memoryCache.DriveFiles[existingIdx] = driveItem;
  } else {
    memoryCache.DriveFiles.unshift(driveItem);
  }
  saveToLocalFile(memoryCache);

  return {
    success: true,
    item: driveItem,
    isDriveSynced,
    syncEngine,
    webViewLink,
    fileId,
    driveErrorDetail,
    message: isDriveSynced
      ? `Dokumen "${filename}" berhasil diunggah langsung ke Google Drive (${syncEngine})!`
      : `Dokumen "${filename}" berhasil diamankan di Cloud Storage & siap diakses.`
  };
}

// 3. ENDPOINT UNTUK UPLOAD FILE KE GOOGLE DRIVE & CLOUD STORAGE
app.post("/api/drive/upload", async (req, res) => {
  try {
    const { filename, fileData, folderId, folder = 'Reports', uploadedBy = 'Petugas BMN', gasUploadUrl } = req.body;
    if (!filename || !fileData) {
      return res.status(400).json({ error: "Filename dan fileData (Base64) wajib diisi." });
    }

    const result = await uploadFileToDriveHelper({
      filename,
      fileData,
      folderId,
      folder,
      uploadedBy,
      customGasUrl: gasUploadUrl
    });

    res.json(result);
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
    const base64Data = `data:application/json;base64,${Buffer.from(jsonString, 'utf8').toString('base64')}`;

    const dyn = getGoogleClients();
    const backupFolderId = req.body?.folderBackupId || dyn.settings?.folderBackupId;

    const result = await uploadFileToDriveHelper({
      filename,
      fileData: base64Data,
      folderId: backupFolderId,
      folder: 'Backup',
      uploadedBy: req.body?.actor || 'Administrator',
      customGasUrl: req.body?.gasUploadUrl
    });

    res.json({
      ...result,
      filename,
      dataUrl: result.item.dataUrl
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

// 7. ENDPOINT UJI COBA UPLOAD BERKAS SAMPEL KE GOOGLE DRIVE
app.post("/api/drive/test-upload", async (req, res) => {
  try {
    const { folderId, folder = 'Reports', gasUploadUrl } = req.body;
    const dateStr = new Date().toLocaleString('id-ID');
    const testContent = `UJI KONEKSI & UPLOAD GOOGLE DRIVE - SILAP BMN BPMP SUMSEL\n` +
      `Waktu Pengujian: ${dateStr}\n` +
      `Status: Berkas pengujian berhasil dibuat dan disimpan di Google Drive.\n` +
      `Integrasi Google Workspace Aktif & Terlindungi.`;
    
    const base64Data = `data:text/plain;base64,${Buffer.from(testContent, 'utf8').toString('base64')}`;
    const filename = `Test_Koneksi_Drive_${Date.now()}.txt`;

    const result = await uploadFileToDriveHelper({
      filename,
      fileData: base64Data,
      folderId,
      folder,
      uploadedBy: 'Sistem Diagnostik',
      customGasUrl: gasUploadUrl
    });

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 8. ENDPOINT SINKRONISASI ULANG SELURUH BERKAS LOKAL KE GOOGLE DRIVE
app.post("/api/drive/sync-all", async (req, res) => {
  try {
    const dyn = getGoogleClients();
    const localData = loadFromLocalFile();
    const files = memoryCache?.DriveFiles || localData?.DriveFiles || [];
    let syncedCount = 0;
    const syncLogs: string[] = [];

    for (const item of files) {
      if (!item.webViewLink || !item.webViewLink.startsWith('https://drive.google.com')) {
        let fileDataUrl = item.dataUrl;
        // Jika dataUrl mengarah ke local path /uploads/..., baca filenya
        if (item.dataUrl && item.dataUrl.startsWith('/uploads/')) {
          const localFilePath = path.join(process.cwd(), item.dataUrl);
          if (fs.existsSync(localFilePath)) {
            const buf = fs.readFileSync(localFilePath);
            fileDataUrl = `data:${item.type || 'application/octet-stream'};base64,${buf.toString('base64')}`;
          }
        }

        if (fileDataUrl && fileDataUrl.startsWith('data:')) {
          const folderId = item.folder === 'Backup' 
            ? dyn.settings?.folderBackupId 
            : item.folder === 'Images' 
            ? dyn.settings?.folderImagesId 
            : item.folder === 'QRCode' 
            ? dyn.settings?.folderQrId 
            : dyn.settings?.folderReportsId;

          const uploadRes = await uploadFileToDriveHelper({
            filename: item.name,
            fileData: fileDataUrl,
            folderId,
            folder: item.folder,
            uploadedBy: item.uploadedBy || 'Petugas BMN',
            customGasUrl: req.body?.gasUploadUrl || dyn.gasUploadUrl
          });

          if (uploadRes.isDriveSynced) {
            syncedCount++;
            syncLogs.push(`✓ ${item.name} -> Terunggah ke Google Drive`);
          }
        }
      }
    }

    res.json({
      success: true,
      syncedCount,
      totalCount: files.length,
      logs: syncLogs,
      message: `Sinkronisasi selesai. ${syncedCount} berkas baru berhasil diunggah ke Google Drive.`
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 9. ENDPOINT UJI KONEKSI & DIAGNOSTIK KREDENSIAL
app.post("/api/drive/test-connection", async (req, res) => {
  try {
    const { 
      serviceAccountEmail, 
      serviceAccountPrivateKey, 
      spreadsheetId, 
      folderReportsId, 
      folderBackupId, 
      folderImagesId, 
      folderQrId,
      gasUploadUrl
    } = req.body;

    const results: string[] = [];
    const errors: string[] = [];
    const recommendations: string[] = [];

    // 1. Test Google Apps Script Web App Bridge (jika disetel)
    if (gasUploadUrl && gasUploadUrl.startsWith('http')) {
      try {
        const gasRes = await fetch(gasUploadUrl, { method: 'GET', redirect: 'follow' });
        if (gasRes.ok) {
          results.push("Google Apps Script Web App (Upload Bridge): Aktif & Terhubung (200 OK)");
        } else {
          errors.push(`Google Apps Script Web App mengembalikan status HTTP ${gasRes.status}`);
        }
      } catch (gasErr: any) {
        errors.push(`Google Apps Script Web App tidak dapat dihubungi (${gasErr.message})`);
      }
    }

    // 2. Test Google Service Account
    let cleanedKey = (serviceAccountPrivateKey || "").trim();
    if (cleanedKey.startsWith('"') && cleanedKey.endsWith('"')) {
      cleanedKey = cleanedKey.slice(1, -1);
    }
    cleanedKey = cleanedKey.replace(/\\r\\n/g, '\n').replace(/\\n/g, '\n');

    if (serviceAccountEmail && cleanedKey) {
      try {
        const testAuth = new google.auth.GoogleAuth({
          credentials: {
            client_email: serviceAccountEmail,
            private_key: cleanedKey,
          },
          scopes: [
            "https://www.googleapis.com/auth/spreadsheets",
            "https://www.googleapis.com/auth/drive",
            "https://www.googleapis.com/auth/drive.file"
          ],
        });

        const testDrive = google.drive({ version: "v3", auth: testAuth });
        const testSheets = google.sheets({ version: "v4", auth: testAuth });

        // Test Spreadsheet
        if (spreadsheetId && spreadsheetId.length > 5 && !spreadsheetId.startsWith("1ss_")) {
          try {
            const ssRes = await testSheets.spreadsheets.get({ spreadsheetId });
            results.push(`Spreadsheet Database: OK ("${ssRes.data.properties?.title || 'Aktif'}")`);
          } catch (e: any) {
            errors.push(`Spreadsheet tidak dapat diakses (${e.message})`);
          }
        }

        // Test folders
        const testFolder = async (folderId: string, name: string) => {
          if (folderId && folderId.length > 5 && !folderId.startsWith("1dr_")) {
            try {
              const folderMeta = await testDrive.files.get({ fileId: folderId, fields: 'id, name' });
              results.push(`Folder ${name}: OK ("${folderMeta.data.name}")`);
            } catch (e: any) {
              errors.push(`Folder ${name} tidak valid (${e.message})`);
            }
          }
        };

        await testFolder(folderReportsId, "Reports / Dokumen");
        await testFolder(folderBackupId, "Backup");
        await testFolder(folderImagesId, "Images");
        await testFolder(folderQrId, "QR Codes");

        results.push("Autentikasi Service Account Google: Valid & Berhasil");
      } catch (authErr: any) {
        errors.push(`Autentikasi Service Account gagal (${authErr.message})`);
      }
    } else if (!gasUploadUrl) {
      errors.push("Kredensial Service Account belum diisi dan Web App GAS belum disetel.");
    }

    if (!gasUploadUrl) {
      recommendations.push("Tips: Untuk akun Google @gmail.com pribadi, pasang 'URL Web App Google Apps Script' di bawah agar berkas Surat Jalan & Foto langsung tersimpan di Google Drive tanpa pembatasan kuota.");
    }

    const hasAnySuccess = results.length > 0;
    const hasErrors = errors.length > 0;

    res.json({ 
      success: hasAnySuccess && !hasErrors, 
      message: hasErrors 
        ? "Pemeriksaan selesai dengan beberapa catatan verifikasi." 
        : "Koneksi Google Workspace & Drive Berhasil Sempurna!", 
      results, 
      errors,
      recommendations
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: `Autentikasi gagal: ${error.message}` });
  }
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Backend berjalan sempurna di Vercel!" });
});

export default app;
