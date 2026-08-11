/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Search, X, Check, Package, FolderTree, QrCode, MapPin, 
  AlertTriangle, CheckCircle2, ChevronDown, Layers, Sparkles,
  ExternalLink, Eye, ArrowUpDown, Filter, CheckCircle, RefreshCw,
  Info, Tag
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
  
  // Notification Toast for item selection feedback
  const [selectionToast, setSelectionToast] = useState<{
    visible: boolean;
    nama: string;
    id: string;
    stok: number;
    satuan: string;
    kategori: string;
  } | null>(null);

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

  // Auto-hide selection toast after 3.5s
  useEffect(() => {
    if (selectionToast?.visible) {
      const timer = setTimeout(() => {
        setSelectionToast(prev => prev ? { ...prev, visible: false } : null);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [selectionToast?.visible]);

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
    
    // Trigger toast notification
    setSelectionToast({
      visible: true,
      nama: item.nama,
      id: item.id,
      stok: item.stokSekarang,
      satuan: item.satuan || 'Unit',
      kategori: item.kategori || ''
    });
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
        <div className="flex items-center justify-between gap-2">
          <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5 min-w-0">
            <FolderTree className={`w-3.5 h-3.5 shrink-0 ${primaryText}`} />
            <span className="truncate">Filter Kategori BMN</span>
          </label>
          <button
            type="button"
            onClick={() => setShowCatalogModal(true)}
            className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 hover:underline cursor-pointer shrink-0"
          >
            <Layers className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline">Jelajahi Katalog Lengkap</span>
            <span className="sm:hidden">Katalog</span>
          </button>
        </div>

        {/* Scrollable Category Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs -mx-1 px-1">
          <button
            type="button"
            onClick={() => setSelectedCategoryFilter('all')}
            className={`px-2.5 sm:px-3 py-1 rounded-lg font-bold text-[11px] shrink-0 transition-all flex items-center gap-1.5 cursor-pointer border ${
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
                <span className="truncate max-w-[110px] sm:max-w-[130px]">{cat.nama}</span>
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

      {/* Micro Confirmation Toast / Feedback Banner when item is picked */}
      {selectionToast?.visible && (
        <div className="p-2.5 sm:p-3 bg-gradient-to-r from-emerald-900 to-slate-900 text-white rounded-xl shadow-lg border border-emerald-400/40 flex items-center justify-between gap-2.5 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300 shrink-0">
              <CheckCircle className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-300 px-1.5 py-0.2 bg-emerald-950/80 rounded border border-emerald-500/30">
                  ✓ Berhasil Dipilih
                </span>
                <span className="font-mono text-[10px] text-slate-300 truncate">[{selectionToast.id}]</span>
              </div>
              <p className="text-xs font-bold text-white truncate mt-0.5">
                {selectionToast.nama}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[10px] sm:text-[11px] font-bold px-2 py-0.5 sm:py-1 bg-emerald-500/20 text-emerald-200 rounded-lg border border-emerald-400/30">
              Stok: {selectionToast.stok} {selectionToast.satuan}
            </span>
            <button
              type="button"
              onClick={() => setSelectionToast(null)}
              className="p-1 text-slate-400 hover:text-white rounded-md transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Main Unified Search & Select Bar */}
      <div className="space-y-1.5 relative">
        <div className="flex flex-wrap items-center justify-between gap-1.5">
          <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <Package className={`w-3.5 h-3.5 shrink-0 ${primaryText}`} />
            Pilih Barang Persediaan *
          </label>
          <div className="flex items-center gap-2">
            {selectedItem && (
              <span className="text-[10px] font-bold text-emerald-700 flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                <CheckCircle2 className="w-3 h-3 shrink-0" />
                <span className="hidden sm:inline">1 Barang Aktif Terpilih</span>
                <span className="sm:hidden">Terpilih</span>
              </span>
            )}
            {onOpenScanner && (
              <button
                type="button"
                onClick={onOpenScanner}
                className={`text-[11px] font-bold flex items-center gap-1 ${primaryText} hover:underline cursor-pointer`}
              >
                <QrCode className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden sm:inline">Scan QR / Barcode</span>
                <span className="sm:hidden">Scan QR</span>
              </button>
            )}
          </div>
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
                ? `Cari barang lain... (Terpilih: ${selectedItem.nama})`
                : 'Ketik nama barang, kode (e.g. 000001), kategori...'
            }
            value={searchQuery}
            onChange={e => {
              setSearchQuery(e.target.value);
              if (!isOpenDropdown) setIsOpenDropdown(true);
            }}
            onFocus={() => setIsOpenDropdown(true)}
            onKeyDown={handleKeyDown}
            className={`w-full pl-9 pr-20 sm:pr-24 py-2 sm:py-2.5 bg-white border ${
              selectedItem ? (isMasuk ? 'border-emerald-400 ring-1 ring-emerald-400/30' : 'border-red-400 ring-1 ring-red-400/30') : 'border-slate-300'
            } rounded-xl text-xs text-slate-900 font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 ${ringColor} transition-all shadow-2xs`}
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
              <span className="text-[10px] text-slate-400 hidden sm:inline">Gunakan tombol ↑ ↓ Enter</span>
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
                      className={`p-2.5 sm:p-3 cursor-pointer transition-colors flex items-center justify-between gap-2.5 ${
                        isSelected 
                          ? isMasuk ? 'bg-emerald-50 font-bold border-l-4 border-emerald-600' : 'bg-red-50 font-bold border-l-4 border-red-600'
                          : isHighlighted
                            ? 'bg-slate-100/90'
                            : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-start gap-2 sm:gap-2.5 min-w-0">
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
                          <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap">
                            <span className="font-mono text-[10px] font-bold px-1.5 py-0.2 bg-slate-100 text-slate-700 rounded border border-slate-200">
                              {highlightMatch(item.id, searchQuery)}
                            </span>
                            <span className="text-[10px] font-semibold px-1.5 py-0.2 bg-indigo-50 text-indigo-700 rounded border border-indigo-100">
                              {item.kategori}
                            </span>
                            {item.lokasiRak && (
                              <span className="text-[10px] text-slate-500 flex items-center gap-0.5">
                                <MapPin className="w-2.5 h-2.5 text-slate-400" />
                                {item.lokasiRak}
                              </span>
                            )}
                          </div>

                          <p className="text-xs font-bold text-slate-900 mt-0.5 truncate">
                            {highlightMatch(item.nama, searchQuery)}
                          </p>
                        </div>
                      </div>

                      {/* Stock Badge & Selection Indicator */}
                      <div className="text-right shrink-0 flex items-center gap-2">
                        <div>
                          <span className={`inline-block px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-[11px] font-bold rounded-lg ${
                            isOutOfStock 
                              ? 'bg-red-100 text-red-700 border border-red-200' 
                              : isLowStock 
                                ? 'bg-amber-100 text-amber-800 border border-amber-200' 
                                : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          }`}>
                            {item.stokSekarang} {item.satuan}
                          </span>
                        </div>

                        {isSelected ? (
                          <div className={`px-2 py-1 rounded-md text-[10px] font-extrabold flex items-center gap-1 ${
                            isMasuk ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
                          }`}>
                            <Check className="w-3 h-3" /> <span className="hidden sm:inline">TERPILIH</span>
                          </div>
                        ) : (
                          <div className="text-[10px] text-slate-500 font-semibold px-2 py-0.5 rounded border border-slate-200 bg-white hover:bg-slate-50">
                            Pilih
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
              <span className="text-slate-500">Cari di seluruh database BMN</span>
              <button
                type="button"
                onClick={() => {
                  setIsOpenDropdown(false);
                  setShowCatalogModal(true);
                }}
                className="font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
              >
                Katalog Lengkap <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Selected Item Visual Showcase Card - PROMINENTLY HIGHLIGHTED */}
      {selectedItem ? (
        <div className={`rounded-2xl border-2 transition-all overflow-hidden ${
          isMasuk 
            ? 'bg-gradient-to-br from-emerald-50/90 via-white to-emerald-50/40 border-emerald-400 shadow-md shadow-emerald-500/5' 
            : 'bg-gradient-to-br from-red-50/90 via-white to-red-50/40 border-red-400 shadow-md shadow-red-500/5'
        }`}>
          {/* Header Accent Bar - Explicit Selected Affirmation */}
          <div className={`px-3 sm:px-4 py-2 border-b flex items-center justify-between text-xs font-bold gap-2 ${
            isMasuk 
              ? 'bg-emerald-600 text-white border-emerald-600' 
              : 'bg-red-600 text-white border-red-600'
          }`}>
            <div className="flex items-center gap-2 min-w-0">
              <span className="relative flex h-2.5 w-2.5 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
              </span>
              <span className="tracking-wide uppercase text-[11px] font-extrabold truncate">
                <span className="hidden sm:inline">✓ BARANG SUDAH DIPILIH & SIAP DITRANSAKSIKAN</span>
                <span className="sm:hidden">✓ BARANG AKTIF TERPILIH</span>
              </span>
            </div>

            <button
              type="button"
              onClick={() => {
                setIsOpenDropdown(true);
                searchInputRef.current?.focus();
              }}
              className="text-[11px] font-bold px-2 sm:px-2.5 py-0.5 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors flex items-center gap-1 cursor-pointer shrink-0"
            >
              <RefreshCw className="w-3 h-3" /> Ganti Barang
            </button>
          </div>

          <div className="p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 sm:gap-4">
              <div className="flex items-start gap-3 sm:gap-3.5 min-w-0">
                <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-white border-2 ${
                  isMasuk ? 'border-emerald-300' : 'border-red-300'
                } shadow-xs shrink-0 flex items-center justify-center text-slate-500 overflow-hidden`}>
                  {selectedItem.imageUrl ? (
                    <img 
                      src={selectedItem.imageUrl} 
                      alt={selectedItem.nama} 
                      className="w-full h-full object-cover hover:scale-110 transition-transform duration-300" 
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <Package className={`w-6 h-6 sm:w-7 sm:h-7 ${primaryText}`} />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-mono text-[11px] sm:text-xs font-black px-2 py-0.5 bg-slate-900 text-white rounded-md shadow-2xs">
                      {selectedItem.id}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded-md border border-indigo-200 truncate max-w-[120px]">
                      {selectedItem.kategori}
                    </span>
                    <span className="text-[10px] font-medium text-slate-700 bg-white px-2 py-0.5 rounded-md border border-slate-200 flex items-center gap-1 shadow-2xs">
                      <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="truncate max-w-[110px]">{selectedItem.lokasiRak || 'Gudang Utama'}</span>
                    </span>
                  </div>

                  <h4 className="text-sm sm:text-base font-extrabold text-slate-900 mt-1 leading-snug break-words">
                    {selectedItem.nama}
                  </h4>

                  {selectedItem.supplier && (
                    <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                      Penyedia/Vendor: <span className="font-bold text-slate-700">{selectedItem.supplier}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Current Stock Metrics Box */}
              <div className="flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 border-slate-200/80 pt-2.5 sm:pt-0 shrink-0 bg-slate-50/80 sm:bg-transparent p-2.5 sm:p-0 rounded-xl">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-extrabold">
                  Posisi Stok Saat Ini
                </span>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                  <span className={`text-xl sm:text-2xl font-black ${
                    selectedItem.stokSekarang <= 0 
                      ? 'text-red-600' 
                      : selectedItem.stokSekarang < selectedItem.stokMin 
                        ? 'text-amber-600' 
                        : 'text-slate-900'
                  }`}>
                    {selectedItem.stokSekarang}
                  </span>
                  <span className="text-xs font-extrabold text-slate-600 uppercase">
                    {selectedItem.satuan || 'Unit'}
                  </span>
                </div>

                {selectedItem.stokSekarang <= 0 ? (
                  <span className="text-[10px] text-red-700 font-bold flex items-center gap-1 mt-0.5 sm:mt-1 bg-red-100 px-2 py-0.5 rounded-md border border-red-200">
                    <AlertTriangle className="w-3 h-3 text-red-600 shrink-0" /> Stok Kosong (0)
                  </span>
                ) : selectedItem.stokSekarang < selectedItem.stokMin ? (
                  <span className="text-[10px] text-amber-800 font-bold flex items-center gap-1 mt-0.5 sm:mt-1 bg-amber-100 px-2 py-0.5 rounded-md border border-amber-200">
                    <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" /> Stok Menipis (&lt;{selectedItem.stokMin})
                  </span>
                ) : (
                  <span className="text-[10px] text-emerald-800 font-bold flex items-center gap-1 mt-0.5 sm:mt-1 bg-emerald-100 px-2 py-0.5 rounded-md border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" /> Stok Aman Tersedia
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-5 bg-amber-50/70 border-2 border-dashed border-amber-300 rounded-2xl text-center text-xs text-amber-900 space-y-1.5">
          <AlertTriangle className="w-6 h-6 mx-auto text-amber-500" />
          <p className="font-extrabold text-sm text-amber-900">Belum Ada Barang yang Dipilih</p>
          <p className="text-[11px] text-amber-700 max-w-md mx-auto">
            Silakan ketik nama barang, kode, atau gunakan tombol <strong>"Jelajahi Katalog Lengkap"</strong> di atas untuk memilih barang persediaan.
          </p>
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
