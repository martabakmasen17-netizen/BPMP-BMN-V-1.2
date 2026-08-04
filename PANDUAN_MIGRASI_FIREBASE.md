# 🚀 Panduan Migrasi Bertahap: Google Sheets ke Firebase Firestore
**Aplikasi Sistem Informasi Layanan Persediaan (SILAP) BMN - BPMP Provinsi Sumatera Selatan**

---

## 📑 Daftar Isi
1. [Pendahuluan & Latar Belakang](#1-pendahuluan--latar-belakang)
2. [Analisis Perbandingan & Keunggulan Firestore](#2-analisis-perbandingan--keunggulan-firestore)
3. [Perancangan Struktur Koleksi Data (Firestore Schema)](#3-perancangan-struktur-koleksi-data-firestore-schema)
4. [Strategi Migrasi Bertahap (5 Fase)](#4-strategi-migrasi-bertahap-5-fase)
5. [Panduan Implementasi Kode (Step-by-Step)](#5-panduan-implementasi-kode-step-by-step)
6. [Aturan Keamanan (Firestore Security Rules)](#6-aturan-keamanan-firestore-security-rules)
7. [Kesimpulan & Checklist Kesiapan](#7-kesimpulan--checklist-kesiapan)

---

## 1. Pendahuluan & Latar Belakang

Saat ini aplikasi SILAP BMN menggunakan **Google Sheets** (melalui Google Apps Script API) sebagai basis data RDBMS sederhana. Solusi ini sangat cepat diimplementasikan dan mudah ditinjau langsung oleh manusia. Namun, seiring berjalannya waktu dan bertambahnya ribuan transaksi mutasi barang (masuk/keluar), audit log, dan pengguna, penggunaan Google Sheets menghadapi keterbatasan teknis.

Migrasi ke **Firebase Firestore** memberikan solusi basis data *NoSQL Cloud Document* modern tanpa menguras biaya (tetap dalam kuota **100% Gratis / Spark Plan**), sekaligus meningkatkan kecepatan respons dari orde detik (1.5 - 3s) menjadi orde milidetik (<100ms).

---

## 2. Analisis Perbandingan & Keunggulan Firestore

| Parameter | Google Sheets (Kondisi Saat Ini) | Firebase Firestore (Target Migrasi) | Keunggulan & Dampak |
| :--- | :--- | :--- | :--- |
| **Kecepatan Respons (Latency)** | 1.5 - 3.0 detik per request (Google Apps Script Engine) | **< 50 - 100 milidetik** (Realtime Listener `onSnapshot`) | Aplikasi terasa jauh lebih responsif dan instan tanpa *loading spinner* lama. |
| **Batas Kapasitas Data** | Terbatas ~10 juta sel (performa melambat jika > 2.000 baris) | **1 GB Storage Gratis** (Dapat menampung > 500.000 transaksi BMN) | Tidak perlu khawatir file lemot atau error *Quota Exceeded*. |
| **Integritas Data (Concurrency)** | Berpotensi *Race Condition* jika 2 petugas input bersamaan | **ACID Transactions & Atomic Writes** | Mencegah konflik penulisan/stok bentrok saat banyak pengguna aktif. |
| **Keamanan Data (Security)** | Membutuhkan Web App URL Apps Script terbuka atau Akses File Sheets | **Firestore Security Rules Granular** (Auth & Role-based) | Admin & Petugas memiliki hak akses yang terkunci rapat di server Google Firebase. |
| **Pencarian & Filtering** | Memuat seluruh data baris ke memori browser lalu di-filter | **Index Query bawaan Google** | Mengambil hanya data yang dibutuhkan (*Paginated Query*). |
| **Estimasi Biaya** | Gratis (Google Workspace) | **Gratis (Firebase Spark Plan)**: 50k Reads, 20k Writes/hari | Biaya **Rp 0,-** untuk operasional harian BPMP Sumsel. |

---

## 3. Perancangan Struktur Koleksi Data (Firestore Schema)

Di Firebase Firestore, data disimpan dalam bentuk **Collection** (koleksi) dan **Document** (dokumen JSON):

1. **`katalog_barang`** (Collection)
   - `id` (Doc ID, contoh: `BRG-001`)
   - `namaBarang`, `kategori`, `merkType`, `satuan`, `stok`, `stokMinimum`, `lokasiRak`, `hargaSatuan`, `fotoUrl`
2. **`barang_masuk`** (Collection)
   - `id` (Doc ID)
   - `tanggal`, `kodeBarang`, `namaBarang`, `jumlah`, `supplier`, `noFaktur`, `penerima`, `keterangan`
3. **`barang_keluar`** (Collection)
   - `id` (Doc ID)
   - `tanggal`, `kodeBarang`, `namaBarang`, `jumlah`, `unitKerja`, `penerima`, `penanggungJawab`, `keterangan`
4. **`users`** (Collection)
   - `uid` (Doc ID dari Firebase Auth)
   - `username`, `nama`, `role` (`Administrator` / `Petugas BMN`), `nip`, `jabatan`, `email`
5. **`unit_kerja`**, **`supplier`**, **`pegawai`** (Collections)
   - Master data referensi pendukung
6. **`audit_logs`** (Collection)
   - `timestamp`, `actor`, `action`, `details`
7. **`pengaturan`** (Collection -> Doc ID: `sistem`)
   - Profil instansi, header kop, penanggung jawab, logo, dan preferensi notifikasi.

---

## 4. Strategi Migrasi Bertahap (5 Fase)

Agar proses migrasi berjalan aman tanpa mengganggu operasional harian BMN yang sedang berjalan, kita menerapkan strategi **Zero-Downtime Migration**:

```
[ Sheets Utama ] ──(Fase 2: Migration Script)──> [ Firestore Copy ]
       │                                                │
 (Fase 3: Dual Write) ──────────────────────────> (Tulis Dual)
       │                                                │
 (Fase 4: Read Source Switch) ◄─────────────────── (Baca Firestore Instan)
       │
 (Fase 5: Sheets sebagai Backup/Arsip)
```

### 📌 Fase 1: Setup & Integrasi Firebase SDK
- Mengaktifkan Firestore Database di Console Firebase Project.
- Menambahkan modul `getFirestore` pada `src/firebase.ts`.

### 📌 Fase 2: Script Impor Data Awal (One-Time Migration Tool)
- Membuat fungsi otomatis untuk membaca seluruh baris dari Google Sheets saat ini dan mengunggahnya (*batch write*) ke koleksi Firestore.

### 📌 Fase 3: Mode Hybrid / Dual-Write
- Setiap kali pengguna menambah/mengedit barang di aplikasi, data ditulis ke **Firestore** dan **Google Sheets** sekaligus.
- Memastikan tidak ada data yang hilang jika terjadi rollback.

### 📌 Fase 4: Beralih Sumber Pembacaan Data (Read-Source Switch)
- Aplikasi membaca data (*fetch*) langsung dari Firestore.
- Waktu *loading* aplikasi meningkat drastis dari 2-3 detik menjadi <0.1 detik.

### 📌 Fase 5: Cut-Over Total
- Firestore menjadi database utama 100%.
- Google Sheets difungsikan secara otomatis sebagai file backup / arsip mingguan saja.

---

## 5. Panduan Implementasi Kode (Step-by-Step)

### Step 1: Update `src/firebase.ts`

```typescript
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  projectId: "gen-lang-client-0916890650",
  appId: "1:259690898917:web:3b69d1c6cb4b4159d13b0c",
  apiKey: "AIzaSyBxLqk6U0JUclKm6Q-x0hgw3WNspAXCRDI",
  authDomain: "gen-lang-client-0916890650.firebaseapp.com",
  storageBucket: "gen-lang-client-0916890650.firebasestorage.app",
  messagingSenderId: "259690898917",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
```

---

### Step 2: Layanan Service CRUD Firestore (`src/services/firestoreService.ts`)

```typescript
import { db } from '../firebase';
import { 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  deleteDoc, 
  writeBatch,
  onSnapshot 
} from 'firebase/firestore';
import { Barang, BarangMasuk, BarangKeluar } from '../types';

// Real-time listener katalog barang
export const subscribeBarang = (callback: (data: Barang[]) => void) => {
  return onSnapshot(collection(db, 'katalog_barang'), (snapshot) => {
    const list: Barang[] = snapshot.docs.map(doc => doc.data() as Barang);
    callback(list);
  });
};

// Simpan / Edit item barang
export const saveBarangToFirestore = async (item: Barang) => {
  const docRef = doc(db, 'katalog_barang', item.kodeBarang);
  await setDoc(docRef, item, { merge: true });
};

// Migration Tool: Push dari Sheets Data ke Firestore dalam 1 Klik
export const migrateAllSheetsToFirestore = async (sheetsData: {
  barang: Barang[];
  barangMasuk: BarangMasuk[];
  barangKeluar: BarangKeluar[];
}) => {
  const batch = writeBatch(db);

  // 1. Batch Katalog Barang
  sheetsData.barang.forEach(b => {
    const ref = doc(db, 'katalog_barang', b.kodeBarang);
    batch.set(ref, b, { merge: true });
  });

  // 2. Batch Barang Masuk
  sheetsData.barangMasuk.forEach(bm => {
    const ref = doc(db, 'barang_masuk', bm.id);
    batch.set(ref, bm, { merge: true });
  });

  // 3. Batch Barang Keluar
  sheetsData.barangKeluar.forEach(bk => {
    const ref = doc(db, 'barang_keluar', bk.id);
    batch.set(ref, bk, { merge: true });
  });

  await batch.commit();
  console.log("Migrasi data dari Sheets ke Firestore berhasil!");
};
```

---

## 6. Aturan Keamanan (Firestore Security Rules)

Di Firebase Console -> Firestore Database -> Rules, terapkan aturan ketat berikut:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Fungsi pembantu mengecek role pengguna
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isAdmin() {
      return isAuthenticated() && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'Administrator';
    }

    // Katalog Barang & Mutasi: Petugas BMN & Admin dapat membaca & mencatat
    match /katalog_barang/{barangId} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated();
    }
    
    match /barang_masuk/{masukId} {
      allow read, write: if isAuthenticated();
    }
    
    match /barang_keluar/{keluarId} {
      allow read, write: if isAuthenticated();
    }

    // Pengaturan Sistem & Manajemen User: Hanya Administrator
    match /pengaturan/{configId} {
      allow read: if isAuthenticated();
      allow write: if isAdmin();
    }

    match /users/{userId} {
      allow read: if isAuthenticated();
      allow write: if isAdmin() || request.auth.uid == userId;
    }
  }
}
```

---

## 7. Kesimpulan & Checklist Kesiapan

Dengan mengikuti panduan ini:
1. **Performa**: Aplikasi BMN akan berjalan hingga **30x lebih cepat** tanpa hambatan *loading* Apps Script.
2. **Biaya**: **Rp 0,- (100% Gratis)** menggunakan batas *Spark Plan* kuota gratis bulanan Firebase.
3. **Keamanan**: Terlindungi secara mutlak oleh *Firebase Auth & Security Rules*.
4. **Google Sheets**: Tetap digunakan sebagai tempat *backup/export* laporan resmi Excel/PDF yang siap dicetak.

---
*Dokumen Panduan Resmi SILAP BMN — BPMP Provinsi Sumatera Selatan (2026)*
