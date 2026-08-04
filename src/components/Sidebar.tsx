/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  LayoutDashboard,
  Box,
  FolderTree,
  Users,
  Building,
  Scale,
  ArrowUpRight,
  ArrowDownLeft,
  History,
  FileText,
  Settings as SettingsIcon,
  ShieldAlert,
  CodeXml,
  Menu,
  ChevronLeft,
  ChevronRight,
  Database,
  Contact
} from 'lucide-react';
import { ActiveTab, UserAccount } from '../types';
import LogoImage from './LogoImage';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  instituteName: string;
  currentUser: UserAccount | null;
  logoUrl?: string;
}

export default function Sidebar({
  activeTab,
  setActiveTab,
  collapsed,
  setCollapsed,
  instituteName,
  currentUser,
  logoUrl
}: SidebarProps) {
  const [openMaster, setOpenMaster] = useState(true);
  const [openTransaksi, setOpenTransaksi] = useState(true);

  const navItemClass = (tab: ActiveTab) => {
    const base = `flex items-center ${collapsed ? 'justify-center px-0' : 'gap-3 px-3'} py-2.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer whitespace-nowrap overflow-hidden `;
    const active = "bg-[#2563EB] text-white shadow-sm";
    const inactive = "text-white/70 hover:bg-white/5 hover:text-white";
    return base + (activeTab === tab ? active : inactive);
  };

  const handleNavClick = (tab: ActiveTab) => {
    setActiveTab(tab);
    if (window.innerWidth < 1024) {
      setCollapsed(true);
    }
  };

  const menuSectionHeaderClass = "px-3 mt-4 mb-2 text-[10px] font-semibold text-white/40 uppercase tracking-wider flex items-center justify-between";

  return (
    <>
      {/* Mobile Sidebar Overlay Backdrop */}
      {!collapsed && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 md:hidden"
          onClick={() => setCollapsed(true)}
        />
      )}

      <div
        className={`bg-[#111827] flex flex-col h-screen fixed md:sticky top-0 left-0 transition-all duration-300 ease-in-out z-50 md:z-30 shadow-xl ${
          collapsed
            ? '-translate-x-full md:translate-x-0 md:w-20'
            : 'translate-x-0 md:w-64'
        } w-64`}
      >
        {/* Expand/Collapse Toggle Button (Desktop) */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3.5 top-7 bg-[#111827] text-white hover:text-white hover:bg-slate-800 border border-white/20 ring-4 ring-slate-50 w-7 h-7 rounded-full hidden md:flex items-center justify-center shadow-md z-[60] transition-all duration-300 cursor-pointer"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>

        {/* Brand Header */}
        <div className="h-20 border-b border-white/10 flex items-center relative transition-all duration-300 overflow-hidden px-4 shrink-0">
          <div className={`flex items-center whitespace-nowrap w-full transition-all duration-300 ${collapsed ? "gap-0" : "gap-3"}`}>
            <div className={`flex-shrink-0 flex items-center justify-center transition-all duration-300 ${collapsed ? 'w-12 h-12 mx-auto' : 'w-12 h-12'}`}>
              <LogoImage logoUrl={logoUrl} alt="Logo BPMP" className="w-full h-full object-contain drop-shadow" />
            </div>
            <div 
              className={`flex flex-col min-w-0 leading-tight transition-all duration-300 overflow-hidden origin-left ${collapsed ? 'opacity-0 w-0 scale-95' : 'opacity-100 w-32 scale-100'}`}
            >
              <span className="font-bold text-white text-sm tracking-tight">BPMP SUMSEL</span>
              <span className="text-[10px] text-white/50 uppercase tracking-widest mt-0.5">Inventory v1.0</span>
            </div>
          </div>
          
          {/* Close button for mobile */}
          <button
            onClick={() => setCollapsed(true)}
            className="p-1.5 hover:bg-white/10 bg-white/5 rounded-lg text-white/70 hover:text-white md:hidden absolute right-4 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        </div>

      {/* Main Navigation */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1 scrollbar-thin">
        {/* Dashboard */}
        <div onClick={() => handleNavClick('dashboard')} className={navItemClass('dashboard')}>
          <LayoutDashboard className="w-4 h-4 flex-shrink-0" />
          <span className={`transition-all duration-300 origin-left ${collapsed ? 'opacity-0 scale-95 w-0' : 'opacity-100 scale-100 w-auto'}`}>Dashboard</span>
        </div>

        {/* MASTER DATA */}
        <div>
          <div className={`${menuSectionHeaderClass} transition-all duration-300 overflow-hidden ${collapsed ? 'opacity-0 h-px my-4 py-0 bg-white/10' : 'opacity-100 h-auto'}`}>
              <span className={`transition-all duration-300 ${collapsed ? 'hidden' : 'block'}`}>Main Menu</span>
            </div>
          <div className="space-y-1">
            <div onClick={() => handleNavClick('barang')} className={navItemClass('barang')}>
              <Box className="w-4 h-4 flex-shrink-0" />
              <span className={`transition-all duration-300 origin-left ${collapsed ? 'opacity-0 scale-95 w-0' : 'opacity-100 scale-100 w-auto'}`}>Data Master Barang</span>
            </div>
            <div onClick={() => handleNavClick('kategori')} className={navItemClass('kategori')}>
              <FolderTree className="w-4 h-4 flex-shrink-0" />
              <span className={`transition-all duration-300 origin-left ${collapsed ? 'opacity-0 scale-95 w-0' : 'opacity-100 scale-100 w-auto'}`}>Kategori</span>
            </div>
            <div onClick={() => handleNavClick('supplier')} className={navItemClass('supplier')}>
              <Users className="w-4 h-4 flex-shrink-0" />
              <span className={`transition-all duration-300 origin-left ${collapsed ? 'opacity-0 scale-95 w-0' : 'opacity-100 scale-100 w-auto'}`}>Supplier</span>
            </div>
            <div onClick={() => handleNavClick('unit')} className={navItemClass('unit')}>
              <Building className="w-4 h-4 flex-shrink-0" />
              <span className={`transition-all duration-300 origin-left ${collapsed ? 'opacity-0 scale-95 w-0' : 'opacity-100 scale-100 w-auto'}`}>Unit Kerja</span>
            </div>
            <div onClick={() => handleNavClick('satuan')} className={navItemClass('satuan')}>
              <Scale className="w-4 h-4 flex-shrink-0" />
              <span className={`transition-all duration-300 origin-left ${collapsed ? 'opacity-0 scale-95 w-0' : 'opacity-100 scale-100 w-auto'}`}>Satuan Barang</span>
            </div>
            <div onClick={() => handleNavClick('pegawai')} className={navItemClass('pegawai')}>
              <Contact className="w-4 h-4 flex-shrink-0" />
              <span className={`transition-all duration-300 origin-left ${collapsed ? 'opacity-0 scale-95 w-0' : 'opacity-100 scale-100 w-auto'}`}>Pegawai BMN</span>
            </div>
          </div>
        </div>

        {/* TRANSAKSI */}
        <div>
          <div className={`${menuSectionHeaderClass} transition-all duration-300 overflow-hidden ${collapsed ? 'opacity-0 h-px my-4 py-0 bg-white/10' : 'opacity-100 h-auto'}`}>
              <span className={`transition-all duration-300 ${collapsed ? 'hidden' : 'block'}`}>Operational</span>
            </div>
          <div className="space-y-1">
            <div onClick={() => handleNavClick('barang_masuk')} className={navItemClass('barang_masuk')}>
              <ArrowDownLeft className="w-4 h-4 flex-shrink-0 text-green-400" />
              <span className={`transition-all duration-300 origin-left ${collapsed ? 'opacity-0 scale-95 w-0' : 'opacity-100 scale-100 w-auto'}`}>Barang Masuk</span>
            </div>
            <div onClick={() => handleNavClick('barang_keluar')} className={navItemClass('barang_keluar')}>
              <ArrowUpRight className="w-4 h-4 flex-shrink-0 text-red-400" />
              <span className={`transition-all duration-300 origin-left ${collapsed ? 'opacity-0 scale-95 w-0' : 'opacity-100 scale-100 w-auto'}`}>Barang Keluar</span>
            </div>
            <div onClick={() => handleNavClick('riwayat')} className={navItemClass('riwayat')}>
              <History className="w-4 h-4 flex-shrink-0" />
              <span className={`transition-all duration-300 origin-left ${collapsed ? 'opacity-0 scale-95 w-0' : 'opacity-100 scale-100 w-auto'}`}>Riwayat Mutasi</span>
            </div>
          </div>
        </div>

        {/* LAPORAN & AUDIT */}
        <div>
          <div className={`${menuSectionHeaderClass} transition-all duration-300 overflow-hidden ${collapsed ? 'opacity-0 h-px my-4 py-0 bg-white/10' : 'opacity-100 h-auto'}`}>
              <span className={`transition-all duration-300 ${collapsed ? 'hidden' : 'block'}`}>Administrasi</span>
            </div>
          <div className="space-y-1">
            <div onClick={() => handleNavClick('laporan')} className={navItemClass('laporan')}>
              <FileText className="w-4 h-4 flex-shrink-0" />
              <span className={`transition-all duration-300 origin-left ${collapsed ? 'opacity-0 scale-95 w-0' : 'opacity-100 scale-100 w-auto'}`}>Laporan Stok</span>
            </div>
            <div onClick={() => handleNavClick('audit_log')} className={navItemClass('audit_log')}>
              <ShieldAlert className="w-4 h-4 flex-shrink-0" />
              <span className={`transition-all duration-300 origin-left ${collapsed ? 'opacity-0 scale-95 w-0' : 'opacity-100 scale-100 w-auto'}`}>Audit Log</span>
            </div>
          </div>
        </div>

        {/* ADMINISTRATOR ACCESS (ONLY FOR ADMINS) */}
        {(currentUser?.role === 'Administrator' || currentUser?.username === 'admin') && (
          <div>
            <div className={`${menuSectionHeaderClass} transition-all duration-300 overflow-hidden ${collapsed ? 'opacity-0 h-px my-4 py-0 bg-white/10' : 'opacity-100 h-auto'}`}>
              <span className={`transition-all duration-300 ${collapsed ? 'hidden' : 'block'}`}>Super Admin</span>
            </div>
            <div className="space-y-1">
              <div onClick={() => handleNavClick('pengaturan')} className={navItemClass('pengaturan')}>
                <SettingsIcon className="w-4 h-4 flex-shrink-0 text-blue-400" />
                <span className={`transition-all duration-300 origin-left ${collapsed ? 'opacity-0 scale-95 w-0' : 'opacity-100 scale-100 w-auto'}`}>Pengaturan Sistem</span>
              </div>
              <div onClick={() => handleNavClick('admin_control')} className={navItemClass('admin_control')}>
                <ShieldAlert className="w-4 h-4 flex-shrink-0 text-red-500 animate-pulse" />
                {!collapsed && <span className="font-bold text-red-400">Admin Control</span>}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Sidebar Footer */}
      <div className="p-4 border-t border-white/10 bg-white/5">
        <div className="flex items-center justify-center relative overflow-hidden h-10 transition-all duration-300">
            <div className={`flex flex-col gap-1 w-full transition-all duration-300 absolute left-0 ${collapsed ? 'opacity-0 -translate-x-4' : 'opacity-100 translate-x-0'}`}>
              <span className="text-[10px] font-semibold text-white/40 uppercase tracking-wider">SISTEM AKTIF</span>
              <span className="text-[11px] text-white/70 font-medium truncate">{instituteName}</span>
            </div>
            <div className={`w-2 h-2 rounded-full bg-green-500 mx-auto absolute transition-all duration-300 ${collapsed ? 'opacity-100 scale-100' : 'opacity-0 scale-0'}`} />
          </div>
      </div>
    </div>
  </>
  );
}
