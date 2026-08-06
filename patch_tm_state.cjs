const fs = require('fs');
let code = fs.readFileSync('src/components/TransaksiMasukView.tsx', 'utf8');

code = code.replace(
  `  const [isDragging, setIsDragging] = useState(false);`,
  `  const [isDragging, setIsDragging] = useState(false);
  
  // Langsung Keluar state
  const [isLangsungKeluar, setIsLangsungKeluar] = useState(false);
  const [lkUnitId, setLkUnitId] = useState(unitList?.[0]?.nama || 'Subbag Tata Usaha');
  const [lkKeperluan, setLkKeperluan] = useState('Kegiatan / Event');
  const [lkCatatan, setLkCatatan] = useState('');`
);

code = code.replace(
  `unitList?: any[];`,
  `unitList?: any[];\n  pegawaiList?: any[];`
);

fs.writeFileSync('src/components/TransaksiMasukView.tsx', code);
