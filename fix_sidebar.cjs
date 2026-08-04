const fs = require('fs');

let sidebarCode = fs.readFileSync('src/components/Sidebar.tsx', 'utf8');

// Replace the wrapper div class to add ease-in-out and relative
const wrapperRegex = /className={`bg-\[#111827\] flex flex-col h-screen fixed md:sticky top-0 left-0 transition-all duration-300 z-50 md:z-30 \$\{[\s\S]*?\} w-64`}/m;
const newWrapper = `className={\`bg-[#111827] flex flex-col h-screen fixed md:sticky top-0 left-0 transition-all duration-300 ease-in-out z-50 md:z-30 relative shadow-xl \${
          collapsed
            ? '-translate-x-full md:translate-x-0 md:w-20'
            : 'translate-x-0 md:w-64'
        } w-64\`}`;
sidebarCode = sidebarCode.replace(wrapperRegex, newWrapper);

// Replace Brand Header area
const brandHeaderRegex = /\{\/\* Brand Header \*\/\}([\s\S]*?)<div className="flex-1 overflow-y-auto px-3 py-4 space-y-1 scrollbar-thin">/m;
const newBrandHeader = `{/* Expand/Collapse Toggle Button (Desktop) */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3.5 top-7 bg-[#111827] text-white hover:text-white hover:bg-slate-800 border-2 border-[#111827] ring-2 ring-slate-100 p-0.5 rounded-full hidden md:flex items-center justify-center shadow-md z-[60] transition-all duration-300 cursor-pointer"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>

        {/* Brand Header */}
        <div className="h-20 border-b border-white/10 flex items-center relative transition-all duration-300 overflow-hidden px-4 shrink-0">
          <div className="flex items-center gap-3 whitespace-nowrap w-full">
            <div className={\`flex-shrink-0 flex items-center justify-center transition-all duration-300 \${collapsed ? 'w-12 h-12 mx-auto' : 'w-12 h-12'}\`}>
              <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
            </div>
            <div 
              className={\`flex flex-col min-w-0 leading-tight transition-all duration-300 overflow-hidden origin-left \${collapsed ? 'opacity-0 w-0 scale-95' : 'opacity-100 w-32 scale-100'}\`}
            >
              <span className="font-bold text-white text-sm tracking-tight">BPMP SUMSEL</span>
              <span className="text-[10px] text-white/50 uppercase tracking-widest mt-0.5">Inventory v2.0</span>
            </div>
          </div>
          
          {/* Close button for mobile */}
          <button
            onClick={() => setCollapsed(true)}
            className="p-1.5 hover:bg-white/10 bg-white/5 rounded-lg text-white/70 hover:text-white md:hidden absolute right-4 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        </div>

      {/* Main Navigation */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1 scrollbar-thin">`;

sidebarCode = sidebarCode.replace(brandHeaderRegex, newBrandHeader);

fs.writeFileSync('src/components/Sidebar.tsx', sidebarCode);
console.log("Done");
