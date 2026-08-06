const fs = require('fs');
let code = fs.readFileSync('src/components/DashboardView.tsx', 'utf8');

const oldCards = `        {/* Card Total Items */}
        <div className="bg-white p-5 rounded-xl border border-[#E5E7EB] shadow-sm flex items-center gap-4">
          <div className="bg-[#2563EB]/10 p-3 rounded-lg text-[#2563EB]">
            <Package className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <span className="text-xs font-medium text-[#6B7280] block">Total Item Barang</span>
            <span className="text-2xl font-bold text-[#111827] block mt-0.5">{totalBarang}</span>
            <span className="text-[10px] text-[#6B7280] font-medium">{totalStokUnit} Total Unit Stok</span>
          </div>
        </div>

        {/* Card Stok Aman */}
        <div className="bg-white p-5 rounded-xl border border-[#E5E7EB] shadow-sm flex items-center gap-4">
          <div className="bg-green-50 p-3 rounded-lg text-green-600">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <span className="text-xs font-medium text-[#6B7280] block">Stok Aman</span>
            <span className="text-2xl font-bold text-[#111827] block mt-0.5">{stokAman}</span>
            <span className="text-[10px] text-green-600 font-semibold flex items-center gap-0.5">
              {totalBarang > 0 ? Math.round((stokAman / totalBarang) * 100) : 0}% dari total barang
            </span>
          </div>
        </div>

        {/* Card Stok Menipis */}
        <div className="bg-white p-5 rounded-xl border border-[#E5E7EB] shadow-sm flex items-center gap-4">
          <div className="bg-amber-50 p-3 rounded-lg text-amber-600">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <span className="text-xs font-medium text-[#6B7280] block">Stok Menipis</span>
            <span className="text-2xl font-bold text-[#DC2626] block mt-0.5">{stokMenipis}</span>
            <span className="text-[10px] text-amber-600 font-semibold">
              Butuh Pengadaan Segera
            </span>
          </div>
        </div>

        {/* Card Stok Habis */}
        <div className="bg-white p-5 rounded-xl border border-[#E5E7EB] shadow-sm flex items-center gap-4">
          <div className="bg-red-50 p-3 rounded-lg text-red-600">
            <XOctagon className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <span className="text-xs font-medium text-[#6B7280] block">Stok Kosong</span>
            <span className="text-2xl font-bold text-[#DC2626] block mt-0.5">{stokHabis}</span>
            <span className="text-[10px] text-red-600 font-semibold">
              Menghentikan Permintaan
            </span>
          </div>
        </div>`;

const newCards = `        {/* Card Total Items */}
        <div className="bg-gradient-to-br from-white to-[#F8FAFC] p-6 rounded-2xl border border-[#E2E8F0] shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Package className="w-16 h-16" />
          </div>
          <div className="flex items-center gap-4 relative z-10">
            <div className="bg-blue-600/10 p-3 rounded-xl text-blue-600">
              <Package className="w-7 h-7" />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Total Katalog</span>
              <span className="text-3xl font-black text-slate-800 block mt-1 tracking-tight">{totalBarang} <span className="text-sm font-bold text-slate-400 tracking-normal">Item</span></span>
              <span className="text-[10px] text-slate-500 font-medium mt-1 block bg-slate-100 px-2 py-0.5 rounded-full inline-block">{totalStokUnit} Unit Tersedia</span>
            </div>
          </div>
        </div>

        {/* Card Stok Aman */}
        <div className="bg-gradient-to-br from-white to-[#F0FDF4] p-6 rounded-2xl border border-green-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity text-green-700">
            <CheckCircle2 className="w-16 h-16" />
          </div>
          <div className="flex items-center gap-4 relative z-10">
            <div className="bg-green-500/10 p-3 rounded-xl text-green-600 shadow-inner">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-bold text-green-700 uppercase tracking-wider block">Stok Aman</span>
              <span className="text-3xl font-black text-green-900 block mt-1 tracking-tight">{stokAman} <span className="text-sm font-bold text-green-600 tracking-normal">Item</span></span>
              <span className="text-[10px] text-green-700 font-bold mt-1 block bg-green-100 px-2 py-0.5 rounded-full inline-block">
                {totalBarang > 0 ? Math.round((stokAman / totalBarang) * 100) : 0}% Kondisi Optimal
              </span>
            </div>
          </div>
        </div>

        {/* Card Stok Menipis */}
        <div className="bg-gradient-to-br from-white to-[#FFFBEB] p-6 rounded-2xl border border-amber-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity text-amber-700">
            <AlertTriangle className="w-16 h-16" />
          </div>
          <div className="flex items-center gap-4 relative z-10">
            <div className="bg-amber-500/10 p-3 rounded-xl text-amber-600 shadow-inner">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-bold text-amber-700 uppercase tracking-wider block">Stok Menipis</span>
              <span className="text-3xl font-black text-amber-900 block mt-1 tracking-tight">{stokMenipis} <span className="text-sm font-bold text-amber-600 tracking-normal">Item</span></span>
              <span className="text-[10px] text-amber-700 font-bold mt-1 block bg-amber-100 px-2 py-0.5 rounded-full inline-block animate-pulse">
                Butuh Pengadaan
              </span>
            </div>
          </div>
        </div>

        {/* Card Stok Habis */}
        <div className="bg-gradient-to-br from-white to-[#FEF2F2] p-6 rounded-2xl border border-red-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity text-red-700">
            <XOctagon className="w-16 h-16" />
          </div>
          <div className="flex items-center gap-4 relative z-10">
            <div className="bg-red-500/10 p-3 rounded-xl text-red-600 shadow-inner">
              <XOctagon className="w-7 h-7" />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-bold text-red-700 uppercase tracking-wider block">Stok Kosong</span>
              <span className="text-3xl font-black text-red-900 block mt-1 tracking-tight">{stokHabis} <span className="text-sm font-bold text-red-600 tracking-normal">Item</span></span>
              <span className="text-[10px] text-red-700 font-bold mt-1 block bg-red-100 px-2 py-0.5 rounded-full inline-block">
                Segera Restok
              </span>
            </div>
          </div>
        </div>`;

code = code.replace(oldCards, newCards);
fs.writeFileSync('src/components/DashboardView.tsx', code);
