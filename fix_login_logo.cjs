const fs = require('fs');
let code = fs.readFileSync('src/components/LoginView.tsx', 'utf8');

const search = `<Shield className="w-8 h-8 text-white" />
            <Sparkles className="w-4 h-4 text-amber-300 absolute -top-1 -right-1 animate-pulse" />`;

const replace = `<img src="/logo.png" alt="Logo" className="w-10 h-10 object-contain drop-shadow-md z-10 relative" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
            <Shield className="w-8 h-8 text-white absolute inset-0 m-auto opacity-20" />
            <Sparkles className="w-4 h-4 text-amber-300 absolute -top-1 -right-1 animate-pulse" />`;

code = code.replace(search, replace);
fs.writeFileSync('src/components/LoginView.tsx', code);
