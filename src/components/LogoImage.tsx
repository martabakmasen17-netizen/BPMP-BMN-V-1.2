import React, { useState, useEffect } from 'react';
import { Building2 } from 'lucide-react';
import defaultLogo from '../assets/logo.png';

interface LogoImageProps {
  src?: string;
  logoUrl?: string;
  alt?: string;
  className?: string;
  fallbackClassName?: string;
}

// Function to check if a logo URL is broken/invalid (e.g. dead wikipedia URL)
function isBrokenUrl(url?: string): boolean {
  if (!url) return true;
  if (url.includes('upload.wikimedia.org')) return true;
  return false;
}

export default function LogoImage({
  src,
  logoUrl,
  alt = 'Logo BPMP',
  className = 'w-full h-full object-contain',
  fallbackClassName = 'w-full h-full object-contain flex items-center justify-center'
}: LogoImageProps) {
  // Determine valid initial source
  const candidate = !isBrokenUrl(src) ? src : (!isBrokenUrl(logoUrl) ? logoUrl : defaultLogo);
  const initialSrc = candidate || defaultLogo || '/logo.png';

  const [imgSrc, setImgSrc] = useState<string>(initialSrc);
  const [errorStage, setErrorStage] = useState<number>(0);

  useEffect(() => {
    const nextCandidate = !isBrokenUrl(src) ? src : (!isBrokenUrl(logoUrl) ? logoUrl : defaultLogo);
    setImgSrc(nextCandidate || defaultLogo || '/logo.png');
    setErrorStage(0);
  }, [src, logoUrl]);

  const handleError = () => {
    if (errorStage === 0) {
      if (imgSrc !== defaultLogo) {
        setImgSrc(defaultLogo);
      } else {
        setImgSrc('/logo.png');
      }
      setErrorStage(1);
    } else if (errorStage === 1) {
      if (imgSrc !== '/logo.png') {
        setImgSrc('/logo.png');
        setErrorStage(2);
      } else {
        setErrorStage(3);
      }
    } else {
      setErrorStage(3);
    }
  };

  if (errorStage >= 3) {
    return (
      <div className={`bg-blue-600/90 text-white rounded-xl font-bold p-2 shadow-sm ${fallbackClassName}`}>
        <Building2 className="w-full h-full" />
      </div>
    );
  }

  return (
    <img
      src={imgSrc}
      alt={alt}
      className={className}
      onError={handleError}
    />
  );
}
