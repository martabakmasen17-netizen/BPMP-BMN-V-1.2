const fs = require('fs');
let code = fs.readFileSync('src/components/BarangView.tsx', 'utf8');

code = code.replace(
  /<img\s+src=\{activeItem\.qrCodeUrl\}\s+alt="QR Code"\s+className="w-32 h-32 object-contain bg-white p-2 rounded-xl shadow-sm border border-gray-100"\s+\/>/m,
  `<div className="bg-white p-2 rounded-xl shadow-sm border border-gray-100">
                  <QRCodeCanvas 
                    id={\`qr-canvas-\${activeItem.id}\`}
                    value={activeItem.id} 
                    size={128} 
                    level={"H"}
                    imageSettings={{
                      src: "/logo.png",
                      x: undefined,
                      y: undefined,
                      height: 30,
                      width: 30,
                      excavate: true,
                    }}
                  />
                </div>`
);

fs.writeFileSync('src/components/BarangView.tsx', code);
