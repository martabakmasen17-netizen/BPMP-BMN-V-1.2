/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const CODE_GS_CONTENT = `/**
 * ==============================================================================
 * BACKEND CONTROLLER: SISTEM INFORMASI MONITORING PERSEDIAAN BARANG
 * ==============================================================================
 * Lembaga: BPMP Provinsi Sumatera Selatan
 * Teknologi: Google Apps Script Web App
 * Database: Google Spreadsheet
 * ==============================================================================
 */

/**
 * Menghandle request masuk dan merender file Index.html ke browser.
 */
function doGet() {
  const htmlOutput = HtmlService.createTemplateFromFile("Index");
  return htmlOutput.evaluate()
    .setTitle("Sistem Informasi Monitoring Persediaan Barang - BPMP Sumsel")
    .setFaviconUrl("https://upload.wikimedia.org/wikipedia/commons/9/9c/Logo_Kementerian_Pendidikan_dan_Kemudayaan.png")
    .addMetaTag("viewport", "width=device-width, initial-scale=1.0")
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * Memasukkan komponen HTML lain secara modular (CSS/JS) di dalam template Index.
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/**
 * Mengambil seluruh data awal untuk aplikasi (Dashboard Statistics & Catalog)
 */
function getInitialData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  return {
    barang: getSheetDataAsObjects(ss, "Barang"),
    kategori: getSheetDataAsObjects(ss, "Kategori"),
    supplier: getSheetDataAsObjects(ss, "Supplier"),
    unit: getSheetDataAsObjects(ss, "Unit"),
    satuan: getSheetDataAsObjects(ss, "Satuan"),
    pegawai: getSheetDataAsObjects(ss, "Pegawai"),
    barangMasuk: getSheetDataAsObjects(ss, "BarangMasuk"),
    barangKeluar: getSheetDataAsObjects(ss, "BarangKeluar"),
    riwayat: getSheetDataAsObjects(ss, "Riwayat"),
    auditLogs: getSheetDataAsObjects(ss, "ActivityLog"),
    notifications: getSheetDataAsObjects(ss, "Notification"),
    accounts: getSheetDataAsObjects(ss, "Accounts"),
    settings: getSystemSettings(ss)
  };
}

/**
 * Helper: Membaca sheet dan mengonversi baris menjadi array of objek (key-value)
 */
function getSheetDataAsObjects(ss, sheetName) {
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];
  
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return [];
  
  const lastCol = sheet.getLastColumn();
  const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  const rows = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
  
  return rows.map((row, rIdx) => {
    const obj = {};
    headers.forEach((header, cIdx) => {
      // Ubah header ke camelCase sebagai key objek
      const key = toCamelCase(header);
      obj[key] = row[cIdx];
      // Jika tipe data adalah Date, ubah ke ISOString agar JSON aman
      if (row[cIdx] instanceof Date) {
        obj[key] = row[cIdx].toISOString();
      }
    });
    // Simpan nomor baris untuk mempermudah edit/hapus
    obj["rowNum"] = rIdx + 2; 
    return obj;
  });
}

/**
 * Helper: Mengonversi judul kolom "Kode Barang" menjadi camelCase "kodeBarang"
 */
function toCamelCase(str) {
  return str.toLowerCase()
    .replace(/[^a-zA-Z0-9]+(.)/g, (m, chr) => chr.toUpperCase())
    .trim();
}

/**
 * Mengambil setelan konfigurasi dari sheet Settings.
 */
function getSystemSettings(ss) {
  const sheet = ss.getSheetByName("Settings");
  if (!sheet) return {};
  
  const data = sheet.getRange(2, 1, sheet.getLastRow() - 1, 2).getValues();
  const settings = {};
  data.forEach(row => {
    settings[row[0]] = row[1];
  });
  return settings;
}

/**
 * MENAMBAH BARANG BARU (CREATE)
 */
function addBarang(item, actor, role) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Barang");
  
  // Ambil ID Terakhir untuk Auto Increment
  const lastRow = sheet.getLastRow();
  let nextId = "BRG-001";
  if (lastRow > 1) {
    const lastId = sheet.getRange(lastRow, 1).getValue().toString();
    const lastNum = parseInt(lastId.replace("BRG-", "")) || 0;
    nextId = "BRG-" + ("00" + (lastNum + 1)).slice(-3);
  }
  
  const now = new Date();
  const qrCodeUrl = "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=" + nextId;
  
  // Urutan kolom: Kode, Nama, Kategori, Supplier, Satuan, Lokasi Rak, QR, StokSekarang, StokMin, StokMaks, Deskripsi, Image, Created, Updated
  sheet.appendRow([
    nextId,
    item.nama,
    item.kategori,
    item.supplier,
    item.satuan,
    item.lokasiRak,
    qrCodeUrl,
    item.stokSekarang,
    item.stokMin,
    item.stokMaks,
    item.deskripsi,
    item.imageUrl || "",
    now,
    now
  ]);
  
  logActivityToSheet(ss, actor, role, "Tambah Barang", "Mendaftarkan barang baru: " + item.nama + " (" + nextId + ")");
  return getInitialData();
}

/**
 * MEMPERBARUI BARANG (UPDATE)
 */
function editBarang(id, item, actor, role) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Barang");
  const data = sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).getValues();
  
  let rowIdx = -1;
  for (let i = 0; i < data.length; i++) {
    if (data[i][0] === id) {
      rowIdx = i + 2;
      break;
    }
  }
  
  if (rowIdx !== -1) {
    const now = new Date();
    // Update kolom spesifik: Nama, Kategori, Supplier, Satuan, Lokasi Rak, StokMin, StokMaks, Deskripsi, Image, UpdatedAt
    sheet.getRange(rowIdx, 2).setValue(item.nama);
    sheet.getRange(rowIdx, 3).setValue(item.kategori);
    sheet.getRange(rowIdx, 4).setValue(item.supplier);
    sheet.getRange(rowIdx, 5).setValue(item.satuan);
    sheet.getRange(rowIdx, 6).setValue(item.lokasiRak);
    sheet.getRange(rowIdx, 9).setValue(item.stokMin);
    sheet.getRange(rowIdx, 10).setValue(item.stokMaks);
    sheet.getRange(rowIdx, 11).setValue(item.deskripsi);
    sheet.getRange(rowIdx, 12).setValue(item.imageUrl || "");
    sheet.getRange(rowIdx, 14).setValue(now);
    
    logActivityToSheet(ss, actor, role, "Edit Barang", "Mengubah spesifikasi katalog barang " + item.nama + " (" + id + ")");
  }
  
  return getInitialData();
}

/**
 * MENGHAPUS BARANG (DELETE)
 */
function deleteBarang(id, actor, role) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Barang");
  const data = sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).getValues();
  
  let rowIdx = -1;
  for (let i = 0; i < data.length; i++) {
    if (data[i][0] === id) {
      rowIdx = i + 2;
      break;
    }
  }
  
  if (rowIdx !== -1) {
    sheet.deleteRow(rowIdx);
    logActivityToSheet(ss, actor, role, "Hapus Barang", "Menghapus item barang " + id + " dari katalog BMN.");
  }
  
  return getInitialData();
}

/**
 * PROSES BARANG MASUK (INBOUND TRANSACTION)
 */
function processBarangMasuk(trans, actor, role) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const now = new Date();
  
  // 1. Generate Transaction ID (TRM-YYMMDD-XX)
  const dateStr = Utilities.formatDate(now, "GMT+7", "yyMMdd");
  const sheetMasuk = ss.getSheetByName("BarangMasuk");
  let nextNum = 1;
  const lastRow = sheetMasuk.getLastRow();
  if (lastRow > 1) {
    const lastId = sheetMasuk.getRange(lastRow, 1).getValue().toString();
    if (lastId.indexOf("TRM-" + dateStr) !== -1) {
      const lastNumStr = lastId.split("-")[2];
      nextNum = parseInt(lastNumStr) + 1;
    }
  }
  const transId = "TRM-" + dateStr + "-" + ("0" + nextNum).slice(-2);
  
  // 2. Tambah Baris Barang Masuk
  sheetMasuk.appendRow([
    transId,
    now,
    trans.barangId,
    trans.namaBarang,
    trans.jumlah,
    trans.supplier,
    trans.petugas,
    trans.fileDokumen,
    trans.catatan
  ]);
  
  // 3. Update Stok di Sheet Barang & Catat Riwayat
  adjustBarangStok(ss, trans.barangId, trans.jumlah, "Masuk", transId, trans.petugas, "Barang masuk dari " + trans.supplier);
  
  // 4. Catat Log Audit
  logActivityToSheet(ss, actor, role, "Transaksi Masuk", "Pencatatan barang masuk volume +" + trans.jumlah + " untuk " + trans.namaBarang + " (" + transId + ")");
  
  return getInitialData();
}

/**
 * PROSES BARANG KELUAR (OUTBOUND TRANSACTION) - MENUNGGU PERSETUJUAN
 */
function processBarangKeluar(trans, actor, role) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const now = new Date();
  
  // 1. Generate Transaction ID (TRK-YYMMDD-XX)
  const dateStr = Utilities.formatDate(now, "GMT+7", "yyMMdd");
  const sheetKeluar = ss.getSheetByName("BarangKeluar");
  let nextNum = 1;
  const lastRow = sheetKeluar.getLastRow();
  if (lastRow > 1) {
    const lastId = sheetKeluar.getRange(lastRow, 1).getValue().toString();
    if (lastId.indexOf("TRK-" + dateStr) !== -1) {
      const lastNumStr = lastId.split("-")[2];
      nextNum = parseInt(lastNumStr) + 1;
    }
  }
  const transId = "TRK-" + dateStr + "-" + ("0" + nextNum).slice(-2);
  
  // 2. Tambah Baris Barang Keluar dengan status "Pending"
  sheetKeluar.appendRow([
    transId,
    now,
    trans.barangId,
    trans.namaBarang,
    trans.jumlah,
    trans.unitId,
    trans.petugas,
    trans.keperluan,
    "Pending",
    trans.catatan
  ]);
  
  // 3. Catat Log Audit
  logActivityToSheet(ss, actor, role, "Transaksi Keluar", "Mengajukan pengeluaran barang volume -" + trans.jumlah + " untuk " + trans.namaBarang + " (" + transId + ")");
  
  return getInitialData();
}

/**
 * DISETUJUI / DITOLAK BARANG KELUAR (APPROVAL FLOW)
 */
function approveRejectTransaksi(id, status, actor, role) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheetKeluar = ss.getSheetByName("BarangKeluar");
  const data = sheetKeluar.getRange(2, 1, sheetKeluar.getLastRow() - 1, 9).getValues();
  
  let rowIdx = -1;
  let trans = {};
  for (let i = 0; i < data.length; i++) {
    if (data[i][0] === id) {
      rowIdx = i + 2;
      trans = {
        barangId: data[i][2],
        namaBarang: data[i][3],
        jumlah: data[i][4],
        unitId: data[i][5],
        petugas: data[i][6]
      };
      break;
    }
  }
  
  if (rowIdx !== -1) {
    sheetKeluar.getRange(rowIdx, 9).setValue(status);
    
    if (status === "Disetujui") {
      // Sifat disetujui: Kurangi Stok Barang & Catat Riwayat
      adjustBarangStok(ss, trans.barangId, -trans.jumlah, "Keluar", id, actor, "Barang didistribusikan ke " + trans.unitId);
    }
    
    logActivityToSheet(ss, actor, role, "Approval " + status, "Permohonan pengeluaran barang " + id + " berstatus: " + status);
  }
  
  return getInitialData();
}

/**
 * Helper: Menyesuaikan stok barang sisa & mencatat ke lembar Riwayat
 */
function adjustBarangStok(ss, barangId, volume, tipe, transId, petugas, keterangan) {
  const sheetBarang = ss.getSheetByName("Barang");
  const data = sheetBarang.getRange(2, 1, sheetBarang.getLastRow() - 1, 8).getValues();
  
  let rowIdx = -1;
  let stokSekarang = 0;
  let stokMin = 0;
  let namaBarang = "";
  
  for (let i = 0; i < data.length; i++) {
    if (data[i][0] === barangId) {
      rowIdx = i + 2;
      stokSekarang = data[i][7];
      stokMin = data[i][8];
      namaBarang = data[i][1];
      break;
    }
  }
  
  if (rowIdx !== -1) {
    const newStok = stokSekarang + volume;
    sheetBarang.getRange(rowIdx, 8).setValue(newStok);
    
    // Catat ke sheet Riwayat
    const sheetRiwayat = ss.getSheetByName("Riwayat");
    sheetRiwayat.appendRow([new Date(), tipe, transId, barangId, namaBarang, Math.abs(volume), petugas, keterangan]);
    
    // Periksa apakah stok menyentuh minimum untuk notifikasi
    checkStokAlert(ss, barangId, namaBarang, newStok, stokMin);
  }
}

/**
 * Memeriksa stok aman/rendah/kosong dan membuat baris Notifikasi jika kritis.
 */
function checkStokAlert(ss, id, nama, stok, min) {
  const sheetNotif = ss.getSheetByName("Notification");
  const now = new Date();
  
  if (stok === 0) {
    sheetNotif.appendRow([
      "NOT-" + Utilities.formatDate(now, "GMT+7", "yyMMddHHmmss"),
      "stok_habis",
      'Stok barang "' + nama + '" HABIS! Segera lakukan pengadaan.',
      now,
      false
    ]);
  } else if (stok < min) {
    sheetNotif.appendRow([
      "NOT-" + Utilities.formatDate(now, "GMT+7", "yyMMddHHmmss"),
      "stok_rendah",
      'Stok barang "' + nama + '" kritis sisa ' + stok + ' unit (Min: ' + min + ').',
      now,
      false
    ]);
  }
}

/**
 * Mengunggah file (faktur/dokumen) secara asinkronus ke folder Dokumen Transaksi di Google Drive.
 */
function uploadFileToDrive(base64Data, filename) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const settings = getSystemSettings(ss);
  const folderId = settings["FOLDER_DOKUMEN_ID"] || settings["FOLDER_REPORTS_ID"];
  
  if (!folderId) return "No_Folder_Configured.pdf";
  
  try {
    const folder = DriveApp.getFolderById(folderId);
    const contentType = base64Data.substring(base64Data.indexOf(":") + 1, base64Data.indexOf(";"));
    const bytes = Utilities.base64Decode(base64Data.split(",")[1]);
    const blob = Utilities.newBlob(bytes, contentType, filename);
    const file = folder.createFile(blob);
    return file.getUrl();
  } catch (error) {
    return filename;
  }
}

/**
 * Mencatat log aktivitas ke sheet ActivityLog.
 */
function logActivityToSheet(ss, actor, role, action, detail) {
  const sheet = ss.getSheetByName("ActivityLog");
  if (sheet) {
    sheet.appendRow([new Date(), actor, role, action, detail]);
  }
}

/**
 * REUSABLE HELPER FOR FINDING ROW BY ID
 */
function findRowIndexById(sheet, idColNum, targetId) {
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return -1;
  const values = sheet.getRange(2, idColNum, lastRow - 1, 1).getValues();
  for (let i = 0; i < values.length; i++) {
    if (values[i][0].toString() === targetId.toString()) {
      return i + 2;
    }
  }
  return -1;
}

/**
 * AUTO GENERATE NEXT ID FOR MASTER SHEET
 */
function getNextId(sheet, prefix) {
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return prefix + "001";
  const lastId = sheet.getRange(lastRow, 1).getValue().toString();
  const lastNum = parseInt(lastId.replace(prefix, "")) || 0;
  return prefix + ("00" + (lastNum + 1)).slice(-3);
}

/**
 * MENDAFTARKAN AKUN BARU (REGISTER)
 */
function registerAccount(newAcc) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Accounts");
  const now = new Date();
  
  sheet.appendRow([
    newAcc.username,
    newAcc.nama,
    newAcc.nip,
    newAcc.jabatan,
    newAcc.telepon,
    newAcc.password,
    newAcc.role || "Petugas BMN",
    "Pending",
    now
  ]);
  
  logActivityToSheet(ss, newAcc.nama, newAcc.role || "Petugas BMN", "Registrasi Akun", "Pendaftaran akun baru dengan status Pending.");
  return getInitialData();
}

/**
 * MENYETUJUI AKUN (APPROVE)
 */
function approveAccount(username, actor, role) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Accounts");
  const rowIdx = findRowIndexById(sheet, 1, username);
  
  if (rowIdx !== -1) {
    sheet.getRange(rowIdx, 8).setValue("Disetujui");
    logActivityToSheet(ss, actor, role, "Konfirmasi Akun", "Menyetujui pendaftaran akun pegawai: " + username);
  }
  
  return getInitialData();
}

/**
 * MENOLAK AKUN (REJECT)
 */
function rejectAccount(username, actor, role) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Accounts");
  const rowIdx = findRowIndexById(sheet, 1, username);
  
  if (rowIdx !== -1) {
    sheet.getRange(rowIdx, 8).setValue("Ditolak");
    logActivityToSheet(ss, actor, role, "Penolakan Akun", "Menolak pendaftaran akun pegawai: " + username);
  }
  
  return getInitialData();
}

/**
 * MENGHAPUS AKUN (DELETE)
 */
function deleteAccount(username, actor, role) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Accounts");
  const rowIdx = findRowIndexById(sheet, 1, username);
  
  if (rowIdx !== -1) {
    sheet.deleteRow(rowIdx);
    logActivityToSheet(ss, actor, role, "Hapus Akun", "Menghapus pendaftaran akun pegawai: " + username);
  }
  
  return getInitialData();
}

/**
 * MEMPERBARUI KATA SANDI AKUN (UPDATE PASSWORD)
 */
function updatePassword(username, newPassword, actor, role) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Accounts");
  const rowIdx = findRowIndexById(sheet, 1, username);
  
  if (rowIdx !== -1) {
    sheet.getRange(rowIdx, 6).setValue(newPassword);
    logActivityToSheet(ss, actor, role, "Ubah Sandi", "Mengubah kata sandi untuk pegawai: " + username);
  }
  
  return getInitialData();
}

/**
 * CRUD KATEGORI
 */
function addKategori(item, actor, role) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Kategori");
  const nextId = getNextId(sheet, "KAT-");
  sheet.appendRow([nextId, item.nama, item.deskripsi || ""]);
  logActivityToSheet(ss, actor, role, "Tambah Kategori", "Menambahkan kategori baru: " + item.nama + " (" + nextId + ")");
  return getInitialData();
}

function editKategori(id, item, actor, role) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Kategori");
  const rowIdx = findRowIndexById(sheet, 1, id);
  if (rowIdx !== -1) {
    sheet.getRange(rowIdx, 2).setValue(item.nama);
    sheet.getRange(rowIdx, 3).setValue(item.deskripsi || "");
    logActivityToSheet(ss, actor, role, "Edit Kategori", "Mengubah kategori: " + item.nama + " (" + id + ")");
  }
  return getInitialData();
}

function deleteKategori(id, actor, role) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Kategori");
  const rowIdx = findRowIndexById(sheet, 1, id);
  if (rowIdx !== -1) {
    sheet.deleteRow(rowIdx);
    logActivityToSheet(ss, actor, role, "Hapus Kategori", "Menghapus kategori ID: " + id);
  }
  return getInitialData();
}

/**
 * CRUD SUPPLIER
 */
function addSupplier(item, actor, role) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Supplier");
  const nextId = getNextId(sheet, "SUP-");
  sheet.appendRow([nextId, item.nama, item.kontak || "", item.telepon || "", item.alamat || ""]);
  logActivityToSheet(ss, actor, role, "Tambah Supplier", "Menambahkan supplier baru: " + item.nama + " (" + nextId + ")");
  return getInitialData();
}

function editSupplier(id, item, actor, role) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Supplier");
  const rowIdx = findRowIndexById(sheet, 1, id);
  if (rowIdx !== -1) {
    sheet.getRange(rowIdx, 2).setValue(item.nama);
    sheet.getRange(rowIdx, 3).setValue(item.kontak || "");
    sheet.getRange(rowIdx, 4).setValue(item.telepon || "");
    sheet.getRange(rowIdx, 5).setValue(item.alamat || "");
    logActivityToSheet(ss, actor, role, "Edit Supplier", "Mengubah supplier: " + item.nama + " (" + id + ")");
  }
  return getInitialData();
}

function deleteSupplier(id, actor, role) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Supplier");
  const rowIdx = findRowIndexById(sheet, 1, id);
  if (rowIdx !== -1) {
    sheet.deleteRow(rowIdx);
    logActivityToSheet(ss, actor, role, "Hapus Supplier", "Menghapus supplier ID: " + id);
  }
  return getInitialData();
}

/**
 * CRUD UNIT KERJA
 */
function addUnit(item, actor, role) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Unit");
  const nextId = getNextId(sheet, "UNT-");
  sheet.appendRow([nextId, item.nama, item.penanggungJawab || "", item.keterangan || ""]);
  logActivityToSheet(ss, actor, role, "Tambah Unit Kerja", "Menambahkan unit kerja baru: " + item.nama + " (" + nextId + ")");
  return getInitialData();
}

function editUnit(id, item, actor, role) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Unit");
  const rowIdx = findRowIndexById(sheet, 1, id);
  if (rowIdx !== -1) {
    sheet.getRange(rowIdx, 2).setValue(item.nama);
    sheet.getRange(rowIdx, 3).setValue(item.penanggungJawab || "");
    sheet.getRange(rowIdx, 4).setValue(item.keterangan || "");
    logActivityToSheet(ss, actor, role, "Edit Unit Kerja", "Mengubah unit kerja: " + item.nama + " (" + id + ")");
  }
  return getInitialData();
}

function deleteUnit(id, actor, role) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Unit");
  const rowIdx = findRowIndexById(sheet, 1, id);
  if (rowIdx !== -1) {
    sheet.deleteRow(rowIdx);
    logActivityToSheet(ss, actor, role, "Hapus Unit Kerja", "Menghapus unit kerja ID: " + id);
  }
  return getInitialData();
}

/**
 * CRUD SATUAN BARANG
 */
function addSatuan(item, actor, role) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Satuan");
  const nextId = getNextId(sheet, "SAT-");
  sheet.appendRow([nextId, item.nama, item.keterangan || ""]);
  logActivityToSheet(ss, actor, role, "Tambah Satuan", "Menambahkan satuan baru: " + item.nama + " (" + nextId + ")");
  return getInitialData();
}

function editSatuan(id, item, actor, role) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Satuan");
  const rowIdx = findRowIndexById(sheet, 1, id);
  if (rowIdx !== -1) {
    sheet.getRange(rowIdx, 2).setValue(item.nama);
    sheet.getRange(rowIdx, 3).setValue(item.keterangan || "");
    logActivityToSheet(ss, actor, role, "Edit Satuan", "Mengubah satuan: " + item.nama + " (" + id + ")");
  }
  return getInitialData();
}

function deleteSatuan(id, actor, role) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Satuan");
  const rowIdx = findRowIndexById(sheet, 1, id);
  if (rowIdx !== -1) {
    sheet.deleteRow(rowIdx);
    logActivityToSheet(ss, actor, role, "Hapus Satuan", "Menghapus satuan ID: " + id);
  }
  return getInitialData();
}

/**
 * CRUD PEGAWAI BMN
 */
function addPegawai(item, actor, role) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Pegawai");
  const nextId = getNextId(sheet, "PEG-");
  sheet.appendRow([nextId, item.nama, item.nip || "", item.jabatan || "", item.telepon || "", item.unitKerja || ""]);
  logActivityToSheet(ss, actor, role, "Tambah Pegawai", "Menambahkan pegawai BMN baru: " + item.nama + " (" + nextId + ")");
  return getInitialData();
}

function editPegawai(id, item, actor, role) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Pegawai");
  const rowIdx = findRowIndexById(sheet, 1, id);
  if (rowIdx !== -1) {
    sheet.getRange(rowIdx, 2).setValue(item.nama);
    sheet.getRange(rowIdx, 3).setValue(item.nip || "");
    sheet.getRange(rowIdx, 4).setValue(item.jabatan || "");
    sheet.getRange(rowIdx, 5).setValue(item.telepon || "");
    sheet.getRange(rowIdx, 6).setValue(item.unitKerja || "");
    logActivityToSheet(ss, actor, role, "Edit Pegawai", "Mengubah data pegawai: " + item.nama + " (" + id + ")");
  }
  return getInitialData();
}

function deletePegawai(id, actor, role) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Pegawai");
  const rowIdx = findRowIndexById(sheet, 1, id);
  if (rowIdx !== -1) {
    sheet.deleteRow(rowIdx);
    logActivityToSheet(ss, actor, role, "Hapus Pegawai", "Menghapus pegawai ID: " + id);
  }
  return getInitialData();
}

/**
 * SAVE SETTINGS
 */
function saveSettings(settingsList, actor, role) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Settings");
  if (!sheet) return getInitialData();
  
  const lastRow = sheet.getLastRow();
  const keysRange = lastRow > 1 ? sheet.getRange(2, 1, lastRow - 1, 1).getValues().map(r => r[0].toString()) : [];
  
  Object.keys(settingsList).forEach(key => {
    const val = settingsList[key];
    const rIdx = keysRange.indexOf(key);
    if (rIdx !== -1) {
      sheet.getRange(rIdx + 2, 2).setValue(val);
    } else {
      sheet.appendRow([key, val, "Custom User Setting"]);
    }
  });
  
  logActivityToSheet(ss, actor, role, "Simpan Pengaturan", "Memperbarui konfigurasi parameter sistem.");
  return getInitialData();
}

/**
 * RESET SYSTEM DATABASE
 */
function resetDatabase(actor, role) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheetsDef = {
    "Barang": ["Kode Barang", "Nama Barang", "Kategori", "Supplier", "Satuan", "Lokasi Rak", "QR Code", "Stok Sekarang", "Stok Min", "Stok Maks", "Deskripsi", "Image Drive URL", "Created At", "Updated At"],
    "Kategori": ["ID Kategori", "Nama Kategori", "Deskripsi"],
    "Supplier": ["ID Supplier", "Nama Supplier", "Kontak Person", "Telepon", "Alamat"],
    "Unit": ["ID Unit", "Nama Unit", "Penanggung Jawab", "Keterangan"],
    "Satuan": ["ID Satuan", "Nama Satuan", "Keterangan"],
    "Pegawai": ["ID Pegawai", "Nama Pegawai", "NIP", "Jabatan", "Telepon", "Unit Kerja"],
    "BarangMasuk": ["ID Transaksi", "Tanggal", "Kode Barang", "Nama Barang", "Jumlah", "Supplier", "Petugas", "File Dokumen URL", "Catatan"],
    "BarangKeluar": ["ID Transaksi", "Tanggal", "Kode Barang", "Nama Barang", "Jumlah", "Unit Penerima", "Petugas", "Keperluan", "Status Persetujuan", "Catatan"],
    "Riwayat": ["Tanggal", "Jenis Mutasi", "ID Transaksi", "Kode Barang", "Nama Barang", "Jumlah", "Petugas", "Keterangan"],
    "ActivityLog": ["Stempel Waktu", "Aktor", "Role", "Aksi/Operasi", "Detail Rincian"],
    "Notification": ["ID Notif", "Tipe", "Pesan", "Tanggal", "Status Dibaca"],
    "Accounts": ["Username", "Nama", "NIP", "Jabatan", "Telepon", "Password", "Role", "Status", "Registered At"]
  };
  
  Object.keys(sheetsDef).forEach(sheetName => {
    const sheet = ss.getSheetByName(sheetName);
    if (sheet) {
      const lastRow = sheet.getLastRow();
      if (lastRow > 1) {
        sheet.deleteRows(2, lastRow - 1);
      }
      
      // Seed default initial data
      const settingsSheet = ss.getSheetByName("Settings");
      let qrId = "", imgId = "", repId = "", bkpId = "";
      if (settingsSheet) {
        const lastRowSettings = settingsSheet.getLastRow();
        if (lastRowSettings > 1) {
          const sData = settingsSheet.getRange(2, 1, lastRowSettings - 1, 2).getValues();
          sData.forEach(r => {
            if (r[0] === "FOLDER_QR_ID") qrId = r[1];
            if (r[0] === "FOLDER_IMAGES_ID") imgId = r[1];
            if (r[0] === "FOLDER_REPORTS_ID") repId = r[1];
            if (r[0] === "FOLDER_BACKUP_ID") bkpId = r[1];
          });
        }
      }
      
      const driveSettings = { QRCode: qrId, Images: imgId, Reports: repId, Backup: bkpId };
      seedInitialData(sheetName, sheet, driveSettings);
    }
  });
  
  logActivityToSheet(ss, actor, role, "Reset Database", "Melakukan pembersihan total dan instalasi ulang basis data BMN.");
  return getInitialData();
}

/**
 * SIMULATE BACKUP
 */
function simulateBackup(actor, role) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const settings = getSystemSettings(ss);
  const backupFolderId = settings["FOLDER_BACKUP_ID"];
  
  if (!backupFolderId) {
    throw new Error("Folder backup belum dikonfigurasi di Settings.");
  }
  
  try {
    const folder = DriveApp.getFolderById(backupFolderId);
    const fileName = "SILAP_BMN_Backup_" + Utilities.formatDate(new Date(), "GMT+7", "yyyyMMdd_HHmmss");
    const file = DriveApp.getFileById(ss.getId()).makeCopy(fileName, folder);
    
    logActivityToSheet(ss, actor, role, "Backup Database", "Berhasil membuat file salinan cadangan di Drive: " + file.getUrl());
    return { success: true, url: file.getUrl() };
  } catch (error) {
    throw new Error("Gagal melakukan backup Drive: " + error.toString());
  }
}
`;
