/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Satuan, TipeSatuan, Barang } from '../types';

export interface SatuanPreset {
  nama: string;
  keterangan: string;
  tipe: TipeSatuan;
  faktorKonversi: number;
  satuanDasar: string;
  rekomendasiStokMin: number;
  rekomendasiStokMaks: number;
  aliases: string[];
}

/**
 * Standard Indonesian Government / BMN Inventory Unit Presets & Conversion Rules
 */
export const STANDARD_SATUAN_PRESETS: SatuanPreset[] = [
  {
    nama: 'Buah',
    keterangan: 'Satuan untuk barang yang dihitung per item atau biji fisik tunggal',
    tipe: 'tunggal',
    faktorKonversi: 1,
    satuanDasar: 'Buah',
    rekomendasiStokMin: 10,
    rekomendasiStokMaks: 100,
    aliases: ['buah', 'bh', 'pcs', 'piece', 'item', 'biji', 'unit']
  },
  {
    nama: 'Lusin',
    keterangan: 'Satuan kemasan grosir yang terdiri dari 12 buah item',
    tipe: 'kemasan',
    faktorKonversi: 12,
    satuanDasar: 'Buah',
    rekomendasiStokMin: 1,
    rekomendasiStokMaks: 20,
    aliases: ['lusin', 'lsn', 'dozen', 'dz', 'doz']
  },
  {
    nama: 'Rim',
    keterangan: 'Satuan kertas cetak / HVS grosir yang terdiri dari 500 lembar',
    tipe: 'lembaran',
    faktorKonversi: 500,
    satuanDasar: 'Lembar',
    rekomendasiStokMin: 2,
    rekomendasiStokMaks: 50,
    aliases: ['rim', 'ream', 'rm']
  },
  {
    nama: 'Kotak',
    keterangan: 'Satuan untuk barang yang dikemas per kotak (klip, isi staples, dll)',
    tipe: 'kemasan',
    faktorKonversi: 10,
    satuanDasar: 'Buah',
    rekomendasiStokMin: 2,
    rekomendasiStokMaks: 50,
    aliases: ['kotak', 'ktk', 'box kecil']
  },
  {
    nama: 'Box',
    keterangan: 'Satuan untuk barang yang dikemas dalam kardus / box besar',
    tipe: 'kemasan',
    faktorKonversi: 20,
    satuanDasar: 'Buah',
    rekomendasiStokMin: 2,
    rekomendasiStokMaks: 40,
    aliases: ['box', 'dus', 'karton', 'koli']
  },
  {
    nama: 'Pak',
    keterangan: 'Satuan untuk barang yang dikemas per pak (amplop, baterai, sticky note)',
    tipe: 'kemasan',
    faktorKonversi: 10,
    satuanDasar: 'Buah',
    rekomendasiStokMin: 2,
    rekomendasiStokMaks: 50,
    aliases: ['pak', 'pack', 'pck', 'bungkus kecil']
  },
  {
    nama: 'Unit',
    keterangan: 'Satuan untuk peralatan, mesin, atau perangkat elektronik BMN',
    tipe: 'tunggal',
    faktorKonversi: 1,
    satuanDasar: 'Unit',
    rekomendasiStokMin: 1,
    rekomendasiStokMaks: 10,
    aliases: ['unit', 'unt', 'perangkat', 'mesin']
  },
  {
    nama: 'Set',
    keterangan: 'Satuan untuk barang yang terdiri dari beberapa komponen terpadu',
    tipe: 'kemasan',
    faktorKonversi: 1,
    satuanDasar: 'Set',
    rekomendasiStokMin: 2,
    rekomendasiStokMaks: 20,
    aliases: ['set', 'paket', 'kit']
  },
  {
    nama: 'Lembar',
    keterangan: 'Satuan untuk barang berbentuk lembaran lepas (karton, mika, sertifikat)',
    tipe: 'lembaran',
    faktorKonversi: 1,
    satuanDasar: 'Lembar',
    rekomendasiStokMin: 20,
    rekomendasiStokMaks: 500,
    aliases: ['lembar', 'lbr', 'sheet', 'sheets']
  },
  {
    nama: 'Rol',
    keterangan: 'Satuan untuk barang gulungan (lakban, solasi, tali rafia, double tape)',
    tipe: 'panjang',
    faktorKonversi: 1,
    satuanDasar: 'Rol',
    rekomendasiStokMin: 2,
    rekomendasiStokMaks: 30,
    aliases: ['rol', 'roll', 'gulung', 'gulungan']
  },
  {
    nama: 'Eksemplar',
    keterangan: 'Satuan untuk buku, majalah, dokumen, atau media cetak resmi',
    tipe: 'tunggal',
    faktorKonversi: 1,
    satuanDasar: 'Eksemplar',
    rekomendasiStokMin: 3,
    rekomendasiStokMaks: 50,
    aliases: ['eksemplar', 'eks', 'buku', 'jilid', 'cop']
  },
  {
    nama: 'Fol',
    keterangan: 'Satuan untuk amplop atau map berukuran folio berkas',
    tipe: 'kemasan',
    faktorKonversi: 10,
    satuanDasar: 'Lembar',
    rekomendasiStokMin: 5,
    rekomendasiStokMaks: 50,
    aliases: ['fol', 'folio']
  },
  {
    nama: 'Botol',
    keterangan: 'Satuan untuk cairan atau tinta dalam botol kemasan',
    tipe: 'volume',
    faktorKonversi: 1,
    satuanDasar: 'Botol',
    rekomendasiStokMin: 2,
    rekomendasiStokMaks: 20,
    aliases: ['botol', 'btl', 'bottle']
  },
  {
    nama: 'Meter',
    keterangan: 'Satuan pengukuran panjang linear (kabel jaringan LAN, kain, pita)',
    tipe: 'panjang',
    faktorKonversi: 1,
    satuanDasar: 'Meter',
    rekomendasiStokMin: 5,
    rekomendasiStokMaks: 100,
    aliases: ['meter', 'm', 'mtr']
  },
  {
    nama: 'Pasang',
    keterangan: 'Satuan untuk barang yang berpasangan dua sisi (sarung tangan, baterai pasang)',
    tipe: 'kemasan',
    faktorKonversi: 2,
    satuanDasar: 'Buah',
    rekomendasiStokMin: 2,
    rekomendasiStokMaks: 20,
    aliases: ['pasang', 'psg', 'pair', 'prs']
  },
  {
    nama: 'Tube',
    keterangan: 'Satuan untuk pasta atau tinta kemasan tabung tekan (tube)',
    tipe: 'volume',
    faktorKonversi: 1,
    satuanDasar: 'Tube',
    rekomendasiStokMin: 2,
    rekomendasiStokMaks: 20,
    aliases: ['tube', 'tabung', 'tb']
  },
  {
    nama: 'Bal',
    keterangan: 'Satuan karung / bal kemasan besar pembungkus logistik',
    tipe: 'kemasan',
    faktorKonversi: 20,
    satuanDasar: 'Buah',
    rekomendasiStokMin: 1,
    rekomendasiStokMaks: 15,
    aliases: ['bal', 'bale', 'karung']
  },
  {
    nama: 'Bungkus',
    keterangan: 'Satuan kemasan bungkusan item persediaan',
    tipe: 'kemasan',
    faktorKonversi: 10,
    satuanDasar: 'Buah',
    rekomendasiStokMin: 2,
    rekomendasiStokMaks: 30,
    aliases: ['bungkus', 'bgk', 'pack']
  }
];

/**
 * Finds standard unit preset definition by name or alias
 */
export function findUnitPreset(unitName: string): SatuanPreset | undefined {
  if (!unitName) return undefined;
  const clean = unitName.trim().toLowerCase();
  
  // 1. Direct match
  const direct = STANDARD_SATUAN_PRESETS.find(p => p.nama.toLowerCase() === clean);
  if (direct) return direct;

  // 2. Alias match
  const byAlias = STANDARD_SATUAN_PRESETS.find(p => 
    p.aliases.some(a => a === clean || clean.includes(a) || a.includes(clean))
  );
  if (byAlias) return byAlias;

  // 3. Substring match for composite units (e.g. "Pack/Kilo" => "Pak", "Set/Kotak" => "Set")
  const composite = STANDARD_SATUAN_PRESETS.find(p => clean.includes(p.nama.toLowerCase()));
  return composite;
}

/**
 * Enriches an array of Satuan with standard conversion metadata if missing
 */
export function enrichSatuanListWithDefaults(list: Satuan[]): Satuan[] {
  return list.map(item => {
    const preset = findUnitPreset(item.nama);
    return {
      ...item,
      tipe: item.tipe || preset?.tipe || 'tunggal',
      faktorKonversi: item.faktorKonversi && item.faktorKonversi > 0 ? item.faktorKonversi : (preset?.faktorKonversi || 1),
      satuanDasar: item.satuanDasar || preset?.satuanDasar || 'Buah',
      rekomendasiStokMin: item.rekomendasiStokMin && item.rekomendasiStokMin > 0 ? item.rekomendasiStokMin : (preset?.rekomendasiStokMin || 5),
      rekomendasiStokMaks: item.rekomendasiStokMaks && item.rekomendasiStokMaks > 0 ? item.rekomendasiStokMaks : (preset?.rekomendasiStokMaks || 100),
    };
  });
}

/**
 * Resolves active metadata for a given unit string from custom list or preset fallback
 */
export function getSatuanMetadata(unitName: string, customList?: Satuan[]): {
  nama: string;
  keterangan: string;
  tipe: TipeSatuan;
  faktorKonversi: number;
  satuanDasar: string;
  rekomendasiStokMin: number;
  rekomendasiStokMaks: number;
  isMultiUnit: boolean;
} {
  const cleanName = (unitName || 'Buah').trim();
  const foundInCustom = customList?.find(s => s.nama.toLowerCase() === cleanName.toLowerCase());
  const preset = findUnitPreset(cleanName);

  const faktorKonversi = Number(foundInCustom?.faktorKonversi) > 0
    ? Number(foundInCustom!.faktorKonversi)
    : (preset?.faktorKonversi || 1);

  const satuanDasar = foundInCustom?.satuanDasar || preset?.satuanDasar || 'Buah';
  const tipe: TipeSatuan = foundInCustom?.tipe || preset?.tipe || (faktorKonversi > 1 ? 'kemasan' : 'tunggal');
  const rekomendasiStokMin = Number(foundInCustom?.rekomendasiStokMin) > 0
    ? Number(foundInCustom!.rekomendasiStokMin)
    : (preset?.rekomendasiStokMin || (faktorKonversi >= 10 ? 2 : 5));
  const rekomendasiStokMaks = Number(foundInCustom?.rekomendasiStokMaks) > 0
    ? Number(foundInCustom!.rekomendasiStokMaks)
    : (preset?.rekomendasiStokMaks || (rekomendasiStokMin * 10));

  return {
    nama: cleanName,
    keterangan: foundInCustom?.keterangan || preset?.keterangan || `Satuan ${cleanName}`,
    tipe,
    faktorKonversi,
    satuanDasar,
    rekomendasiStokMin,
    rekomendasiStokMaks,
    isMultiUnit: faktorKonversi > 1
  };
}

/**
 * Calculates the rational, unit-aware effective minimum stock for an item.
 * 1. If item.stokMin > 0, returns the user-customized stokMin.
 * 2. If item.stokMin === 0 or unset, returns the intelligent unit-specific recommendation (e.g. 1 Lusin, 2 Rim, 10 Buah).
 */
export function getEffectiveStokMin(barang: Barang | { stokMin?: number; satuan: string }, customList?: Satuan[]): number {
  const explicitMin = Number(barang.stokMin);
  if (explicitMin > 0) {
    return explicitMin;
  }
  const meta = getSatuanMetadata(barang.satuan, customList);
  return meta.rekomendasiStokMin;
}

/**
 * Calculates the rational, unit-aware effective maximum stock for an item.
 */
export function getEffectiveStokMaks(barang: Barang | { stokMaks?: number; satuan: string }, customList?: Satuan[]): number {
  const explicitMaks = Number(barang.stokMaks);
  if (explicitMaks > 0) {
    return explicitMaks;
  }
  const meta = getSatuanMetadata(barang.satuan, customList);
  return meta.rekomendasiStokMaks;
}

/**
 * Calculates the equivalent normalized quantity in the base discrete unit
 * (e.g., 5 Lusin => 60 Buah, 3 Rim => 1.500 Lembar)
 */
export function getEquivalentBaseStock(stok: number, unitName: string, customList?: Satuan[]): {
  qty: number;
  satuan: string;
  baseQty: number;
  baseSatuan: string;
  faktorKonversi: number;
  isMultiUnit: boolean;
  shortLabel: string;
  fullLabel: string;
  formula: string;
} {
  const meta = getSatuanMetadata(unitName, customList);
  const safeStok = Number(stok) || 0;
  const baseQty = safeStok * meta.faktorKonversi;
  const isMultiUnit = meta.faktorKonversi > 1 && meta.satuanDasar.toLowerCase() !== meta.nama.toLowerCase();

  const formattedBaseQty = baseQty.toLocaleString('id-ID');
  const shortLabel = isMultiUnit ? `${formattedBaseQty} ${meta.satuanDasar}` : `${safeStok} ${meta.nama}`;
  const fullLabel = isMultiUnit ? `${safeStok} ${meta.nama} (≈ ${formattedBaseQty} ${meta.satuanDasar})` : `${safeStok} ${meta.nama}`;
  const formula = `1 ${meta.nama} = ${meta.faktorKonversi} ${meta.satuanDasar}`;

  return {
    qty: safeStok,
    satuan: meta.nama,
    baseQty,
    baseSatuan: meta.satuanDasar,
    faktorKonversi: meta.faktorKonversi,
    isMultiUnit,
    shortLabel,
    fullLabel,
    formula
  };
}

export interface StockEvaluation {
  stokSekarang: number;
  satuan: string;
  effectiveMin: number;
  effectiveMaks: number;
  baseQty: number;
  baseSatuan: string;
  faktorKonversi: number;
  conversionFactor: number;
  isMultiUnit: boolean;
  isOutOfStock: boolean;
  isLowStock: boolean;
  isSafe: boolean;
  status: 'habis' | 'kritis' | 'aman';
  healthRatio: number; // stok / effectiveMin
  healthPercentage: number;
  urgencyScore: number; // Lower score = more urgent restock priority
  badgeLabel: string;
  badgeClass: string;
  helperText: string;
  baseEquivLabel: string;
}

/**
 * Intelligent stock health and threshold evaluator.
 * Solves unit discrepancies (e.g. 5 Lusin = 60 pcs is SAFE, whereas 6 Buah = 6 pcs is LOW).
 */
export function evaluateStockStatus(barang: Barang, customList?: Satuan[]): StockEvaluation {
  const stokSekarang = Number(barang.stokSekarang) || 0;
  const effectiveMin = getEffectiveStokMin(barang, customList);
  const effectiveMaks = getEffectiveStokMaks(barang, customList);
  const meta = getSatuanMetadata(barang.satuan, customList);
  
  const baseQty = stokSekarang * meta.faktorKonversi;
  const minBaseQty = effectiveMin * meta.faktorKonversi;
  const isMultiUnit = meta.faktorKonversi > 1 && meta.satuanDasar.toLowerCase() !== meta.nama.toLowerCase();

  const isOutOfStock = stokSekarang === 0;
  const isLowStock = stokSekarang > 0 && stokSekarang <= effectiveMin;
  const isSafe = stokSekarang > effectiveMin;

  let status: 'habis' | 'kritis' | 'aman' = 'aman';
  if (isOutOfStock) {
    status = 'habis';
  } else if (isLowStock) {
    status = 'kritis';
  }

  const healthRatio = effectiveMin > 0 ? (stokSekarang / effectiveMin) : (stokSekarang > 0 ? 2 : 0);
  const healthPercentage = Math.min(100, Math.round(healthRatio * 100));

  // Urgency score calculation:
  // 1. Out of stock is absolute priority (score 0)
  // 2. Low stock items are scored by (baseQty / minBaseQty) combined with absolute item count
  // This guarantees that 6 Buah (6 items) is ranked as more urgent than 5 Lusin (60 items)
  let urgencyScore = 999;
  if (isOutOfStock) {
    urgencyScore = 0;
  } else if (isLowStock) {
    urgencyScore = (healthRatio * 10) + Math.min(baseQty, 50);
  } else {
    urgencyScore = 100 + (healthRatio * 20) + baseQty;
  }

  let badgeLabel = `Aman (${stokSekarang} ${barang.satuan})`;
  let badgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  let helperText = `Stok aman di atas batas minimum (${effectiveMin} ${barang.satuan})`;

  if (isOutOfStock) {
    badgeLabel = 'Stok Habis (0)';
    badgeClass = 'bg-rose-50 text-rose-700 border-rose-200';
    helperText = `Stok kosong! Butuh restok segera (Target min: ${effectiveMin} ${barang.satuan})`;
  } else if (isLowStock) {
    badgeLabel = `Kritis (${stokSekarang} ${barang.satuan})`;
    badgeClass = 'bg-amber-50 text-amber-800 border-amber-200';
    helperText = `Stok menipis di bawah/sama dengan batas minimum (${effectiveMin} ${barang.satuan})`;
  }

  const baseEquivLabel = isMultiUnit
    ? `${stokSekarang} ${barang.satuan} (= ${baseQty.toLocaleString('id-ID')} ${meta.satuanDasar})`
    : `${stokSekarang} ${barang.satuan}`;

  return {
    stokSekarang,
    satuan: barang.satuan,
    effectiveMin,
    effectiveMaks,
    baseQty,
    baseSatuan: meta.satuanDasar,
    faktorKonversi: meta.faktorKonversi,
    conversionFactor: meta.faktorKonversi,
    isMultiUnit,
    isOutOfStock,
    isLowStock,
    isSafe,
    status,
    healthRatio,
    healthPercentage,
    urgencyScore,
    badgeLabel,
    badgeClass,
    helperText,
    baseEquivLabel
  };
}

/**
 * Sorts items by genuine restock urgency (Out of stock first, then critically low items based on normalized base stock)
 */
export function sortBarangByUrgency(barangList: Barang[], customList?: Satuan[]): Barang[] {
  return [...barangList].sort((a, b) => {
    const evalA = evaluateStockStatus(a, customList);
    const evalB = evaluateStockStatus(b, customList);
    return evalA.urgencyScore - evalB.urgencyScore;
  });
}
