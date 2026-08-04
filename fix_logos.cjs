const fs = require('fs');

// Fix Sidebar.tsx
let sidebarCode = fs.readFileSync('src/components/Sidebar.tsx', 'utf8');
const sidebarSearch = `<div className="bg-white text-blue-600 p-1.5 rounded-lg flex-shrink-0 w-9 h-9 flex items-center justify-center relative overflow-hidden">
              <img src="/logo.png" alt="Logo" className="w-full h-full object-contain z-10" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
              <Database className="w-5 h-5 absolute opacity-20" />
            </div>`;
const sidebarReplace = `<div className="flex-shrink-0 w-10 h-10 flex items-center justify-center relative overflow-hidden bg-white rounded-full p-0.5">
              <img src="/logo.png" alt="Logo" className="w-full h-full object-contain z-10" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
            </div>`;
sidebarCode = sidebarCode.replace(sidebarSearch, sidebarReplace);
fs.writeFileSync('src/components/Sidebar.tsx', sidebarCode);

// Fix LoginView.tsx
let loginCode = fs.readFileSync('src/components/LoginView.tsx', 'utf8');
const loginSearch = `<motion.div 
            whileHover={{ scale: 1.05, rotate: 2 }}
            className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-blue-500/25 mb-3.5 border border-blue-400/40 relative group cursor-pointer"
          >
            <img src="/logo.png" alt="Logo" className="w-10 h-10 object-contain drop-shadow-md z-10 relative" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
            <Shield className="w-8 h-8 text-white absolute inset-0 m-auto opacity-20" />
            <Sparkles className="w-4 h-4 text-amber-300 absolute -top-1 -right-1 animate-pulse" />
          </motion.div>`;
const loginReplace = `<motion.div 
            whileHover={{ scale: 1.05 }}
            className="w-24 h-24 bg-white rounded-full p-1.5 flex items-center justify-center shadow-xl shadow-blue-900/20 mb-5 relative"
          >
            <img src="/logo.png" alt="Logo" className="w-full h-full object-contain drop-shadow-sm z-10" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
          </motion.div>`;
loginCode = loginCode.replace(loginSearch, loginReplace);
fs.writeFileSync('src/components/LoginView.tsx', loginCode);

console.log("Done");
