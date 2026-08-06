const fs = require('fs');
let code = fs.readFileSync('src/components/DashboardView.tsx', 'utf8');

code = code.replace(
  `  barangMasukCountToday: number;
  barangKeluarCountToday: number;`,
  `  barangMasukCountBulanIni: number;
  barangKeluarCountBulanIni: number;`
);

code = code.replace(
  `  barangMasukCountToday,
  barangKeluarCountToday,`,
  `  barangMasukCountBulanIni,
  barangKeluarCountBulanIni,`
);

const addition = `
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  
  const monthPeriodStr = \`\${firstDay.getDate()} \${firstDay.toLocaleDateString('id-ID', { month: 'long' })} - \${lastDay.getDate()} \${lastDay.toLocaleDateString('id-ID', { month: 'long' })} \${now.getFullYear()}\`;
`;

code = code.replace(
  `  // Calculations
  const totalBarang = barang.length;`,
  `  // Calculations
${addition}
  const totalBarang = barang.length;`
);

code = code.replace(
  `<span className="text-xs font-medium text-[#6B7280] block">Masuk Hari Ini</span>`,
  `<span className="text-xs font-medium text-[#6B7280] block">Masuk Bulan Ini</span>`
);

code = code.replace(
  `<span className="text-2xl font-bold text-[#111827] block mt-0.5">{barangMasukCountToday} Transaksi</span>`,
  `<span className="text-2xl font-bold text-[#111827] block mt-0.5">{barangMasukCountBulanIni} Transaksi</span>`
);

code = code.replace(
  `<span className="text-[10px] text-[#6B7280] font-medium">Masuk gudang BMN</span>`,
  `<span className="text-[10px] text-[#6B7280] font-medium">Masuk gudang BMN ({monthPeriodStr})</span>`
);


code = code.replace(
  `<span className="text-xs font-medium text-[#6B7280] block">Keluar Hari Ini</span>`,
  `<span className="text-xs font-medium text-[#6B7280] block">Keluar Bulan Ini</span>`
);

code = code.replace(
  `<span className="text-2xl font-bold text-[#111827] block mt-0.5">{barangKeluarCountToday} Transaksi</span>`,
  `<span className="text-2xl font-bold text-[#111827] block mt-0.5">{barangKeluarCountBulanIni} Transaksi</span>`
);

code = code.replace(
  `<span className="text-[10px] text-[#6B7280] font-medium">Diserahkan ke unit kerja</span>`,
  `<span className="text-[10px] text-[#6B7280] font-medium">Diserahkan ke unit kerja ({monthPeriodStr})</span>`
);

fs.writeFileSync('src/components/DashboardView.tsx', code);
