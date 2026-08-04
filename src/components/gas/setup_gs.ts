/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const SETUP_GS_CONTENT = `/**
 * ==============================================================================
 * SETUP SCRIPT: BPMP SUMATERA SELATAN INVENTORY MANAGEMENT SYSTEM
 * ==============================================================================
 * Penulis: BPMP Sumatera Selatan - Bidang BMN
 * Deskripsi: Skrip inisialisasi basis data dan struktur folder Google Drive.
 *            Skrip ini hanya perlu dijalankan SATU KALI oleh Administrator.
 * ==============================================================================
 */

/**
 * Inisialisasi basis data Spreadsheet dan folder penyimpanan Google Drive.
 */
function initializeSystem() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let ui;
  try {
    ui = SpreadsheetApp.getUi();
  } catch (e) {
    ui = null;
  }
  
  try {
    // 1. Inisialisasi Google Drive Folders
    const driveSettings = setupDriveFolders();
    
    // 2. Buat seluruh lembar kerja (Sheets) jika belum ada
    createSheetsIfNotExist(ss, driveSettings);
    
    // 3. Log Audit Inisialisasi Berhasil
    logActivityToSheet(ss, "SYSTEM", "SETUP", "Inisialisasi sistem basis data dan folder Google Drive berhasil dijalankan.");
    
    const successMsg = "Sistem Informasi Monitoring Persediaan Barang berhasil diinisialisasi.\\n\\nID Spreadsheet: " + ss.getId() + "\\nFolder Utama Drive: DATABASE BMN\\n\\nPENTING JIKA DEPLOY VIA VERCEL:\\nBuka Google Drive Anda, cari folder 'DATABASE BMN', lalu klik kanan -> Bagikan (Share) -> masukkan email Service Account Google Cloud Anda sebagai Editor.";
    if (ui) {
      ui.alert("Sukses!", successMsg, ui.ButtonSet.OK);
    } else {
      Logger.log("Sukses: " + successMsg);
    }
  } catch (error) {
    const errorMsg = "Terjadi kesalahan: " + error.toString();
    if (ui) {
      ui.alert("Gagal Inisialisasi", errorMsg, ui.ButtonSet.OK);
    } else {
      Logger.log("Gagal Inisialisasi: " + errorMsg);
    }
  }
}

/**
 * Membuat seluruh folder Google Drive yang diperlukan dan mengembalikan ID Folder.
 */
function setupDriveFolders() {
  const folderName = "DATABASE BMN";
  let mainFolder;
  
  // Cari folder utama agar tidak duplikat jika dirun ulang
  const folders = DriveApp.getFoldersByName(folderName);
  if (folders.hasNext()) {
    mainFolder = folders.next();
  } else {
    mainFolder = DriveApp.createFolder(folderName);
  }
  
  const subFolders = ["QR Codes", "Images", "Laporan", "Backup Data", "Dokumen Transaksi"];
  const folderIds = {
    main: mainFolder.getId()
  };
  
  subFolders.forEach(sub => {
    let subFolder;
    const existing = mainFolder.getFoldersByName(sub);
    if (existing.hasNext()) {
      subFolder = existing.next();
    } else {
      subFolder = mainFolder.createFolder(sub);
    }
    // Hapus spasi untuk penamaan key object
    folderIds[sub.replace(/ /g, "")] = subFolder.getId();
  });
  
  return folderIds;
}

/**
 * Membuat lembar kerja (Sheets) dan format header.
 */
function createSheetsIfNotExist(ss, driveSettings) {
  // Definisi sheets, header kolom, dan konfigurasi lebar kolom
  const sheetsDef = {
    "Dashboard": ["Kunci", "Nilai"],
    "Barang": ["Kode Barang", "Nama Barang", "Kategori", "Supplier", "Satuan", "Lokasi Rak", "QR Code", "Stok Sekarang", "Stok Min", "Stok Maks", "Deskripsi", "Image Drive URL", "Created At", "Updated At"],
    "Kategori": ["ID Kategori", "Nama Kategori", "Deskripsi"],
    "Supplier": ["ID Supplier", "Nama Supplier", "Kontak Person", "Telepon", "Alamat"],
    "Unit": ["ID Unit", "Nama Unit", "Penanggung Jawab", "Keterangan"],
    "Satuan": ["ID Satuan", "Nama Satuan", "Keterangan"],
    "BarangMasuk": ["ID Transaksi", "Tanggal", "Kode Barang", "Nama Barang", "Jumlah", "Supplier", "Petugas", "File Dokumen URL", "Catatan"],
    "BarangKeluar": ["ID Transaksi", "Tanggal", "Kode Barang", "Nama Barang", "Jumlah", "Unit Penerima", "Petugas", "Keperluan", "Status Persetujuan", "Catatan"],
    "Riwayat": ["Tanggal", "Jenis Mutasi", "ID Transaksi", "Kode Barang", "Nama Barang", "Jumlah", "Petugas", "Keterangan"],
    "ActivityLog": ["Stempel Waktu", "Aktor", "Role", "Aksi/Operasi", "Detail Rincian"],
    "Notification": ["ID Notif", "Tipe", "Pesan", "Tanggal", "Status Dibaca"],
    "Accounts": ["Username", "Nama", "NIP", "Jabatan", "Telepon", "Password", "Role", "Status", "Registered At"],
    "Settings": ["Kunci", "Nilai", "Deskripsi"]
  };
  
  Object.keys(sheetsDef).forEach(sheetName => {
    let sheet = ss.getSheetByName(sheetName);
    const isNew = !sheet;
    
    if (isNew) {
      sheet = ss.insertSheet(sheetName);
    }
    
    // Selalu setel atau perbarui header kolom
    const headers = sheetsDef[sheetName];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    
    // Format Header: Tebal, Background Biru, Text Putih, Tengah
    const headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setFontWeight("bold")
               .setBackground("#2563EB")
               .setFontColor("#FFFFFF")
               .setHorizontalAlignment("center");
               
    // Bekukan (Freeze) baris pertama
    sheet.setFrozenRows(1);
    
    // Masukkan data awal (Seeding) jika sheet baru
    if (isNew) {
      seedInitialData(sheetName, sheet, driveSettings);
    }
    
    // Tambahkan filter otomatis
    try {
      sheet.getFilter() || sheet.getRange(1, 1, sheet.getLastRow(), headers.length).createFilter();
    } catch(e) {}
  });
}

/**
 * Memasukkan data awal (seed) ke masing-masing sheet.
 */
function seedInitialData(name, sheet, driveSettings) {
  const now = new Date().toISOString();
  
  if (name === "Kategori") {
    sheet.appendRow(["KAT-001", "Alat Tulis Kantor (ATK)", "Kebutuhan alat tulis dan kertas kantor sehari-hari"]);
    sheet.appendRow(["KAT-002", "Peralatan Komputer & IT", "Hardware, peripheral, dan jaringan internet"]);
    sheet.appendRow(["KAT-003", "Sarana Sosialisasi & Publikasi", "Spanduk, brosur, banner, merchandise"]);
  }
  else if (name === "Supplier") {
    sheet.appendRow(["SUP-001", "CV Sriwijaya Abadi Jaya", "Bpk. Ahmad", "0812-7345-6789", "Jl. Jenderal Sudirman No. 120, Palembang"]);
    sheet.appendRow(["SUP-002", "PT Tekno Mandiri Sumsel", "Ibu Rina", "0813-8899-0011", "Komplek Ruko PS, Palembang"]);
  }
  else if (name === "Unit") {
    sheet.appendRow(["UNT-001", "Subbagian Umum", "Bpk. Wahyudi, S.Si", "Urusan umum dan perlengkapan"]);
    sheet.appendRow(["UNT-002", "FPMP", "Ibu Dr. Hartati, M.Pd.", "Fasilitasi mutu pendidikan"]);
  }
  else if (name === "Satuan") {
    sheet.appendRow(["SAT-001", "Rim", "Kertas"]);
    sheet.appendRow(["SAT-002", "Pcs", "Pieces / Biji"]);
    sheet.appendRow(["SAT-003", "Box", "Kotak"]);
  }
  else if (name === "Settings") {
    sheet.appendRow(["NAMA_INSTITUSI", "BPMP Provinsi Sumatera Selatan", "Nama Lembaga Resmi"]);
    sheet.appendRow(["LOGO_URL", "/logo.png", "Logo Kop Surat"]);
    sheet.appendRow(["FOLDER_QR_ID", driveSettings.QRCodes, "Folder ID QR Codes"]);
    sheet.appendRow(["FOLDER_IMAGES_ID", driveSettings.Images, "Folder ID Images"]);
    sheet.appendRow(["FOLDER_LAPORAN_ID", driveSettings.Laporan, "Folder ID Laporan"]);
    sheet.appendRow(["FOLDER_BACKUP_ID", driveSettings.BackupData, "Folder ID Backup"]);
    sheet.appendRow(["FOLDER_DOKUMEN_ID", driveSettings.DokumenTransaksi, "Folder ID Dokumen (Faktur/PDF)"]);
  }
  else if (name === "Barang") {
    // Empty initial barang for production
  }
  else if (name === "Accounts") {
    sheet.appendRow(["admin", "Ilham Muharrama", "-", "Magang/KP", "08981741680", "admin", "Administrator", "Disetujui", now]);
    sheet.appendRow(["petugas", "Roni Setiawan", "198804152014021003", "Petugas BMN", "081271234567", "bmn", "Petugas BMN", "Disetujui", now]);
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
`;
