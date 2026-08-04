const fs = require('fs');
let code = fs.readFileSync('src/components/BarangView.tsx', 'utf8');

code = code.replace(
  /<img\s+src=\{activeItem\.qrCodeUrl\}\s+alt="QR Code"\s+referrerPolicy="no-referrer"\s+className="w-36 h-36 bg-white p-2 rounded-lg border border-gray-200"\s+\/>/m,
  `<div className="bg-white p-2 rounded-lg border border-gray-200">
                  <QRCodeCanvas 
                    id={\`qr-canvas-\${activeItem.id}\`}
                    value={activeItem.id} 
                    size={130} 
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
