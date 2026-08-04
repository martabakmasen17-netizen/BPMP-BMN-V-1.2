/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const INDEX_HTML_CONTENT = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SILAP BMN - BPMP Sumatera Selatan</title>
  
  <!-- Tailwind CSS CDN -->
  <script src="https://cdn.tailwindcss.com"></script>
  
  <!-- Font Inter & JetBrains Mono -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;600;700&display=swap" rel="stylesheet">
  
  <!-- Bootstrap Icons -->
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css">
  
  <!-- SweetAlert2 CDN -->
  <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>

  <style>
    body {
      font-family: 'Inter', sans-serif;
      background-color: #F8FAFC;
    }
    .scrollbar-thin::-webkit-scrollbar {
      width: 5px;
      height: 5px;
    }
    .scrollbar-thin::-webkit-scrollbar-track {
      background: transparent;
    }
    .scrollbar-thin::-webkit-scrollbar-thumb {
      background: #CBD5E1;
      border-radius: 99px;
    }
    .viewport-container {
      height: 100vh;
      overflow: hidden;
    }
  </style>
</head>
<body class="text-slate-900 selection:bg-blue-100 font-medium bg-slate-50">

  <!-- ==================== PAGE: LOGIN / REGISTER ==================== -->
  <div id="page-login" class="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden select-none">
    <!-- Ambient background glows -->
    <div class="absolute top-1/4 left-1/4 w-80 h-80 bg-blue-600/10 rounded-full blur-[100px] pointer-events-none"></div>
    <div class="absolute bottom-1/4 right-1/4 w-80 h-80 bg-violet-600/10 rounded-full blur-[100px] pointer-events-none"></div>
    
    <div class="w-full max-w-md bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl p-6 relative z-10 space-y-6">
      
      <!-- App Identity / Header -->
      <div class="text-center space-y-2">
        <div class="w-14 h-14 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto shadow-xl shadow-blue-500/10">
          <i class="bi bi-box-seam-fill text-2xl text-white"></i>
        </div>
        <div>
          <h2 class="text-xl font-extrabold tracking-tight text-white">SILAP BMN</h2>
          <p class="text-[10px] text-slate-400 font-bold uppercase tracking-wider">BPMP Provinsi Sumatera Selatan</p>
        </div>
      </div>

      <!-- Card Title & Toggles -->
      <div class="border-b border-slate-800 pb-3 flex justify-between items-center">
        <h3 id="login-card-title" class="text-sm font-bold text-slate-200">Masuk ke Sistem</h3>
        <button id="btn-toggle-auth" onclick="toggleAuthMode()" class="text-xs text-blue-400 hover:text-blue-300 font-semibold cursor-pointer">
          Buat Akun Baru &rarr;
        </button>
      </div>

      <!-- FORM LOGIN -->
      <form id="form-login-fields" onsubmit="handleLoginSubmit(event)" class="space-y-4">
        <div class="space-y-1">
          <label class="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">NIP atau Username</label>
          <div class="relative">
            <span class="absolute left-3 top-2.5 text-slate-500"><i class="bi bi-person"></i></span>
            <input type="text" id="login-username" required placeholder="admin / petugas" class="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500/50 transition-all font-semibold">
          </div>
        </div>

        <div class="space-y-1">
          <div class="flex justify-between items-center mb-0.5">
            <label class="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Kata Sandi (Password)</label>
            <button type="button" onclick="showForgotPasswordModal()" class="text-[10px] text-blue-400 hover:text-blue-300 hover:underline font-semibold cursor-pointer">
              Lupa Sandi?
            </button>
          </div>
          <div class="relative">
            <span class="absolute left-3 top-2.5 text-slate-500"><i class="bi bi-key"></i></span>
            <input type="password" id="login-password" required placeholder="••••••••" class="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500/50 transition-all font-mono">
          </div>
        </div>

        <button type="submit" class="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-500/15 cursor-pointer transition-all">
          Masuk Sekarang <i class="bi bi-arrow-right-short ml-1"></i>
        </button>
      </form>

      <!-- FORM REGISTER (Hidden by default) -->
      <form id="form-register-fields" onsubmit="handleRegisterSubmit(event)" class="space-y-4 hidden max-h-[420px] overflow-y-auto pr-1 scrollbar-thin">
        <div class="space-y-1">
          <label class="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Nama Lengkap</label>
          <input type="text" id="reg-nama" required placeholder="Nama lengkap beserta gelar" class="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-blue-500/50 transition-all font-semibold">
        </div>

        <div class="space-y-1">
          <label class="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">NIP (Nomor Induk Pegawai)</label>
          <input type="text" id="reg-nip" required placeholder="Contoh: 19880415..." class="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-blue-500/50 transition-all font-mono">
        </div>

        <div class="space-y-1">
          <label class="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Jabatan / Posisi</label>
          <input type="text" id="reg-jabatan" required placeholder="Contoh: Petugas BMN Baru" class="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-blue-500/50 transition-all font-semibold">
        </div>

        <div class="space-y-1">
          <label class="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">No. WhatsApp / Telepon</label>
          <input type="text" id="reg-telepon" required placeholder="Contoh: 081273..." class="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-blue-500/50 transition-all font-semibold">
        </div>

        <div class="space-y-1">
          <label class="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Username Akun</label>
          <input type="text" id="reg-username" required placeholder="Digunakan untuk login" class="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-blue-500/50 transition-all font-semibold">
        </div>

        <div class="space-y-1">
          <label class="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Kata Sandi (Password)</label>
          <input type="password" id="reg-password" required placeholder="Minimal 4 karakter" class="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-blue-500/50 transition-all font-mono">
        </div>

        <button type="submit" class="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-500/15 cursor-pointer transition-all">
          Kirim Permohonan Daftar <i class="bi bi-file-earmark-check ml-1"></i>
        </button>
      </form>
    </div>
  </div>

  <!-- ==================== LUPA SANDI MODAL ==================== -->
  <div id="modal-forgot" class="fixed inset-0 bg-slate-950/70 backdrop-blur-sm hidden items-center justify-center p-4 z-50">
    <div class="bg-slate-850 bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 text-center text-slate-300 shadow-2xl relative">
      <div class="w-14 h-14 bg-blue-500/10 border border-blue-500/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <i class="bi bi-key-fill text-2xl text-blue-400"></i>
      </div>
      <h3 class="text-lg font-bold text-white mb-2">Lupa Kata Sandi Akun?</h3>
      <p class="text-xs leading-relaxed mb-4 text-slate-300 text-left">
        Untuk alasan keamanan dan integritas data BMN, sistem <strong class="text-white">SILAP BMN</strong> tidak menyimpan sandi secara terenkripsi satu arah di sisi klien saja. 
      </p>

      <div class="p-3.5 bg-slate-950/60 rounded-2xl border border-slate-800 text-[11px] leading-relaxed text-slate-400 mb-6 text-left space-y-2">
        <p class="text-slate-200 font-bold">💡 CARA MERESET KATA SANDI:</p>
        <ol class="list-decimal pl-4 space-y-1">
          <li>Silakan hubungi Kepala Subbagian Umum selaku <strong>Administrator (Wahyudi, S.Si)</strong>.</li>
          <li>Administrator dapat melihat dan mengganti sandi Anda secara langsung melalui panel <strong>Admin Control Center</strong>.</li>
          <li>Gunakan tautan di bawah ini untuk mengirim pesan otomatis permohonan reset sandi via WhatsApp.</li>
        </ol>
      </div>

      <div class="flex flex-col gap-2.5">
        <a id="btn-wa-reset" href="#" target="_blank" class="w-full py-2.5 bg-green-600 hover:bg-green-500 text-white font-bold text-xs rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer">
          Kirim Permohonan ke Admin (WA) <i class="bi bi-whatsapp"></i>
        </a>
        <button onclick="closeForgotPasswordModal()" class="w-full py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 font-semibold text-xs rounded-xl transition-all cursor-pointer">
          Kembali ke Halaman Login
        </button>
      </div>
    </div>
  </div>

  <!-- ==================== REGISTRATION SUCCESS MODAL ==================== -->
  <div id="modal-reg-success" class="fixed inset-0 bg-slate-950/70 backdrop-blur-sm hidden items-center justify-center p-4 z-50">
    <div class="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 text-center text-slate-300 shadow-2xl relative">
      <div class="w-14 h-14 bg-green-500/10 border border-green-500/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <i class="bi bi-patch-check-fill text-2xl text-green-400"></i>
      </div>
      <h3 class="text-lg font-bold text-white mb-2">Pendaftaran Berhasil Dikirim!</h3>
      <p class="text-xs leading-relaxed mb-4 text-slate-400">
        Permohonan akun Anda telah dicatat ke database dengan status <span class="px-2 py-0.5 bg-amber-500/10 text-amber-400 rounded-lg font-bold">Pending</span>. Silakan hubungi Administrator untuk persetujuan akun agar dapat masuk.
      </p>

      <div class="p-3.5 bg-slate-950/60 rounded-2xl border border-slate-800 text-[11px] text-slate-300 text-left space-y-1.5 font-mono mb-6">
        <div><span class="text-slate-500">NAMA:</span> <strong class="text-white" id="success-nama">-</strong></div>
        <div><span class="text-slate-500">NIP:</span> <strong class="text-white" id="success-nip">-</strong></div>
      </div>

      <div class="flex flex-col gap-2.5">
        <a id="btn-wa-confirm" href="#" target="_blank" class="w-full py-2.5 bg-green-600 hover:bg-green-500 text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer">
          Kirim Notifikasi via WhatsApp <i class="bi bi-whatsapp"></i>
        </a>
        <button onclick="closeRegSuccessModal()" class="w-full py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 font-semibold text-xs rounded-xl transition-all cursor-pointer">
          Selesai & Kembali
        </button>
      </div>
    </div>
  </div>


  <!-- ==================== MAIN APPLICATION LAYOUT ==================== -->
  <div id="page-app" class="hidden viewport-container flex bg-slate-50 select-none">
    
    <!-- SIDEBAR -->
    <div class="bg-slate-900 text-slate-300 w-64 flex flex-col h-full z-30 border-r border-slate-800 flex-shrink-0">
      
      <!-- Institution Header -->
      <div class="p-4 border-b border-slate-800 flex items-center gap-3 bg-slate-950/50">
        <div class="bg-blue-600 text-white p-2 rounded-xl">
          <i class="bi bi-building-fill-check text-xl"></i>
        </div>
        <div class="flex flex-col">
          <span class="font-extrabold text-[11px] tracking-tight text-white uppercase">BPMP SUMATERA SELATAN</span>
          <span class="text-[9px] text-slate-400 font-bold uppercase">Sistem SILAP BMN</span>
        </div>
      </div>

      <!-- Navigation Links -->
      <div class="flex-1 overflow-y-auto p-3 space-y-1 scrollbar-thin">
        
        <div class="px-3 py-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Navigasi Utama</div>
        <button onclick="switchTab('dashboard')" id="btn-tab-dashboard" class="nav-item w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold transition-all text-white bg-blue-600 shadow-sm">
          <i class="bi bi-grid-1x2"></i>
          <span>Dashboard</span>
        </button>

        <div class="px-3 mt-4 py-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Gudang & Inventaris</div>
        <button onclick="switchTab('barang')" id="btn-tab-barang" class="nav-item w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold transition-all text-slate-400 hover:bg-slate-800 hover:text-slate-200">
          <i class="bi bi-box-seam"></i>
          <span>Katalog Barang</span>
        </button>
        <button onclick="switchTab('kategori')" id="btn-tab-kategori" class="nav-item w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold transition-all text-slate-400 hover:bg-slate-800 hover:text-slate-200">
          <i class="bi bi-tags"></i>
          <span>Kategori & Satuan</span>
        </button>

        <div class="px-3 mt-4 py-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Mutasi Logistik</div>
        <button onclick="switchTab('masuk')" id="btn-tab-masuk" class="nav-item w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold transition-all text-slate-400 hover:bg-slate-800 hover:text-slate-200">
          <i class="bi bi-arrow-down-left-circle text-green-500"></i>
          <span>Barang Masuk</span>
        </button>
        <button onclick="switchTab('keluar')" id="btn-tab-keluar" class="nav-item w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold transition-all text-slate-400 hover:bg-slate-800 hover:text-slate-200">
          <i class="bi bi-arrow-up-right-circle text-red-500"></i>
          <span>Barang Keluar</span>
        </button>

        <!-- Admin-Only Panel Link -->
        <div id="nav-group-admin" class="hidden">
          <div class="px-3 mt-4 py-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Kontrol Sistem</div>
          <button onclick="switchTab('admin')" id="btn-tab-admin" class="nav-item w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold transition-all text-slate-400 hover:bg-slate-800 hover:text-slate-200">
            <i class="bi bi-shield-lock-fill text-amber-500"></i>
            <span>Admin Control Center</span>
          </button>
        </div>
      </div>

      <!-- User profile & Logout -->
      <div class="p-4 border-t border-slate-800 bg-slate-950/40 space-y-3">
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-xl bg-blue-600/10 border border-blue-500/30 text-blue-400 flex items-center justify-center font-bold text-xs flex-shrink-0" id="user-avatar">
            -
          </div>
          <div class="min-w-0 flex-1">
            <span class="text-xs font-bold text-white truncate block" id="user-display-name">-</span>
            <span class="text-[10px] text-slate-400 font-semibold truncate block" id="user-display-role">-</span>
          </div>
        </div>
        <button onclick="handleLogout()" class="w-full py-2 bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer">
          <i class="bi bi-box-arrow-right"></i> Keluar Aplikasi
        </button>
      </div>
    </div>

    <!-- MAIN FRAME -->
    <div class="flex-1 flex flex-col h-full min-w-0">
      
      <!-- Top navbar -->
      <header class="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-6 flex-shrink-0">
        <div class="flex items-center gap-2">
          <h2 id="header-page-title" class="text-sm font-extrabold text-slate-900 uppercase tracking-wider">Dashboard Pemantauan</h2>
        </div>
        <div class="flex items-center gap-3">
          <span class="text-xs text-slate-500 font-semibold bg-slate-100 px-3 py-1 rounded-xl" id="system-time">-</span>
        </div>
      </header>

      <!-- VIEW WINDOW -->
      <main class="flex-1 overflow-y-auto p-6 scrollbar-thin">
        
        <!-- LOADING SPINNER -->
        <div id="app-loading-spinner" class="h-64 flex flex-col items-center justify-center gap-3">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span class="text-xs text-slate-500 font-semibold">Sinkronisasi Basis Data Cloud...</span>
        </div>

        <div id="views-wrapper" class="hidden space-y-6">
          
          <!-- ==================== VIEW: DASHBOARD ==================== -->
          <div id="view-dashboard" class="tab-pane space-y-6">
            <!-- Stats -->
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                <div class="bg-blue-50 text-blue-600 p-3 rounded-xl"><i class="bi bi-box-seam text-lg"></i></div>
                <div>
                  <span class="text-xs text-slate-500 block font-bold">Total Barang</span>
                  <span id="stat-total-barang" class="text-lg font-extrabold text-slate-900 block mt-0.5">0</span>
                </div>
              </div>
              <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                <div class="bg-green-50 text-green-600 p-3 rounded-xl"><i class="bi bi-check-circle text-lg"></i></div>
                <div>
                  <span class="text-xs text-slate-500 block font-bold">Stok Aman</span>
                  <span id="stat-stok-aman" class="text-lg font-extrabold text-slate-900 block mt-0.5">0</span>
                </div>
              </div>
              <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                <div class="bg-amber-50 text-amber-600 p-3 rounded-xl"><i class="bi bi-exclamation-triangle text-lg"></i></div>
                <div>
                  <span class="text-xs text-slate-500 block font-bold">Stok Rendah</span>
                  <span id="stat-stok-rendah" class="text-lg font-extrabold text-slate-900 block mt-0.5">0</span>
                </div>
              </div>
              <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                <div class="bg-red-50 text-red-600 p-3 rounded-xl"><i class="bi bi-x-octagon text-lg"></i></div>
                <div>
                  <span class="text-xs text-slate-500 block font-bold">Stok Habis</span>
                  <span id="stat-stok-habis" class="text-lg font-extrabold text-slate-900 block mt-0.5">0</span>
                </div>
              </div>
            </div>

            <!-- Welcome banner -->
            <div class="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div class="space-y-1">
                <h4 class="font-bold text-gray-900 text-sm">Selamat Datang di SILAP BMN Sumsel!</h4>
                <p class="text-xs text-gray-500 leading-relaxed">
                  Gunakan navigasi sebelah kiri untuk mengelola katalog, mencatat transaksi masuk/keluar, atau menyetujui mutasi barang persediaan.
                </p>
              </div>
            </div>
          </div>

          <!-- ==================== VIEW: KATALOG BARANG ==================== -->
          <div id="view-barang" class="tab-pane hidden space-y-4">
            <div class="bg-white p-4 border border-slate-200 rounded-2xl flex items-center justify-between shadow-xs">
              <span class="text-xs text-slate-500 font-bold">Daftar item barang persediaan BMN aktif.</span>
            </div>
            
            <div class="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
              <table class="w-full text-left border-collapse">
                <thead>
                  <tr class="bg-slate-50/75 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    <th class="p-3">Kode / Item</th>
                    <th class="p-3">Kategori</th>
                    <th class="p-3">Lokasi</th>
                    <th class="p-3 text-center">Stok</th>
                    <th class="p-3">Satuan</th>
                  </tr>
                </thead>
                <tbody id="table-barang-body" class="divide-y divide-slate-100 text-xs text-slate-700">
                  <!-- JS Injection -->
                </tbody>
              </table>
            </div>
          </div>

          <!-- ==================== VIEW: KATEGORI ==================== -->
          <div id="view-kategori" class="tab-pane hidden space-y-6">
            <div class="bg-white p-5 border border-slate-200 rounded-2xl shadow-xs">
              <h4 class="font-bold text-slate-900 text-xs mb-3 uppercase tracking-wider">Daftar Kategori</h4>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-3" id="kategori-container">
                <!-- JS Injection -->
              </div>
            </div>
          </div>

          <!-- ==================== VIEW: BARANG MASUK ==================== -->
          <div id="view-masuk" class="tab-pane hidden space-y-6">
            <div class="bg-white p-5 border border-slate-200 rounded-2xl shadow-xs space-y-4">
              <h4 class="font-bold text-slate-900 text-xs uppercase tracking-wider">Riwayat Barang Masuk (Inbound)</h4>
              <div class="overflow-x-auto">
                <table class="w-full text-left border-collapse">
                  <thead>
                    <tr class="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase">
                      <th class="p-3">ID / Tanggal</th>
                      <th class="p-3">Barang</th>
                      <th class="p-3">Jumlah</th>
                      <th class="p-3">Supplier</th>
                      <th class="p-3">Petugas</th>
                    </tr>
                  </thead>
                  <tbody id="table-masuk-body" class="divide-y divide-slate-100 text-xs text-slate-700">
                    <!-- JS Injection -->
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- ==================== VIEW: BARANG KELUAR ==================== -->
          <div id="view-keluar" class="tab-pane hidden space-y-6">
            <div class="bg-white p-5 border border-slate-200 rounded-2xl shadow-xs space-y-4">
              <h4 class="font-bold text-slate-900 text-xs uppercase tracking-wider">Riwayat Barang Keluar (Outbound)</h4>
              <div class="overflow-x-auto">
                <table class="w-full text-left border-collapse">
                  <thead>
                    <tr class="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase">
                      <th class="p-3">ID / Tanggal</th>
                      <th class="p-3">Barang</th>
                      <th class="p-3">Jumlah</th>
                      <th class="p-3">Penerima</th>
                      <th class="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody id="table-keluar-body" class="divide-y divide-slate-100 text-xs text-slate-700">
                    <!-- JS Injection -->
                  </tbody>
                </table>
              </div>
            </div>
          </div>


          <!-- ==================== VIEW: ADMIN CONTROL CENTER ==================== -->
          <div id="view-admin" class="tab-pane hidden space-y-6">
            
            <div class="bg-gradient-to-r from-red-500/10 to-amber-500/10 border border-red-500/20 p-4 rounded-2xl">
              <h4 class="font-bold text-red-900 text-xs uppercase tracking-wider mb-1">Admin Control Center</h4>
              <p class="text-[11px] text-red-700 leading-relaxed font-semibold">
                Kelola pendaftaran akun pegawai baru, lihat sandi pegawai, ganti sandi, atau hapus akun pengguna di bawah ini.
              </p>
            </div>

            <!-- SECTION 1: PENDING CONFIRMATIONS -->
            <div class="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              <div class="p-4 border-b border-slate-200 bg-slate-50/50 flex justify-between items-center">
                <h3 class="font-extrabold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <i class="bi bi-person-fill-exclamation text-amber-500 text-base"></i>
                  Konfirmasi Pendaftaran Akun (<span id="count-pending">0</span> Menunggu Tindakan)
                </h3>
              </div>
              <div class="overflow-x-auto">
                <table class="w-full text-left border-collapse">
                  <thead>
                    <tr class="bg-slate-50/70 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      <th class="p-3">Nama Lengkap / NIP</th>
                      <th class="p-3">Jabatan / Posisi</th>
                      <th class="p-3">Username</th>
                      <th class="p-3">Telepon</th>
                      <th class="p-3 text-center">Tindakan</th>
                    </tr>
                  </thead>
                  <tbody id="table-pending-accounts" class="divide-y divide-slate-100 text-xs text-slate-700 font-medium">
                    <!-- JS Injection -->
                  </tbody>
                </table>
              </div>
            </div>

            <!-- SECTION 2: APPROVED / ACTIVE DIRECTORY -->
            <div class="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              <div class="p-4 border-b border-slate-200 bg-slate-50/50">
                <h3 class="font-extrabold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <i class="bi bi-people-fill text-blue-500 text-base"></i>
                  Direktori Akun Terkonfirmasi / Aktif (<span id="count-active">0</span>)
                </h3>
              </div>
              <div class="overflow-x-auto">
                <table class="w-full text-left border-collapse">
                  <thead>
                    <tr class="bg-slate-50/70 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      <th class="p-3">Nama Lengkap / NIP</th>
                      <th class="p-3">Jabatan</th>
                      <th class="p-3">Username</th>
                      <th class="p-3">Kata Sandi</th>
                      <th class="p-3">Telepon</th>
                      <th class="p-3 text-center">Status</th>
                      <th class="p-3 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody id="table-active-accounts" class="divide-y divide-slate-100 text-xs text-slate-700 font-medium">
                    <!-- JS Injection -->
                  </tbody>
                </table>
              </div>
            </div>

          </div>

        </div>
      </main>
    </div>
  </div>


  <!-- ==================== CLIENT JAVASCRIPT ENGINE ==================== -->
  <script>
    // --- STATE ENGINE ---
    let currentUser = null;
    let database = {
      barang: [],
      kategori: [],
      supplier: [],
      unit: [],
      satuan: [],
      barangMasuk: [],
      barangKeluar: [],
      accounts: [] // New accounts array added
    };

    // --- MOCK DATABASE (Used when run outside Apps Script context) ---
    const MOCK_DATA = {
      barang: [],
      kategori: [],
      barangMasuk: [],
      barangKeluar: [],
      accounts: [
        { username: "admin", nama: "Ilham Muharrama", nip: "-", jabatan: "Magang/KP / Administrator", telepon: "08981741680", password: "admin", role: "Administrator", status: "Disetujui" },
        { username: "petugas", nama: "Roni Setiawan", nip: "198804152014021003", jabatan: "Petugas BMN", telepon: "081271234567", password: "bmn", role: "Petugas BMN", status: "Disetujui" }
      ]
    };

    // Initialize Page
    window.onload = function() {
      // Set Clock
      setInterval(() => {
        const now = new Date();
        document.getElementById("system-time").innerText = now.toLocaleString("id-ID", { hour12: false });
      }, 1000);

      fetchDatabase();
    };

    // --- FETCH DATA FROM GOOGLE APPS SCRIPT ---
    function fetchDatabase() {
      showSpinner(true);
      
      if (typeof google !== 'undefined' && google.script && google.script.run) {
        google.script.run
          .withSuccessHandler(function(data) {
            database = data;
            showSpinner(false);
            renderUI();
          })
          .withFailureHandler(function(err) {
            Swal.fire({ icon: 'error', title: 'Sinkronisasi Gagal', text: err.toString() });
            showSpinner(false);
          })
          .getInitialData();
      } else {
        // Fallback Mock data for preview
        setTimeout(() => {
          database = MOCK_DATA;
          showSpinner(false);
          renderUI();
        }, 1000);
      }
    }

    function showSpinner(show) {
      if (show) {
        document.getElementById("app-loading-spinner").classList.remove("hidden");
        document.getElementById("views-wrapper").classList.add("hidden");
      } else {
        document.getElementById("app-loading-spinner").classList.add("hidden");
        document.getElementById("views-wrapper").classList.remove("hidden");
      }
    }

    // --- TOGGLE AUTH MODAL MODE ---
    let authMode = "login"; // login | register
    function toggleAuthMode() {
      const loginForm = document.getElementById("form-login-fields");
      const regForm = document.getElementById("form-register-fields");
      const title = document.getElementById("login-card-title");
      const toggleBtn = document.getElementById("btn-toggle-auth");

      if (authMode === "login") {
        authMode = "register";
        loginForm.classList.add("hidden");
        regForm.classList.remove("hidden");
        title.innerText = "Pendaftaran Akun Baru";
        toggleBtn.innerText = "← Masuk dengan Akun";
      } else {
        authMode = "login";
        loginForm.classList.remove("hidden");
        regForm.classList.add("hidden");
        title.innerText = "Masuk ke Sistem";
        toggleBtn.innerText = "Buat Akun Baru →";
      }
    }

    // --- FORGOT PASSWORD TRIGGER ---
    function showForgotPasswordModal() {
      const adminPhone = "6281178901234";
      const text = "Halo Bapak Wahyudi, saya lupa kata sandi akun saya di aplikasi SILAP BMN.\\n\\nMohon dibantu untuk mereset kata sandi akun saya atau menginformasikan kata sandi aktif saya dari dashboard Admin Control. Terima kasih!";
      const link = "https://wa.me/" + adminPhone + "?text=" + encodeURIComponent(text);
      
      document.getElementById("btn-wa-reset").href = link;
      document.getElementById("modal-forgot").classList.remove("hidden");
      document.getElementById("modal-forgot").classList.add("flex");
    }

    function closeForgotPasswordModal() {
      document.getElementById("modal-forgot").classList.add("hidden");
      document.getElementById("modal-forgot").classList.remove("flex");
    }

    // --- FORM HANDLING: REGISTER ---
    function handleRegisterSubmit(e) {
      e.preventDefault();
      
      const newAcc = {
        username: document.getElementById("reg-username").value.trim().toLowerCase(),
        nama: document.getElementById("reg-nama").value.trim(),
        nip: document.getElementById("reg-nip").value.trim(),
        jabatan: document.getElementById("reg-jabatan").value.trim(),
        telepon: document.getElementById("reg-telepon").value.trim(),
        password: document.getElementById("reg-password").value.trim(),
        role: "Petugas BMN",
        status: "Pending",
        registeredAt: new Date().toISOString()
      };

      if (!newAcc.username || !newAcc.nama || !newAcc.password) {
        Swal.fire({ icon: 'warning', title: 'Data Kurang', text: 'Nama, Username, dan Sandi wajib diisi!' });
        return;
      }

      // Check if username already exists in database
      const exists = database.accounts.some(acc => acc.username === newAcc.username);
      if (exists) {
        Swal.fire({ icon: 'error', title: 'Username Digunakan', text: 'Username tersebut sudah terdaftar di sistem!' });
        return;
      }

      showSpinner(true);

      if (typeof google !== 'undefined' && google.script && google.script.run) {
        google.script.run
          .withSuccessHandler(function(updatedData) {
            database = updatedData;
            showSpinner(false);
            showRegSuccess(newAcc);
          })
          .withFailureHandler(function(err) {
            Swal.fire({ icon: 'error', title: 'Gagal', text: err.toString() });
            showSpinner(false);
          })
          .registerAccount(newAcc);
      } else {
        // Mock success
        setTimeout(() => {
          database.accounts.push(newAcc);
          showSpinner(false);
          showRegSuccess(newAcc);
        }, 1000);
      }
    }

    function showRegSuccess(newAcc) {
      document.getElementById("success-nama").innerText = newAcc.nama;
      document.getElementById("success-nip").innerText = newAcc.nip;

      const adminPhone = "6281178901234";
      const text = "Halo Bapak Wahyudi (Kasubag Umum / Admin SILAP BMN Sumsel),\\n\\nsaya telah mengirimkan permohonan pendaftaran akun pegawai baru:\\n\\n- Nama: " + newAcc.nama + "\\n- NIP: " + newAcc.nip + "\\n- Jabatan: " + newAcc.jabatan + "\\n- Username: " + newAcc.username + "\\n- Telepon: " + newAcc.telepon + "\\n\\nMohon bantuannya untuk menyetujui akun saya melalui panel Admin Control Center. Terima kasih!";
      const waLink = "https://wa.me/" + adminPhone + "?text=" + encodeURIComponent(text);

      document.getElementById("btn-wa-confirm").href = waLink;
      document.getElementById("modal-reg-success").classList.remove("hidden");
      document.getElementById("modal-reg-success").classList.add("flex");
    }

    function closeRegSuccessModal() {
      document.getElementById("modal-reg-success").classList.add("hidden");
      document.getElementById("modal-reg-success").classList.remove("flex");
      // Reset register forms and switch to login
      document.getElementById("form-register-fields").reset();
      toggleAuthMode();
    }

    // --- FORM HANDLING: LOGIN ---
    function handleLoginSubmit(e) {
      e.preventDefault();
      const userVal = document.getElementById("login-username").value.trim().toLowerCase();
      const passVal = document.getElementById("login-password").value.trim();

      // Find user account in database
      const found = database.accounts.find(acc => acc.username === userVal && acc.password === passVal);

      if (!found) {
        Swal.fire({ icon: 'error', title: 'Login Gagal', text: 'Username atau kata sandi tidak cocok!' });
        return;
      }

      if (found.status === "Pending") {
        Swal.fire({ 
          icon: 'warning', 
          title: 'Akun Belum Disetujui', 
          text: 'Status pendaftaran akun Anda masih menunggu persetujuan dari Administrator (Wahyudi, S.Si).' 
        });
        return;
      }

      if (found.status === "Ditolak") {
        Swal.fire({ 
          icon: 'error', 
          title: 'Akun Ditolak', 
          text: 'Mohon maaf, pendaftaran akun Anda ditolak oleh Administrator.' 
        });
        return;
      }

      // Login success
      currentUser = found;
      document.getElementById("page-login").classList.add("hidden");
      document.getElementById("page-app").classList.remove("hidden");

      // Set user profiles in sidebar
      document.getElementById("user-display-name").innerText = found.nama;
      document.getElementById("user-display-role").innerText = found.role;
      document.getElementById("user-avatar").innerText = found.nama.charAt(0);

      // Show/hide admin control tab link
      if (found.role === "Administrator") {
        document.getElementById("nav-group-admin").classList.remove("hidden");
      } else {
        document.getElementById("nav-group-admin").classList.add("hidden");
      }

      switchTab("dashboard");
      renderUI();
      
      Swal.fire({ icon: 'success', title: 'Berhasil Masuk', text: 'Selamat datang, ' + found.nama + '!', timer: 1500, showConfirmButton: false });
    }

    // --- LOGOUT ---
    function handleLogout() {
      Swal.fire({
        title: 'Keluar Aplikasi?',
        text: "Anda harus login kembali untuk mengakses data.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Ya, Keluar',
        cancelButtonText: 'Batal'
      }).then((result) => {
        if (result.isConfirmed) {
          currentUser = null;
          document.getElementById("login-password").value = "";
          document.getElementById("page-app").classList.add("hidden");
          document.getElementById("page-login").classList.remove("hidden");
        }
      });
    }

    // --- NAVIGATION TAB SWITCH ---
    function switchTab(tabId) {
      document.querySelectorAll(".tab-pane").forEach(v => v.classList.add("hidden"));
      document.querySelectorAll(".nav-item").forEach(b => {
        b.classList.remove("bg-blue-600", "text-white");
        b.classList.add("text-slate-400", "hover:bg-slate-800", "hover:text-slate-200");
      });

      document.getElementById("view-" + tabId).classList.remove("hidden");
      document.getElementById("btn-tab-" + tabId).classList.add("bg-blue-600", "text-white");
      document.getElementById("btn-tab-" + tabId).classList.remove("text-slate-400", "hover:bg-slate-800", "hover:text-slate-200");

      const titleMap = {
        dashboard: "Dashboard Pemantauan",
        barang: "Katalog Barang BMN",
        kategori: "Kategori & Satuan",
        masuk: "Logistik Barang Masuk",
        keluar: "Logistik Barang Keluar",
        admin: "Admin Control Center"
      };
      document.getElementById("header-page-title").innerText = titleMap[tabId] || "SILAP BMN";
    }

    // --- RENDER DYNAMIC UI TABLES ---
    function renderUI() {
      // 1. Render Stats
      document.getElementById("stat-total-barang").innerText = database.barang.length;
      document.getElementById("stat-stok-aman").innerText = database.barang.filter(b => b.stokSekarang >= b.stokMin).length;
      document.getElementById("stat-stok-rendah").innerText = database.barang.filter(b => b.stokSekarang < b.stokMin && b.stokSekarang > 0).length;
      document.getElementById("stat-stok-habis").innerText = database.barang.filter(b => b.stokSekarang === 0).length;

      // 2. Render Barang Catalog
      const bBody = document.getElementById("table-barang-body");
      bBody.innerHTML = "";
      if (database.barang.length === 0) {
        bBody.innerHTML = '<tr><td colspan="5" class="p-4 text-center text-slate-400">Tidak ada barang terdaftar</td></tr>';
      } else {
        database.barang.forEach(b => {
          let stokBadge = '<span class="px-2 py-0.5 bg-green-50 text-green-700 border border-green-200 rounded-md font-bold text-[10px]">Aman</span>';
          if (b.stokSekarang === 0) {
            stokBadge = '<span class="px-2 py-0.5 bg-red-50 text-red-700 border border-red-200 rounded-md font-bold text-[10px]">Habis</span>';
          } else if (b.stokSekarang < b.stokMin) {
            stokBadge = '<span class="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-md font-bold text-[10px]">Menipis</span>';
          }
          
          bBody.innerHTML += \`
            <tr class="hover:bg-slate-50 transition-colors">
              <td class="p-3">
                <span class="font-extrabold text-slate-900 block">\${b.namaBarang}</span>
                <span class="text-[10px] font-mono text-slate-400 block font-bold">\${b.kodeBarang}</span>
              </td>
              <td class="p-3 font-semibold text-slate-600">\${b.kategori}</td>
              <td class="p-3 font-semibold text-slate-600">\${b.lokasiRak || '-'}</td>
              <td class="p-3 text-center font-bold font-mono text-slate-900">\${b.stokSekarang}</td>
              <td class="p-3 font-semibold text-slate-500">\${b.satuan} \${stokBadge}</td>
            </tr>
          \`;
        });
      }

      // 3. Render Categories
      const kContainer = document.getElementById("kategori-container");
      kContainer.innerHTML = "";
      database.kategori.forEach(k => {
        kContainer.innerHTML += \`
          <div class="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span class="font-extrabold text-slate-900 text-xs block">\${k.namaKategori}</span>
            <span class="text-[10px] text-slate-500 leading-relaxed block mt-1 font-semibold">\${k.deskripsi}</span>
          </div>
        \`;
      });

      // 4. Render Barang Masuk / Keluar
      const inboundBody = document.getElementById("table-masuk-body");
      inboundBody.innerHTML = "";
      if (database.barangMasuk.length === 0) {
        inboundBody.innerHTML = '<tr><td colspan="5" class="p-4 text-center text-slate-400">Tidak ada riwayat masuk</td></tr>';
      } else {
        database.barangMasuk.forEach(m => {
          inboundBody.innerHTML += \`
            <tr class="hover:bg-slate-50 transition-colors">
              <td class="p-3">
                <span class="font-mono text-slate-900 font-bold block">\${m.idTransaksi}</span>
                <span class="text-[10px] text-slate-400 font-semibold block">\${new Date(m.tanggal).toLocaleDateString('id-ID')}</span>
              </td>
              <td class="p-3">
                <span class="font-bold text-slate-800 block">\${m.namaBarang}</span>
                <span class="text-[10px] font-mono text-slate-400">\${m.kodeBarang}</span>
              </td>
              <td class="p-3 font-bold font-mono text-green-600 font-extrabold">+\${m.jumlah}</td>
              <td class="p-3 font-semibold text-slate-600">\${m.supplier}</td>
              <td class="p-3 font-semibold text-slate-500">\${m.petugas}</td>
            </tr>
          \`;
        });
      }

      const outboundBody = document.getElementById("table-keluar-body");
      outboundBody.innerHTML = "";
      if (!database.barangKeluar || database.barangKeluar.length === 0) {
        outboundBody.innerHTML = '<tr><td colspan="5" class="p-4 text-center text-slate-400">Tidak ada riwayat keluar</td></tr>';
      } else {
        database.barangKeluar.forEach(k => {
          let badge = '<span class="px-2 py-0.5 bg-amber-500/10 text-amber-500 rounded font-bold text-[10px]">Pending</span>';
          if (k.statusPersetujuan === "Disetujui") {
            badge = '<span class="px-2 py-0.5 bg-green-500/10 text-green-500 rounded font-bold text-[10px]">Disetujui</span>';
          } else if (k.statusPersetujuan === "Ditolak") {
            badge = '<span class="px-2 py-0.5 bg-red-500/10 text-red-500 rounded font-bold text-[10px]">Ditolak</span>';
          }
          
          outboundBody.innerHTML += \`
            <tr class="hover:bg-slate-50 transition-colors">
              <td class="p-3">
                <span class="font-mono text-slate-900 font-bold block">\${k.idTransaksi}</span>
                <span class="text-[10px] text-slate-400 font-semibold block">\${new Date(k.tanggal).toLocaleDateString('id-ID')}</span>
              </td>
              <td class="p-3">
                <span class="font-bold text-slate-800 block">\${k.namaBarang}</span>
                <span class="text-[10px] font-mono text-slate-400">\${k.kodeBarang}</span>
              </td>
              <td class="p-3 font-bold font-mono text-red-600 font-extrabold">-\${k.jumlah}</td>
              <td class="p-3 font-semibold text-slate-600">\${k.unitPenerima}</td>
              <td class="p-3">\${badge}</td>
            </tr>
          \`;
        });
      }

      // 5. Render Admin Control Accounts
      renderAdminAccounts();
    }

    // --- RENDER ACCOUNTS DIRECTORY & ACTION HANDLERS ---
    function renderAdminAccounts() {
      const pendingBody = document.getElementById("table-pending-accounts");
      const activeBody = document.getElementById("table-active-accounts");

      const pendingAccs = database.accounts.filter(a => a.status === "Pending");
      const activeOrRejectedAccs = database.accounts.filter(a => a.status !== "Pending");

      document.getElementById("count-pending").innerText = pendingAccs.length;
      document.getElementById("count-active").innerText = activeOrRejectedAccs.length;

      // Pending table
      pendingBody.innerHTML = "";
      if (pendingAccs.length === 0) {
        pendingBody.innerHTML = '<tr><td colspan="5" class="p-4 text-center text-slate-400 font-semibold text-[11px]">Tidak ada permohonan pendaftaran akun pegawai baru yang menunggu konfirmasi saat ini.</td></tr>';
      } else {
        pendingAccs.forEach(acc => {
          pendingBody.innerHTML += \`
            <tr class="hover:bg-slate-50/50 transition-colors">
              <td class="p-3">
                <span class="font-bold text-slate-900 block">\${acc.nama}</span>
                <span class="text-[10px] font-mono text-slate-400">NIP: \${acc.nip}</span>
              </td>
              <td class="p-3 font-semibold text-slate-600">\${acc.jabatan}</td>
              <td class="p-3 font-mono text-slate-800 font-bold">\${acc.username}</td>
              <td class="p-3 font-bold text-blue-600">\${acc.telepon}</td>
              <td class="p-3 text-center">
                <div class="flex justify-center items-center gap-1.5">
                  <button onclick="handleApproveAccount('\${acc.username}')" class="px-2.5 py-1 bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 rounded-lg text-[10px] font-extrabold cursor-pointer transition-all">
                    Setujui
                  </button>
                  <button onclick="handleRejectAccount('\${acc.username}')" class="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg text-[10px] font-extrabold cursor-pointer transition-all">
                    Tolak
                  </button>
                </div>
              </td>
            </tr>
          \`;
        });
      }

      // Active & Rejected Table
      activeBody.innerHTML = "";
      activeOrRejectedAccs.forEach(acc => {
        const isSystemAdmin = acc.username === "admin";
        
        let statusBadge = '<span class="px-2 py-0.5 bg-green-50 text-green-700 border border-green-200 rounded-md font-bold text-[10px]">Disetujui</span>';
        if (acc.status === "Ditolak") {
          statusBadge = '<span class="px-2 py-0.5 bg-red-50 text-red-700 border border-red-200 rounded-md font-bold text-[10px]">Ditolak</span>';
        }

        let actionHtml = '';
        if (isSystemAdmin) {
          actionHtml = '<span class="text-[10px] font-bold text-slate-400 italic font-semibold">Sistem Utama</span>';
        } else {
          actionHtml = \`
            <button onclick="handleDeleteAccount('\${acc.username}')" class="p-1.5 bg-red-50 hover:bg-red-100 border border-red-100 rounded-lg text-red-600 hover:text-red-700 cursor-pointer transition-all" title="Hapus Akun">
              <i class="bi bi-trash-fill"></i>
            </button>
          \`;
        }

        activeBody.innerHTML += \`
          <tr class="hover:bg-slate-50/50 transition-colors">
            <td class="p-3">
              <span class="font-bold text-slate-900 block">\${acc.nama}</span>
              <span class="text-[10px] font-mono text-slate-400">NIP: \${acc.nip}</span>
            </td>
            <td class="p-3 font-semibold text-slate-600">\${acc.jabatan}</td>
            <td class="p-3 font-mono text-slate-800 font-bold">\${acc.username}</td>
            <td class="p-3">
              <div class="flex items-center gap-1.5">
                <span class="font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-800 font-bold select-all text-[11px]">\${acc.password}</span>
                <button onclick="handleEditPassword('\${acc.username}', '\${acc.password}')" class="p-1 text-blue-600 hover:text-blue-700 hover:bg-slate-100 rounded transition-all cursor-pointer" title="Ubah Kata Sandi">
                  <i class="bi bi-pencil-square"></i>
                </button>
              </div>
            </td>
            <td class="p-3 font-bold text-blue-600">\${acc.telepon}</td>
            <td class="p-3 text-center">\${statusBadge}</td>
            <td class="p-3 text-center">\${actionHtml}</td>
          </tr>
        \`;
      });
    }

    // Account Actions Implementation
    function handleApproveAccount(username) {
      if (!currentUser) return;
      showSpinner(true);
      
      if (typeof google !== 'undefined' && google.script && google.script.run) {
        google.script.run
          .withSuccessHandler(function(updatedData) {
            database = updatedData;
            showSpinner(false);
            renderUI();
            Swal.fire({ icon: 'success', title: 'Akun Disetujui', text: 'Pendaftaran akun ' + username + ' telah aktif!', timer: 1500, showConfirmButton: false });
          })
          .withFailureHandler(function(err) {
            Swal.fire({ icon: 'error', title: 'Gagal', text: err.toString() });
            showSpinner(false);
          })
          .approveAccount(username, currentUser.nama, currentUser.role);
      } else {
        // Mock
        setTimeout(() => {
          database.accounts = database.accounts.map(a => a.username === username ? { ...a, status: "Disetujui" } : a);
          showSpinner(false);
          renderUI();
          Swal.fire({ icon: 'success', title: 'Akun Disetujui', text: 'Pendaftaran akun ' + username + ' telah aktif!', timer: 1500, showConfirmButton: false });
        }, 800);
      }
    }

    function handleRejectAccount(username) {
      if (!currentUser) return;
      showSpinner(true);
      
      if (typeof google !== 'undefined' && google.script && google.script.run) {
        google.script.run
          .withSuccessHandler(function(updatedData) {
            database = updatedData;
            showSpinner(false);
            renderUI();
            Swal.fire({ icon: 'info', title: 'Akun Ditolak', text: 'Pendaftaran akun ' + username + ' ditolak.', timer: 1500, showConfirmButton: false });
          })
          .withFailureHandler(function(err) {
            Swal.fire({ icon: 'error', title: 'Gagal', text: err.toString() });
            showSpinner(false);
          })
          .rejectAccount(username, currentUser.nama, currentUser.role);
      } else {
        // Mock
        setTimeout(() => {
          database.accounts = database.accounts.map(a => a.username === username ? { ...a, status: "Ditolak" } : a);
          showSpinner(false);
          renderUI();
        }, 800);
      }
    }

    function handleDeleteAccount(username) {
      if (!currentUser) return;

      Swal.fire({
        title: 'Hapus Akun Pegawai?',
        text: "Tindakan ini permanen dan akan menghapus akun " + username + " dari database.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Ya, Hapus Akun',
        cancelButtonText: 'Batal'
      }).then((result) => {
        if (result.isConfirmed) {
          showSpinner(true);
          
          if (typeof google !== 'undefined' && google.script && google.script.run) {
            google.script.run
              .withSuccessHandler(function(updatedData) {
                database = updatedData;
                showSpinner(false);
                renderUI();
                Swal.fire({ icon: 'success', title: 'Terhapus', text: 'Akun pegawai telah dihapus dari sistem.', timer: 1500, showConfirmButton: false });
              })
              .withFailureHandler(function(err) {
                Swal.fire({ icon: 'error', title: 'Gagal', text: err.toString() });
                showSpinner(false);
              })
              .deleteAccount(username, currentUser.nama, currentUser.role);
          } else {
            // Mock
            setTimeout(() => {
              database.accounts = database.accounts.filter(a => a.username !== username);
              showSpinner(false);
              renderUI();
              Swal.fire({ icon: 'success', title: 'Terhapus', text: 'Akun pegawai telah dihapus.', timer: 1500, showConfirmButton: false });
            }, 800);
          }
        }
      });
    }

    function handleEditPassword(username, currentPass) {
      if (!currentUser) return;

      Swal.fire({
        title: 'Ubah Kata Sandi Akun',
        text: 'Masukkan kata sandi baru untuk akun: ' + username,
        input: 'text',
        inputValue: currentPass,
        inputPlaceholder: 'Kata sandi baru',
        showCancelButton: true,
        confirmButtonText: 'Simpan',
        cancelButtonText: 'Batal',
        inputValidator: (value) => {
          if (!value || value.trim().length < 4) {
            return 'Sandi baru harus minimal 4 karakter!';
          }
        }
      }).then((result) => {
        if (result.isConfirmed && result.value) {
          const newPass = result.value.trim();
          showSpinner(true);

          if (typeof google !== 'undefined' && google.script && google.script.run) {
            google.script.run
              .withSuccessHandler(function(updatedData) {
                database = updatedData;
                showSpinner(false);
                renderUI();
                Swal.fire({ icon: 'success', title: 'Sandi Diperbarui', text: 'Sandi akun ' + username + ' berhasil diubah!', timer: 1500, showConfirmButton: false });
              })
              .withFailureHandler(function(err) {
                Swal.fire({ icon: 'error', title: 'Gagal', text: err.toString() });
                showSpinner(false);
              })
              .updatePassword(username, newPass, currentUser.nama, currentUser.role);
          } else {
            // Mock
            setTimeout(() => {
              database.accounts = database.accounts.map(a => a.username === username ? { ...a, password: newPass } : a);
              showSpinner(false);
              renderUI();
              Swal.fire({ icon: 'success', title: 'Sandi Diperbarui', text: 'Sandi berhasil diubah!', timer: 1500, showConfirmButton: false });
            }, 800);
          }
        }
      });
    }
  </script>
</body>
</html>
`;
