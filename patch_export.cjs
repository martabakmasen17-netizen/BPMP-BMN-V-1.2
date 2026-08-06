const fs = require('fs');
let code = fs.readFileSync('src/components/ExportConfirmModal.tsx', 'utf8');

code = code.replace(
  `  onConfirm: (
    filteredData: T[],
    format: ExportFormat,
    summaryText: string
  ) => void;`,
  `  onConfirm: (
    filteredData: T[],
    format: ExportFormat,
    summaryText: string,
    dateRange?: { start: string, end: string }
  ) => void;`
);

code = code.replace(
  `  const { filteredData, summaryText } = useMemo(() => {`,
  `  const { filteredData, summaryText, dateRange } = useMemo(() => {`
);

code = code.replace(
  `        return {
          filteredData: result,
          summaryText: \`Bulan \${monthLabel}\`
        };`,
  `        return {
          filteredData: result,
          summaryText: \`Bulan \${monthLabel}\`,
          dateRange: { start: \`\${singleMonth}-01\`, end: \`\${singleMonth}-31\` }
        };`
);

code = code.replace(
  `        return {
          filteredData: result,
          summaryText: \`Rentang Bulan \${start} s.d \${end}\`
        };`,
  `        return {
          filteredData: result,
          summaryText: \`Rentang Bulan \${start} s.d \${end}\`,
          dateRange: { start: \`\${start}-01\`, end: \`\${end}-31\` }
        };`
);

code = code.replace(
  `        return {
          filteredData: result,
          summaryText: \`Beberapa Bulan (\${selectedMonthsList.length} bulan terpilih)\`
        };`,
  `        const sorted = [...selectedMonthsList].sort();
        return {
          filteredData: result,
          summaryText: \`Beberapa Bulan (\${selectedMonthsList.length} bulan terpilih)\`,
          dateRange: sorted.length > 0 ? { start: \`\${sorted[0]}-01\`, end: \`\${sorted[sorted.length - 1]}-31\` } : undefined
        };`
);

code = code.replace(
  `        return {
          filteredData: result,
          summaryText: \`Tanggal \${dateLabel}\`
        };`,
  `        return {
          filteredData: result,
          summaryText: \`Tanggal \${dateLabel}\`,
          dateRange: { start: singleDate, end: singleDate }
        };`
);

code = code.replace(
  `        return {
          filteredData: result,
          summaryText: \`Rentang Tanggal \${start} s.d \${end}\`
        };`,
  `        return {
          filteredData: result,
          summaryText: \`Rentang Tanggal \${start} s.d \${end}\`,
          dateRange: { start, end }
        };`
);

code = code.replace(
  `        return {
          filteredData: result,
          summaryText: \`Beberapa Tanggal (\${selectedDatesList.length} hari terpilih)\`
        };`,
  `        const sorted = [...selectedDatesList].sort();
        return {
          filteredData: result,
          summaryText: \`Beberapa Tanggal (\${selectedDatesList.length} hari terpilih)\`,
          dateRange: sorted.length > 0 ? { start: sorted[0], end: sorted[sorted.length - 1] } : undefined
        };`
);

code = code.replace(
  `    return { filteredData: dataList, summaryText: 'Keseluruhan Data' };`,
  `    return { filteredData: dataList, summaryText: 'Keseluruhan Data', dateRange: undefined };`
);

code = code.replace(
  `                onClick={() => {
                  onConfirm(filteredData, selectedFormat, summaryText);
                  onClose();
                }}`,
  `                onClick={() => {
                  onConfirm(filteredData, selectedFormat, summaryText, dateRange);
                  onClose();
                }}`
);

fs.writeFileSync('src/components/ExportConfirmModal.tsx', code);
