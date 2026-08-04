const fs = require('fs');
let code = fs.readFileSync('src/components/LoginView.tsx', 'utf8');
let lines = code.split('\n');

const fixLines = [177, 224, 278, 406, 408, 451, 502];
for (let i of fixLines) {
  lines[i] = lines[i].replace("</div>", "</motion.div>");
}

fs.writeFileSync('src/components/LoginView.tsx', lines.join('\n'));
