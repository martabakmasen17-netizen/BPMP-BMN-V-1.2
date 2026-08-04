const fs = require('fs');
let code = fs.readFileSync('api/index.ts', 'utf8');

const cacheHeader = `
// ==========================================
// IN-MEMORY CACHE UNTUK MENGURANGI KUOTA SPREADSHEET
// ==========================================
let memoryCache = null;
let memoryVersion = 0;

app.get("/api/sync/version", (req, res) => {
  res.json({ version: memoryVersion });
});
`;

code = code.replace("// 1. MENGAMBIL SELURUH DATA DARI SPREADSHEET", cacheHeader + "\n// 1. MENGAMBIL SELURUH DATA DARI SPREADSHEET");

const getSyncStart = `app.get("/api/sync", async (req, res) => {
  try {
    if (memoryCache && req.query.force !== '1') {
      return res.json(memoryCache);
    }
`;

code = code.replace(`app.get("/api/sync", async (req, res) => {
  try {`, getSyncStart);


const getSyncEnd = `    memoryCache = allData;
    res.json(allData);
  } catch (error: any) {`;

code = code.replace(`    res.json(allData);
  } catch (error: any) {`, getSyncEnd);


const postSyncEnd = `    memoryCache = incomingData;
    memoryVersion++;
    res.json({ success: true, message: "Data berhasil disinkronisasi ke Google Spreadsheet." });
  } catch (error: any) {`;

code = code.replace(`    res.json({ success: true, message: "Data berhasil disinkronisasi ke Google Spreadsheet." });
  } catch (error: any) {`, postSyncEnd);

fs.writeFileSync('api/index.ts', code);
console.log("api/index.ts updated");
