const fs = require('fs');
let code = fs.readFileSync('src/components/Sidebar.tsx', 'utf8');

const oldFunc = `  const navItemClass = (tab: ActiveTab) => {
    const base = "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer whitespace-nowrap overflow-hidden ";
    const active = "bg-[#2563EB] text-white shadow-sm";
    const inactive = "text-white/70 hover:bg-white/5 hover:text-white";
    return base + (activeTab === tab ? active : inactive);
  };`;

const newFunc = `  const navItemClass = (tab: ActiveTab) => {
    const base = \`flex items-center \${collapsed ? 'justify-center px-0' : 'gap-3 px-3'} py-2.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer whitespace-nowrap overflow-hidden \`;
    const active = "bg-[#2563EB] text-white shadow-sm";
    const inactive = "text-white/70 hover:bg-white/5 hover:text-white";
    return base + (activeTab === tab ? active : inactive);
  };`;

code = code.replace(oldFunc, newFunc);
fs.writeFileSync('src/components/Sidebar.tsx', code);
console.log("Done");
