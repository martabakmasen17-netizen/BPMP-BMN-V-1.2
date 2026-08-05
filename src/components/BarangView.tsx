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
    const stokSekarang = Number(item.stokSekarang) || 0;
    const stokMin = Number(item.stokMin) || 0;
    
    if (stockFilter === 'safe') {
      matchesStock = stokSekarang >= stokMin && stokSekarang > 0;
    } else if (stockFilter === 'low') {
      matchesStock = stokSekarang < stokMin && stokSekarang > 0;
    } else if (stockFilter === 'empty') {
      matchesStock = stokSekarang === 0;
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

    setFormData({
      id: nextCode,
      kategoriId: firstCatId,
      kategori: firstCatNama,
      nama: '',
      supplier: supplierList[0]?.nama || '',
      satuan: satuanList[0]?.nama || 'Pcs',
      lokasiRak: 'Rak ATK - A1',
      stokSekarang: 10,
      stokMin: 5,
      stokMaks: 100,
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
      id: `${selected.id}-${nextCode}`
    }));
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nama) return;
    onAddBarang(formData);
    setShowAddModal(false);
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

  const getStockStatusBadge = (current: number, min: number) => {
    if (current === 0) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 whitespace-nowrap">
          <span className="w-1.5 h-1.5 bg-red-600 rounded-full" />
          Stok Habis (0)
        </span>
      );
    }
    if (current < min) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700 whitespace-nowrap">
          <span className="w-1.5 h-1.5 bg-amber-600 rounded-full" />
          Kritis ({current})
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 whitespace-nowrap">
        <span className="w-1.5 h-1.5 bg-green-600 rounded-full" />
        Aman ({current})
      </span>
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
                    <td className="p-4 max-w-[200px]">
                      <div className="font-bold text-gray-900 truncate" title={item.nama}>
                        {item.nama}
                      </div>
                      <div className="text-[10px] text-gray-500 font-medium mt-0.5">
                        Satuan: {item.satuan}
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
                      {getStockStatusBadge(item.stokSekarang, item.stokMin)}
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
                              onClick={() => {
                                if (confirm(`Apakah Anda yakin ingin menghapus barang "${item.nama}"?`)) {
                                  onDeleteBarang(item.id);
                                }
                              }}
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
              <div className="grid grid-cols-2 gap-3 text-xs border-t border-gray-100 pt-4">
                <div>
                  <span className="text-gray-400 block">Stok Sekarang</span>
                  <span className="font-bold text-gray-900 block mt-0.5">{activeItem.stokSekarang} {activeItem.satuan}</span>
                </div>
                <div>
                  <span className="text-gray-400 block">Lokasi Rak</span>
                  <span className="font-bold text-gray-900 block mt-0.5">{activeItem.lokasiRak}</span>
                </div>
                <div>
                  <span className="text-gray-400 block">Stok Minimum</span>
                  <span className="font-bold text-gray-900 block mt-0.5">{activeItem.stokMin} {activeItem.satuan}</span>
                </div>
                <div>
                  <span className="text-gray-400 block">Supplier</span>
                  <span className="font-bold text-gray-900 block mt-0.5 truncate">{activeItem.supplier}</span>
                </div>
              </div>

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

                {/* Auto Kode Barang */}
                <div className="space-y-1">
                  <label className="block text-gray-500">Kode Barang (Otomatis per Kategori)</label>
                  <input
                    type="text"
                    disabled
                    value={formData.id}
                    className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl font-mono font-bold text-blue-700 cursor-not-allowed"
                  />
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
                <div className="space-y-1">
                  <label className="block text-gray-500">Satuan Pengukuran *</label>
                  <select
                    value={formData.satuan}
                    onChange={e => setFormData({ ...formData, satuan: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  >
                    {satuanList.map(st => (
                      <option key={st.id} value={st.nama}>
                        {st.nama}
                      </option>
                    ))}
                  </select>
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
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl cursor-pointer"
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
                <div className="space-y-1">
                  <label className="block text-gray-500">Satuan Pengukuran *</label>
                  <select
                    value={editFormData.satuan}
                    onChange={e => setEditFormData({ ...editFormData, satuan: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  >
                    {satuanList.map(st => (
                      <option key={st.id} value={st.nama}>
                        {st.nama}
                      </option>
                    ))}
                  </select>
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
    </div>
  );
}
