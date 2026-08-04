const fs = require('fs');

// Transaksi Masuk View
let m = fs.readFileSync('src/components/TransaksiMasukView.tsx', 'utf8');

// Fix the closing tags for the form
m = m.replace(/      <\/div>\n      \)\}\n      \{\/\* Transactions list \*\/\}/g, 
`      </div>
      )}
      {/* Transactions list */}`);

// We might have multiple or duplicate closing tags
// Let's just fix the end of the file
const mListEnd = `          </div>
        </div>
      </div>
        </div>
      )}
    </div>
  );
}`;
// We have an issue in TransaksiMasukView.tsx where there's an extra `</div>`
// Let's use prettier to see where it breaks

fs.writeFileSync('src/components/TransaksiMasukView.tsx', m);
