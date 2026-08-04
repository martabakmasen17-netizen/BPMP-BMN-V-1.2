const fs = require('fs');
const content = fs.readFileSync('src/components/TransaksiKeluarView.tsx', 'utf8');

const lines = content.split('\n');
for (let i=470; i<480; i++) {
  console.log(i + 1, lines[i]);
}
