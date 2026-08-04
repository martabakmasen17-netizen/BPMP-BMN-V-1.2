const fs = require('fs');

let m = fs.readFileSync('src/components/TransaksiMasukView.tsx', 'utf8');
m = m.replace("      </div>\n      </div>\n      {/* Transactions list */}", "      </div>\n      )}\n      {/* Transactions list */}");
fs.writeFileSync('src/components/TransaksiMasukView.tsx', m);

