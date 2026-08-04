const fs = require('fs');
let code = fs.readFileSync('src/components/Navbar.tsx', 'utf8');

if (!code.includes("import { motion, AnimatePresence } from 'framer-motion';")) {
  code = code.replace("import React, { useState } from 'react';", "import React, { useState } from 'react';\nimport { motion, AnimatePresence } from 'framer-motion';");
}
if (!code.includes("AlertTriangle")) {
  code = code.replace("LogOut } from 'lucide-react';", "LogOut, AlertTriangle, X } from 'lucide-react';");
}

code = code.replace("const [showNotificationPopover, setShowNotificationPopover] = useState(false);", "const [showNotificationPopover, setShowNotificationPopover] = useState(false);\n  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);");

code = code.replace("onClick={onLogout}", "onClick={() => setShowLogoutConfirm(true)}");

const modalCode = `
      <AnimatePresence>
        {showLogoutConfirm && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowLogoutConfirm(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-white rounded-2xl shadow-xl z-50 overflow-hidden"
            >
              <div className="p-6">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4 mx-auto">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 text-center mb-2">Konfirmasi Keluar</h3>
                <p className="text-sm text-slate-500 text-center mb-6">
                  Apakah Anda yakin ingin keluar dari sesi saat ini? Anda harus masuk kembali untuk mengakses sistem.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowLogoutConfirm(false)}
                    className="flex-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    onClick={() => {
                      setShowLogoutConfirm(false);
                      onLogout();
                    }}
                    className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-sm transition-colors shadow-sm cursor-pointer"
                  >
                    Ya, Keluar
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
`;

code = code.replace("</header>", `${modalCode}\n    </header>`);

fs.writeFileSync('src/components/Navbar.tsx', code);
console.log("Done");
