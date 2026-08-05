/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Search, X, Check, Package, FolderTree, QrCode, MapPin, 
  AlertTriangle, CheckCircle2, ChevronDown, Layers, Sparkles,
  ExternalLink, Eye, ArrowUpDown, Filter
} from 'lucide-react';
import { Barang, Kategori } from '../types';

interface BarangSearchPickerProps {
  barangList: Barang[];
  kategoriList: Kategori[];
  selectedBarangId: string;
  onSelectBarang: (barang: Barang) => void;
  onOpenScanner?: () => void;
  mode: 'masuk' | 'keluar';
  themeColor?: 'emerald' | 'red' | 'indigo';
}

export default function BarangSearchPicker({
  barangList = [],
  kategoriList = [],
  selectedBarangId,
  onSelectBarang,
  onOpenScanner,
  mode = 'masuk',
  themeColor = mode === 'masuk' ? 'emerald' : 'red'
}: BarangSearchPickerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [isOpenDropdown, setIsOpenDropdown] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [showCatalogModal, setShowCatalogModal] = useState(false);
  const [catalogCategoryFilter, setCatalogCategoryFilter] = useState<string>('all');
  const [catalogSearch, setCatalogSearch] = useState('');

  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const dropdownListRef = useRef<HTMLDivElement>(null);

  const selectedItem = useMemo(() => {
    return barangList.find(b => b.id === selectedBarangId);
  }, [barangList, selectedBarangId]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpenDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter items based on active search and category filter
  const filteredBarang = useMemo(() => {
    return barangList.filter(item => {
      // Category filter match
      if (selectedCategoryFilter !== 'all') {
        const matchesCategory = 
          item.kategoriId === selectedCategoryFilter || 
          item.kategori?.toLowerCase() === selectedCategoryFilter.toLowerCase();
        if (!matchesCategory) return false;
      }

      // Query match (searches ID, Name, Category, Rak, Supplier)
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      const matchId = item.id?.toLowerCase().includes(q);
      const matchName = item.nama?.toLowerCase().includes(q);
      const matchCat = item.kategori?.toLowerCase().includes(q);
      const matchRak = item.lokasiRak?.toLowerCase().includes(q);
      const matchSupplier = item.supplier?.toLowerCase().includes(q);

      return matchId || matchName || matchCat || matchRak || matchSupplier;
    });
  }, [barangList, selectedCategoryFilter, searchQuery]);

  // Reset highlighted index when filter changes
  useEffect(() => {
    setHighlightedIndex(0);
  }, [filteredBarang.length]);

  // Scroll active item into view
  useEffect(() => {
    if (isOpenDropdown && dropdownListRef.current) {
      const activeEl = dropdownListRef.current.children[highlightedIndex] as HTMLElement;
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex, isOpenDropdown]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpenDropdown) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpenDropdown(true);
        e.preventDefault();
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev < filteredBarang.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev > 0 ? prev - 1 : filteredBarang.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredBarang[highlightedIndex]) {
        handleSelectItem(filteredBarang[highlightedIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsOpenDropdown(false);
    }
  };

  const handleSelectItem = (item: Barang) => {
    onSelectBarang(item);
    setIsOpenDropdown(false);
    setSearchQuery('');
  };

  // Category counts calculation
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: barangList.length };
    kategoriList.forEach(k => {
      counts[k.id] = barangList.filter(b => b.kategoriId === k.id || b.kategori === k.nama).length;
    });
    return counts;
  }, [barangList, kategoriList]);

  // Highlight matched search text
  const highlightMatch = (text: string, query: string) => {
    if (!query.trim() || !text) return text;
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, i) => 
      regex.test(part) ? (
        <mark key={i} className="bg-amber-200 text-amber-900 font-bold px-0.5 rounded">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  // Filter for Catalog Modal
  const catalogFilteredBarang = useMemo(() => {
    return barangList.filter(item => {
      if (catalogCategoryFilter !== 'all') {
        const matchesCategory = 
          item.kategoriId === catalogCategoryFilter || 
          item.kategori?.toLowerCase() === catalogCategoryFilter.toLowerCase();
        if (!matchesCategory) return false;
      }
      if (!catalogSearch.trim()) return true;
      const q = catalogSearch.toLowerCase().trim();
      return (
        item.id.toLowerCase().includes(q) ||
        item.nama.toLowerCase().includes(q) ||
        item.kategori.toLowerCase().includes(q) ||
        (item.lokasiRak && item.lokasiRak.toLowerCase().includes(q))
      );
    });
  }, [barangList, catalogCategoryFilter, catalogSearch]);

  const isMasuk = mode === 'masuk';
  const primaryBg = isMasuk ? 'bg-emerald-600' : 'bg-red-600';
  const primaryText = isMasuk ? 'text-emerald-700' : 'text-red-700';
  const ringColor = isMasuk ? 'focus:ring-emerald-500' : 'focus:ring-red-500';
  const borderColor = isMasuk ? 'border-emerald-500' : 'border-red-500';

  return (
    <div className="space-y-3" ref={containerRef}>
      {/* Category Pills Quick Filter */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <FolderTree className={`w-3.5 h-3.5 ${primaryText}`} />
            Filter Kategori BMN
          </label>
          <button
            type="button"
            onClick={() => setShowCatalogModal(true)}
            className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 hover:underline cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5" />
            Jelajahi Katalog Lengkap
          </button>
        </div>

        {/* Scrollable Category Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 no-scrollbar text-xs">
          <button
            type="button"
            onClick={() => setSelectedCategoryFilter('all')}
            className={`px-3 py-1 rounded-lg font-bold text-[11px] shrink-0 transition-all flex items-center gap-1.5 cursor-pointer border ${
              selectedCategoryFilter === 'all'
                ? isMasuk 
                  ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs' 
                  : 'bg-red-700 text-white border-red-700 shadow-xs'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <span>Semua</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
              selectedCategoryFilter === 'all' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
            }`}>
              {categoryCounts.all || 0}
            </span>
          </button>

          {kategoriList.map(cat => {
            const count = categoryCounts[cat.id] || 0;
            const isSelected = selectedCategoryFilter === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategoryFilter(cat.id)}
                className={`px-2.5 py-1 rounded-lg font-semibold text-[11px] shrink-0 transition-all flex items-center gap-1.5 cursor-pointer border ${
                  isSelected
                    ? isMasuk
                      ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                      : 'bg-red-700 text-white border-red-700 shadow-xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                }`}
                title={cat.nama}
              >
                <span className="truncate max-w-[130px]">{cat.nama}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Unified Search & Select Bar */}
      <div className="space-y-1.5 relative">
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <Package className={`w-3.5 h-3.5 ${primaryText}`} />
            Pilih Barang Persediaan *
          </label>
          {onOpenScanner && (
            <button
              type="button"
              onClick={onOpenScanner}
              className={`text-[11px] font-bold flex items-center gap-1 ${primaryText} hover:underline cursor-pointer`}
            >
              <QrCode className="w-3.5 h-3.5" />
              Scan QR / Barcode
            </button>
          )}
        </div>

        {/* Search Input Box with Combobox Trigger */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          
          <input
            ref={searchInputRef}
            type="text"
            placeholder={
              selectedItem 
                ? `Cari pengganti atau ketik nama/kode barang... (Terpilih: ${selectedItem.nama})`
                : 'Ketik nama barang, kode (e.g. 000001), kategori, atau lokasi rak...'
            }
            value={searchQuery}
            onChange={e => {
              setSearchQuery(e.target.value);
              if (!isOpenDropdown) setIsOpenDropdown(true);
            }}
            onFocus={() => setIsOpenDropdown(true)}
            onKeyDown={handleKeyDown}
            className={`w-full pl-9 pr-20 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 ${ringColor} transition-all shadow-2xs`}
          />

          <div className="absolute inset-y-0 right-0 pr-2 flex items-center gap-1">
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  searchInputRef.current?.focus();
                }}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-md cursor-pointer transition-colors"
                title="Hapus pencarian"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsOpenDropdown(prev => !prev)}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 cursor-pointer transition-colors"
              title="Buka daftar barang"
            >
              <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpenDropdown ? 'rotate-180 text-slate-700' : ''}`} />
            </button>
          </div>
        </div>

        {/* Dropdown Results List (Autocomplete Popover) */}
        {isOpenDropdown && (
          <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
            {/* Header info in dropdown */}
            <div className="p-2.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
              <span>
                Menampilkan <strong className="text-slate-800">{filteredBarang.length}</strong> barang
                {selectedCategoryFilter !== 'all' && (
                  <span> dalam kategori <strong className="text-indigo-600">{kategoriList.find(k => k.id === selectedCategoryFilter)?.nama || selectedCategoryFilter}</strong></span>
                )}
              </span>
              <span className="text-[10px] text-slate-400">Gunakan tombol ↑ ↓ Enter</span>
            </div>

            {/* List items */}
            <div 
              ref={dropdownListRef}
              className="max-h-64 overflow-y-auto divide-y divide-slate-100 text-xs"
            >
              {filteredBarang.length === 0 ? (
                <div className="p-6 text-center text-slate-500 space-y-2">
                  <Package className="w-8 h-8 mx-auto text-slate-300" />
                  <p className="font-bold text-slate-700">Barang tidak ditemukan</p>
                  <p className="text-[11px]">
                    Tidak ada barang yang cocok dengan kata kunci <strong>"{searchQuery}"</strong>
                  </p>
                  {selectedCategoryFilter !== 'all' && (
                    <button
                      type="button"
                      onClick={() => setSelectedCategoryFilter('all')}
                      className="text-xs font-bold text-indigo-600 hover:underline inline-block mt-1 cursor-pointer"
                    >
                      Hapus filter kategori & cari di semua barang
                    </button>
                  )}
                </div>
              ) : (
                filteredBarang.map((item, idx) => {
                  const isSelected = item.id === selectedBarangId;
                  const isHighlighted = idx === highlightedIndex;
                  const isLowStock = item.stokSekarang < item.stokMin;
                  const isOutOfStock = item.stokSekarang <= 0;

                  return (
                    <div
                      key={item.id}
                      onClick={() => handleSelectItem(item)}
                      onMouseEnter={() => setHighlightedIndex(idx)}
                      className={`p-3 cursor-pointer transition-colors flex items-center justify-between gap-3 ${
                        isSelected 
                          ? isMasuk ? 'bg-emerald-50/80 font-bold' : 'bg-red-50/80 font-bold'
                          : isHighlighted
                            ? 'bg-slate-100/90'
                            : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-start gap-2.5 min-w-0">
                        {/* Thumbnail / Category Icon */}
                        <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 shrink-0 flex items-center justify-center text-slate-500 overflow-hidden mt-0.5">
                          {item.imageUrl ? (
                            <img 
                              src={item.imageUrl} 
                              alt={item.nama} 
                              className="w-full h-full object-cover" 
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <Package className="w-4 h-4 text-slate-400" />
                          )}
                        </div>

                        {/* Title and details */}
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded border border-slate-200">
                              {highlightMatch(item.id, searchQuery)}
                            </span>
                            <span className="text-[10px] font-semibold px-1.5 py-0.5 bg-indigo-50 text-indigo-700 rounded border border-indigo-100">
                              {item.kategori}
                            </span>
                            {item.lokasiRak && (
                              <span className="text-[10px] text-slate-500 flex items-center gap-0.5">
                                <MapPin className="w-2.5 h-2.5 text-slate-400" />
                                {item.lokasiRak}
                              </span>
                            )}
                          </div>

                          <p className="text-xs font-bold text-slate-900 mt-1 truncate">
                            {highlightMatch(item.nama, searchQuery)}
                          </p>
                        </div>
                      </div>

                      {/* Stock Badge & Selection Indicator */}
                      <div className="text-right shrink-0 flex items-center gap-2.5">
                        <div>
                          <span className={`inline-block px-2 py-0.5 text-[11px] font-bold rounded-lg ${
                            isOutOfStock 
                              ? 'bg-red-100 text-red-700 border border-red-200' 
                              : isLowStock 
                                ? 'bg-amber-100 text-amber-800 border border-amber-200' 
                                : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          }`}>
                            {item.stokSekarang} {item.satuan}
                          </span>
                          <span className="block text-[9px] text-slate-400 mt-0.5">
                            {isOutOfStock ? 'Habis' : isLowStock ? 'Stok Menipis' : 'Tersedia'}
                          </span>
                        </div>

                        {isSelected && (
                          <div className={`p-1 rounded-full ${isMasuk ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`}>
                            <Check className="w-3.5 h-3.5" />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer with Catalog Modal trigger */}
            <div className="p-2 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px]">
              <span className="text-slate-500">Ketik untuk mencari di semua bidang data</span>
              <button
                type="button"
                onClick={() => {
                  setIsOpenDropdown(false);
                  setShowCatalogModal(true);
                }}
                className="font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
              >
                Lihat Semua di Katalog <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Selected Item Visual Showcase Card */}
      {selectedItem ? (
        <div className={`p-3.5 rounded-xl border transition-all ${
          isMasuk 
            ? 'bg-emerald-50/40 border-emerald-200/80 shadow-2xs' 
            : 'bg-red-50/40 border-red-200/80 shadow-2xs'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 shadow-2xs shrink-0 flex items-center justify-center text-slate-500 overflow-hidden">
                {selectedItem.imageUrl ? (
                  <img 
                    src={selectedItem.imageUrl} 
                    alt={selectedItem.nama} 
                    className="w-full h-full object-cover" 
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <Package className={`w-6 h-6 ${primaryText}`} />
                )}
              </div>

              <div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-mono text-[11px] font-extrabold px-2 py-0.5 bg-white text-slate-800 rounded-md border border-slate-200 shadow-2xs">
                    {selectedItem.id}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded-md">
                    {selectedItem.kategori}
                  </span>
                  <span className="text-[10px] font-medium text-slate-600 bg-white px-2 py-0.5 rounded-md border border-slate-200 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-slate-400" />
                    {selectedItem.lokasiRak || 'Gudang Utama'}
                  </span>
                </div>

                <h4 className="text-sm font-bold text-slate-900 mt-1">
                  {selectedItem.nama}
                </h4>

                {selectedItem.supplier && (
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Supplier Utama: <span className="font-semibold text-slate-700">{selectedItem.supplier}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Current Stock Metrics Box */}
            <div className="flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 border-slate-200/60 pt-2 sm:pt-0">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                Stok Saat Ini
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-base font-extrabold text-slate-900">
                  {selectedItem.stokSekarang}
                </span>
                <span className="text-xs font-bold text-slate-600">
                  {selectedItem.satuan}
                </span>
              </div>

              {selectedItem.stokSekarang < selectedItem.stokMin ? (
                <span className="text-[10px] text-red-600 font-bold flex items-center gap-1 mt-0.5">
                  <AlertTriangle className="w-3 h-3" /> Stok Menipis (&lt;{selectedItem.stokMin})
                </span>
              ) : (
                <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1 mt-0.5">
                  <CheckCircle2 className="w-3 h-3" /> Stok Aman
                </span>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="p-4 bg-amber-50/60 border border-dashed border-amber-300 rounded-xl text-center text-xs text-amber-800 space-y-1">
          <AlertTriangle className="w-5 h-5 mx-auto text-amber-500" />
          <p className="font-bold">Belum ada barang yang dipilih</p>
          <p className="text-[11px] text-amber-700">Silakan cari nama atau kode barang pada kolom pencarian di atas.</p>
        </div>
      )}

      {/* --- FULL CATALOG MODAL BROWSER --- */}
      {showCatalogModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[85vh] shadow-2xl border border-slate-100 overflow-hidden flex flex-col text-xs">
            {/* Modal Header */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-600 rounded-lg text-white">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold">Katalog Master Barang Persediaan (BMN)</h3>
                  <p className="text-[11px] text-slate-300">Pilih salah satu barang untuk dimasukkan ke form transaksi</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCatalogModal(false)}
                className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Filters */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 space-y-3">
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Cari kode, nama barang, rak, atau spesifikasi..."
                    value={catalogSearch}
                    onChange={e => setCatalogSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                  {catalogSearch && (
                    <button
                      type="button"
                      onClick={() => setCatalogSearch('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <select
                  value={catalogCategoryFilter}
                  onChange={e => setCatalogCategoryFilter(e.target.value)}
                  className="px-3 py-2 bg-white border border-slate-200 rounded-xl font-semibold text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="all">Semua Kategori ({barangList.length})</option>
                  {kategoriList.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.nama} ({categoryCounts[cat.id] || 0})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Catalog Grid / List */}
            <div className="p-4 overflow-y-auto flex-1 divide-y divide-slate-100">
              {catalogFilteredBarang.length === 0 ? (
                <div className="p-12 text-center text-slate-500 space-y-2">
                  <Package className="w-10 h-10 mx-auto text-slate-300" />
                  <p className="font-bold text-sm text-slate-700">Tidak ada barang yang sesuai filter</p>
                  <p className="text-xs">Coba ubah kata kunci pencarian atau kategori.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {catalogFilteredBarang.map(item => {
                    const isSelected = item.id === selectedBarangId;
                    const isLowStock = item.stokSekarang < item.stokMin;
                    return (
                      <div
                        key={item.id}
                        className={`p-3 rounded-xl border transition-all flex items-start justify-between gap-3 ${
                          isSelected
                            ? isMasuk ? 'bg-emerald-50 border-emerald-300' : 'bg-red-50 border-red-300'
                            : 'bg-white border-slate-200 hover:border-indigo-300 hover:shadow-xs'
                        }`}
                      >
                        <div className="flex items-start gap-2.5 min-w-0">
                          <div className="w-9 h-9 rounded-lg bg-slate-100 border border-slate-200 shrink-0 flex items-center justify-center text-slate-500 overflow-hidden">
                            {item.imageUrl ? (
                              <img 
                                src={item.imageUrl} 
                                alt={item.nama} 
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <Package className="w-4 h-4 text-slate-400" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-[10px] font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">
                                {item.id}
                              </span>
                              <span className="text-[10px] text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded font-semibold truncate max-w-[100px]">
                                {item.kategori}
                              </span>
                            </div>
                            <h5 className="font-bold text-slate-900 text-xs mt-1 truncate">
                              {item.nama}
                            </h5>
                            <p className="text-[10px] text-slate-500 mt-0.5">
                              Stok: <strong className={isLowStock ? 'text-amber-700' : 'text-slate-800'}>{item.stokSekarang} {item.satuan}</strong>
                              {item.lokasiRak && ` • 📍 ${item.lokasiRak}`}
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            handleSelectItem(item);
                            setShowCatalogModal(false);
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 transition-all cursor-pointer ${
                            isSelected
                              ? isMasuk 
                                ? 'bg-emerald-600 text-white' 
                                : 'bg-red-600 text-white'
                              : 'bg-slate-100 hover:bg-indigo-600 hover:text-white text-slate-700'
                          }`}
                        >
                          {isSelected ? 'Terpilih' : 'Pilih'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-slate-600">
              <span>Total {catalogFilteredBarang.length} dari {barangList.length} barang persediaan</span>
              <button
                type="button"
                onClick={() => setShowCatalogModal(false)}
                className="px-4 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold rounded-xl cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
