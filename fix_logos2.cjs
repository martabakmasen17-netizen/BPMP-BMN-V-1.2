const fs = require('fs');

// Fix Sidebar.tsx
let sidebarCode = fs.readFileSync('src/components/Sidebar.tsx', 'utf8');
sidebarCode = sidebarCode.replace(
  'className="flex-shrink-0 w-10 h-10 flex items-center justify-center relative overflow-hidden bg-white rounded-full p-0.5"',
  'className="flex-shrink-0 w-10 h-10 flex items-center justify-center relative overflow-hidden"'
);
fs.writeFileSync('src/components/Sidebar.tsx', sidebarCode);

// Fix LoginView.tsx
let loginCode = fs.readFileSync('src/components/LoginView.tsx', 'utf8');
loginCode = loginCode.replace(
  'className="w-24 h-24 bg-white rounded-full p-1.5 flex items-center justify-center shadow-xl shadow-blue-900/20 mb-5 relative"',
  'className="w-24 h-24 flex items-center justify-center drop-shadow-2xl mb-5 relative"'
);
fs.writeFileSync('src/components/LoginView.tsx', loginCode);

console.log("Done");
