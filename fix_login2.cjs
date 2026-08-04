const fs = require('fs');
let code = fs.readFileSync('src/components/LoginView.tsx', 'utf8');

// Replace remaining motion.div in background with normal divs to prevent lag on mobile
code = code.replace(/<motion\.div\s+animate=\{\{[\s\S]*?className="absolute top-12 left-12 hidden lg:flex/g, 
  '<div className="absolute top-12 left-12 hidden lg:flex');

code = code.replace(/<motion\.div\s+animate=\{\{[\s\S]*?className="absolute bottom-12 right-12 hidden lg:flex/g, 
  '<div className="absolute bottom-12 right-12 hidden lg:flex');

// Also remove motion from the floating elements if they are still there
// Just to be safe, I'll do a simpler replace.
