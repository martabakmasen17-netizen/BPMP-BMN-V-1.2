const fs = require('fs');
const content = fs.readFileSync('src/components/TransaksiKeluarView.tsx', 'utf8');

const lines = content.split('\n');
for (let i=570; i<lines.length; i++) {
  console.log(i + 1, lines[i]);
}
