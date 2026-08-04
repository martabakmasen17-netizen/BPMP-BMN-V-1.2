const fs = require('fs');
let code = fs.readFileSync('src/components/TransaksiKeluarView.tsx', 'utf8');

const importTarget = `import { Search, ArrowUpRight, Check, X, ShieldAlert, Clock, AlertTriangle, Building, FileSpreadsheet, QrCode, FolderTree, Package } from 'lucide-react';`;
if (code.includes(importTarget)) {
   code = code.replace(importTarget, `import { Search, ArrowUpRight, Check, X, ShieldAlert, Clock, AlertTriangle, Building, FileSpreadsheet, QrCode, FolderTree, Package, History, ArrowLeft, Download, FileUp, FileText } from 'lucide-react';`);
} else {
   code = code.replace(`import { Search`, `import { Search, History, ArrowLeft, Download, FileUp, FileText`);
}

const stateTarget = `  const [showConfirmModal, setShowConfirmModal] = useState(false);`;
const stateReplacement = `  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showHistory, setShowHistory] = useState(false);`;
code = code.replace(stateTarget, stateReplacement);

const returnTarget = `      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">`;
const returnReplacement = `      <div className="space-y-6">`;
code = code.replace(returnTarget, returnReplacement);

const formTarget = `        {/* Form Input Container */}
        <div className="bg-white p-5 border border-gray-200 rounded-2xl shadow-sm lg:col-span-1 h-fit">
          <div className="border-b border-gray-100 pb-3 mb-4">
            <h3 className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
              <ArrowUpRight className="w-4.5 h-4.5 text-red-500 bg-red-50 p-0.5 rounded" />
              Proses Distribusi Barang Keluar
            </h3>
            <p className="text-[10px] text-gray-400 mt-1 uppercase font-bold tracking-wider">Keluarkan barang untuk unit pemohon</p>
          </div>`;
const formReplacement = `        {/* Form Input Container */}
        {!showHistory && (
        <div className="bg-white p-5 border border-gray-200 rounded-2xl shadow-sm max-w-2xl mx-auto h-fit">
          <div className="flex justify-between items-center border-b border-gray-100 pb-3 mb-4">
            <div>
              <h3 className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
                <ArrowUpRight className="w-4.5 h-4.5 text-red-500 bg-red-50 p-0.5 rounded" />
                Proses Distribusi Barang Keluar
              </h3>
              <p className="text-[10px] text-gray-400 mt-1 uppercase font-bold tracking-wider">Keluarkan barang untuk unit pemohon</p>
            </div>
            <button 
              onClick={() => setShowHistory(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
            >
              <History className="w-3.5 h-3.5" />
              Riwayat Barang Keluar
            </button>
          </div>`;
code = code.replace(formTarget, formReplacement);

const listTarget = `        {/* Transactions list */}
        <div className="bg-white p-5 border border-gray-200 rounded-2xl shadow-sm lg:col-span-2">
          <h3 className="font-bold text-gray-900 text-sm border-b border-gray-100 pb-3 mb-4 flex items-center justify-between">
            <span>Daftar Distribusi Barang Terbaru</span>
            <span className="text-xs text-gray-400 font-semibold">{transaksiList.length} Transaksi</span>
          </h3>`;

const listReplacement = `        </div>
        )}
        {/* Transactions list */}
        {showHistory && (
        <div className="bg-white p-5 border border-gray-200 rounded-2xl shadow-sm">
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
                Daftar Distribusi Barang Terbaru
              </h3>
              <span className="text-xs text-gray-400 font-semibold">{transaksiList.length} Transaksi</span>
            </div>
          </div>`;
code = code.replace(listTarget, listReplacement);

// Fix missing closing div and brace for the list
const listEndTarget = `      </div>
    </div>
  );
}`;
const listEndReplacement = `          </div>
        )}
      </div>
    </div>
  );
}`;
code = code.replace(listEndTarget, listEndReplacement);

fs.writeFileSync('src/components/TransaksiKeluarView.tsx', code);
