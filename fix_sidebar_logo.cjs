const fs = require('fs');
let code = fs.readFileSync('src/components/Sidebar.tsx', 'utf8');

const search = `<div className="bg-[#2563EB] text-white p-2 rounded-lg flex-shrink-0">
              <Database className="w-5 h-5" />
            </div>`;

const replace = `<div className="bg-white text-blue-600 p-1.5 rounded-lg flex-shrink-0 w-9 h-9 flex items-center justify-center relative overflow-hidden">
              <img src="/logo.png" alt="Logo" className="w-full h-full object-contain z-10" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
              <Database className="w-5 h-5 absolute opacity-20" />
            </div>`;

code = code.replace(search, replace);
fs.writeFileSync('src/components/Sidebar.tsx', code);
