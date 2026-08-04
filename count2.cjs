const fs = require('fs');
const content = fs.readFileSync('src/components/TransaksiMasukView.tsx', 'utf8');

const lines = content.split('\n');
let depth = 0;
for (let i=0; i<lines.length; i++) {
  const line = lines[i];
  const opens = (line.match(/<div/g) || []).length;
  const closes = (line.match(/<\/div>/g) || []).length;
  depth += (opens - closes);
  if (i > 430 && i < 455) {
     console.log(i + 1, depth, line);
  }
}
