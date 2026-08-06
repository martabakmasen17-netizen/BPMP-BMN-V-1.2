/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { 
  AlertTriangle, 
  Trash2, 
  PlusCircle, 
  CheckCircle2, 
  Info, 
  X, 
  HelpCircle,
  ShieldAlert
} from 'lucide-react';

export type ConfirmationVariant = 'danger' | 'primary' | 'success' | 'warning';

export interface DetailField {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
}

export interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  subtitle?: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmationVariant;
  icon?: React.ReactNode;
  details?: DetailField[];
  isLoading?: boolean;
  warningNote?: string;
  confirmButtonId?: string;
  cancelButtonId?: string;
}

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  subtitle,
  message,
  confirmLabel,
  cancelLabel = 'Batal',
  variant = 'primary',
  icon,
  details = [],
  isLoading = false,
  warningNote,
  confirmButtonId = 'btn-confirm-action',
  cancelButtonId = 'btn-cancel-action'
}: ConfirmationModalProps) {
  // Handle keyboard events (Escape to close, Enter to submit)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Variant styles
  const isDanger = variant === 'danger';
  const isWarning = variant === 'warning';
  const isSuccess = variant === 'success';

  const defaultConfirmLabel = isDanger 
    ? 'Ya, Hapus' 
    : isWarning 
      ? 'Lanjutkan' 
      : 'Ya, Tambahkan';

  const getHeaderIcon = () => {
    if (icon) return icon;
    if (isDanger) return <Trash2 className="w-5 h-5 text-rose-600" />;
    if (isWarning) return <AlertTriangle className="w-5 h-5 text-amber-600" />;
    if (isSuccess) return <CheckCircle2 className="w-5 h-5 text-emerald-600" />;
    return <PlusCircle className="w-5 h-5 text-blue-600" />;
  };

  const getIconBadgeBg = () => {
    if (isDanger) return 'bg-rose-50 border-rose-100 text-rose-600';
    if (isWarning) return 'bg-amber-50 border-amber-100 text-amber-600';
    if (isSuccess) return 'bg-emerald-50 border-emerald-100 text-emerald-600';
    return 'bg-blue-50 border-blue-100 text-blue-600';
  };

  const getConfirmButtonClasses = () => {
    if (isDanger) {
      return 'bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white focus:ring-rose-200';
    }
    if (isWarning) {
      return 'bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white focus:ring-amber-200';
    }
    if (isSuccess) {
      return 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white focus:ring-emerald-200';
    }
    return 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white focus:ring-blue-200';
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLoading) onClose();
      }}
      role="dialog"
      aria-modal="true"
      id="confirmation-modal-overlay"
    >
      <div 
        className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200/90 overflow-hidden transform transition-all flex flex-col"
        onClick={e => e.stopPropagation()}
        id="confirmation-modal-container"
      >
        {/* Header Bar */}
        <div className="p-5 border-b border-slate-100 flex items-start justify-between gap-3 bg-white">
          <div className="flex items-start gap-3.5">
            <div className={`p-2.5 rounded-xl border flex-shrink-0 mt-0.5 ${getIconBadgeBg()}`}>
              {getHeaderIcon()}
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base leading-tight">
                {title}
              </h3>
              {subtitle && (
                <p className="text-xs text-slate-500 font-medium mt-1">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1.5 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
            aria-label="Tutup"
            id="btn-close-confirmation-modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {message && (
            <p className="text-xs text-slate-600 leading-relaxed">
              {message}
            </p>
          )}

          {/* Details Table / Key-Value Breakdown */}
          {details.length > 0 && (
            <div className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-3.5 space-y-2.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block border-b border-slate-200/60 pb-1.5">
                Rincian Data:
              </span>
              <div className="space-y-2">
                {details.map((field, idx) => (
                  <div key={idx} className="flex items-start justify-between gap-3 text-xs">
                    <span className="text-slate-500 font-medium flex items-center gap-1.5 flex-shrink-0">
                      {field.icon && <span className="text-slate-400">{field.icon}</span>}
                      {field.label}:
                    </span>
                    <span className="font-semibold text-slate-800 text-right break-words max-w-[240px]">
                      {field.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Optional Warning / Destructive Alert Banner */}
          {warningNote && (
            <div className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
              isDanger 
                ? 'bg-rose-50/80 border-rose-200/80 text-rose-800' 
                : isWarning 
                  ? 'bg-amber-50/80 border-amber-200/80 text-amber-800'
                  : 'bg-blue-50/80 border-blue-200/80 text-blue-800'
            }`}>
              <ShieldAlert className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
                isDanger ? 'text-rose-600' : isWarning ? 'text-amber-600' : 'text-blue-600'
              }`} />
              <div className="text-[11px] leading-relaxed font-medium">
                {warningNote}
              </div>
            </div>
          )}
        </div>

        {/* Action Footer */}
        <div className="p-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-end gap-2.5">
          <button
            type="button"
            id={cancelButtonId}
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-all cursor-pointer shadow-2xs hover:shadow-xs disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            id={confirmButtonId}
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-5 py-2.5 font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer focus:outline-none focus:ring-2 disabled:opacity-50 flex items-center gap-1.5 ${getConfirmButtonClasses()}`}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Memproses...
              </span>
            ) : (
              confirmLabel || defaultConfirmLabel
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
