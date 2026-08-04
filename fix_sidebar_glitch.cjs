const fs = require('fs');
let code = fs.readFileSync('src/components/Sidebar.tsx', 'utf8');

// Replace navItemClass
const oldNavItem = `const base = "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer ";`;
const newNavItem = `const base = "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer whitespace-nowrap overflow-hidden ";`;
code = code.replace(oldNavItem, newNavItem);

// Helper function to replace span tags
code = code.replace(/\{\!collapsed && (<span>.*?<\/span>)\}/g, (match, p1) => {
    // Inject className into the span
    if (p1.includes('className=')) {
        return p1.replace(/className="(.*?)"/, `className="$1 transition-all duration-300 origin-left \${collapsed ? 'opacity-0 scale-95 w-0' : 'opacity-100 scale-100 w-auto'}"`);
    } else {
        return p1.replace('<span>', `<span className={\`transition-all duration-300 origin-left \${collapsed ? 'opacity-0 scale-95 w-0' : 'opacity-100 scale-100 w-auto'}\`}>`);
    }
});

// Section headers
const sectionRegex = /\{\!collapsed \? \(\s*<div className=\{menuSectionHeaderClass\}>\s*<span>(.*?)<\/span>\s*<\/div>\s*\) : \(\s*<div className="h-px bg-white\/10 my-4" \/>\s*\)\}/g;

code = code.replace(sectionRegex, (match, text) => {
    return `<div className={\`\${menuSectionHeaderClass} transition-all duration-300 overflow-hidden \${collapsed ? 'opacity-0 h-px my-4 py-0 bg-white/10' : 'opacity-100 h-auto'}\`}>
              <span className={\`transition-all duration-300 \${collapsed ? 'hidden' : 'block'}\`}>${text}</span>
            </div>`;
});


// Footer
const footerRegex = /\{\!collapsed \? \(\s*<div className="flex flex-col gap-1">\s*<span className="text-\[10px\] font-semibold text-white\/40 uppercase tracking-wider">SISTEM AKTIF<\/span>\s*<span className="text-\[11px\] text-white\/70 font-medium truncate">\{instituteName\}<\/span>\s*<\/div>\s*\) : \(\s*<div className="w-2 h-2 rounded-full bg-green-500 mx-auto" \/>\s*\)\}/;

code = code.replace(footerRegex, `<div className="flex items-center justify-center relative overflow-hidden h-10 transition-all duration-300">
            <div className={\`flex flex-col gap-1 w-full transition-all duration-300 absolute left-0 \${collapsed ? 'opacity-0 -translate-x-4' : 'opacity-100 translate-x-0'}\`}>
              <span className="text-[10px] font-semibold text-white/40 uppercase tracking-wider">SISTEM AKTIF</span>
              <span className="text-[11px] text-white/70 font-medium truncate">{instituteName}</span>
            </div>
            <div className={\`w-2 h-2 rounded-full bg-green-500 mx-auto absolute transition-all duration-300 \${collapsed ? 'opacity-100 scale-100' : 'opacity-0 scale-0'}\`} />
          </div>`);

fs.writeFileSync('src/components/Sidebar.tsx', code);
console.log("Done");
