const fs = require('fs');
let code = fs.readFileSync('src/components/TransaksiMasukView.tsx', 'utf8');

const importTarget = `import { Package, Search, PlusCircle, Filter, CalendarDays, History, AlertCircle, Save, QrCode, FileText, Upload, CheckCircle2, ShieldAlert, X } from 'lucide-react';`;
if (code.includes(importTarget)) {
   code = code.replace(importTarget, `import { Package, Search, PlusCircle, Filter, CalendarDays, History, AlertCircle, Save, QrCode, FileText, Upload, CheckCircle2, ShieldAlert, X, ArrowLeft, ArrowRight, Download, ArrowDownLeft, FileUp } from 'lucide-react';`);
} else {
   code = code.replace(`import { Package, Search, X`, `import { Package, Search, X, ArrowLeft, ArrowRight, Download, ArrowDownLeft, FileUp`);
}

const stateTarget = `  const [showConfirmModal, setShowConfirmModal] = useState(false);`;
const stateReplacement = `  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showHistory, setShowHistory] = useState(false);`;
code = code.replace(stateTarget, stateReplacement);

const returnTarget = `    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">`;
const returnReplacement = `    <div className="space-y-6">`;
code = code.replace(returnTarget, returnReplacement);

const formTarget = `      {/* Transaction form */}
      <div className="bg-white p-5 border border-gray-200 rounded-2xl shadow-sm lg:col-span-1 h-fit">`;
const formReplacement = `      {/* Transaction form */}
      {!showHistory && (
      <div className="bg-white p-5 border border-gray-200 rounded-2xl shadow-sm max-w-2xl mx-auto h-fit">
        <div className="flex justify-between items-center border-b border-gray-100 pb-3 mb-4">
          <div>
            <h3 className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
              <ArrowDownLeft className="w-4.5 h-4.5 text-green-500 bg-green-50 p-0.5 rounded" />
              Input Penerimaan Barang Masuk
            </h3>
            <p className="text-[10px] text-gray-400 mt-1 uppercase font-bold tracking-wider">Pilih Kategori Dulu → Lalu Pilih Barang</p>
          </div>
          <button 
            onClick={() => setShowHistory(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
          >
            <History className="w-3.5 h-3.5" />
            Riwayat Barang Masuk
          </button>
        </div>`;
code = code.replace(formTarget, formReplacement);

const listTarget = `      {/* Transactions list */}
      <div className="bg-white p-5 border border-gray-200 rounded-2xl shadow-sm lg:col-span-2">
        <h3 className="font-bold text-gray-900 text-sm border-b border-gray-100 pb-3 mb-4 flex items-center justify-between">
          <span>Daftar Riwayat Barang Masuk Baru</span>
          <span className="text-xs text-gray-400 font-semibold">{transaksiList.length} Transaksi</span>
        </h3>`;

const listReplacement = `      </div>
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
              Daftar Riwayat Barang Masuk Baru
            </h3>
            <span className="text-xs text-gray-400 font-semibold">{transaksiList.length} Transaksi</span>
          </div>
        </div>`;
code = code.replace(listTarget, listReplacement);

// Fix missing closing div and brace for the list
const listEndTarget = `    </div>
  );
}`;
const listEndReplacement = `        </div>
      )}
    </div>
  );
}`;
code = code.replace(listEndTarget, listEndReplacement);

// Remove the old header logic inside the form
const oldHeader = `        <div className="border-b border-gray-100 pb-3 mb-4">
          <h3 className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
            <ArrowDownLeft className="w-4.5 h-4.5 text-green-500 bg-green-50 p-0.5 rounded" />
            Input Penerimaan Barang Masuk
          </h3>
          <p className="text-[10px] text-gray-400 mt-1 uppercase font-bold tracking-wider">Pilih Kategori Dulu → Lalu Pilih Barang</p>
        </div>`;
code = code.replace(oldHeader, ``);

fs.writeFileSync('src/components/TransaksiMasukView.tsx', code);
