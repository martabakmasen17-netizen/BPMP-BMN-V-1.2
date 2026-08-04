/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { CodeXml, Copy, Check, Download, AlertCircle, Sparkles, BookOpen } from 'lucide-react';
import { CODE_GS_CONTENT } from './gas/code_gs';
import { SETUP_GS_CONTENT } from './gas/setup_gs';
import { INDEX_HTML_CONTENT } from './gas/index_html';

export default function AppsScriptView() {
  const [activeSubTab, setActiveSubTab] = useState<'code' | 'setup' | 'index'>('code');
  const [copied, setCopied] = useState(false);

  const getCodeContent = () => {
    switch (activeSubTab) {
      case 'code':
        return CODE_GS_CONTENT;
      case 'setup':
        return SETUP_GS_CONTENT;
      case 'index':
        return INDEX_HTML_CONTENT;
    }
  };

  const getFilename = () => {
    switch (activeSubTab) {
      case 'code':
        return 'Code.gs';
      case 'setup':
        return 'Setup.gs';
      case 'index':
        return 'Index.html';
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getCodeContent());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([getCodeContent()], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = getFilename();
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Alert Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 p-5 rounded-2xl flex items-start gap-4 shadow-xs text-xs font-medium">
        <Sparkles className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="font-bold text-gray-900 text-sm">Portal Integrasi & Deployment Google Apps Script (GAS)</h4>
          <p className="text-gray-600 leading-relaxed">
            Kode sumber di bawah ini dirancang <strong>100% kompatibel</strong> dengan ekosistem Google Workspace. Dengan menyalin kode ini ke editor skrip Google Spreadsheet Anda, Anda dapat meluncurkan SaaS manajemen pergudangan lengkap di server cloud Google secara gratis!
          </p>
        </div>
      </div>

      {/* Manual Steps Card */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-4">
        <h3 className="font-bold text-gray-900 text-sm flex items-center gap-1.5 border-b border-gray-100 pb-2">
          <BookOpen className="w-4 h-4 text-blue-600" />
          Panduan Deployment 3 Langkah (Sangat Mudah)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-medium text-gray-600">
          <div className="p-3 bg-slate-50/60 rounded-xl space-y-1">
            <span className="text-blue-600 font-bold block">Langkah 1: Siapkan Spreadsheet</span>
            <p className="text-[11px] leading-relaxed">
              Buat sebuah Google Spreadsheet kosong baru. Pilih menu <strong>Extensions (Ekstensi) &gt; Apps Script</strong> untuk membuka editor script Google.
            </p>
          </div>
          <div className="p-3 bg-slate-50/60 rounded-xl space-y-1">
            <span className="text-blue-600 font-bold block">Langkah 2: Salin File Kode</span>
            <p className="text-[11px] leading-relaxed">
              Buat 3 file skrip di Apps Script editor: <code>Code.gs</code>, <code>Setup.gs</code>, dan <code>Index.html</code> (HTML). Salin konten dari tab di bawah ke masing-masing file tersebut.
            </p>
          </div>
          <div className="p-3 bg-slate-50/60 rounded-xl space-y-1">
            <span className="text-blue-600 font-bold block">Langkah 3: Jalankan Setup & Deploy</span>
            <p className="text-[11px] leading-relaxed">
              Pilih fungsi <code>initializeSystem</code> di file <code>Setup.gs</code> dan klik **Run**. Klik **Deploy &gt; New Deployment** sebagai Web App untuk mendapatkan URL aktif aplikasi!
            </p>
          </div>
        </div>
      </div>

      {/* Editor Panel */}
      <div className="bg-slate-900 rounded-2xl overflow-hidden shadow-lg border border-slate-800 flex flex-col h-[600px]">
        {/* Header toolbar */}
        <div className="bg-slate-950 px-4 py-3 flex items-center justify-between border-b border-slate-800 flex-shrink-0">
          <div className="flex gap-1">
            <button
              onClick={() => setActiveSubTab('code')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeSubTab === 'code' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Code.gs
            </button>
            <button
              onClick={() => setActiveSubTab('setup')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeSubTab === 'setup' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Setup.gs
            </button>
            <button
              onClick={() => setActiveSubTab('index')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeSubTab === 'index' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Index.html
            </button>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-semibold cursor-pointer transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-green-400" /> Terpilih!
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" /> Salin Kode
                </>
              )}
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold cursor-pointer transition-colors"
            >
              <Download className="w-3.5 h-3.5" /> Unduh
            </button>
          </div>
        </div>

        {/* Code body */}
        <div className="flex-1 overflow-auto p-4 font-mono text-[11px] text-slate-300 bg-slate-900 scrollbar-thin select-text">
          <pre className="whitespace-pre">{getCodeContent()}</pre>
        </div>
      </div>
    </div>
  );
}
