const fs = require('fs');
let code = fs.readFileSync('src/components/TransaksiKeluarView.tsx', 'utf8');

const target = `        </div>

        {/* Transactions lists */}
        <div className="bg-white p-5 border border-gray-200 rounded-2xl shadow-sm lg:col-span-2 space-y-6">`;

const replacement = `        </div>
        )}

        {/* Transactions lists */}
        {showHistory && (
        <div className="bg-white p-5 border border-gray-200 rounded-2xl shadow-sm max-w-4xl mx-auto w-full space-y-6">
          <div className="flex justify-between items-center border-b border-gray-100 pb-3 mb-4">
            <button 
              onClick={() => setShowHistory(false)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Kembali ke Form Input
            </button>
            <div className="text-right">
              <h3 className="font-bold text-gray-900 text-sm flex items-center justify-end gap-1.5">
                Riwayat Barang Keluar
              </h3>
            </div>
          </div>`;

code = code.replace(target, replacement);

fs.writeFileSync('src/components/TransaksiKeluarView.tsx', code);
