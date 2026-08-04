/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { Camera, Upload, Trash2, Video, VideoOff, RefreshCw, Sparkles, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { compressImage } from '../utils/imageCompressor';

interface ImagePickerProps {
  value: string;
  onChange: (val: string) => void;
  label?: string;
}

const SIMULATED_PHOTOS = [
  { name: 'Laptop / Komputer', url: 'https://images.unsplash.com/photo-1496181130204-755241544e35?auto=format&fit=crop&q=80&w=400' },
  { name: 'Proyektor LCD', url: 'https://images.unsplash.com/photo-1535016120720-40c646be5580?auto=format&fit=crop&q=80&w=400' },
  { name: 'Kursi Kerja Kantor', url: 'https://images.unsplash.com/photo-1505797149-43b0069ec26b?auto=format&fit=crop&q=80&w=400' },
  { name: 'Kertas HVS / ATK', url: 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?auto=format&fit=crop&q=80&w=400' },
  { name: 'Air Mineral Cup / Dus', url: 'https://images.unsplash.com/photo-1548839130-3fd96cd5cc49?auto=format&fit=crop&q=80&w=400' },
  { name: 'Flashdisk / USB Hub', url: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&q=80&w=400' },
];

export default function ImagePicker({ value, onChange, label = 'Foto Barang BMN' }: ImagePickerProps) {
  const [mode, setMode] = useState<'idle' | 'camera'>('idle');
  const [cameraError, setCameraError] = useState<string>('');
  const [isSimulating, setIsSimulating] = useState(false);
  const [selectedSimIndex, setSelectedSimIndex] = useState(0);
  const [flashEffect, setFlashEffect] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Stop camera stream
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  // Start camera stream
  const startCamera = async () => {
    setCameraError('');
    setIsSimulating(false);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Kamera tidak didukung oleh browser Anda / konteks iframe.');
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } }
      });
      
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(e => {
          console.error("Video play failed:", e);
        });
      }
    } catch (err: any) {
      console.warn("Real camera failed, switching to simulated camera:", err.message);
      setCameraError(err.message || 'Gagal mengakses perangkat kamera.');
      setIsSimulating(true); // Automatically fallback to beautiful simulated camera
    }
  };

  useEffect(() => {
    if (mode === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [mode]);

  // Handle File upload
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImage(file, 360, 360, 0.6);
        onChange(compressed);
      } catch (err) {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === 'string') {
            onChange(reader.result);
          }
        };
        reader.readAsDataURL(file);
      }
    }
  };

  // Handle capture from real camera
  const handleCapture = async () => {
    if (videoRef.current) {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = Math.min(video.videoWidth || 640, 480);
      canvas.height = Math.min(video.videoHeight || 480, 480);
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Flash screen effect
        setFlashEffect(true);
        setTimeout(() => setFlashEffect(false), 300);

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const rawUrl = canvas.toDataURL('image/jpeg', 0.6);
        const compressedUrl = await compressImage(rawUrl, 360, 360, 0.6);
        onChange(compressedUrl);
        setMode('idle');
      }
    }
  };

  // Handle capture in simulation mode
  const handleSimulateCapture = () => {
    setFlashEffect(true);
    setTimeout(() => {
      setFlashEffect(false);
      onChange(SIMULATED_PHOTOS[selectedSimIndex].url);
      setMode('idle');
    }, 300);
  };

  const handleTriggerUpload = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-2 border border-slate-100 bg-slate-50/50 p-4 rounded-2xl">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold text-gray-700">{label}</label>
        {value && mode === 'idle' && (
          <button
            type="button"
            onClick={() => onChange('')}
            className="text-[11px] text-red-500 hover:text-red-700 flex items-center gap-1 font-bold cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" /> Hapus Foto
          </button>
        )}
      </div>

      {mode === 'idle' ? (
        <div className="flex flex-col items-center justify-center">
          {value ? (
            <div className="relative w-full max-w-[200px] h-[150px] rounded-xl overflow-hidden shadow-sm border border-slate-200 group">
              <img
                src={value}
                alt="Pratinjau Foto Barang"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                <button
                  type="button"
                  onClick={() => setMode('camera')}
                  className="p-2 bg-white rounded-full text-slate-800 hover:bg-slate-100 transition-all shadow mx-1"
                  title="Ambil Ulang dari Kamera"
                >
                  <Camera className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleTriggerUpload}
                  className="p-2 bg-white rounded-full text-slate-800 hover:bg-slate-100 transition-all shadow mx-1"
                  title="Upload dari Galeri"
                >
                  <Upload className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="w-full border-2 border-dashed border-slate-200 hover:border-blue-400 bg-white p-5 rounded-xl flex flex-col items-center justify-center text-center transition-all">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-full mb-2">
                <Camera className="w-5 h-5" />
              </div>
              <p className="text-[11px] font-semibold text-gray-700">Belum ada foto barang</p>
              <p className="text-[10px] text-gray-400 mt-0.5 mb-3.5">Ambil foto inventaris secara langsung atau unggah dokumen foto</p>
              
              <div className="flex flex-wrap gap-2 justify-center">
                <button
                  type="button"
                  onClick={() => setMode('camera')}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[10px] font-bold cursor-pointer transition-all shadow-sm"
                >
                  <Camera className="w-3.5 h-3.5" /> Ambil dari Kamera
                </button>
                
                <button
                  type="button"
                  onClick={handleTriggerUpload}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[10px] font-bold cursor-pointer transition-all"
                >
                  <Upload className="w-3.5 h-3.5" /> File / Galeri
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* CAMERA FEED VIEW */
        <div className="relative w-full bg-black rounded-xl overflow-hidden border border-slate-800 flex flex-col items-center p-3 text-white">
          
          {/* Flash animation overlay */}
          {flashEffect && (
            <div className="absolute inset-0 bg-white z-50 animate-pulse" />
          )}

          {/* Simulated view vs webcam stream */}
          {isSimulating ? (
            /* SIMULATION CONTAINER */
            <div className="w-full space-y-3">
              <div className="bg-amber-950/40 border border-amber-500/20 px-3 py-1.5 rounded-lg text-[10px] text-amber-300 flex items-start gap-1.5 leading-snug">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-amber-400" />
                <span>Simulasi Kamera Aktif karena izin kamera browser terblokir atau berjalan dalam iframe sandboxed.</span>
              </div>

              {/* Viewfinder simulation */}
              <div className="relative w-full h-[180px] rounded-lg overflow-hidden border border-slate-700">
                <img
                  src={SIMULATED_PHOTOS[selectedSimIndex].url}
                  alt="Simulasi Kamera Feed"
                  className="w-full h-full object-cover transition-all duration-300"
                  referrerPolicy="no-referrer"
                />
                
                {/* Viewfinder crosshair overlay */}
                <div className="absolute inset-0 border-2 border-dashed border-white/20 pointer-events-none flex items-center justify-center">
                  <div className="w-8 h-8 border border-white/40 rounded-full" />
                </div>
                <span className="absolute top-2 left-2 bg-red-600 text-white font-mono text-[9px] px-1.5 py-0.5 rounded font-bold animate-pulse">
                  SIM REC
                </span>
                <span className="absolute bottom-2 right-2 bg-black/60 text-white font-mono text-[9px] px-1.5 py-0.5 rounded">
                  {SIMULATED_PHOTOS[selectedSimIndex].name}
                </span>
              </div>

              {/* Carousel select */}
              <div className="space-y-1">
                <label className="block text-[10px] text-slate-400 font-bold">Pilih Objek BMN yang Akan Difoto:</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {SIMULATED_PHOTOS.map((sim, i) => (
                    <button
                      key={sim.name}
                      type="button"
                      onClick={() => setSelectedSimIndex(i)}
                      className={`px-2 py-1.5 rounded text-[9px] font-bold text-left border transition-all ${
                        selectedSimIndex === i
                          ? 'bg-blue-600 text-white border-blue-500'
                          : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700'
                      }`}
                    >
                      {sim.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* REAL VIDEO CONTAINER */
            <div className="relative w-full h-[200px] rounded-lg overflow-hidden border border-slate-700 bg-slate-900">
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                playsInline
                muted
              />
              {/* Viewfinder details */}
              <div className="absolute inset-0 border-2 border-dashed border-white/20 pointer-events-none flex items-center justify-center">
                <div className="w-10 h-10 border-2 border-blue-500/30 rounded-full" />
              </div>
              <span className="absolute top-2 left-2 bg-red-600 text-white font-mono text-[9px] px-1.5 py-0.5 rounded font-bold animate-pulse">
                🔴 LIVE REC
              </span>
            </div>
          )}

          {/* Camera controls */}
          <div className="flex gap-2 w-full justify-between items-center mt-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setMode('idle')}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-lg text-[10px]"
            >
              Batal
            </button>

            {isSimulating ? (
              <button
                type="button"
                onClick={handleSimulateCapture}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-[10px] flex items-center gap-1.5 shadow"
              >
                <Camera className="w-4 h-4" /> Ambil Gambar (Simulasi)
              </button>
            ) : (
              <button
                type="button"
                onClick={handleCapture}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-[10px] flex items-center gap-1.5 shadow"
              >
                <Camera className="w-4 h-4" /> Ambil Gambar
              </button>
            )}

            {isSimulating ? (
              <button
                type="button"
                onClick={() => {
                  setIsSimulating(false);
                  setTimeout(() => {
                    startCamera();
                  }, 100);
                }}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300"
                title="Coba Aktifkan Kamera Hardware"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setIsSimulating(true);
                  stopCamera();
                }}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300"
                title="Beralih ke Simulasi"
              >
                <Sparkles className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}
