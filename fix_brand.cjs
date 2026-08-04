const fs = require('fs');
let code = fs.readFileSync('src/components/Sidebar.tsx', 'utf8');

code = code.replace(
  '<div className="flex items-center gap-3 whitespace-nowrap w-full">',
  '<div className={`flex items-center whitespace-nowrap w-full transition-all duration-300 ${collapsed ? "gap-0" : "gap-3"}`}>'
);

fs.writeFileSync('src/components/Sidebar.tsx', code);
console.log("Done");
