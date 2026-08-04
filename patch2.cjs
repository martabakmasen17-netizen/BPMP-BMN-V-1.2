const fs = require('fs');
let masuk = fs.readFileSync('src/components/TransaksiMasukView.tsx', 'utf8');

masuk = masuk.replace(`      </div>
      </div>
      )}`, `      </div>
      )}`);

fs.writeFileSync('src/components/TransaksiMasukView.tsx', masuk);

let keluar = fs.readFileSync('src/components/TransaksiKeluarView.tsx', 'utf8');
// Check around line 500 or end of form.
keluar = keluar.replace(`      </div>
        )}`, `      </div>
        )}`);

fs.writeFileSync('src/components/TransaksiKeluarView.tsx', keluar);
