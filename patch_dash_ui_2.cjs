const fs = require('fs');
let code = fs.readFileSync('src/components/DashboardView.tsx', 'utf8');

const oldCards2 = `        {/* Card Transactions - Masuk */}
        <div className="bg-white p-5 rounded-xl border border-[#E5E7EB] shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-green-50 p-3 rounded-lg text-green-600">
              <ArrowDownLeft className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-[#111827] text-sm">Barang Masuk</h3>
              <p className="text-xs text-[#6B7280]">Penerimaan gudang BMN</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 border-t border-[#E5E7EB] pt-4 mt-auto">
            <div>
              <span className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider block mb-1">Hari Ini</span>
              <span className="text-xl font-black text-[#111827] block">{barangMasukCountToday} <span className="text-[10px] font-medium text-[#6B7280]">Trx</span></span>
              <span className="text-[9px] text-[#6B7280] font-medium">{todayDateStr}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider block mb-1">Bulan Ini</span>
              <span className="text-xl font-black text-[#111827] block">{barangMasukCountBulanIni} <span className="text-[10px] font-medium text-[#6B7280]">Trx</span></span>
              <span className="text-[9px] text-[#6B7280] font-medium">{monthPeriodStr}</span>
            </div>
          </div>
        </div>

        {/* Card Transactions - Keluar */}
        <div className="bg-white p-5 rounded-xl border border-[#E5E7EB] shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-red-50 p-3 rounded-lg text-red-600">
              <ArrowUpRight className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-[#111827] text-sm">Barang Keluar</h3>
              <p className="text-xs text-[#6B7280]">Distribusi ke unit kerja</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 border-t border-[#E5E7EB] pt-4 mt-auto">
            <div>
              <span className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider block mb-1">Hari Ini</span>
              <span className="text-xl font-black text-[#111827] block">{barangKeluarCountToday} <span className="text-[10px] font-medium text-[#6B7280]">Trx</span></span>
              <span className="text-[9px] text-[#6B7280] font-medium">{todayDateStr}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider block mb-1">Bulan Ini</span>
              <span className="text-xl font-black text-[#111827] block">{barangKeluarCountBulanIni} <span className="text-[10px] font-medium text-[#6B7280]">Trx</span></span>
              <span className="text-[9px] text-[#6B7280] font-medium">{monthPeriodStr}</span>
            </div>
          </div>
        </div>`;

const newCards2 = `        {/* Card Transactions - Masuk */}
        <div className="bg-gradient-to-br from-white to-[#F8FAFC] p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-green-50 rounded-full blur-2xl opacity-60"></div>
          <div className="flex items-center gap-4 mb-6 relative z-10">
            <div className="bg-gradient-to-b from-green-400 to-green-600 p-3 rounded-xl text-white shadow-lg shadow-green-200">
              <ArrowDownLeft className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-base">Barang Masuk</h3>
              <p className="text-xs text-slate-500">Penerimaan gudang BMN</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-5 mt-auto relative z-10">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Harian (Hari Ini)</span>
              <span className="text-2xl font-black text-slate-800 block">{barangMasukCountToday} <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Trx</span></span>
              <span className="text-[9px] text-slate-400 font-medium mt-1 block truncate">{todayDateStr}</span>
            </div>
            <div className="bg-green-50 p-3 rounded-xl border border-green-100">
              <span className="text-[10px] font-bold text-green-700 uppercase tracking-wider block mb-1">Bulanan (Bulan Ini)</span>
              <span className="text-2xl font-black text-green-900 block">{barangMasukCountBulanIni} <span className="text-[10px] font-bold text-green-600 uppercase tracking-wider">Trx</span></span>
              <span className="text-[9px] text-green-600/80 font-medium mt-1 block truncate" title={monthPeriodStr}>{monthPeriodStr}</span>
            </div>
          </div>
        </div>

        {/* Card Transactions - Keluar */}
        <div className="bg-gradient-to-br from-white to-[#F8FAFC] p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-red-50 rounded-full blur-2xl opacity-60"></div>
          <div className="flex items-center gap-4 mb-6 relative z-10">
            <div className="bg-gradient-to-b from-red-400 to-red-600 p-3 rounded-xl text-white shadow-lg shadow-red-200">
              <ArrowUpRight className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-base">Barang Keluar</h3>
              <p className="text-xs text-slate-500">Distribusi ke unit kerja</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-5 mt-auto relative z-10">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Harian (Hari Ini)</span>
              <span className="text-2xl font-black text-slate-800 block">{barangKeluarCountToday} <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Trx</span></span>
              <span className="text-[9px] text-slate-400 font-medium mt-1 block truncate">{todayDateStr}</span>
            </div>
            <div className="bg-red-50 p-3 rounded-xl border border-red-100">
              <span className="text-[10px] font-bold text-red-700 uppercase tracking-wider block mb-1">Bulanan (Bulan Ini)</span>
              <span className="text-2xl font-black text-red-900 block">{barangKeluarCountBulanIni} <span className="text-[10px] font-bold text-red-600 uppercase tracking-wider">Trx</span></span>
              <span className="text-[9px] text-red-600/80 font-medium mt-1 block truncate" title={monthPeriodStr}>{monthPeriodStr}</span>
            </div>
          </div>
        </div>`;

code = code.replace(oldCards2, newCards2);
fs.writeFileSync('src/components/DashboardView.tsx', code);
