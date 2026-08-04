/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Shield, Key, User, Phone, Briefcase, Mail, CheckCircle, ExternalLink, ArrowRight, BookOpen, Lock, Sparkles, Server } from 'lucide-react';
import { UserAccount } from '../types';
import LogoImage from './LogoImage';

interface LoginViewProps {
  accounts: UserAccount[];
  onLoginSuccess: (account: UserAccount) => void;
  onRegisterAccount: (newAcc: UserAccount) => void;
  logoUrl?: string;
}

export default function LoginView({ accounts, onLoginSuccess, onRegisterAccount, logoUrl }: LoginViewProps) {
  const [isRegister, setIsRegister] = useState(false);
  
  // Login Form States
  const [loginUser, setLoginUser] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [loginError, setLoginError] = useState('');

  // Register Form States
  const [regNama, setRegNama] = useState('');
  const [regNip, setRegNip] = useState('');
  const [regJabatan, setRegJabatan] = useState('Petugas BMN');
  const [regTelepon, setRegTelepon] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');

  // Forgot password states
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  // Successful Registration Info for WhatsApp Modal
  const [registeredUser, setRegisteredUser] = useState<{ nama: string; nip: string } | null>(null);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    if (!loginUser || !loginPass) {
      setLoginError('Silakan masukkan Username / Email dan Password.');
      return;
    }

    // Find account
    const acc = accounts.find(
      a => a.username.toLowerCase() === loginUser.toLowerCase() && a.password === loginPass
    );

    if (!acc) {
      setLoginError('Kombinasi Username/Email dan Password salah.');
      return;
    }

    if (acc.status === 'Pending') {
      setLoginError('Akun Anda masih dalam status PENDING. Silakan hubungi Administrator untuk meminta konfirmasi.');
      return;
    }

    if (acc.status === 'Ditolak') {
      setLoginError('Maaf, permohonan pendaftaran akun Anda ditolak oleh Administrator.');
      return;
    }

    // Success
    onLoginSuccess(acc);
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regNama || !regNip || !regTelepon || !regUsername || !regPassword) {
      alert('Semua kolom bertanda * wajib diisi!');
      return;
    }

    // Check if account already exists
    const exists = accounts.some(a => a.username.toLowerCase() === regUsername.toLowerCase());
    if (exists) {
      alert('Username / Email ini sudah terdaftar! Silakan gunakan email lain atau login.');
      return;
    }

    // Register
    onRegisterAccount({
      username: regUsername,
      nama: regNama,
      nip: regNip,
      jabatan: regJabatan,
      telepon: regTelepon,
      password: regPassword,
      role: 'Petugas BMN', // Default registered role is BMN officer
      status: 'Pending',
      registeredAt: new Date().toISOString()
    });

    // Set info to show in the success modal
    setRegisteredUser({ nama: regNama, nip: regNip });

    // Reset register form fields
    setRegNama('');
    setRegNip('');
    setRegJabatan('Petugas BMN');
    setRegTelepon('');
    setRegUsername('');
    setRegPassword('');
  };

  const closeSuccessModalAndReset = () => {
    setRegisteredUser(null);
    setIsRegister(false); // return to login
  };

  const handleWhatsAppRedirect = () => {
    if (!registeredUser) return;
    const text = encodeURIComponent(
      `Halo Admin BMN, saya telah mendaftar akun baru Petugas BMN di sistem inventaris.\n\n` +
      `• Nama: ${registeredUser.nama}\n` +
      `• NIP: ${registeredUser.nip}\n\n` +
      `Mohon bantuannya untuk melakukan konfirmasi & aktivasi akun saya agar dapat login. Terima kasih!`
    );
    window.open(`https://wa.me/628981741680?text=${text}`, '_blank');
    closeSuccessModalAndReset();
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans select-none">
      
      {/* Dynamic Animated Motion Background Elements */}
      {/* 1. Static Ambient Gradient Orbs (Animations removed for mobile performance) */}
      <div className="absolute -top-32 -left-32 w-[550px] h-[550px] rounded-full bg-gradient-to-tr from-blue-600/30 via-indigo-600/20 to-sky-400/10 blur-[100px] pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-indigo-700/30 via-blue-500/20 to-purple-600/15 blur-[100px] pointer-events-none" />

      {/* 2. Floating Cyber Grid Lines / Tech Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:32px_32px] opacity-[0.04] pointer-events-none" />

      {/* 3. Floating Security Shield & Pulse Rings in Background */}
      <div className="absolute top-12 left-12 hidden lg:flex items-center gap-3 bg-slate-900/60 backdrop-blur-md border border-slate-800/80 px-4 py-2.5 rounded-2xl shadow-xl pointer-events-none z-0 animate-pulse">
        <div className="w-8 h-8 rounded-xl bg-blue-500/15 border border-blue-400/30 flex items-center justify-center text-blue-400">
          <Lock className="w-4 h-4" />
        </div>
        <div>
          <p className="text-[11px] font-bold text-slate-200">Enkripsi BMN Secure</p>
          <p className="text-[9px] text-slate-400 font-mono">Status: Terproteksi Protocol 256-Bit</p>
        </div>
      </div>

      <div className="absolute bottom-12 right-12 hidden lg:flex items-center gap-3 bg-slate-900/60 backdrop-blur-md border border-slate-800/80 px-4 py-2.5 rounded-2xl shadow-xl pointer-events-none z-0 animate-pulse" style={{ animationDelay: '1s' }}>
        <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
          <Server className="w-4 h-4" />
        </div>
        <div>
          <p className="text-[11px] font-bold text-slate-200">Sistem Logistik BMN</p>
          <p className="text-[9px] text-slate-400 font-mono">Server Cloud Active & Synchronized</p>
        </div>
      </div>

      {/* Main Login Card with Motion Entrance */}
      <motion.div 
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md bg-slate-900/85 backdrop-blur-xl rounded-3xl border border-slate-800 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.7)] p-6 sm:p-8 relative z-10 overflow-hidden"
      >
        {/* Subtle top card glow line */}
        <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-blue-500/60 to-transparent" />

        {/* LOGO & TITLE HEADER */}
        <div className="flex flex-col items-center text-center mb-7">
          <motion.div 
            whileHover={{ scale: 1.05 }}
            className="w-32 h-32 flex items-center justify-center drop-shadow-2xl mb-5 relative"
          >
            <LogoImage logoUrl={logoUrl} alt="Logo SILAP BMN" className="w-full h-full object-contain drop-shadow-lg z-10" />
          </motion.div>
          
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2 justify-center">
            SILAP BMN
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-[300px] leading-relaxed">
            Sistem Informasi Logistik & Alat Persediaan Barang Milik Negara - BPMP
          </p>
        </div>

        {/* Form Selection Tab */}
        <div className="flex p-1 bg-slate-950/80 rounded-xl mb-6 border border-slate-800/80">
          <button
            type="button"
            onClick={() => { setIsRegister(false); setLoginError(''); }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              !isRegister ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-md shadow-blue-600/20' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Masuk Akun
          </button>
          <button
            type="button"
            onClick={() => { setIsRegister(true); setLoginError(''); }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              isRegister ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-md shadow-blue-600/20' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Pegawai Baru (Daftar)
          </button>
        </div>

        {/* LOGIN FORM */}
        {!isRegister ? (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.25 }}
          >
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              {loginError && (
                <motion.div 
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-[11px] text-red-400 font-medium leading-relaxed"
                >
                  {loginError}
                </motion.div>
              )}

              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider">Username atau Email</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-slate-500">
                    <User className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="Masukkan username atau email terdaftar"
                    value={loginUser}
                    onChange={e => setLoginUser(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-white text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all placeholder-slate-600"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center mb-0.5">
                  <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider">Kata Sandi (Password)</label>
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    className="text-[10px] text-blue-400 hover:text-blue-300 hover:underline font-semibold cursor-pointer transition-all"
                  >
                    Lupa Sandi?
                  </button>
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-slate-500">
                    <Key className="w-4 h-4" />
                  </span>
                  <input
                    type="password"
                    required
                    placeholder="Masukkan kata sandi akun Anda"
                    value={loginPass}
                    onChange={e => setLoginPass(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-white text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all placeholder-slate-600"
                  />
                </div>
              </div>

              <motion.button
                whileTap={{ scale: 0.98 }}
                type="submit"
                className="w-full py-3 mt-3 bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-blue-600/20 cursor-pointer transition-all flex items-center justify-center gap-2 tracking-wide"
              >
                Masuk ke Aplikasi <ArrowRight className="w-4 h-4" />
              </motion.button>
            </form>
          </motion.div>
        ) : (
          /* REGISTER FORM */
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.25 }}
          >
            <form onSubmit={handleRegisterSubmit} className="space-y-3">
              <p className="text-[11px] text-slate-400 bg-slate-950/50 border border-slate-800/80 p-2.5 rounded-xl leading-relaxed mb-1">
                Pendaftaran ini dikhususkan bagi <strong>Pegawai Petugas BMN</strong>. Akun yang baru dibuat akan berstatus <span className="text-amber-400 font-bold">Pending</span> dan perlu disetujui Admin.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nama Lengkap *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-slate-500">
                      <User className="w-3.5 h-3.5" />
                    </span>
                    <input
                      type="text"
                      required
                      placeholder="Nama Lengkap"
                      value={regNama}
                      onChange={e => setRegNama(e.target.value)}
                      className="w-full pl-8 pr-2.5 py-1.5 bg-slate-950/60 border border-slate-800 rounded-xl text-white text-[11px] focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all placeholder-slate-600"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">NIP (Nomor Induk) *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-slate-500">
                      <BookOpen className="w-3.5 h-3.5" />
                    </span>
                    <input
                      type="text"
                      required
                      placeholder="NIP Pegawai"
                      value={regNip}
                      onChange={e => setRegNip(e.target.value)}
                      className="w-full pl-8 pr-2.5 py-1.5 bg-slate-950/60 border border-slate-800 rounded-xl text-white text-[11px] focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all placeholder-slate-600"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Jabatan / Peran *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-slate-500">
                      <Briefcase className="w-3.5 h-3.5" />
                    </span>
                    <select
                      value={regJabatan}
                      onChange={e => setRegJabatan(e.target.value)}
                      className="w-full pl-8 pr-2.5 py-1.5 bg-slate-950/60 border border-slate-800 rounded-xl text-white text-[11px] focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                    >
                      <option value="Petugas BMN">Petugas BMN</option>
                      <option value="Verifikator BMN">Verifikator BMN</option>
                      <option value="Pegawai BMN">Pegawai BMN</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">No Telepon / WA *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-slate-500">
                      <Phone className="w-3.5 h-3.5" />
                    </span>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: 0812-xxx"
                      value={regTelepon}
                      onChange={e => setRegTelepon(e.target.value)}
                      className="w-full pl-8 pr-2.5 py-1.5 bg-slate-950/60 border border-slate-800 rounded-xl text-white text-[11px] focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all placeholder-slate-600"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Username atau Email Pilihan *</label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-slate-500">
                    <Mail className="w-3.5 h-3.5" />
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: budi@bmn.go.id atau budi123"
                    value={regUsername}
                    onChange={e => setRegUsername(e.target.value)}
                    className="w-full pl-8 pr-2.5 py-1.5 bg-slate-950/60 border border-slate-800 rounded-xl text-white text-[11px] focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all placeholder-slate-600"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Kata Sandi (Password) *</label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-slate-500">
                    <Key className="w-3.5 h-3.5" />
                  </span>
                  <input
                    type="password"
                    required
                    placeholder="Buat sandi minimal 4 karakter"
                    value={regPassword}
                    onChange={e => setRegPassword(e.target.value)}
                    className="w-full pl-8 pr-2.5 py-1.5 bg-slate-950/60 border border-slate-800 rounded-xl text-white text-[11px] focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all placeholder-slate-600"
                  />
                </div>
              </div>

              <motion.button
                whileTap={{ scale: 0.98 }}
                type="submit"
                className="w-full py-2.5 mt-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/20 cursor-pointer transition-all"
              >
                Daftar & Kirim Permohonan
              </motion.button>
            </form>
          </motion.div>
        )}
      </motion.div>

      {/* WHATSAPP MODAL POPUP FOR PENDING REGISTRATION */}
      {registeredUser && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl max-w-md w-full p-6 text-center text-slate-300 relative"
          >
            <div className="w-14 h-14 bg-green-500/10 border border-green-500/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>

            <h3 className="text-lg font-bold text-white mb-2">Pendaftaran Berhasil Terkirim!</h3>
            
            <p className="text-xs leading-relaxed mb-4">
              Akun pegawai atas nama <strong className="text-white">"{registeredUser.nama}"</strong> berhasil disimpan di basis data sistem.
            </p>

            <div className="p-3.5 bg-slate-950/60 rounded-2xl border border-slate-800/80 text-[11px] leading-relaxed text-slate-400 mb-6 text-left space-y-2">
              <p>
                ⚠️ <strong>STATUS AKUN: PENDING VERIFIKASI</strong>
              </p>
              <p>
                Untuk alasan keamanan data BMN, silakan hubungi Administrator untuk memberikan konfirmasi pendaftaran akun Anda sebelum melakukan login ke dashboard.
              </p>
            </div>

            <div className="flex flex-col gap-2.5">
              <button
                onClick={handleWhatsAppRedirect}
                className="w-full py-2.5 bg-green-600 hover:bg-green-500 text-white font-bold text-xs rounded-xl transition-all shadow-lg shadow-green-600/15 cursor-pointer flex items-center justify-center gap-2"
              >
                Hubungi Admin via WhatsApp <ExternalLink className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={closeSuccessModalAndReset}
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl transition-all cursor-pointer border border-slate-700/50"
              >
                Kembali ke Halaman Login
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* FORGOT PASSWORD MODAL */}
      {showForgotPassword && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl max-w-md w-full p-6 text-center text-slate-300 relative"
          >
            <div className="w-14 h-14 bg-blue-500/10 border border-blue-500/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Key className="w-8 h-8 text-blue-400" />
            </div>

            <h3 className="text-lg font-bold text-white mb-2">Lupa Kata Sandi Akun?</h3>
            
            <p className="text-xs leading-relaxed mb-4 text-slate-300 text-left">
              Untuk alasan keamanan dan integritas data BMN, sistem <strong className="text-white">SILAP BMN</strong> tidak menyimpan sandi secara terenkripsi satu arah di sisi klien saja. 
            </p>

            <div className="p-3.5 bg-slate-950/60 rounded-2xl border border-slate-800/80 text-[11px] leading-relaxed text-slate-400 mb-6 text-left space-y-2">
              <p className="text-slate-200 font-bold">
                💡 CARA MERESET KATA SANDI:
              </p>
              <ol className="list-decimal pl-4 space-y-1">
                <li>Silakan hubungi Administrator <strong>(Ilham Muharrama)</strong>.</li>
                <li>Administrator dapat melihat dan mengganti sandi Anda secara langsung melalui panel <strong>Admin Control Center</strong>.</li>
                <li>Gunakan tautan di bawah ini untuk mengirim pesan otomatis permohonan reset sandi via WhatsApp.</li>
              </ol>
            </div>

            <div className="flex flex-col gap-2.5">
              <a
                href={`https://wa.me/628981741680?text=${encodeURIComponent(
                  "Halo Mas Ilham, saya lupa kata sandi akun saya di aplikasi SILAP BMN.\n\nMohon dibantu untuk mereset kata sandi akun saya atau menginformasikan kata sandi aktif saya dari dashboard Admin Control. Terima kasih!"
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 bg-green-600 hover:bg-green-500 text-white font-bold text-xs rounded-xl transition-all shadow-lg shadow-green-600/15 cursor-pointer flex items-center justify-center gap-2"
              >
                Kirim Permohonan ke Admin (WA) <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <button
                onClick={() => setShowForgotPassword(false)}
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl transition-all cursor-pointer border border-slate-700/50"
              >
                Kembali ke Halaman Login
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

