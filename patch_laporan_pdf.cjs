const fs = require('fs');
let code = fs.readFileSync('src/components/LaporanView.tsx', 'utf8');

code = code.replace(
  `  const executeBarangPrintOfficialPDF = (data: Barang[], summaryText: string) => {`,
  `  const executeBarangPrintOfficialPDF = (data: Barang[], summaryText: string, dateRange?: {start: string, end: string}) => {`
);

const originalPrintCode = `    const todayDate = new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });`;

const newPrintCode = `    const todayDate = new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    let periodStartDisplay = '-';
    let periodEndDisplay = todayDate;
    if (dateRange) {
        const endDate = new Date(dateRange.end);
        if (!isNaN(endDate.getTime())) {
            periodEndDisplay = endDate.toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            });
        }
        const startDate = new Date(dateRange.start);
        if (!isNaN(startDate.getTime())) {
            periodStartDisplay = startDate.toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            });
        }
    }`;

code = code.replace(originalPrintCode, newPrintCode);

const originalMetaHtml = `          <div class="meta">
            LAPORAN REKAPITULASI PERSEDIAAN BARANG BMN
            <span>Periode Data: \${summaryText}</span>
            <span>Per Tanggal Cetak: \${todayDate}</span>
          </div>`;

const newMetaHtml = `          <div class="meta">
            LAPORAN REKAPITULASI PERSEDIAAN BARANG BMN
            <span>Periode: \${periodStartDisplay !== '-' ? periodStartDisplay + ' s.d ' + periodEndDisplay : summaryText}</span>
            <span>Per Tanggal Cetak: \${todayDate}</span>
          </div>`;

code = code.replace(originalMetaHtml, newMetaHtml);

code = code.replace(
  `        onConfirm={(filteredData, format, summaryText) => {
          if (format === 'pdf') {
            executeBarangPrintOfficialPDF(filteredData, summaryText);
          } else {
            executeBarangExportSpreadsheet(filteredData, summaryText);
          }
        }}`,
  `        onConfirm={(filteredData, format, summaryText, dateRange) => {
          if (format === 'pdf') {
            executeBarangPrintOfficialPDF(filteredData, summaryText, dateRange);
          } else {
            executeBarangExportSpreadsheet(filteredData, summaryText);
          }
        }}`
);

fs.writeFileSync('src/components/LaporanView.tsx', code);
