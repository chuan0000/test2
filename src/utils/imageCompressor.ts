/**
 * Utility to compress images on the client-side before storing or rendering.
 * Converts large multi-megabyte photos to optimized JPEGs (~80KB - 150KB),
 * preventing browser localStorage QuotaExceededError and ensuring ultra-fast exports.
 */
export async function compressImageFile(
  file: File,
  maxWidth = 1200,
  maxHeight = 1200,
  quality = 0.82
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions maintaining aspect ratio
        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            maxHeight = maxHeight;
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          canvas.width = 0;
          canvas.height = 0;
          resolve(event.target?.result as string);
          return;
        }

        // Draw image on white background (in case of transparent PNG)
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to optimized JPEG data URL
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        // Explicitly clear canvas to free backing store memory
        canvas.width = 0;
        canvas.height = 0;
        resolve(compressedDataUrl);
      };
      img.onerror = (err) => {
        // Fallback to original read if canvas fails
        resolve(event.target?.result as string);
      };
    };
    reader.onerror = (err) => reject(err);
  });
}

/**
 * Proportionally resizes and compresses an oversized Base64 / Data URL image
 * so that its maximum dimension does not exceed maxDimension (default 1600px).
 * Ensures smooth canvas rendering without Out-Of-Memory crashes.
 */
export async function optimizeImageBase64(
  dataUrl: string,
  maxDimension = 1600,
  quality = 0.85
): Promise<string> {
  if (!dataUrl || typeof dataUrl !== 'string' || !dataUrl.startsWith('data:image')) {
    return dataUrl;
  }

  return new Promise((resolve) => {
    let resolved = false;
    const finish = (result: string) => {
      if (!resolved) {
        resolved = true;
        resolve(result);
      }
    };

    // Safety timeout: prevent canvas/image hangs from blocking execution
    const timer = setTimeout(() => {
      finish(dataUrl);
    }, 3000);

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      clearTimeout(timer);
      let width = img.width;
      let height = img.height;

      // If dimensions already fit within limit and base64 size is reasonable, keep as is
      if (width <= maxDimension && height <= maxDimension && dataUrl.length < 500 * 1024) {
        finish(dataUrl);
        return;
      }

      if (width > height) {
        if (width > maxDimension) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        }
      } else {
        if (height > maxDimension) {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        canvas.width = 0;
        canvas.height = 0;
        finish(dataUrl);
        return;
      }

      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);

      const optimized = canvas.toDataURL('image/jpeg', quality);
      // Clean up canvas
      canvas.width = 0;
      canvas.height = 0;
      finish(optimized);
    };
    img.onerror = () => {
      clearTimeout(timer);
      finish(dataUrl);
    };
    img.src = dataUrl;
  });
}

/**
 * Extracts and formats Google Drive image share links to direct preview URLs.
 * e.g. https://drive.google.com/file/d/FILE_ID/view -> https://lh3.googleusercontent.com/d/FILE_ID
 */
export function formatGoogleDriveImageUrl(url: string): string {
  if (!url) return url;
  const driveMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || url.match(/id=([a-zA-Z0-9_-]+)/);
  if (driveMatch && driveMatch[1]) {
    const fileId = driveMatch[1];
    return `https://lh3.googleusercontent.com/d/${fileId}`;
  }
  return url;
}
