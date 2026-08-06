const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  `  // Stats today count
  const todayStr = new Date().toISOString().slice(0, 10);
  const monthStr = new Date().toISOString().slice(0, 7);
  const barangMasukBulanIni = barangMasukList.filter(t => t.tanggal.startsWith(monthStr)).length;
  const barangKeluarBulanIni = barangKeluarList.filter(t => t.tanggal.startsWith(monthStr)).length;`,
  `  // Stats today count
  const todayStr = new Date().toISOString().slice(0, 10);
  const monthStr = new Date().toISOString().slice(0, 7);
  const barangMasukToday = barangMasukList.filter(t => t.tanggal.startsWith(todayStr)).length;
  const barangKeluarToday = barangKeluarList.filter(t => t.tanggal.startsWith(todayStr)).length;
  const barangMasukBulanIni = barangMasukList.filter(t => t.tanggal.startsWith(monthStr)).length;
  const barangKeluarBulanIni = barangKeluarList.filter(t => t.tanggal.startsWith(monthStr)).length;`
);

code = code.replace(
  `                  barangMasukCountBulanIni={barangMasukBulanIni}
                  barangKeluarCountBulanIni={barangKeluarBulanIni}`,
  `                  barangMasukCountToday={barangMasukToday}
                  barangKeluarCountToday={barangKeluarToday}
                  barangMasukCountBulanIni={barangMasukBulanIni}
                  barangKeluarCountBulanIni={barangKeluarBulanIni}`
);

fs.writeFileSync('src/App.tsx', code);
