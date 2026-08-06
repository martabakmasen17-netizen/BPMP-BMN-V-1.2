const fs = require('fs');
let code = fs.readFileSync('src/components/DashboardView.tsx', 'utf8');

code = code.replace(
  `  barangMasukCountBulanIni: number;
  barangKeluarCountBulanIni: number;`,
  `  barangMasukCountToday: number;
  barangKeluarCountToday: number;
  barangMasukCountBulanIni: number;
  barangKeluarCountBulanIni: number;`
);

code = code.replace(
  `  barangMasukCountBulanIni,
  barangKeluarCountBulanIni,`,
  `  barangMasukCountToday,
  barangKeluarCountToday,
  barangMasukCountBulanIni,
  barangKeluarCountBulanIni,`
);

code = code.replace(
  `const monthPeriodStr = \`\${firstDay.getDate()} \${firstDay.toLocaleDateString('id-ID', { month: 'long' })} - \${lastDay.getDate()} \${lastDay.toLocaleDateString('id-ID', { month: 'long' })} \${now.getFullYear()}\`;`,
  `const monthPeriodStr = \`\${firstDay.getDate()} \${firstDay.toLocaleDateString('id-ID', { month: 'long' })} - \${lastDay.getDate()} \${lastDay.toLocaleDateString('id-ID', { month: 'long' })} \${now.getFullYear()}\`;
  const todayDateStr = \`\${now.getDate()} \${now.toLocaleDateString('id-ID', { month: 'long' })} \${now.getFullYear()}\`;`
);

const kpiRow2Original = `      {/* KPI Cards Row 2 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

        {/* Card Transactions */}
        <div className="bg-white p-5 rounded-xl border border-[#E5E7EB] shadow-sm flex items-center gap-4">
          <div className="bg-green-50 p-3 rounded-lg text-green-600">
            <ArrowDownLeft className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <span className="text-xs font-medium text-[#6B7280] block">Masuk Bulan Ini</span>
            <span className="text-2xl font-bold text-[#111827] block mt-0.5">{barangMasukCountBulanIni} Transaksi</span>
            <span className="text-[10px] text-[#6B7280] font-medium">Masuk gudang BMN ({monthPeriodStr})</span>
          </div>
        </div>

        {/* Card Transactions Out */}
        <div className="bg-white p-5 rounded-xl border border-[#E5E7EB] shadow-sm flex items-center gap-4">
          <div className="bg-red-50 p-3 rounded-lg text-red-600">
            <ArrowUpRight className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <span className="text-xs font-medium text-[#6B7280] block">Keluar Bulan Ini</span>
            <span className="text-2xl font-bold text-[#111827] block mt-0.5">{barangKeluarCountBulanIni} Transaksi</span>
            <span className="text-[10px] text-[#6B7280] font-medium">Diserahkan ke unit kerja ({monthPeriodStr})</span>
          </div>
        </div>
      </div>`;

const kpiRow2New = `      {/* KPI Cards Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Card Transactions - Masuk */}
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
        </div>

      </div>`;

code = code.replace(kpiRow2Original, kpiRow2New);

fs.writeFileSync('src/components/DashboardView.tsx', code);
