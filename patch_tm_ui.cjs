const fs = require('fs');
let code = fs.readFileSync('src/components/TransaksiMasukView.tsx', 'utf8');

const submitButtonStr = `                  <button
                    type="submit"
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer text-center flex items-center justify-center gap-2"
                  >
                    <ArrowDownLeft className="w-4 h-4" />
                    Simpan Penerimaan Barang Masuk
                  </button>`;

const newSubmitUI = `                  {/* LANGSUNG KELUAR CHECKBOX */}
                    <div className="pt-2 border-t border-gray-100">
                      <label className="flex items-center gap-2 cursor-pointer bg-slate-50 border border-slate-200 p-2.5 rounded-xl hover:bg-slate-100 transition-colors">
                        <input
                          type="checkbox"
                          checked={isLangsungKeluar}
                          onChange={e => setIsLangsungKeluar(e.target.checked)}
                          className="w-4 h-4 rounded text-blue-600 focus:ring-blue-600 cursor-pointer"
                        />
                        <span className="font-bold text-slate-800 text-xs">Langsung Distribusikan (Masuk & Keluar sekaligus)</span>
                      </label>
                      
                      {isLangsungKeluar && (
                        <div className="mt-3 p-3 bg-blue-50/50 border border-blue-100 rounded-xl space-y-3">
                          <p className="text-[10px] text-blue-700 leading-relaxed font-medium">
                            <span className="font-bold">Info:</span> Fitur ini digunakan untuk barang yang hanya transit (misal: pengadaan acara/event). Sistem akan otomatis mencatat penerimaan barang lalu langsung mendistribusikannya sejumlah <strong>{jumlah} {selectedItem?.satuan}</strong>.
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <label className="block text-slate-700 font-bold">Unit Penerima *</label>
                              <select
                                required={isLangsungKeluar}
                                value={lkUnitId}
                                onChange={e => setLkUnitId(e.target.value)}
                                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none text-xs"
                              >
                                {unitList?.map(u => (
                                  <option key={u.id} value={u.nama}>{u.nama}</option>
                                ))}
                              </select>
                            </div>
                            <div className="space-y-1">
                              <label className="block text-slate-700 font-bold">Keperluan / Acara *</label>
                              <input
                                type="text"
                                required={isLangsungKeluar}
                                value={lkKeperluan}
                                onChange={e => setLkKeperluan(e.target.value)}
                                placeholder="Contoh: Acara Pelatihan..."
                                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none text-xs"
                              />
                            </div>
                          </div>
                          <div className="space-y-1">
                            <label className="block text-slate-700 font-bold">Catatan Distribusi (Opsional)</label>
                            <input
                              type="text"
                              value={lkCatatan}
                              onChange={e => setLkCatatan(e.target.value)}
                              placeholder="Catatan tambahan saat keluar..."
                              className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none text-xs"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                  <button
                    type="submit"
                    className={\`w-full py-2.5 text-white rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer text-center flex items-center justify-center gap-2 \${isLangsungKeluar ? 'bg-blue-600 hover:bg-blue-700' : 'bg-emerald-600 hover:bg-emerald-700'}\`}
                  >
                    <ArrowDownLeft className="w-4 h-4" />
                    {isLangsungKeluar ? 'Simpan Penerimaan & Langsung Distribusikan' : 'Simpan Penerimaan Barang Masuk'}
                  </button>`;

code = code.replace(submitButtonStr, newSubmitUI);
fs.writeFileSync('src/components/TransaksiMasukView.tsx', code);
