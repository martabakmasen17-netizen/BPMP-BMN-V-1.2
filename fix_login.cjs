const fs = require('fs');
let code = fs.readFileSync('src/components/LoginView.tsx', 'utf8');

// Replace animated orbs with static divs
const search1 = `<motion.div 
        animate={{
          scale: [1, 1.25, 1],
          opacity: [0.25, 0.4, 0.25],
          rotate: [0, 180, 360]
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute -top-32 -left-32 w-[550px] h-[550px] rounded-full bg-gradient-to-tr from-blue-600/30 via-indigo-600/20 to-sky-400/10 blur-[120px] pointer-events-none"
      />`;

const search2 = `<motion.div 
        animate={{
          scale: [1.2, 1, 1.2],
          opacity: [0.2, 0.35, 0.2],
          rotate: [360, 180, 0]
        }}
        transition={{
          duration: 22,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute -bottom-32 -right-32 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-indigo-700/30 via-blue-500/20 to-purple-600/15 blur-[140px] pointer-events-none"
      />`;

const replace1 = `<div className="absolute -top-32 -left-32 w-[550px] h-[550px] rounded-full bg-gradient-to-tr from-blue-600/30 via-indigo-600/20 to-sky-400/10 blur-[120px] pointer-events-none" />`;
const replace2 = `<div className="absolute -bottom-32 -right-32 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-indigo-700/30 via-blue-500/20 to-purple-600/15 blur-[140px] pointer-events-none" />`;

if (code.includes(search1)) {
  code = code.replace(search1, replace1);
  code = code.replace(search2, replace2);
  fs.writeFileSync('src/components/LoginView.tsx', code);
  console.log('LoginView.tsx updated for performance');
} else {
  console.log('Could not find animated orbs block');
}
