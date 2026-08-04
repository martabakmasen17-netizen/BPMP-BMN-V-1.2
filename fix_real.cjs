const fs = require('fs');

let k = fs.readFileSync('src/components/TransaksiKeluarView.tsx', 'utf8');

const kTarget = `{/* Form panel */}
        <div className="bg-white p-5 border border-gray-200 rounded-2xl shadow-sm lg:col-span-1 h-fit">
          <div className="border-b border-gray-100 pb-3 mb-4">
            <h3 className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
              <ArrowUpRight className="w-4.5 h-4.5 text-red-500 bg-red-50 p-0.5 rounded" />
              Input Pengeluaran Barang Keluar
            </h3>
            <p className="text-[10px] text-gray-400 mt-1 uppercase font-bold tracking-wider">Pilih Kategori Dulu → Lalu Pilih Barang</p>
          </div>`;

const kReplacement = `{/* Form panel */}
        {!showHistory && (
        <div className="bg-white p-5 border border-gray-200 rounded-2xl shadow-sm max-w-2xl mx-auto h-fit w-full">
          <div className="flex justify-between items-center border-b border-gray-100 pb-3 mb-4">
            <div>
              <h3 className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
                <ArrowUpRight className="w-4.5 h-4.5 text-red-500 bg-red-50 p-0.5 rounded" />
                Input Pengeluaran Barang Keluar
              </h3>
              <p className="text-[10px] text-gray-400 mt-1 uppercase font-bold tracking-wider">Pilih Kategori Dulu → Lalu Pilih Barang</p>
            </div>
            <button 
              onClick={() => setShowHistory(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
            >
              <History className="w-3.5 h-3.5" />
              Riwayat Barang Keluar
            </button>
          </div>`;

if(k.includes(kTarget)) {
  k = k.replace(kTarget, kReplacement);
} else {
  console.log("Target not found!");
}

// Fix the bottom that we broke again
k = k.replace(/          <\/div>\n        <\/div>\n        \)\}\n    <\/div>\n  \);\n}/g, `          </div>\n        </div>\n        )}\n      </div>\n    </div>\n  );\n}`);

fs.writeFileSync('src/components/TransaksiKeluarView.tsx', k);

