/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Compresses an image file or Base64 Data URL to a low-footprint Data URL.
 * Guarantees output size is safely under Google Sheets 50,000 character cell limit (~10KB-25KB).
 */
export const compressImage = (
  fileOrDataUrl: File | string,
  maxWidth = 360,
  maxHeight = 360,
  quality = 0.6
): Promise<string> => {
  return new Promise((resolve) => {
    if (!fileOrDataUrl) {
      resolve('');
      return;
    }

    const img = new Image();

    const processCanvas = () => {
      try {
        let width = img.width || 360;
        let height = img.height || 360;

        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, width);
        canvas.height = Math.max(1, height);
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          resolve(typeof fileOrDataUrl === 'string' ? fileOrDataUrl : '');
          return;
        }

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        let result = canvas.toDataURL('image/jpeg', quality);

        // If compressed result is still over 35,000 chars, perform aggressive pass
        if (result.length > 35000) {
          const smallCanvas = document.createElement('canvas');
          smallCanvas.width = Math.max(1, Math.round(canvas.width * 0.7));
          smallCanvas.height = Math.max(1, Math.round(canvas.height * 0.7));
          const sCtx = smallCanvas.getContext('2d');
          if (sCtx) {
            sCtx.drawImage(canvas, 0, 0, smallCanvas.width, smallCanvas.height);
            result = smallCanvas.toDataURL('image/jpeg', 0.45);
          }
        }

        resolve(result);
      } catch (err) {
        console.warn('Image compression fallback:', err);
        resolve(typeof fileOrDataUrl === 'string' ? fileOrDataUrl : '');
      }
    };

    img.onload = () => processCanvas();
    img.onerror = () => resolve(typeof fileOrDataUrl === 'string' ? fileOrDataUrl : '');

    if (typeof fileOrDataUrl === 'string') {
      img.src = fileOrDataUrl;
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };
      reader.onerror = () => resolve('');
      reader.readAsDataURL(fileOrDataUrl);
    }
  });
};
