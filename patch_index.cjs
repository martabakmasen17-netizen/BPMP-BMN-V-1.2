const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');
html = html.replace(/Sistem Persediaan BMN - BPMP Sumsel/g, 'SILAP BMN - BPMP Sumsel');
html = html.replace(/Sistem Informasi Manajemen Persediaan Barang Milik Negara \(BMN\)/g, 'SILAP BMN - Sistem Informasi Logistik & Alat Persediaan Barang Milik Negara');
fs.writeFileSync('index.html', html);
