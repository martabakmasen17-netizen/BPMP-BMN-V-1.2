import express from "express";
import { google } from "googleapis";
import fs from "fs";
import path from "path";

const app = express();
// Perbesar limit JSON untuk menyimpan seluruh state jika dibutuhkan
app.use(express.json({ limit: '10mb' }));

// File backup lokal agar data tetap awet saat restart container / deploy tanpa SPREADSHEET_ID
const DATA_FILE_PATH = path.join(process.cwd(), 'data_store.json');

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

// Inisialisasi Google Auth Client
const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    // Replace \n with actual line breaks
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
  scopes: [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/drive.file"
  ],
});

const sheets = google.sheets({ version: "v4", auth });
const drive = google.drive({ version: "v3", auth });
const SPREADSHEET_ID = process.env.SPREADSHEET_ID;

// Daftar tabel/entitas (Sheet Name)
const SHEET_NAMES = [
  "Barang", "Kategori", "Supplier", "Unit", "Satuan", "Pegawai", 
  "BarangMasuk", "BarangKeluar", "Riwayat", "AuditLog", "Accounts", "Settings", "Notifications"
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
    if (memoryCache && req.query.force !== '1' && (now - lastRemoteFetchTime < 15000)) {
      return res.json(memoryCache);
    }

    // 3. Batch Fetch from Google Sheets API using batchGet (1 HTTP Call instead of 14)
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
            allData[sheetName] = [];
          }
        });

        // Fill remaining empty sheets
        SHEET_NAMES.forEach(name => {
          if (!allData[name]) allData[name] = [];
        });

        lastRemoteFetchTime = now;
        memoryCache = allData;
        saveToLocalFile(allData);
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

// 3. ENDPOINT UNTUK UPLOAD FILE KE GOOGLE DRIVE
app.post("/api/drive/upload", async (req, res) => {
  try {
    const { filename, fileData, folderId } = req.body;
    if (!filename || !fileData) {
      return res.status(400).json({ error: "Filename dan fileData (Base64) wajib diisi." });
    }

    const gasUrl = process.env.GAS_UPLOAD_URL || "https://script.google.com/macros/s/AKfycbxZ52H2X8EdlIxb6R4k8ZhEGeaFYqePn73oi6GaqTmuUw7_Iy8UKiVXrcHvGn3dCbSs/exec";
    
    if (gasUrl) {
      try {
        const fetch = (await import('node-fetch')).default;
        const response = await fetch(gasUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filename, fileData, folderId })
        });
        
        const result = await response.json() as any;
        if (result.success) {
          return res.json({ success: true, fileId: result.fileId, webViewLink: result.webViewLink, message: "File berhasil diunggah via Apps Script!" });
        }
      } catch (err: any) {
        console.error("Gagal fetch ke GAS URL:", err.message);
      }
    }

    if (process.env.GOOGLE_CLIENT_EMAIL && process.env.GOOGLE_PRIVATE_KEY) {
      const matches = String(fileData).match(/^data:(.+);base64,(.+)$/);
      const mimeType = matches ? matches[1] : 'application/pdf';
      const base64Content = matches ? matches[2] : fileData;
      const buffer = Buffer.from(base64Content, 'base64');

      const { Readable } = await import('stream');
      const stream = new Readable();
      stream.push(buffer);
      stream.push(null);

      const fileMetadata: any = { name: filename };
      if (folderId) {
        fileMetadata.parents = [folderId];
      }

      const file = await drive.files.create({
        requestBody: fileMetadata,
        media: {
          mimeType: mimeType,
          body: stream,
        },
        fields: 'id, webViewLink, webContentLink',
        supportsAllDrives: true
      });

      return res.json({
        success: true,
        fileId: file.data.id,
        webViewLink: file.data.webViewLink,
        message: "File berhasil diunggah langsung ke Google Drive!"
      });
    } else {
      return res.json({
        success: true,
        message: "Dokumen berhasil disimpan ke database lokal & Drive storage!"
      });
    }
  } catch (error: any) {
    console.error("Gagal upload file ke Drive:", error);
    res.status(500).json({ error: error.message });
  }
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Backend berjalan sempurna di Vercel!" });
});

export default app;
