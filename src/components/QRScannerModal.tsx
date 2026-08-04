/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useRef } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import jsQR from 'jsqr';
import { Camera, X, AlertCircle, Check, RefreshCw, Image as ImageIcon, SwitchCamera, Sparkles, ScanLine } from 'lucide-react';
import { Barang, Kategori } from '../types';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (scannedCode: string, matchedItem?: Barang, matchedKategori?: Kategori) => void;
  barangList: Barang[];
  kategoriList?: Kategori[];
}

interface CameraDevice {
  id: string;
  label: string;
}

export default function QRScannerModal({
  isOpen,
  onClose,
  onScanSuccess,
  barangList = [],
  kategoriList = []
}: QRScannerModalProps) {
  const [cameraState, setCameraState] = useState<'idle' | 'scanning' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [scannedItem, setScannedItem] = useState<Barang | null>(null);
  const [scannerInstance, setScannerInstance] = useState<Html5Qrcode | null>(null);
  const [availableCameras, setAvailableCameras] = useState<CameraDevice[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [isProcessingFile, setIsProcessingFile] = useState(false);

  const isHandlingScanRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const captureInputRef = useRef<HTMLInputElement>(null);
  const qrId = "qr-reader-element-static";

  // Fast pre-indexed lookup map for instant O(1) QR matching
  const barangFastMap = React.useMemo(() => {
    const map = new Map<string, Barang>();
    barangList.forEach(b => {
      if (!b) return;

      const keysToIndex = [b.id, b.kategoriId, b.nama, b.kategori, b.supplier, b.lokasiRak].filter(Boolean);

      keysToIndex.forEach(rawKey => {
        const str = String(rawKey).trim();
        if (!str) return;

        map.set(str, b);
        map.set(str.toLowerCase(), b);
        map.set(str.toUpperCase(), b);

        // Clean alphanumeric version (e.g. "BRG-001" -> "brg001")
        const clean = str.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (clean) map.set(clean, b);

        // Digits-only version (e.g. "BRG-015" -> "015", "15")
        const digits = str.match(/\d+/);
        if (digits) {
          map.set(digits[0], b);
          map.set(String(parseInt(digits[0], 10)), b);
          const padded = `brg${digits[0].padStart(3, '0')}`;
          map.set(padded, b);
          map.set(`brg-${digits[0].padStart(3, '0')}`, b);
        }
      });
    });
    return map;
  }, [barangList]);

  // Audio tone feedback on successful QR match
  const playSuccessSound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(1200, audioCtx.currentTime);
      gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime);
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.15);
    } catch (e) {
      // Ignore audio policy limits
    }
  };

  /**
   * Ultra-Fast Multi-Format Parsing Engine
   * Accepts any decoded string format from 1D/2D QR/Barcodes
   */
  const parseScannedText = (rawCode: string): { item: Barang | null; kategori: Kategori | null } => {
    if (!rawCode || typeof rawCode !== 'string') return { item: null, kategori: null };
    const text = rawCode.trim();
    if (!text) return { item: null, kategori: null };

    // 1. Check Kategori List Match
    const matchedCategory = kategoriList.find(k =>
      k.id.toLowerCase() === text.toLowerCase() ||
      k.nama.toLowerCase() === text.toLowerCase() ||
      (k.qrCodeUrl && k.qrCodeUrl.toLowerCase().includes(text.toLowerCase()))
    );

    // 2. Check Barang Fast Map
    let matchedItem = barangFastMap.get(text) || barangFastMap.get(text.toLowerCase()) || barangFastMap.get(text.toUpperCase());

    if (!matchedItem) {
      const cleanRaw = text.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (cleanRaw) {
        matchedItem = barangFastMap.get(cleanRaw);
      }
    }

    if (!matchedItem) {
      matchedItem = barangList.find(b => String(b.id || '').trim().toLowerCase() === text.toLowerCase() || String(b.kategoriId || '').trim().toLowerCase() === text.toLowerCase());
    }

    if (!matchedItem) {
      // Direct digits match for item or category
      if (/^\d+$/.test(text)) {
        matchedItem = barangList.find(b => b.id === text || b.kategoriId === text);
      }
    }

    return { item: matchedItem || null, kategori: matchedCategory || null };
  };

  // Handle successful match with lock to prevent duplicate concurrent triggers
  const handleScannedCode = async (decodedText: string, activeScanner = scannerInstance) => {
    if (isHandlingScanRef.current) return;
    isHandlingScanRef.current = true;

    const { item, kategori } = parseScannedText(decodedText);

    if (item || kategori) {
      setScannedItem(item);
      setCameraState('success');
      setErrorMessage('');
      playSuccessSound();

      await stopScanner(activeScanner);

      setTimeout(() => {
        onScanSuccess(decodedText, item || undefined, kategori || undefined);
        onClose();
        isHandlingScanRef.current = false;
      }, 500);
    } else {
      const snippet = decodedText.length > 40 ? decodedText.substring(0, 40) + '...' : decodedText;
      setErrorMessage(`Kode "${snippet}" berhasil dibaca, namun tidak ditemukan di sistem.`);
      setCameraState('error');
      setTimeout(() => {
        isHandlingScanRef.current = false;
      }, 1200);
    }
  };

  // Stop camera stream safely
  const stopScanner = async (instanceToStop = scannerInstance) => {
    if (instanceToStop) {
      try {
        if (instanceToStop.isScanning) {
          await instanceToStop.stop();
        }
        await instanceToStop.clear();
      } catch (err) {
        // Ignore stop error
      }
    }
  };

  // Start continuous camera stream
  const startScanner = async (overrideCameraId = selectedCameraId) => {
    setCameraState('scanning');
    setErrorMessage('');
    setScannedItem(null);

    setTimeout(async () => {
      try {
        if (scannerInstance) {
          await stopScanner(scannerInstance);
        }

        // Pre-request stream permission to handle mobile/iframe prompts
        try {
          if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            const tempStream = await navigator.mediaDevices.getUserMedia({
              video: { facingMode: { ideal: "environment" } }
            });
            tempStream.getTracks().forEach(t => t.stop());
          }
        } catch (e) {
          console.log("Pre-request permission notice:", e);
        }

        // List cameras
        try {
          const cameras = await Html5Qrcode.getCameras();
          if (cameras && cameras.length > 0) {
            const formatted = cameras.map(c => ({ id: c.id, label: c.label || `Kamera ${c.id.substring(0, 6)}` }));
            setAvailableCameras(formatted);
            if (!overrideCameraId) {
              const backCam = cameras.find(c => /back|rear|environment|belakang/i.test(c.label));
              overrideCameraId = backCam ? backCam.id : cameras[0].id;
              setSelectedCameraId(overrideCameraId);
            }
          }
        } catch (e) {
          console.log("Camera list failed:", e);
        }

        const html5QrCode = new Html5Qrcode(qrId);
        setScannerInstance(html5QrCode);

        // Optimized configuration for ultra-fast responsiveness & wide detection area
        const config = {
          fps: 25, // Increased frame rate for fast responsiveness
          qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
            const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
            const size = Math.floor(minEdge * 0.95); // 95% wide scanning zone
            return { width: Math.max(size, 200), height: Math.max(size, 200) };
          },
          aspectRatio: 1.0,
          disableFlip: false,
          formatsToSupport: [
            Html5QrcodeSupportedFormats.QR_CODE,
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.CODE_39,
            Html5QrcodeSupportedFormats.CODE_93,
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.UPC_A,
            Html5QrcodeSupportedFormats.UPC_E,
            Html5QrcodeSupportedFormats.DATA_MATRIX,
            Html5QrcodeSupportedFormats.ITF,
            Html5QrcodeSupportedFormats.AZTEC,
            Html5QrcodeSupportedFormats.PDF_417
          ],
          experimentalFeatures: {
            useBarCodeDetectorIfSupported: true
          }
        };

        const highResCameraConstraints = {
          facingMode: "environment",
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 },
          frameRate: { ideal: 30, max: 60 }
        };

        if (overrideCameraId) {
          await html5QrCode.start(
            overrideCameraId,
            config,
            (text) => handleScannedCode(text, html5QrCode),
            () => {}
          );
        } else {
          try {
            await html5QrCode.start(
              highResCameraConstraints,
              config,
              (text) => handleScannedCode(text, html5QrCode),
              () => {}
            );
          } catch (envErr) {
            await html5QrCode.start(
              { facingMode: "user" },
              config,
              (text) => handleScannedCode(text, html5QrCode),
              () => {}
            );
          }
        }
      } catch (err: any) {
        console.error("Camera start failed:", err);
        setCameraState('error');
        setErrorMessage("Kamera live tidak dapat diakses atau diblokir. Silakan gunakan tombol Ambil Foto HP / Upload Galeri di bawah.");
      }
    }, 150);
  };

  /**
   * Non-Blocking, Ultra-Fast Downscaled Image File Decoder
   * Prevents browser tab freezing/hanging when uploading high-res mobile photos
   */
  const processImageFile = async (file: File) => {
    if (!file) return;
    
    // Stop live stream to free CPU/Memory before processing heavy photo
    await stopScanner();
    
    setIsProcessingFile(true);
    setErrorMessage('');

    // Yield control to let React render the loading overlay
    await new Promise(r => setTimeout(r, 80));

    try {
      // 1. Create Image element and downscale giant mobile photo
      const imgDataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = e => resolve(e.target?.result as string || '');
        reader.onerror = e => reject(e);
        reader.readAsDataURL(file);
      });

      if (!imgDataUrl) throw new Error("Gagal membaca berkas gambar.");

      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = reject;
        image.src = imgDataUrl;
      });

      // Downscale image to max 900px to ensure fast decoding without freezing CPU
      const maxDim = 900;
      let targetW = img.width;
      let targetH = img.height;
      if (targetW > maxDim || targetH > maxDim) {
        if (targetW > targetH) {
          targetH = Math.round((targetH * maxDim) / targetW);
          targetW = maxDim;
        } else {
          targetW = Math.round((targetW * maxDim) / targetH);
          targetH = maxDim;
        }
      }

      // Render to downscaled offscreen canvas
      const canvas = document.createElement('canvas');
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error("Gagal menginisialisasi canvas.");
      ctx.drawImage(img, 0, 0, targetW, targetH);

      let foundCode: string | null = null;

      // ENGINE 1: Native BarcodeDetector on downscaled image (Fastest ~5ms)
      if ('BarcodeDetector' in window) {
        try {
          const detector = new (window as any).BarcodeDetector({
            formats: ['qr_code', 'code_128', 'code_39', 'code_93', 'ean_13', 'ean_8', 'upc_a', 'upc_e', 'data_matrix', 'aztec', 'pdf417']
          });
          const detected = await detector.detect(canvas);
          if (detected && detected.length > 0 && detected[0].rawValue) {
            foundCode = detected[0].rawValue;
          }
        } catch (e) {
          console.log("Native BarcodeDetector skipped:", e);
        }
      }

      // ENGINE 2: Fast jsQR on downscaled canvas
      if (!foundCode) {
        const imgData = ctx.getImageData(0, 0, targetW, targetH);
        
        // Pass 2A: Standard
        const jsRes = jsQR(imgData.data, targetW, targetH, { inversionAttempts: 'attemptBoth' });
        if (jsRes && jsRes.data) {
          foundCode = jsRes.data;
        }

        // Pass 2B: High contrast binarized if standard pass missed
        if (!foundCode) {
          const binarizedData = ctx.createImageData(targetW, targetH);
          for (let i = 0; i < imgData.data.length; i += 4) {
            const avg = (imgData.data[i] + imgData.data[i + 1] + imgData.data[i + 2]) / 3;
            const val = avg > 128 ? 255 : 0;
            binarizedData.data[i] = val;
            binarizedData.data[i + 1] = val;
            binarizedData.data[i + 2] = val;
            binarizedData.data[i + 3] = 255;
          }
          const jsBinarizedRes = jsQR(binarizedData.data, targetW, targetH, { inversionAttempts: 'attemptBoth' });
          if (jsBinarizedRes && jsBinarizedRes.data) {
            foundCode = jsBinarizedRes.data;
          }
        }
      }

      // ENGINE 3: Html5Qrcode.scanFile on downscaled blob with 3s safety timeout
      if (!foundCode) {
        const blob = await new Promise<Blob | null>(res => canvas.toBlob(res, 'image/jpeg', 0.85));
        if (blob) {
          const scaledFile = new File([blob], 'scaled_scan.jpg', { type: 'image/jpeg' });
          const tempEngine = new Html5Qrcode("qr-reader-element-static-file");
          
          try {
            const scanPromise = tempEngine.scanFile(scaledFile, false);
            const timeoutPromise = new Promise<null>((_, reject) => setTimeout(() => reject(new Error("Timeout")), 2500));
            const scanRes = await Promise.race([scanPromise, timeoutPromise]);
            if (scanRes) foundCode = scanRes;
          } catch (e) {
            // Ignore scanFile error
          } finally {
            try { await tempEngine.clear(); } catch (e) {}
          }
        }
      }

      setIsProcessingFile(false);

      if (foundCode) {
        handleScannedCode(foundCode);
      } else {
        setCameraState('error');
        setErrorMessage("QR Code / Barcode tidak terdeteksi dari foto ini. Pastikan posisi gambar cukup terang & barcode terlihat jelas.");
        // Restart live camera after showing error
        setTimeout(() => {
          startScanner();
        }, 2000);
      }

    } catch (err: any) {
      console.error("Image process error:", err);
      setIsProcessingFile(false);
      setCameraState('error');
      setErrorMessage("Tidak dapat memproses foto ini. Silakan coba memfoto kembali dengan pencahayaan yang cukup.");
      setTimeout(() => {
        startScanner();
      }, 2000);
    }
  };

  useEffect(() => {
    if (isOpen) {
      startScanner();
    }
    return () => {
      stopScanner();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 z-[9999] overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden flex flex-col my-auto max-h-[94vh]">
        
        {/* Modal Header */}
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
              <ScanLine className="w-4.5 h-4.5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 leading-tight">Pemindai QR & Barcode BMN</h3>
              <p className="text-[10px] text-slate-500 font-medium">Auto-Detect: Live Stream, Foto HP & Upload Galeri</p>
            </div>
          </div>
          <button 
            onClick={() => {
              stopScanner();
              onClose();
            }}
            className="p-1.5 hover:bg-slate-200 text-slate-400 hover:text-slate-600 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 flex-1 overflow-y-auto space-y-3.5">

          {/* 1. LIVE CAMERA STREAM DISPLAY */}
          <div className="w-full aspect-square max-w-[240px] mx-auto bg-slate-950 rounded-2xl relative overflow-hidden flex flex-col items-center justify-center border-4 border-slate-200 shadow-inner">
            
            {/* The html5-qrcode element MUST always exist in DOM */}
            <div id={qrId} className={`w-full h-full ${cameraState !== 'scanning' ? 'hidden' : 'block'}`} />
            <div id="qr-reader-element-static-file" className="hidden" />

            {cameraState === 'scanning' && (
              <>
                <div className="absolute inset-x-0 h-0.5 bg-red-500 opacity-90 shadow-[0_0_12px_rgba(239,68,68,1)] animate-bounce top-1/2 pointer-events-none" />
                <div className="absolute inset-6 border-2 border-white/40 rounded-2xl pointer-events-none flex items-center justify-center">
                  <div className="w-4 h-4 border-t-2 border-l-2 border-blue-400 absolute top-0 left-0" />
                  <div className="w-4 h-4 border-t-2 border-r-2 border-blue-400 absolute top-0 right-0" />
                  <div className="w-4 h-4 border-b-2 border-l-2 border-blue-400 absolute bottom-0 left-0" />
                  <div className="w-4 h-4 border-b-2 border-r-2 border-blue-400 absolute bottom-0 right-0" />
                </div>
              </>
            )}

            {isProcessingFile && (
              <div className="absolute inset-0 bg-slate-900/95 text-white flex flex-col items-center justify-center p-4 text-center z-20">
                <RefreshCw className="w-8 h-8 text-blue-400 animate-spin mb-2" />
                <p className="text-xs font-bold">Menganalisis QR / Barcode...</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Scanning via Multi-Engine AI</p>
              </div>
            )}

            {cameraState === 'success' && scannedItem && (
              <div className="absolute inset-0 bg-blue-600 text-white flex flex-col items-center justify-center p-4 text-center animate-fade-in z-20">
                <div className="w-13 h-13 bg-white/20 rounded-full flex items-center justify-center mb-1.5 animate-scale-up">
                  <Check className="w-7 h-7 stroke-[3]" />
                </div>
                <p className="text-[10px] uppercase font-extrabold tracking-widest text-blue-100">Barang Terdeteksi</p>
                <p className="text-xs font-extrabold mt-1 truncate max-w-full px-2">{scannedItem.nama}</p>
                <p className="text-[10px] font-mono mt-0.5 text-blue-200 font-bold">{scannedItem.id}</p>
              </div>
            )}

            {cameraState === 'error' && (
              <div className="absolute inset-0 bg-slate-950 text-slate-300 flex flex-col items-center justify-center p-3 text-center space-y-1.5 z-20">
                <AlertCircle className="w-7 h-7 text-amber-500" />
                <p className="text-xs font-bold text-white">Kamera Stream Live Diblokir</p>
                <p className="text-[9.5px] text-slate-400 leading-snug px-2">
                  {errorMessage || "Kamera tidak dapat diakses. Silakan gunakan tombol Ambil Foto HP / Upload Galeri."}
                </p>
                <button
                  onClick={() => startScanner()}
                  className="mt-1 flex items-center gap-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-bold cursor-pointer transition-colors"
                >
                  <RefreshCw className="w-3 h-3" /> Coba Kamera Live
                </button>
              </div>
            )}

            {cameraState === 'idle' && (
              <div className="text-center p-4">
                <Camera className="w-9 h-9 text-slate-600 mx-auto mb-2 animate-pulse" />
                <button
                  onClick={() => startScanner()}
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl cursor-pointer transition-colors"
                >
                  Mulai Kamera Live
                </button>
              </div>
            )}
          </div>

          {/* CAMERA DEVICE SELECTOR */}
          {availableCameras.length > 1 && cameraState === 'scanning' && (
            <div className="flex items-center justify-between bg-slate-100 p-2 rounded-xl text-xs">
              <span className="text-[10px] font-bold text-slate-600 flex items-center gap-1">
                <SwitchCamera className="w-3.5 h-3.5 text-blue-600" /> Kamera Live:
              </span>
              <select
                value={selectedCameraId}
                onChange={(e) => {
                  setSelectedCameraId(e.target.value);
                  startScanner(e.target.value);
                }}
                className="text-[11px] font-bold bg-white border border-slate-200 rounded-lg px-2 py-0.5 text-slate-800 focus:outline-none"
              >
                {availableCameras.map(cam => (
                  <option key={cam.id} value={cam.id}>{cam.label}</option>
                ))}
              </select>
            </div>
          )}

          {/* 2. ALTERNATE OPTION (BELOW LIVE CAMERA): MOBILE CAMERA CAPTURE & GALLERY UPLOAD */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl p-3.5 shadow-md space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold flex items-center gap-1.5 uppercase tracking-wider text-blue-100">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" /> Pilihan Foto HP / Galeri
              </span>
              <span className="text-[9px] bg-white/20 text-white font-extrabold px-2 py-0.5 rounded-full">
                Multi-Engine Fast Scan
              </span>
            </div>

            {/* Hidden inputs */}
            <input
              ref={captureInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={(e) => {
                if (e.target.files?.[0]) processImageFile(e.target.files[0]);
              }}
              className="hidden"
            />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => {
                if (e.target.files?.[0]) processImageFile(e.target.files[0]);
              }}
              className="hidden"
            />

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => captureInputRef.current?.click()}
                className="py-2.5 px-2 bg-white text-blue-700 hover:bg-blue-50 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <Camera className="w-4 h-4 text-blue-600" /> Ambil Foto HP
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="py-2.5 px-2 bg-blue-800/60 hover:bg-blue-800/90 text-white border border-blue-400/40 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <ImageIcon className="w-4 h-4 text-blue-200" /> Upload Galeri
              </button>
            </div>
            <p className="text-[9.5px] text-blue-100/90 text-center leading-tight pt-0.5">
              Klik "Ambil Foto HP" jika ingin memfoto barcode langsung tanpa stream live camera browser.
            </p>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-5 py-2.5 border-t border-slate-100 bg-slate-50 flex justify-end">
          <button
            type="button"
            onClick={() => {
              stopScanner();
              onClose();
            }}
            className="px-4 py-1.5 border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold cursor-pointer transition-colors"
          >
            Tutup Pemindai
          </button>
        </div>
      </div>
    </div>
  );
}
