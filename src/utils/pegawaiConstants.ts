/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface JabatanPreset {
  jabatan: string;
  tugasDefault: string;
  isCustomTugas?: boolean;
  deskripsiSingkat?: string;
  roleType: 'pj' | 'anggota' | 'magang' | 'custom';
}

export const JABATAN_PRESETS: JabatanPreset[] = [
  {
    jabatan: 'Pengolah Data dan Informasi',
    tugasDefault: 'PJ BMN',
    isCustomTugas: false,
    deskripsiSingkat: 'Penanggung Jawab Pengelolaan & Inventarisasi BMN',
    roleType: 'pj'
  },
  {
    jabatan: 'Penata Laksana Barang Terampil',
    tugasDefault: 'Anggota',
    isCustomTugas: false,
    deskripsiSingkat: 'Anggota Tim Penatausahaan & Pengelolaan Barang',
    roleType: 'anggota'
  },
  {
    jabatan: 'Operator Layanan Operasional',
    tugasDefault: 'Anggota',
    isCustomTugas: false,
    deskripsiSingkat: 'Anggota Tim Pengoperasian Layanan & Logistik BMN',
    roleType: 'anggota'
  },
  {
    jabatan: 'Pengelola Umum Operasional',
    tugasDefault: 'Anggota',
    isCustomTugas: false,
    deskripsiSingkat: 'Anggota Tim Pengelolaan Operasional Umum BMN',
    roleType: 'anggota'
  },
  {
    jabatan: 'Magang/KP',
    tugasDefault: 'Petugas BMN (Magang/KP)',
    isCustomTugas: true,
    deskripsiSingkat: 'Praktik Kerja Lapangan / Magang (Tugas & Tanggung Jawab Bebas Diisi Sendiri)',
    roleType: 'magang'
  }
];

export const TUGAS_PRESET_OPTIONS = [
  'PJ BMN',
  'Anggota',
  'Koordinator Pengelolaan BMN',
  'Verifikator Administrasi BMN',
  'Petugas Pencatatan & Gudang',
  'Petugas Distribusi & Mutasi',
  'Lainnya (Tulis Sendiri)'
];

/**
 * Mendapatkan tugas dan tanggung jawab default berdasarkan nama jabatan
 */
export function getDefaultTugasByJabatan(jabatan: string): string {
  const found = JABATAN_PRESETS.find(p => p.jabatan.trim().toLowerCase() === jabatan.trim().toLowerCase());
  if (found) {
    return found.tugasDefault;
  }
  if (jabatan.toLowerCase().includes('pengolah data')) return 'PJ BMN';
  if (jabatan.toLowerCase().includes('magang') || jabatan.toLowerCase().includes('kp')) {
    return 'Petugas BMN (Magang/KP)';
  }
  return 'Anggota';
}

/**
 * Cek apakah jabatan memerlukan pengisian tugas manual
 */
export function isCustomTugasJabatan(jabatan: string): boolean {
  const found = JABATAN_PRESETS.find(p => p.jabatan.trim().toLowerCase() === jabatan.trim().toLowerCase());
  if (found) {
    return !!found.isCustomTugas;
  }
  return jabatan.toLowerCase().includes('magang') || jabatan.toLowerCase().includes('kp') || jabatan.toLowerCase().includes('lainnya');
}

/**
 * Helper styling badge tugas dan tanggung jawab
 */
export function getTugasBadgeClass(tugas?: string): { badge: string; text: string; dot: string } {
  const t = (tugas || '').toLowerCase();
  if (t.includes('pj') || t.includes('penanggung jawab')) {
    return {
      badge: 'bg-amber-50 text-amber-800 border-amber-200/80 shadow-2xs font-extrabold',
      text: 'text-amber-900',
      dot: 'bg-amber-500'
    };
  }
  if (t.includes('magang') || t.includes('kp')) {
    return {
      badge: 'bg-indigo-50 text-indigo-800 border-indigo-200/80 shadow-2xs font-bold',
      text: 'text-indigo-900',
      dot: 'bg-indigo-500'
    };
  }
  if (t.includes('anggota')) {
    return {
      badge: 'bg-blue-50 text-blue-800 border-blue-200/80 shadow-2xs font-bold',
      text: 'text-blue-900',
      dot: 'bg-blue-500'
    };
  }
  return {
    badge: 'bg-slate-100 text-slate-800 border-slate-200 shadow-2xs font-medium',
    text: 'text-slate-900',
    dot: 'bg-slate-500'
  };
}
