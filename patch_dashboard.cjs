const fs = require('fs');
let code = fs.readFileSync('src/components/DashboardView.tsx', 'utf8');

const replacement = `  const getStokMin = (b: Barang) => Number(b.stokMin) > 0 ? Number(b.stokMin) : 5;
  const stokAman = barang.filter(b => Number(b.stokSekarang) > getStokMin(b)).length;
  const stokMenipis = barang.filter(b => Number(b.stokSekarang) <= getStokMin(b) && Number(b.stokSekarang) > 0).length;
  const stokHabis = barang.filter(b => Number(b.stokSekarang) === 0).length;

  const totalStokUnit = barang.reduce((sum, item) => sum + Number(item.stokSekarang), 0);

  // Get items with low stock (stokSekarang <= stokMin)
  const barangRendah = barang.filter(b => Number(b.stokSekarang) <= getStokMin(b)).sort((a, b) => Number(a.stokSekarang) - Number(b.stokSekarang));`;

code = code.replace(
  `  const stokAman = barang.filter(b => Number(b.stokSekarang) > Number(b.stokMin) && Number(b.stokSekarang) > 0).length;
  const stokMenipis = barang.filter(b => Number(b.stokSekarang) <= Number(b.stokMin) && Number(b.stokSekarang) > 0).length;
  const stokHabis = barang.filter(b => Number(b.stokSekarang) === 0).length;

  const totalStokUnit = barang.reduce((sum, item) => sum + Number(item.stokSekarang), 0);

  // Get items with low stock (stokSekarang < stokMin)
  const barangRendah = barang.filter(b => Number(b.stokSekarang) <= Number(b.stokMin)).sort((a, b) => Number(a.stokSekarang) - Number(b.stokSekarang));`,
  replacement
);

fs.writeFileSync('src/components/DashboardView.tsx', code);
