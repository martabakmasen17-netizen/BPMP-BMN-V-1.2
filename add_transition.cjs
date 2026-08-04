const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

if (!code.includes('const [isTransitioning, setIsTransitioning] = useState(false);')) {
  code = code.replace("const [isInitialLoad, setIsInitialLoad] = useState(true);", "const [isInitialLoad, setIsInitialLoad] = useState(true);\n  const [isTransitioning, setIsTransitioning] = useState(false);");
}

const onLoginSuccessStr = `onLoginSuccess={(acc) => {
          setIsTransitioning(true);
          setTimeout(() => {
            handleSetCurrentUser(acc);
            setActiveTab('dashboard');
            // Write login log
            const newLog: AuditLog = {
              id: \`LOG-\${Date.now().toString().slice(-6)}\`,
              tanggal: new Date().toISOString(),
              aktor: acc.nama,
              role: acc.role,
              aksi: 'Login',
              detail: \`Sesi login baru dimulai oleh \${acc.nama} (\${acc.role}) pada peranti desktop\`
            };
            setAuditLogsList(prev => [newLog, ...prev]);
            setIsTransitioning(false);
          }, 2000);
        }}`;

code = code.replace(/onLoginSuccess=\{\(acc\) => \{[\s\S]*?setAuditLogsList\(prev => \[newLog, \.\.\.prev\]\);\s*\}\}/, onLoginSuccessStr);

// Now, insert the overlay rendering right before the closing </div> of the app or simply in LoginView wrapper.
// Let's wrap the LoginView return in a fragment and add the overlay, or put it at the root of App.tsx?
// Since it's while currentUser is null, we can return the overlay inside if (!currentUser) { ... }.

const loginViewBlock = `  if (!currentUser) {
    return (
      <>
        <LoginView
          accounts={accounts}
          onLoginSuccess={(acc) => {
            setIsTransitioning(true);
            setTimeout(() => {
              handleSetCurrentUser(acc);
              setActiveTab('dashboard');
              // Write login log
              const newLog: AuditLog = {
                id: \`LOG-\${Date.now().toString().slice(-6)}\`,
                tanggal: new Date().toISOString(),
                aktor: acc.nama,
                role: acc.role,
                aksi: 'Login',
                detail: \`Sesi login baru dimulai oleh \${acc.nama} (\${acc.role}) pada peranti desktop\`
              };
              setAuditLogsList(prev => [newLog, ...prev]);
              setIsTransitioning(false);
            }, 2000);
          }}
          onRegisterAccount={(newAcc) => {
            setAccounts(prev => [...prev, newAcc]);
          }}
        />

        {/* Transition Overlay */}
        <AnimatePresence>
          {isTransitioning && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] bg-slate-900 flex flex-col items-center justify-center overflow-hidden"
            >
              {/* Decorative Background Elements */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <motion.div
                  animate={{ 
                    scale: [1, 1.2, 1],
                    opacity: [0.3, 0.5, 0.3],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="absolute -top-[20%] -right-[10%] w-[70vw] h-[70vw] rounded-full bg-blue-600/20 blur-3xl"
                />
                <motion.div
                  animate={{ 
                    scale: [1, 1.5, 1],
                    opacity: [0.2, 0.4, 0.2],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 1
                  }}
                  className="absolute -bottom-[20%] -left-[10%] w-[60vw] h-[60vw] rounded-full bg-indigo-600/20 blur-3xl"
                />
              </div>

              {/* Main Loader Content */}
              <div className="relative z-10 flex flex-col items-center">
                <div className="w-20 h-20 bg-white rounded-2xl shadow-2xl p-4 mb-8 relative flex items-center justify-center">
                  <motion.img 
                    src="/logo.png" 
                    alt="Logo" 
                    className="w-full h-full object-contain"
                    animate={{ scale: [0.9, 1.05, 0.9] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                  {/* Outer spinning ring */}
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-[-12px] rounded-[1.25rem] border-2 border-transparent border-t-blue-500 border-r-blue-500 opacity-80"
                  />
                  <motion.div
                    animate={{ rotate: -360 }}
                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-[-20px] rounded-[1.5rem] border-2 border-transparent border-b-indigo-500 border-l-indigo-500 opacity-60"
                  />
                </div>
                
                <h2 className="text-2xl font-bold text-white tracking-tight mb-2">
                  Menyiapkan Ruang Kerja Anda
                </h2>
                <div className="flex items-center gap-2">
                  <div className="flex gap-1.5">
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        animate={{ y: [0, -6, 0] }}
                        transition={{
                          duration: 0.6,
                          repeat: Infinity,
                          delay: i * 0.15,
                          ease: "easeInOut"
                        }}
                        className="w-2 h-2 bg-blue-400 rounded-full"
                      />
                    ))}
                  </div>
                  <span className="text-sm font-medium text-blue-200 tracking-wide ml-2">
                    Mengautentikasi pengguna...
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </>
    );
  }`;

code = code.replace(/if \(!currentUser\) \{[\s\S]*?<LoginView[\s\S]*?\/>\s*\);\s*\}/, loginViewBlock);

fs.writeFileSync('src/App.tsx', code);
console.log("Done");
