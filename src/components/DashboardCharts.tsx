/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, 
  PieChart, Pie, Legend, CartesianGrid, AreaChart, Area
} from 'recharts';
import { 
  TrendingUp, PieChart as PieIcon, BarChart3, Filter, Search, 
  ChevronLeft, ChevronRight, Layers, ArrowUpDown, ShieldAlert, 
  CheckCircle2, AlertTriangle, XOctagon, Info, Sparkles, PackageCheck
} from 'lucide-react';
import { Barang, Kategori } from '../types';

interface DashboardChartsProps {
  barang: Barang[];
  kategoriList: Kategori[];
  onSelectCategoryFilter?: (katNama: string) => void;
  onQuickRestock?: (barangId: string) => void;
}

export default function DashboardCharts({
  barang,
  kategoriList,
  onSelectCategoryFilter,
  onQuickRestock
}: DashboardChartsProps) {
  // Chart Display Mode: 'bar' | 'donut' | 'health' | 'top_items'
  const [chartMode, setChartMode] = useState<'bar' | 'donut' | 'health' | 'top_items'>('bar');
  
  // Top limit state: '5' | '10' | '15' | 'all'
  const [topLimit, setTopLimit] = useState<'5' | '10' | '15' | 'all'>('10');

  // Search filter for category
  const [searchTerm, setSearchTerm] = useState('');

  // Selected Category Drill-down
  const [selectedCategoryName, setSelectedCategoryName] = useState<string | null>(null);

  // Pagination for category list if 'all' or high limit is active
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Process Category Data
  const categoryStats = useMemo(() => {
    const statsMap: { 
      [key: string]: { 
        id: string; 
        nama: string; 
        totalStok: number; 
        itemCount: number; 
        stokAman: number; 
        stokMenipis: number; 
        stokKosong: number; 
      } 
    } = {};

    // Initialize map with official kategoriList if available
    kategoriList.forEach(k => {
      statsMap[k.nama] = {
        id: k.id,
        nama: k.nama,
        totalStok: 0,
        itemCount: 0,
        stokAman: 0,
        stokMenipis: 0,
        stokKosong: 0
      };
    });

    // Populate from barang items
    barang.forEach(b => {
      const katName = b.kategori || 'Tanpa Kategori';
      if (!statsMap[katName]) {
        statsMap[katName] = {
          id: b.kategoriId || 'KAT-MISC',
          nama: katName,
          totalStok: 0,
          itemCount: 0,
          stokAman: 0,
          stokMenipis: 0,
          stokKosong: 0
        };
      }

      const stok = Number(b.stokSekarang) || 0;
      const min = Number(b.stokMin) || 0;

      statsMap[katName].totalStok += stok;
      statsMap[katName].itemCount += 1;

      if (stok === 0) {
        statsMap[katName].stokKosong += 1;
      } else if (stok < min) {
        statsMap[katName].stokMenipis += 1;
      } else {
        statsMap[katName].stokAman += 1;
      }
    });

    return Object.values(statsMap);
  }, [barang, kategoriList]);

  // Filter & Sort Category Data
  const filteredCategoryStats = useMemo(() => {
    let result = categoryStats;

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      result = result.filter(c => c.nama.toLowerCase().includes(q) || c.id.toLowerCase().includes(q));
    }

    // Sort descending by total stock
    return result.sort((a, b) => b.totalStok - a.totalStok);
  }, [categoryStats, searchTerm]);

  // Prepared chart data depending on topLimit setting
  const chartData = useMemo(() => {
    if (topLimit === 'all') return filteredCategoryStats;

    const limit = parseInt(topLimit, 10);
    if (filteredCategoryStats.length <= limit) return filteredCategoryStats;

    const topItems = filteredCategoryStats.slice(0, limit);
    const otherItems = filteredCategoryStats.slice(limit);

    const otherTotalStok = otherItems.reduce((acc, curr) => acc + curr.totalStok, 0);
    const otherItemCount = otherItems.reduce((acc, curr) => acc + curr.itemCount, 0);
    const otherStokAman = otherItems.reduce((acc, curr) => acc + curr.stokAman, 0);
    const otherStokMenipis = otherItems.reduce((acc, curr) => acc + curr.stokMenipis, 0);
    const otherStokKosong = otherItems.reduce((acc, curr) => acc + curr.stokKosong, 0);

    if (otherTotalStok > 0 || otherItemCount > 0) {
      return [
        ...topItems,
        {
          id: 'OTHERS',
          nama: `Lainnya (${otherItems.length} Kategori)`,
          totalStok: otherTotalStok,
          itemCount: otherItemCount,
          stokAman: otherStokAman,
          stokMenipis: otherStokMenipis,
          stokKosong: otherStokKosong
        }
      ];
    }

    return topItems;
  }, [filteredCategoryStats, topLimit]);

  // Top Items dataset for 'top_items' chart mode
  const topBarangData = useMemo(() => {
    return [...barang]
      .sort((a, b) => b.stokSekarang - a.stokSekarang)
      .slice(0, 10)
      .map(b => ({
        nama: b.nama.length > 20 ? b.nama.substring(0, 20) + '...' : b.nama,
        fullNama: b.nama,
        stok: b.stokSekarang,
        satuan: b.satuan,
        kategori: b.kategori
      }));
  }, [barang]);

  // Color Palette for charts
  const COLORS = [
    '#2563EB', '#3B82F6', '#6366F1', '#8B5CF6', '#EC4899', 
    '#F59E0B', '#10B981', '#06B6D4', '#64748B', '#0D9488',
    '#D97706', '#E11D48', '#4F46E5', '#0284C7', '#059669'
  ];

  // Paginated categories for bottom quick list
  const totalPages = Math.ceil(filteredCategoryStats.length / pageSize) || 1;
  const paginatedCategories = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredCategoryStats.slice(start, start + pageSize);
  }, [filteredCategoryStats, currentPage, pageSize]);

  // Items under selected category drill-down
  const activeCategoryItems = useMemo(() => {
    if (!selectedCategoryName) return [];
    return barang.filter(b => b.kategori === selectedCategoryName || b.kategoriId === selectedCategoryName);
  }, [barang, selectedCategoryName]);

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden flex flex-col justify-between">
      {/* Chart Header Bar */}
      <div className="p-4 sm:p-5 border-b border-gray-100 bg-slate-50/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-blue-100 text-blue-700 rounded-lg">
              <TrendingUp className="w-4 h-4" />
            </span>
            <h3 className="font-bold text-gray-900 text-sm">
              Visualisasi & Grafik Distribusi Stok
            </h3>
            <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold rounded-md font-mono">
              {categoryStats.length} Kategori • {barang.length} Barang
            </span>
          </div>
          <p className="text-[11px] text-gray-500 mt-1">
            Pantau sebaran persediaan BMN lintas kategori dengan mode grafik interaktif yang mudah dibaca.
          </p>
        </div>

        {/* Controls: Chart Mode Switcher & Top N Selector */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Chart Mode */}
          <div className="flex items-center bg-slate-200/80 p-1 rounded-xl font-semibold text-[11px]">
            <button
              onClick={() => setChartMode('bar')}
              className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                chartMode === 'bar' ? 'bg-white text-blue-700 font-bold shadow-xs' : 'text-gray-600 hover:text-gray-900'
              }`}
              title="Grafik Batang Volume"
            >
              <BarChart3 className="w-3.5 h-3.5" /> Batang
            </button>
            <button
              onClick={() => setChartMode('donut')}
              className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                chartMode === 'donut' ? 'bg-white text-blue-700 font-bold shadow-xs' : 'text-gray-600 hover:text-gray-900'
              }`}
              title="Grafik Donat Proporsi"
            >
              <PieIcon className="w-3.5 h-3.5" /> Donat
            </button>
            <button
              onClick={() => setChartMode('health')}
              className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                chartMode === 'health' ? 'bg-white text-blue-700 font-bold shadow-xs' : 'text-gray-600 hover:text-gray-900'
              }`}
              title="Grafik Status Kesehatan Stok"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-amber-500" /> Kesehatan
            </button>
            <button
              onClick={() => setChartMode('top_items')}
              className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                chartMode === 'top_items' ? 'bg-white text-blue-700 font-bold shadow-xs' : 'text-gray-600 hover:text-gray-900'
              }`}
              title="Top 10 Item Terbanyak"
            >
              <PackageCheck className="w-3.5 h-3.5 text-emerald-600" /> Top Item
            </button>
          </div>

          {/* Limit selector (Top 5 / 10 / 15 / All) */}
          {chartMode !== 'top_items' && (
            <div className="flex items-center gap-1 text-[11px] font-semibold text-gray-600 bg-white border border-gray-200 px-2 py-1 rounded-xl shadow-2xs">
              <span className="text-gray-400">Tampil:</span>
              <select
                value={topLimit}
                onChange={e => setTopLimit(e.target.value as any)}
                className="bg-transparent font-bold text-gray-800 focus:outline-none cursor-pointer"
              >
                <option value="5">Top 5</option>
                <option value="10">Top 10</option>
                <option value="15">Top 15</option>
                <option value="all">Semua ({filteredCategoryStats.length})</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Main Interactive Chart View Canvas */}
      <div className="p-4 sm:p-6 min-h-[340px] flex flex-col justify-center">

        {/* 1. BAR CHART MODE */}
        {chartMode === 'bar' && (
          <div className="w-full h-72 sm:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 15, right: 20, left: 10, bottom: 45 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis 
                  dataKey="nama" 
                  tick={{ fontSize: 10, fill: '#64748B', fontWeight: 600 }}
                  interval={0}
                  angle={-25}
                  textAnchor="end"
                  tickFormatter={(v) => v.length > 15 ? v.substring(0, 15) + '...' : v}
                />
                <YAxis tick={{ fontSize: 10, fill: '#64748B', fontWeight: 600 }} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-900 text-white p-3 rounded-xl text-xs shadow-xl border border-slate-700 space-y-1 min-w-[180px]">
                          <p className="font-bold text-blue-300 border-b border-slate-700 pb-1">{data.nama}</p>
                          <div className="flex justify-between pt-1">
                            <span className="text-slate-400">Total Stok Volume:</span>
                            <span className="font-bold text-white">{data.totalStok} Unit</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Jumlah Item Barang:</span>
                            <span className="font-bold text-amber-300">{data.itemCount} Barang</span>
                          </div>
                          <p className="text-[10px] text-slate-400 italic pt-1">Klik grafik untuk filter detail item</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="totalStok" radius={[6, 6, 0, 0]} className="cursor-pointer">
                  {chartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={selectedCategoryName === entry.nama ? '#1E40AF' : COLORS[index % COLORS.length]} 
                      onClick={() => {
                        if (!entry.nama.startsWith('Lainnya')) {
                          setSelectedCategoryName(selectedCategoryName === entry.nama ? null : entry.nama);
                        }
                      }}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* 2. DONUT / PIE CHART MODE */}
        {chartMode === 'donut' && (
          <div className="w-full flex flex-col md:flex-row items-center justify-center gap-6 md:gap-4 md:h-80">
            <div className="w-full h-56 sm:h-64 md:w-2/3 relative shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={95}
                    paddingAngle={3}
                    dataKey="totalStok"
                    nameKey="nama"
                    className="cursor-pointer"
                  >
                    {chartData.map((entry, index) => (
                      <Cell 
                        key={`pie-cell-${index}`} 
                        fill={selectedCategoryName === entry.nama ? '#1E40AF' : COLORS[index % COLORS.length]} 
                        onClick={() => {
                          if (!entry.nama.startsWith('Lainnya')) {
                            setSelectedCategoryName(selectedCategoryName === entry.nama ? null : entry.nama);
                          }
                        }}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        const grandTotal = categoryStats.reduce((sum, c) => sum + c.totalStok, 0) || 1;
                        const pct = Math.round((data.totalStok / grandTotal) * 100);
                        return (
                          <div className="bg-slate-900 text-white p-3 rounded-xl text-xs shadow-xl border border-slate-700 space-y-1">
                            <p className="font-bold text-blue-300 border-b border-slate-700 pb-1">{data.nama}</p>
                            <div className="flex justify-between gap-4 pt-1">
                              <span className="text-slate-400">Total Stok:</span>
                              <span className="font-bold text-white">{data.totalStok} Unit ({pct}%)</span>
                            </div>
                            <div className="flex justify-between gap-4">
                              <span className="text-slate-400">Variasi Item:</span>
                              <span className="font-bold text-amber-300">{data.itemCount} Jenis</span>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              {/* Center Donut Label */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Total Volume</span>
                <span className="text-xl font-extrabold text-gray-900">
                  {categoryStats.reduce((acc, curr) => acc + curr.totalStok, 0)}
                </span>
                <span className="text-[10px] text-blue-600 font-semibold">Unit Stok</span>
              </div>
            </div>

            {/* Side Legend Breakdown */}
            <div className="w-full md:w-1/3 max-h-64 overflow-y-auto space-y-1.5 text-xs pr-1 scrollbar-thin">
              {chartData.map((c, idx) => {
                const totalAll = categoryStats.reduce((sum, item) => sum + item.totalStok, 0) || 1;
                const percentage = Math.round((c.totalStok / totalAll) * 100);
                const isSelected = selectedCategoryName === c.nama;

                return (
                  <button
                    key={c.id}
                    onClick={() => !c.nama.startsWith('Lainnya') && setSelectedCategoryName(isSelected ? null : c.nama)}
                    className={`w-full flex items-center justify-between p-2 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected ? 'bg-blue-50 border-blue-300 shadow-2xs' : 'border-gray-100 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span 
                        className="w-3 h-3 rounded-full shrink-0" 
                        style={{ backgroundColor: COLORS[idx % COLORS.length] }} 
                      />
                      <span className="font-bold text-gray-800 truncate text-[11px]">{c.nama}</span>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-bold text-gray-900 block text-[11px]">{c.totalStok} Unit</span>
                      <span className="text-[9px] text-gray-400 font-semibold">{percentage}%</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 3. HEALTH / STATUS STACKED BAR CHART MODE */}
        {chartMode === 'health' && (
          <div className="w-full h-72 sm:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 15, right: 20, left: 10, bottom: 45 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis 
                  dataKey="nama" 
                  tick={{ fontSize: 10, fill: '#64748B', fontWeight: 600 }}
                  interval={0}
                  angle={-25}
                  textAnchor="end"
                  tickFormatter={(v) => v.length > 15 ? v.substring(0, 15) + '...' : v}
                />
                <YAxis tick={{ fontSize: 10, fill: '#64748B', fontWeight: 600 }} label={{ value: 'Jumlah Item', angle: -90, position: 'insideLeft', fontSize: 10 }} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-900 text-white p-3 rounded-xl text-xs shadow-xl border border-slate-700 space-y-1 min-w-[190px]">
                          <p className="font-bold text-blue-300 border-b border-slate-700 pb-1">{data.nama}</p>
                          <div className="flex justify-between text-emerald-400 font-medium pt-1">
                            <span>Stok Aman:</span>
                            <span className="font-bold">{data.stokAman} Item</span>
                          </div>
                          <div className="flex justify-between text-amber-400 font-medium">
                            <span>Stok Menipis:</span>
                            <span className="font-bold">{data.stokMenipis} Item</span>
                          </div>
                          <div className="flex justify-between text-red-400 font-medium">
                            <span>Stok Kosong:</span>
                            <span className="font-bold">{data.stokKosong} Item</span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend 
                  wrapperStyle={{ paddingTop: 10, fontSize: 11 }}
                  formatter={(value) => {
                    if (value === 'stokAman') return 'Stok Aman';
                    if (value === 'stokMenipis') return 'Stok Menipis';
                    if (value === 'stokKosong') return 'Stok Kosong';
                    return value;
                  }}
                />
                <Bar dataKey="stokAman" stackId="a" fill="#10B981" radius={[0, 0, 0, 0]} />
                <Bar dataKey="stokMenipis" stackId="a" fill="#F59E0B" radius={[0, 0, 0, 0]} />
                <Bar dataKey="stokKosong" stackId="a" fill="#EF4444" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* 4. TOP ITEMS MODE */}
        {chartMode === 'top_items' && (
          <div className="w-full h-72 sm:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={topBarangData}
                margin={{ top: 10, right: 30, left: 60, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                <XAxis type="number" tick={{ fontSize: 10, fill: '#64748B' }} />
                <YAxis dataKey="nama" type="category" tick={{ fontSize: 10, fill: '#1E293B', fontWeight: 600 }} width={120} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-900 text-white p-3 rounded-xl text-xs shadow-xl border border-slate-700 space-y-1">
                          <p className="font-bold text-emerald-400">{data.fullNama}</p>
                          <p className="text-slate-400 text-[11px]">Kategori: {data.kategori}</p>
                          <div className="flex justify-between font-bold pt-1 text-white">
                            <span>Stok Tersedia:</span>
                            <span className="text-blue-300">{data.stok} {data.satuan}</span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="stok" fill="#3B82F6" radius={[0, 6, 6, 0]}>
                  {topBarangData.map((_, index) => (
                    <Cell key={`top-bar-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Selected Category Drill-Down Drawer / Inspector */}
      {selectedCategoryName && (
        <div className="p-4 bg-blue-50/70 border-t border-blue-200 animate-in fade-in duration-200">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="p-1 bg-blue-600 text-white rounded-md">
                <Filter className="w-3.5 h-3.5" />
              </span>
              <h4 className="font-bold text-gray-900 text-xs">
                Detail Item Dalam Kategori: <span className="text-blue-700">"{selectedCategoryName}"</span>
              </h4>
              <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-[10px] font-bold rounded-full">
                {activeCategoryItems.length} Barang
              </span>
            </div>

            <button
              onClick={() => setSelectedCategoryName(null)}
              className="text-[11px] font-bold text-slate-500 hover:text-slate-800 bg-white border border-gray-200 px-2.5 py-1 rounded-lg shadow-2xs cursor-pointer"
            >
              Tutup Inspector
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-48 overflow-y-auto pr-1">
            {activeCategoryItems.length === 0 ? (
              <p className="col-span-full text-center text-xs text-gray-500 py-3">Tidak ada barang terdaftar dalam kategori ini.</p>
            ) : (
              activeCategoryItems.map(item => (
                <div key={item.id} className="bg-white p-2.5 rounded-xl border border-blue-100 shadow-2xs flex items-center justify-between text-xs">
                  <div className="min-w-0 pr-2">
                    <span className="font-bold text-gray-900 block truncate">{item.nama}</span>
                    <span className="text-[10px] text-gray-400 font-mono">ID: {item.id}</span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold block ${
                      item.stokSekarang === 0 ? 'bg-red-100 text-red-800' :
                      item.stokSekarang < item.stokMin ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {item.stokSekarang} {item.satuan}
                    </span>
                    {onQuickRestock && item.stokSekarang < item.stokMin && (
                      <button
                        onClick={() => onQuickRestock(item.id)}
                        className="mt-1 text-[9px] text-blue-600 hover:underline font-bold block cursor-pointer"
                      >
                        + Restok
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Category List Data Grid & Search Footer (Scales seamlessly up to 33+ and hundreds of categories!) */}
      <div className="p-4 border-t border-gray-100 bg-slate-50/40">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-gray-600" />
            <span className="font-bold text-gray-800 text-xs">Ringkasan Direktori Kategori Persediaan ({categoryStats.length})</span>
          </div>

          {/* Quick Search inside Category Directory */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Cari kategori dari 33+ data..."
              value={searchTerm}
              onChange={e => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
            />
          </div>
        </div>

        {/* Compact Table / List Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {paginatedCategories.map(c => {
            const isSelected = selectedCategoryName === c.nama;
            return (
              <div
                key={c.id}
                onClick={() => setSelectedCategoryName(isSelected ? null : c.nama)}
                className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between text-xs ${
                  isSelected 
                    ? 'bg-blue-600 text-white border-blue-600 shadow-md' 
                    : 'bg-white hover:bg-slate-50 border-gray-200/80 text-gray-700 shadow-2xs'
                }`}
              >
                <div className="min-w-0">
                  <span className={`font-bold block truncate text-[11px] ${isSelected ? 'text-white' : 'text-gray-900'}`}>
                    {c.nama}
                  </span>
                  <span className={`text-[10px] block font-mono ${isSelected ? 'text-blue-100' : 'text-gray-400'}`}>
                    {c.id} • {c.itemCount} Item Barang
                  </span>
                </div>

                <div className="text-right shrink-0 pl-2">
                  <span className={`font-bold block text-xs ${isSelected ? 'text-white' : 'text-blue-700'}`}>
                    {c.totalStok} Pcs
                  </span>
                  {c.stokKosong > 0 ? (
                    <span className={`text-[9px] font-bold ${isSelected ? 'text-red-200' : 'text-red-600'}`}>
                      {c.stokKosong} Kosong
                    </span>
                  ) : c.stokMenipis > 0 ? (
                    <span className={`text-[9px] font-bold ${isSelected ? 'text-amber-200' : 'text-amber-600'}`}>
                      {c.stokMenipis} Menipis
                    </span>
                  ) : (
                    <span className={`text-[9px] font-medium ${isSelected ? 'text-emerald-200' : 'text-emerald-600'}`}>
                      Aman
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Pagination Bar for Categories */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-3 mt-3 border-t border-gray-200/60 text-xs">
            <span className="text-[11px] text-gray-500 font-medium">
              Menampilkan Halaman {currentPage} dari {totalPages} (Total {filteredCategoryStats.length} Kategori)
            </span>

            <div className="flex items-center gap-1.5">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className="p-1.5 bg-white border border-gray-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5 text-gray-600" />
              </button>
              <span className="px-2.5 py-1 bg-white border border-gray-200 rounded-lg font-bold text-gray-800 text-[11px]">
                {currentPage} / {totalPages}
              </span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                className="p-1.5 bg-white border border-gray-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
              >
                <ChevronRight className="w-3.5 h-3.5 text-gray-600" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
