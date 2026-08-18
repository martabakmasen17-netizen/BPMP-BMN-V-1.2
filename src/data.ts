/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Kategori, Supplier, Unit, Satuan, Barang, BarangMasuk, BarangKeluar, Riwayat, AuditLog, SystemNotification, Settings, Pegawai, DriveFileItem } from './types';
import { STANDARD_SATUAN_PRESETS } from './utils/unitUtils';

export const INITIAL_KATEGORI: Kategori[] = [];

export const INITIAL_SUPPLIER: Supplier[] = [];

export const INITIAL_UNIT: Unit[] = [];

export const INITIAL_SATUAN: Satuan[] = [];

export const INITIAL_BARANG: Barang[] = [];

export const INITIAL_BARANG_MASUK: BarangMasuk[] = [];

export const INITIAL_BARANG_KELUAR: BarangKeluar[] = [];

export const INITIAL_RIWAYAT: Riwayat[] = [];

export const INITIAL_AUDIT_LOG: AuditLog[] = [];

export const INITIAL_NOTIFICATION: SystemNotification[] = [];

export const DEFAULT_SETTINGS: Settings = {
  namaInstitusi: 'BALAI PENJAMINAN MUTU PENDIDIKAN PROVINSI SUMATERA SELATAN',
  subHeaderKop: 'KEMENTERIAN PENDIDIKAN, KEBUDAYAAN, RISET, DAN TEKNOLOGI',
  alamatKop: 'Jl. Jenderal Sudirman Km. 6.5 Palembang Telp. (0711) 356789 Fax. 356790',
  kontakKop: 'Email: bpmp.sumsel@kemdikbud.go.id | Laman: bpmp-sumsel.kemdikbud.go.id',
  namaPenanggungJawab: 'Ilham Muharrama',
  jabatanPenanggungJawab: 'Magang/KP / Petugas BMN',
  nipPenanggungJawab: '-',
  logoUrl: '/logo.png',
  prefiksKodeBarang: 'BRG-',
  defaultStokMin: 5,
  autoSyncIntervalSec: 2,
  folderQrId: '1dr_qr_code_bpmp_sumsel_folder',
  folderImagesId: '1dr_images_bpmp_sumsel_folder',
  folderReportsId: '1dr_reports_bpmp_sumsel_folder',
  folderBackupId: '1dr_backup_bpmp_sumsel_folder',
  spreadsheetId: '1ss_bpmp_sumsel_inventory_database',
  bilaStokRendahNotif: true,
  bilaStokHabisNotif: true,
  konfirmasiOtomatisKeluar: true
};

export const INITIAL_PEGAWAI: Pegawai[] = [];

export const INITIAL_DRIVE_FILES: DriveFileItem[] = [];
