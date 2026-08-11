/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Plus,
  Search,
  SlidersHorizontal,
  Eye,
  Edit2,
  Trash2,
  X,
  PlusSquare, Upload,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  PackageCheck,
  FolderTree,
  Tag,
  AlertCircle,
  FileSpreadsheet,
  Printer,
  Download
} from 'lucide-react';
import { Barang, Kategori, Supplier, Satuan } from '../types';
import ImagePicker from './ImagePicker';
import ExportConfirmModal from './ExportConfirmModal';
import ConfirmationModal from './ConfirmationModal';
import {
  evaluateStockStatus,
  getEquivalentBaseStock,
  getEffectiveStokMin,
  getEffectiveStokMaks,
  getSatuanMetadata
} from '../utils/unitUtils';

interface BarangViewProps {
  barang: Barang[];
  kategoriList: Kategori[];
  supplierList: Supplier[];
  satuanList: Satuan[];
  onAddBarang: (b: Omit<Barang, 'createdAt' | 'updatedAt'>) => void;
  onEditBarang: (id: string, b: Partial<Barang>) => void;
  onDeleteBarang: (id: string) => void;
  onImportCsv?: (file: File) => void;
  currentUserRole: string;
  logoUrl?: string;
}

export default function BarangView({
  barang,
  kategoriList,
  supplierList,
  satuanList,
  onAddBarang,
  onEditBarang,
  onDeleteBarang,
  onImportCsv,
  currentUserRole,
  logoUrl
}: BarangViewProps) {
  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [stockFilter, setStockFilter] = useState<'all' | 'safe' | 'low' | 'empty'>('all');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showConfirmAddModal, setShowConfirmAddModal] = useState(false);
  const [showConfirmDeleteModal, setShowConfirmDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<Barang | null>(null);
  const [activeItem, setActiveItem] = useState<Barang | null>(null);

  const executeExportSpreadsheet = (data: Barang[], summaryText: string) => {
    const headers = 'Kode Barang,Nama Barang,Kategori,Supplier,Satuan,Lokasi Rak,Stok Sekarang,Stok Minimum\n';
    const rows = data
      .map(
        b =>
          `"${b.id}","${b.nama}","${b.kategori}","${b.supplier}","${b.satuan}","${b.lokasiRak}",${b.stokSekarang},${b.stokMin}`
      )
      .join('\n');
    const csvContent = 'data:text/csv;charset=utf-8,' + encodeURIComponent(headers + rows);

    const link = document.createElement('a');
    link.setAttribute('href', csvContent);
    link.setAttribute('download', `Katalog_Barang_BMN_BPMP_Sumsel_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Form states
  const [formData, setFormData] = useState({
    id: '000001',
    kategoriId: '1010301001',
    kategori: '',
    nama: '',
    supplier: '',
    satuan: '',
    lokasiRak: '',
    stokSekarang: 0,
    stokMin: 0,
    stokMaks: 50,
    deskripsi: '',
    imageUrl: ''
  });

  // Edit form state
  const [editFormData, setEditFormData] = useState<Partial<Barang>>({});

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const isReadOnly = currentUserRole === 'Viewer' || currentUserRole === 'Pimpinan';

  // Filtering
  const filteredBarang = barang.filter(item => {
    const matchesSearch =
      String(item.nama || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(item.id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(item.kategoriId || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(item.lokasiRak || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = selectedCategory ? item.kategori === selectedCategory : true;

    let matchesStock = true;
    const evaluation = evaluateStockStatus(item, satuanList);
    
    if (stockFilter === 'safe') {
      matchesStock = evaluation.isSafe;
    } else if (stockFilter === 'low') {
      matchesStock = evaluation.isLowStock;
    } else if (stockFilter === 'empty') {
      matchesStock = evaluation.isOutOfStock;
    }

    return matchesSearch && matchesCategory && matchesStock;
  });

  // Paginated data
  const totalPages = Math.ceil(filteredBarang.length / itemsPerPage);
  const paginatedBarang = filteredBarang.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleOpenAdd = () => {
    const firstCat = kategoriList[0];
    const firstCatId = firstCat ? firstCat.id : '1010301001';
    const firstCatNama = firstCat ? firstCat.nama : 'ALAT TULIS';
    const sameCatItems = barang.filter(b => b.kategoriId === firstCatId || b.kategori === firstCatNama);
    const nextCode = String(sameCatItems.length + 1).padStart(6, '0');

    const defaultSatuan = satuanList[0]?.nama || 'Buah';
    const meta = getSatuanMetadata(defaultSatuan, satuanList);

    setFormData({
      id: nextCode,
      kategoriId: firstCatId,
      kategori: firstCatNama,
      nama: '',
      supplier: supplierList[0]?.nama || '',
      satuan: defaultSatuan,
      lokasiRak: 'Rak ATK - A1',
      stokSekarang: meta.rekomendasiStokMin * 2,
      stokMin: meta.rekomendasiStokMin,
      stokMaks: meta.rekomendasiStokMaks,
      deskripsi: '',
      imageUrl: 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?auto=format&fit=crop&q=80&w=200'
    });
    setShowAddModal(true);
  };

  const handleKategoriChangeInAdd = (catId: string) => {
    const selected = kategoriList.find(k => k.id === catId);
    if (!selected) return;
    const sameCatItems = barang.filter(b => b.kategoriId === catId || b.kategori === selected.nama);
    const nextCode = String(sameCatItems.length + 1).padStart(6, '0');
    setFormData(prev => ({
      ...prev,
      kategoriId: selected.id,
      kategori: selected.nama,
      id: nextCode
    }));
  };

  const isCodeValidFormat = /^\d{6}$/.test(formData.id || '');
  const isCodeDuplicate = barang.some(b => b.id === `${formData.kategoriId}-${formData.id}`);
  const isAddFormValid = formData.nama && isCodeValidFormat && !isCodeDuplicate;

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAddFormValid) return;
    setShowConfirmAddModal(true);
  };

  const handleConfirmAdd = () => {
    onAddBarang(formData);
    setShowConfirmAddModal(false);
    setShowAddModal(false);
  };

  const handleOpenDelete = (item: Barang) => {
    setItemToDelete(item);
    setShowConfirmDeleteModal(true);
  };

  const handleConfirmDelete = () => {
    if (itemToDelete) {
      onDeleteBarang(itemToDelete.id);
      setShowConfirmDeleteModal(false);
      setItemToDelete(null);
    }
  };

  const handleOpenEdit = (item: Barang) => {
    setEditFormData(item);
    setShowEditModal(true);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editFormData.id || !editFormData.nama) return;
    onEditBarang(editFormData.id, editFormData);
    setShowEditModal(false);
  };

  const handleOpenDetail = (item: Barang) => {
    setActiveItem(item);
    setShowDetailModal(true);
  };

  const getStockStatusBadge = (item: Barang) => {
    const evaluation = evaluateStockStatus(item, satuanList);
    if (evaluation.isOutOfStock) {
      return (
        <div className="flex flex-col items-center">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 whitespace-nowrap border border-rose-200">
            <span className="w-1.5 h-1.5 bg-rose-600 rounded-full" />
            Stok Habis (0)
          </span>
          <span className="text-[10px] text-rose-600 font-semibold mt-0.5">Min: {evaluation.effectiveMin} {item.satuan}</span>
        </div>
      );
    }
    if (evaluation.isLowStock) {
      return (
        <div className="flex flex-col items-center">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 whitespace-nowrap border border-amber-200">
            <span className="w-1.5 h-1.5 bg-amber-600 rounded-full" />
            Kritis ({item.stokSekarang} {item.satuan})
          </span>
          <span className="text-[10px] text-amber-700 font-semibold mt-0.5">
            Batas Min: {evaluation.effectiveMin} {item.satuan}
          </span>
        </div>
      );
    }
    return (
      <div className="flex flex-col items-center">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 whitespace-nowrap border border-emerald-200">
          <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full" />
          Aman ({item.stokSekarang} {item.satuan})
        </span>
        {evaluation.isMultiUnit && (
          <span className="text-[10px] text-emerald-700 font-medium mt-0.5">
            ≈ {evaluation.baseQty.toLocaleString('id-ID')} {evaluation.baseSatuan}
          </span>
        )}
      </div>
    );
  };

  const visiblePages = (() => {
    const delta = 1;
    const range = [];
    const rangeWithDots = [];
    let l;

    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= currentPage - delta && i <= currentPage + delta)) {
        range.push(i);
      }
    }

    for (let i of range) {
      if (l) {
        if (i - l === 2) {
          rangeWithDots.push(l + 1);
        } else if (i - l !== 1) {
          rangeWithDots.push('...');
        }
      }
      rangeWithDots.push(i);
      l = i;
    }
    return rangeWithDots;
  })();

  return (
    <div className="space-y-4">
      {/* Search and Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-3 items-start md:items-center justify-between">
        <div className="w-full flex-1 flex flex-col md:flex-row flex-wrap gap-2 md:items-center">
          {/* Search */}
          <div className="relative w-full md:max-w-xs">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari nama, kode, lokasi rak..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className="w-full md:w-auto px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            <option value="">Semua Kategori</option>
            {kategoriList.map(cat => (
              <option key={cat.id} value={cat.nama}>
                {cat.nama}
              </option>
            ))}
          </select>

          {/* Stock Filter */}
          <select
            value={stockFilter}
            onChange={e => setStockFilter(e.target.value as any)}
            className="w-full md:w-auto px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            <option value="all">Semua Level Stok</option>
            <option value="safe">Stok Aman</option>
            <option value="low">Stok Menipis / Kritis</option>
            <option value="empty">Stok Kosong</option>
          </select>
        </div>

        {/* Create Action */}
        <div className="w-full md:w-auto flex flex-col sm:flex-row items-center gap-2 mt-1 md:mt-0 pt-3 md:pt-0 border-t md:border-0 border-gray-100">
          <button
            onClick={() => setShowExportModal(true)}
            className="w-full md:w-auto flex items-center justify-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
          >
            <Download className="w-4 h-4 text-green-400" /> Ekspor Data (.csv)
          </button>
          {!isReadOnly && (
            <>
              {currentUserRole === 'Administrator' && (
                <button
                  onClick={() => {
                    const fileInput = document.createElement('input');
                    fileInput.type = 'file';
                    fileInput.accept = '.csv';
                    fileInput.onchange = (e: any) => {
                      const file = e.target.files[0];
                      if (file) {
                        onImportCsv && onImportCsv(file);
                      }
                    };
                    fileInput.click();
                  }}
                  className="w-full md:w-auto flex items-center justify-center gap-1.5 px-4 py-2 bg-white border border-gray-200 hover:bg-slate-50 text-gray-700 rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
                >
                  <Upload className="w-4 h-4" /> Import CSV
                </button>
              )}
              <button
                onClick={handleOpenAdd}
                className="w-full md:w-auto flex items-center justify-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Tambah Barang
              </button>
            </>
          )}
        </div>
      </div>

      {/* Responsive Grid/Table */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-gray-100 text-gray-500 font-bold uppercase tracking-wider text-[10px]">
                <th className="p-4">Visual</th>
                <th className="p-4">Kode Barang</th>
                <th className="p-4">Nama Barang</th>
                <th className="p-4">Kategori / Supplier</th>
                <th className="p-4">Rak</th>
                <th className="p-4 text-center">Status Stok</th>
                <th className="p-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium">
              {paginatedBarang.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-gray-400">
                    <div className="flex flex-col items-center gap-2">
                      <PackageCheck className="w-10 h-10 text-gray-300" />
                      <span>Tidak ada item barang persediaan ditemukan</span>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedBarang.map((item, idx) => (
                  <tr key={`${item.id}_${item.kategoriId || ''}_${idx}`} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4">
                      <img
                        src={item.imageUrl}
                        alt={item.nama}
                        referrerPolicy="no-referrer"
                        className="w-10 h-10 rounded-lg object-cover bg-gray-100 border border-gray-200 flex-shrink-0"
                      />
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col gap-1 mt-1">
                        <span className="text-gray-500 text-xs font-medium bg-gray-100 px-2 py-1 rounded w-fit inline-flex items-center gap-1">
                          <Tag className="w-3 h-3" />
                          Kode: <strong className="text-gray-700 tracking-wide font-mono">{item.id.replace('-', '.')}</strong>
                        </span>
                      </div>
                    </td>
                    <td className="p-4 max-w-[220px]">
                      <div className="font-bold text-gray-900 truncate" title={item.nama}>
                        {item.nama}
                      </div>
                      <div className="text-[10px] text-gray-500 font-medium mt-0.5 flex flex-wrap items-center gap-1.5">
                        <span>Satuan: <strong className="text-gray-700">{item.satuan}</strong></span>
                        {(() => {
                          const equiv = getEquivalentBaseStock(Number(item.stokSekarang) || 0, item.satuan, satuanList);
                          if (equiv.isMultiUnit) {
                            return (
                              <span className="text-blue-600 bg-blue-50 px-1.5 py-0.2 rounded text-[9px] font-bold border border-blue-200">
                                1 {item.satuan} = {equiv.faktorKonversi} {equiv.baseSatuan}
                              </span>
                            );
                          }
                          return null;
                        })()}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="text-gray-700 truncate max-w-[150px]">{item.kategori}</div>
                      <div className="text-[10px] text-gray-400 truncate max-w-[150px] mt-0.5">
                        {item.supplier}
                      </div>
                    </td>
                    <td className="p-4 max-w-[100px] sm:max-w-[140px]">
                      <div className="flex items-center">
                        <span className="text-slate-600 font-bold bg-slate-50 border border-slate-200 px-2 py-1 rounded-md text-[10px] truncate w-full shadow-2xs" title={item.lokasiRak}>
                          {item.lokasiRak}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      {getStockStatusBadge(item)}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleOpenDetail(item)}
                          className="p-1.5 hover:bg-slate-100 rounded-lg text-blue-600 cursor-pointer"
                          title="Detail / QR"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {!isReadOnly && (
                          <>
                            <button
                              onClick={() => handleOpenEdit(item)}
                              className="p-1.5 hover:bg-slate-100 rounded-lg text-amber-600 cursor-pointer"
                              title="Edit"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleOpenDelete(item)}
                              className="p-1.5 hover:bg-red-50 rounded-lg text-red-600 cursor-pointer"
                              title="Hapus"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="p-4 bg-slate-50 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-xs text-gray-500 font-medium text-center sm:text-left">
              Menampilkan <strong className="text-slate-700">{paginatedBarang.length}</strong> dari <strong className="text-slate-700">{filteredBarang.length}</strong> item
            </span>
            <div className="flex items-center gap-1.5 w-full sm:w-auto justify-center">
              <button
                disabled={currentPage === 1}
                onClick={() => handlePageChange(currentPage - 1)}
                className="p-1.5 border border-gray-200 rounded-lg text-gray-500 hover:bg-white disabled:opacity-50 cursor-pointer transition-colors shrink-0"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-1">
                {visiblePages.map((page, idx) => (
                  <button
                    key={idx}
                    disabled={page === '...'}
                    onClick={() => page !== '...' && handlePageChange(page as number)}
                    className={`px-3 py-1.5 text-xs rounded-lg font-bold border transition-colors shrink-0 ${
                      page === '...'
                        ? 'border-transparent bg-transparent text-gray-400 cursor-default px-1.5'
                        : currentPage === page
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm cursor-pointer'
                        : 'border-gray-200 bg-white text-gray-700 hover:bg-slate-50 cursor-pointer hover:border-gray-300'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>
              <button
                disabled={currentPage === totalPages}
                onClick={() => handlePageChange(currentPage + 1)}
                className="p-1.5 border border-gray-200 rounded-lg text-gray-500 hover:bg-white disabled:opacity-50 cursor-pointer transition-colors shrink-0"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* DETAIL & QR MODAL */}
      {showDetailModal && activeItem && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-xl border border-gray-100 overflow-hidden flex flex-col max-h-[90vh] my-auto">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between shrink-0 bg-white">
              <span className="text-xs font-bold text-gray-400">DETAIL BARANG PERSEDIAAN</span>
              <button
                onClick={() => setShowDetailModal(false)}
                className="p-1 hover:bg-gray-100 rounded-lg text-gray-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-4 overflow-y-auto">
              <div className="flex gap-4 items-start">
                <img
                  src={activeItem.imageUrl}
                  alt={activeItem.nama}
                  referrerPolicy="no-referrer"
                  className="w-20 h-20 rounded-xl object-cover border border-gray-200 flex-shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <span className="font-mono bg-blue-50 text-blue-800 px-2 py-0.5 rounded text-[10px] font-bold">
                    {activeItem.id}
                  </span>
                  <h3 className="font-bold text-gray-900 text-base mt-1.5 leading-tight">{activeItem.nama}</h3>
                  <p className="text-xs text-gray-500 mt-1">{activeItem.kategori}</p>
                </div>
              </div>

              {/* Identification Badge Center */}
              <div className="bg-slate-50 p-4 rounded-xl space-y-2 border border-slate-200">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500 font-bold flex items-center gap-1">
                    <FolderTree className="w-3.5 h-3.5 text-red-600" /> Kode Kategori:
                  </span>
                  <span className="font-mono font-bold bg-red-100 text-red-800 px-2.5 py-1 rounded-lg border border-red-200 text-xs">
                    {activeItem.kategoriId || '1010301001'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500 font-bold flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5 text-blue-600" /> Kode Barang Item:
                  </span>
                  <span className="font-mono font-bold bg-blue-100 text-blue-800 px-2.5 py-1 rounded-lg border border-blue-200 text-xs">
                    {activeItem.id}
                  </span>
                </div>
                <p className="text-[10px] text-gray-400 text-center italic pt-1 border-t border-slate-200">
                  * Barcode & QR Code fisik dicetak per Kategori pada menu "Kategori Barang".
                </p>
              </div>

              {/* Technical Specifications */}
              {(() => {
                const evalItem = evaluateStockStatus(activeItem, satuanList);
                const equiv = getEquivalentBaseStock(Number(activeItem.stokSekarang) || 0, activeItem.satuan, satuanList);
                return (
                  <div className="space-y-3 border-t border-gray-100 pt-4">
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        <span className="text-gray-400 block text-[10px] font-bold uppercase">Stok Saat Ini</span>
                        <span className="font-extrabold text-gray-900 block mt-0.5 text-sm">
                          {activeItem.stokSekarang} {activeItem.satuan}
                        </span>
                        {equiv.isMultiUnit && (
                          <span className="text-[10px] text-blue-600 font-bold block mt-0.5">
                            Setara: {equiv.baseQty.toLocaleString('id-ID')} {equiv.baseSatuan}
                          </span>
                        )}
                      </div>
                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        <span className="text-gray-400 block text-[10px] font-bold uppercase">Batas Stok Minimum</span>
                        <span className="font-extrabold text-gray-900 block mt-0.5 text-sm">
                          {evalItem.effectiveMin} {activeItem.satuan}
                        </span>
                        {evalItem.isMultiUnit && (
                          <span className="text-[10px] text-gray-500 font-medium block mt-0.5">
                            Setara: {evalItem.effectiveMin * evalItem.faktorKonversi} {evalItem.baseSatuan}
                          </span>
                        )}
                      </div>
                      <div>
                        <span className="text-gray-400 block">Lokasi Rak</span>
                        <span className="font-bold text-gray-900 block mt-0.5">{activeItem.lokasiRak}</span>
                      </div>
                      <div>
                        <span className="text-gray-400 block">Supplier</span>
                        <span className="font-bold text-gray-900 block mt-0.5 truncate">{activeItem.supplier}</span>
                      </div>
                    </div>

                    {/* Stock Health Assessment Banner */}
                    <div className={`p-2.5 rounded-xl border text-xs flex items-center justify-between ${
                      evalItem.isOutOfStock ? 'bg-rose-50 border-rose-200 text-rose-800' :
                      evalItem.isLowStock ? 'bg-amber-50 border-amber-200 text-amber-800' :
                      'bg-emerald-50 border-emerald-200 text-emerald-800'
                    }`}>
                      <span className="font-bold">Status Kesehatan Persediaan:</span>
                      <span className="font-black px-2 py-0.5 rounded-md bg-white border shadow-2xs">
                        {evalItem.isOutOfStock ? 'Habis (0)' : evalItem.isLowStock ? 'Kritis (Perlu Pengadaan)' : 'Aman'}
                      </span>
                    </div>
                  </div>
                );
              })()}

              {/* Description */}
              <div className="border-t border-gray-100 pt-3">
                <span className="text-gray-400 text-[10px] font-bold block uppercase tracking-wider">Deskripsi</span>
                <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                  {activeItem.deskripsi || 'Tidak ada deskripsi tambahan.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ADD MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-xl border border-gray-100 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-slate-50 flex-shrink-0">
              <h3 className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
                <PlusSquare className="w-4 h-4 text-blue-600" />
                Registrasi Barang Baru (Katalog BMN)
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 hover:bg-gray-100 rounded-lg text-gray-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleAddSubmit} className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs font-medium text-gray-700 max-h-[60vh]">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Nama */}
                  <div className="sm:col-span-2 space-y-1">
                    <label className="block text-gray-500">Nama Barang *</label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Kertas HVS A4 80gr"
                      value={formData.nama}
                      onChange={e => setFormData({ ...formData, nama: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
                    />
                  </div>

                {/* Kategori */}
                <div className="space-y-1">
                  <label className="block text-gray-500">Kategori Barang *</label>
                  <select
                    value={formData.kategoriId}
                    onChange={e => handleKategoriChangeInAdd(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none font-medium"
                  >
                    {kategoriList.map(cat => (
                      <option key={cat.id} value={cat.id}>
                        {cat.id} - {cat.nama}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Manual Kode Barang */}
                <div className="space-y-1">
                  <label className="block text-gray-500">Kode Barang (6 Angka) *</label>
                  <div className="flex rounded-xl overflow-hidden shadow-sm border focus-within:ring-2 focus-within:ring-blue-600 focus-within:border-blue-600 transition-colors">
                    <span className="flex items-center px-3 bg-slate-100 text-slate-500 border-r border-gray-200 font-mono text-sm">
                      {formData.kategoriId}-
                    </span>
                    <input
                      type="text"
                      maxLength={6}
                      required
                      value={formData.id}
                      onChange={e => setFormData({ ...formData, id: e.target.value.replace(/\D/g, '') })}
                      className="w-full px-3 py-2 outline-none font-mono font-bold text-gray-900"
                      placeholder="000001"
                    />
                  </div>
                  {formData.id && !isCodeValidFormat && (
                    <p className="text-red-500 text-[10px] font-bold mt-1">Kode harus persis 6 angka.</p>
                  )}
                  {isCodeDuplicate && (
                    <p className="text-red-500 text-[10px] font-bold mt-1">Kode sudah digunakan di kategori ini!</p>
                  )}
                </div>

                {/* Supplier */}
                <div className="space-y-1">
                  <label className="block text-gray-500">Supplier *</label>
                  <select
                    value={formData.supplier}
                    onChange={e => setFormData({ ...formData, supplier: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  >
                    {supplierList.map(s => (
                      <option key={s.id} value={s.nama}>
                        {s.nama}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Satuan */}
                <div className="space-y-1 sm:col-span-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-gray-500">Satuan Pengukuran *</label>
                    {(() => {
                      const meta = getSatuanMetadata(formData.satuan, satuanList);
                      return (
                        <button
                          type="button"
                          onClick={() => {
                            setFormData(prev => ({
                              ...prev,
                              stokMin: meta.rekomendasiStokMin,
                              stokMaks: meta.rekomendasiStokMaks
                            }));
                          }}
                          className="text-[10px] text-blue-600 hover:text-blue-700 font-bold underline cursor-pointer"
                        >
                          Gunakan Standar Satuan ({meta.rekomendasiStokMin} {meta.nama})
                        </button>
                      );
                    })()}
                  </div>
                  <select
                    value={formData.satuan}
                    onChange={e => {
                      const newSatuan = e.target.value;
                      const meta = getSatuanMetadata(newSatuan, satuanList);
                      setFormData(prev => ({
                        ...prev,
                        satuan: newSatuan,
                        stokMin: meta.rekomendasiStokMin,
                        stokMaks: meta.rekomendasiStokMaks
                      }));
                    }}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none font-bold text-gray-800"
                  >
                    {satuanList.map(st => (
                      <option key={st.id} value={st.nama}>
                        {st.nama} {st.faktorKonversi && st.faktorKonversi > 1 ? `(1 ${st.nama} = ${st.faktorKonversi} ${st.satuanDasar})` : ''}
                      </option>
                    ))}
                  </select>

                  {(() => {
                    const meta = getSatuanMetadata(formData.satuan, satuanList);
                    return (
                      <div className="bg-blue-50/80 p-2.5 rounded-xl border border-blue-200/70 text-[11px] text-blue-900 mt-1 flex items-start gap-2">
                        <Sparkles className="w-3.5 h-3.5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold">
                            {meta.isMultiUnit ? `Satuan Kemasan Grosir: 1 ${meta.nama} = ${meta.faktorKonversi} ${meta.satuanDasar}` : `Satuan Eceran Tunggal: 1 ${meta.nama}`}
                          </p>
                          <p className="text-blue-700 mt-0.5">
                            Rekomendasi Batas Min: <strong>{meta.rekomendasiStokMin} {meta.nama}</strong> {meta.isMultiUnit ? `(setara ${meta.rekomendasiStokMin * meta.faktorKonversi} ${meta.satuanDasar})` : ''} • Batas Maks: <strong>{meta.rekomendasiStokMaks} {meta.nama}</strong>
                          </p>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Lokasi Rak */}
                <div className="space-y-1">
                  <label className="block text-gray-500">Lokasi Penempatan Rak *</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Rak ATK - A1"
                    value={formData.lokasiRak}
                    onChange={e => setFormData({ ...formData, lokasiRak: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>

                {/* Stok Sekarang */}
                <div className="space-y-1">
                  <label className="block text-gray-500">Stok Awal Sekarang *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.stokSekarang}
                    onChange={e => setFormData({ ...formData, stokSekarang: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>

                {/* Stok Min */}
                <div className="space-y-1">
                  <label className="block text-gray-500">Batas Stok Minimum *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.stokMin}
                    onChange={e => setFormData({ ...formData, stokMin: e.target.value === '' ? 0 : parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>

                {/* Deskripsi */}
                <div className="sm:col-span-2 space-y-1">
                  <label className="block text-gray-500">Deskripsi / Spesifikasi Barang</label>
                  <textarea
                    rows={2}
                    placeholder="Keterangan fisik, spesifikasi ukuran, berat atau merek barang..."
                    value={formData.deskripsi}
                    onChange={e => setFormData({ ...formData, deskripsi: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>

                {/* Image Picker */}
                <div className="sm:col-span-2">
                  <ImagePicker
                    value={formData.imageUrl || ''}
                    onChange={val => setFormData({ ...formData, imageUrl: val })}
                    label="Foto / Gambar Barang BMN (Ambil Foto atau Pilih File)"
                  />
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-2 justify-end p-4 border-t border-gray-100 bg-slate-50 flex-shrink-0">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 border border-gray-200 rounded-xl hover:bg-slate-50 cursor-pointer text-gray-600 font-bold"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={!isAddFormValid}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl cursor-pointer transition-colors"
              >
                Daftarkan Item
              </button>
            </div>
          </form>
        </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {showEditModal && editFormData.id && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-xl border border-gray-100 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-slate-50 flex-shrink-0">
              <h3 className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
                <Edit2 className="w-4 h-4 text-amber-500" />
                Ubah Informasi Barang ({editFormData.id})
              </h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-1 hover:bg-gray-100 rounded-lg text-gray-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs font-medium text-gray-700 max-h-[60vh]">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Nama */}
                  <div className="sm:col-span-2 space-y-1">
                    <label className="block text-gray-500">Nama Barang *</label>
                    <input
                      type="text"
                      required
                      value={editFormData.nama}
                      onChange={e => setEditFormData({ ...editFormData, nama: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
                    />
                  </div>

                {/* Kategori */}
                <div className="space-y-1">
                  <label className="block text-gray-500">Kategori *</label>
                  <select
                    value={editFormData.kategori}
                    disabled={true}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl bg-slate-50 text-gray-500 cursor-not-allowed"
                  >
                    {kategoriList.map(cat => (
                      <option key={cat.id} value={cat.nama}>
                        {cat.id} - {cat.nama}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Kategori tidak dapat diubah setelah barang dibuat untuk menjaga konsistensi Kode Barang.
                  </p>
                </div>

                {/* Supplier */}
                <div className="space-y-1">
                  <label className="block text-gray-500">Supplier *</label>
                  <select
                    value={editFormData.supplier}
                    onChange={e => setEditFormData({ ...editFormData, supplier: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  >
                    {supplierList.map(s => (
                      <option key={s.id} value={s.nama}>
                        {s.nama}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Satuan */}
                <div className="space-y-1 sm:col-span-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-gray-500">Satuan Pengukuran *</label>
                    {(() => {
                      const meta = getSatuanMetadata(editFormData.satuan || '', satuanList);
                      return (
                        <button
                          type="button"
                          onClick={() => {
                            setEditFormData(prev => ({
                              ...prev,
                              stokMin: meta.rekomendasiStokMin
                            }));
                          }}
                          className="text-[10px] text-blue-600 hover:text-blue-700 font-bold underline cursor-pointer"
                        >
                          Gunakan Standar Satuan ({meta.rekomendasiStokMin} {meta.nama})
                        </button>
                      );
                    })()}
                  </div>
                  <select
                    value={editFormData.satuan}
                    onChange={e => {
                      const newSatuan = e.target.value;
                      const meta = getSatuanMetadata(newSatuan, satuanList);
                      setEditFormData(prev => ({
                        ...prev,
                        satuan: newSatuan,
                        stokMin: meta.rekomendasiStokMin
                      }));
                    }}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none font-bold text-gray-800"
                  >
                    {satuanList.map(st => (
                      <option key={st.id} value={st.nama}>
                        {st.nama} {st.faktorKonversi && st.faktorKonversi > 1 ? `(1 ${st.nama} = ${st.faktorKonversi} ${st.satuanDasar})` : ''}
                      </option>
                    ))}
                  </select>

                  {(() => {
                    const meta = getSatuanMetadata(editFormData.satuan || '', satuanList);
                    return (
                      <div className="bg-blue-50/80 p-2.5 rounded-xl border border-blue-200/70 text-[11px] text-blue-900 mt-1 flex items-start gap-2">
                        <Sparkles className="w-3.5 h-3.5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold">
                            {meta.isMultiUnit ? `Satuan Kemasan Grosir: 1 ${meta.nama} = ${meta.faktorKonversi} ${meta.satuanDasar}` : `Satuan Eceran Tunggal: 1 ${meta.nama}`}
                          </p>
                          <p className="text-blue-700 mt-0.5">
                            Rekomendasi Batas Min: <strong>{meta.rekomendasiStokMin} {meta.nama}</strong> {meta.isMultiUnit ? `(setara ${meta.rekomendasiStokMin * meta.faktorKonversi} ${meta.satuanDasar})` : ''}
                          </p>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Lokasi Rak */}
                <div className="space-y-1">
                  <label className="block text-gray-500">Lokasi Penempatan Rak *</label>
                  <input
                    type="text"
                    required
                    value={editFormData.lokasiRak}
                    onChange={e => setEditFormData({ ...editFormData, lokasiRak: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>

                {/* Stok Sekarang */}
                <div className="space-y-1">
                  <label className="block text-gray-500">Stok Saat Ini (Hanya via Transaksi) *</label>
                  <input
                    type="number"
                    disabled
                    value={editFormData.stokSekarang}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl bg-slate-50 text-gray-400"
                  />
                </div>

                {/* Stok Min */}
                <div className="space-y-1">
                  <label className="block text-gray-500">Batas Stok Minimum *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={editFormData.stokMin}
                    onChange={e => setEditFormData({ ...editFormData, stokMin: e.target.value === '' ? 0 : parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>

                {/* Deskripsi */}
                <div className="sm:col-span-2 space-y-1">
                  <label className="block text-gray-500">Deskripsi / Spesifikasi Barang</label>
                  <textarea
                    rows={2}
                    value={editFormData.deskripsi}
                    onChange={e => setEditFormData({ ...editFormData, deskripsi: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>

                {/* Image Picker */}
                <div className="sm:col-span-2">
                  <ImagePicker
                    value={editFormData.imageUrl || ''}
                    onChange={val => setEditFormData({ ...editFormData, imageUrl: val })}
                    label="Foto / Gambar Barang BMN (Ambil Foto atau Pilih File)"
                  />
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-2 justify-end p-4 border-t border-gray-100 bg-slate-50 flex-shrink-0">
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 border border-gray-200 rounded-xl hover:bg-slate-50 cursor-pointer text-gray-600 font-bold"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl cursor-pointer"
              >
                Simpan Perubahan
              </button>
            </div>
          </form>
        </div>
        </div>
      )}

      {/* Export Confirm Modal */}
      <ExportConfirmModal<Barang>
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        title="Konfirmasi Ekspor Data Persediaan BMN"
        description="Filter periode pembuatan/perubahan data barang yang akan diunduh"
        dataList={filteredBarang}
        getDateFn={item => item.createdAt || ''}
        onConfirm={(filteredData, format, summaryText) => {
          executeExportSpreadsheet(filteredData, summaryText);
        }}
      />

      {/* Confirmation Modal for Adding Barang */}
      <ConfirmationModal
        isOpen={showConfirmAddModal}
        onClose={() => setShowConfirmAddModal(false)}
        onConfirm={handleConfirmAdd}
        title="Konfirmasi Registrasi Barang Baru"
        subtitle="Pastikan seluruh spesifikasi item persediaan BMN telah sesuai sebelum didaftarkan."
        variant="primary"
        confirmLabel="Ya, Daftarkan Barang"
        cancelLabel="Kembali & Cek"
        details={[
          { label: 'Kode Barang', value: `${formData.kategoriId}.${formData.id}` },
          { label: 'Nama Barang', value: formData.nama },
          { label: 'Kategori BMN', value: formData.kategori },
          { label: 'Supplier / Rekanan', value: formData.supplier || '-' },
          { label: 'Satuan', value: formData.satuan },
          { label: 'Lokasi Rak / Gudang', value: formData.lokasiRak },
          { label: 'Stok Awal', value: `${formData.stokSekarang} ${formData.satuan}` },
          { label: 'Batas Minimum', value: `${formData.stokMin} ${formData.satuan}` },
          { label: 'Batas Maksimum', value: `${formData.stokMaks} ${formData.satuan}` }
        ]}
      />

      {/* Confirmation Modal for Deleting Barang */}
      <ConfirmationModal
        isOpen={showConfirmDeleteModal && !!itemToDelete}
        onClose={() => {
          setShowConfirmDeleteModal(false);
          setItemToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Konfirmasi Hapus Barang Persediaan"
        subtitle={itemToDelete ? `Apakah Anda yakin ingin menghapus item "${itemToDelete.nama}" dari katalog persediaan BMN?` : ''}
        variant="danger"
        confirmLabel="Ya, Hapus Barang"
        cancelLabel="Batal"
        warningNote="Peringatan: Item ini akan dihapus dari katalog persediaan aktif. Seluruh mutasi masa lalu tetap tercatat dalam log pembukuan."
        details={itemToDelete ? [
          { label: 'Kode Barang', value: itemToDelete.id.replace('-', '.') },
          { label: 'Nama Barang', value: itemToDelete.nama },
          { label: 'Kategori BMN', value: itemToDelete.kategori },
          { label: 'Sisa Stok Saat Ini', value: `${itemToDelete.stokSekarang} ${itemToDelete.satuan}` },
          { label: 'Lokasi Rak', value: itemToDelete.lokasiRak }
        ] : []}
      />
    </div>
  );
}
