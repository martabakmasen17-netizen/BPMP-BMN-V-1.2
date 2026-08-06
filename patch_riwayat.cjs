const fs = require('fs');
let code = fs.readFileSync('src/components/RiwayatView.tsx', 'utf8');

code = code.replace(
  `  const executePrintOfficialBMNSummaryPDF = (filteredMutasi: Riwayat[], summaryText: string) => {`,
  `  const executePrintOfficialBMNSummaryPDF = (filteredMutasi: Riwayat[], summaryText: string, dateRange?: {start: string, end: string}) => {`
);

code = code.replace(
  `        onConfirm={(filteredData, format, summaryText) => {
          executePrintOfficialBMNSummaryPDF(filteredData, summaryText);
        }}`,
  `        onConfirm={(filteredData, format, summaryText, dateRange) => {
          executePrintOfficialBMNSummaryPDF(filteredData, summaryText, dateRange);
        }}`
);

const originalDates = `    const todayDate = new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    const currentYear = new Date().getFullYear();
    const currentMonthDateStr = new Date().toLocaleDateString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).replace(/\\//g, '-');`;

const newDates = `    const todayDate = new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    const currentYear = new Date().getFullYear();
    const currentMonthDateStr = new Date().toLocaleDateString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).replace(/\\//g, '-');

    let periodEndStr = todayDate.toUpperCase();
    let periodStartDisplay = \`01-01-\${currentYear}\`;
    let periodEndDisplay = todayDate;

    if (dateRange) {
        const endDate = new Date(dateRange.end);
        if (!isNaN(endDate.getTime())) {
            periodEndDisplay = endDate.toLocaleDateString('id-ID', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            }).replace(/\\//g, '-');
            periodEndStr = endDate.toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            }).toUpperCase();
        }
        
        const startDate = new Date(dateRange.start);
        if (!isNaN(startDate.getTime())) {
            periodStartDisplay = startDate.toLocaleDateString('id-ID', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            }).replace(/\\//g, '-');
        }
    }`;

code = code.replace(originalDates, newDates);

const originalMutasiLoop = `      items.forEach((b) => {
        // Calculate mutasi for item b in filteredMutasi
        const itemMutasi = filteredMutasi.filter(r => r.barangId === b.id || r.namaBarang === b.nama);
        const masuk = itemMutasi.filter(r => r.tipe === 'Masuk').reduce((sum, r) => sum + (Number(r.jumlah) || 0), 0);
        const keluar = itemMutasi.filter(r => r.tipe === 'Keluar').reduce((sum, r) => sum + (Number(r.jumlah) || 0), 0);
        const mutasiNet = masuk - keluar;
        const stokAkhir = Number(b.stokSekarang) || 0;
        const stokAwal = Math.max(0, stokAkhir - mutasiNet);`;

const newMutasiLoop = `      items.forEach((b) => {
        const itemMutasi = filteredMutasi.filter(r => r.barangId === b.id || r.namaBarang === b.nama);
        const masuk = itemMutasi.filter(r => r.tipe === 'Masuk').reduce((sum, r) => sum + (Number(r.jumlah) || 0), 0);
        const keluar = itemMutasi.filter(r => r.tipe === 'Keluar').reduce((sum, r) => sum + (Number(r.jumlah) || 0), 0);
        const mutasiNet = masuk - keluar;
        
        let mutasiNetAfter = 0;
        if (dateRange) {
          const allItemMutasi = riwayat.filter(r => r.barangId === b.id || r.namaBarang === b.nama);
          const mutasiAfterEnd = allItemMutasi.filter(r => r.tanggal > dateRange.end + 'T23:59:59Z');
          const masukAfter = mutasiAfterEnd.filter(r => r.tipe === 'Masuk').reduce((sum, r) => sum + (Number(r.jumlah) || 0), 0);
          const keluarAfter = mutasiAfterEnd.filter(r => r.tipe === 'Keluar').reduce((sum, r) => sum + (Number(r.jumlah) || 0), 0);
          mutasiNetAfter = masukAfter - keluarAfter;
        }

        const stokSekarangReal = Number(b.stokSekarang) || 0;
        const stokAkhir = stokSekarangReal - mutasiNetAfter;
        const stokAwal = Math.max(0, stokAkhir - mutasiNet);`;

code = code.replace(originalMutasiLoop, newMutasiLoop);

code = code.replace(
  `UNTUK PERIODE YANG BERAKHIR TANGGAL \${todayDate.toUpperCase()}`,
  `UNTUK PERIODE YANG BERAKHIR TANGGAL \${periodEndStr}`
);

code = code.replace(
  `S/D 01-01-\${currentYear}`,
  `S/D \${periodStartDisplay}`
);

code = code.replace(
  `S/D \${currentMonthDateStr}`,
  `S/D \${periodEndDisplay}`
);

fs.writeFileSync('src/components/RiwayatView.tsx', code);
