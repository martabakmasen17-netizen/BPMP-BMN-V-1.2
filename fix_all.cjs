const fs = require('fs');

let m = fs.readFileSync('src/components/TransaksiMasukView.tsx', 'utf8');
m = m.replace(/      <\/div>\n      \)}\n      \{\/\* Transactions list \*\/\}/g, `      </div>\n      {/* Transactions list */}`);
m = m.replace(/      <\/div>\n      \)\}\n      \{\/\* Transactions list \*\/\}/g, `      </div>\n      {/* Transactions list */}`);
fs.writeFileSync('src/components/TransaksiMasukView.tsx', m);

let k = fs.readFileSync('src/components/TransaksiKeluarView.tsx', 'utf8');
k = k.replace(/        <\/div>\n        \)\}\n\n        \{\/\* Transactions lists \*\/\}/g, `        </div>\n\n        {/* Transactions lists */}`);
k = k.replace(/        <\/div>\n          \)\}\n        \{\/\* Transactions lists \*\/\}/g, `        </div>\n\n        {/* Transactions lists */}`);

// fix the very bottom
k = k.replace(/          <\/div>\n        <\/div>\n          <\/div>\n        \)\}\n      <\/div>\n    <\/div>\n  \);\n}/g, `          </div>\n        </div>\n        )}\n      </div>\n    </div>\n  );\n}`);

fs.writeFileSync('src/components/TransaksiKeluarView.tsx', k);
