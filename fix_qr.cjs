const fs = require('fs');
let code = fs.readFileSync('src/components/BarangView.tsx', 'utf8');

if (!code.includes('import { QRCodeCanvas }')) {
  code = code.replace(
    "import { Barang, Kategori, Unit } from '../types';",
    "import { Barang, Kategori, Unit } from '../types';\nimport { QRCodeCanvas } from 'qrcode.react';"
  );
}

// Update handlePrintQR to generate QR with logo using canvas.
// But wait, since we need to render the canvas, we can just replace the image in the print window with the canvas data URL.
// Actually, it's easier to just use the modal's canvas! We can give the canvas an ID.
code = code.replace(
  "const handlePrintQR = (id: string, name: string) => {",
  `const handlePrintQR = (id: string, name: string) => {
    const canvas = document.getElementById('qr-canvas-' + id) as HTMLCanvasElement;
    const qrDataUrl = canvas ? canvas.toDataURL('image/png') : \`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=\${id}\`;
`
);

code = code.replace(
  "const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${id}`;",
  "// qrUrl removed"
);

code = code.replace(
  "<img src=\"${qrUrl}\" class=\"qr\" />",
  "<img src=\"${qrDataUrl}\" class=\"qr\" />"
);

// Update the modal QR display
const searchModal = `<img
                  src={activeItem.qrCodeUrl}
                  alt="QR Code"
                  className="w-32 h-32 object-contain bg-white p-2 rounded-xl shadow-sm border border-gray-100"
                />`;

const replaceModal = `<div className="bg-white p-2 rounded-xl shadow-sm border border-gray-100">
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
                </div>`;

code = code.replace(searchModal, replaceModal);

// Also fix the Download QR button
code = code.replace(
  `href={activeItem.qrCodeUrl}
                    target="_blank"
                    rel="noreferrer"`,
  `onClick={(e) => {
                      e.preventDefault();
                      const canvas = document.getElementById('qr-canvas-' + activeItem.id) as HTMLCanvasElement;
                      if (canvas) {
                        const url = canvas.toDataURL('image/png');
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = \`QR-\${activeItem.id}.png\`;
                        a.click();
                      }
                    }}
                    href="#"`
);

fs.writeFileSync('src/components/BarangView.tsx', code);
console.log("BarangView.tsx updated for QR");
