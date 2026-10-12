export const IMGBB_API_KEY = '9551c6c91a49c0c4b17819b26554d812';

export interface ImgBBUploadResult {
  url: string;
  displayUrl: string;
  viewerUrl?: string;
  deleteUrl?: string;
  base64DataUrl: string;
  mimeType: string;
  uploadedToImgBB: boolean;
}

/**
 * Converts a File or data URL (including SVG data URLs) into a raster PNG/JPEG base64 data URL
 * so that ImgBB accepts it reliably.
 */
export async function toRasterDataUrl(
  fileOrDataUrl: File | string
): Promise<{ dataUrl: string; mimeType: string }> {
  if (typeof fileOrDataUrl !== 'string') {
    const file = fileOrDataUrl;
    const rawDataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    if (file.type === 'image/svg+xml' || rawDataUrl.startsWith('data:image/svg+xml')) {
      const pngUrl = await rasterizeSvgDataUrlToPng(rawDataUrl);
      return { dataUrl: pngUrl, mimeType: 'image/png' };
    }

    return { dataUrl: rawDataUrl, mimeType: file.type || 'image/jpeg' };
  }

  if (fileOrDataUrl.startsWith('data:image/svg+xml')) {
    const pngUrl = await rasterizeSvgDataUrlToPng(fileOrDataUrl);
    return { dataUrl: pngUrl, mimeType: 'image/png' };
  }

  const mimeMatch = fileOrDataUrl.match(/^data:([^;]+);base64,/);
  return {
    dataUrl: fileOrDataUrl,
    mimeType: mimeMatch ? mimeMatch[1] : 'image/png',
  };
}

function rasterizeSvgDataUrlToPng(svgDataUrl: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth || 1200;
      canvas.height = img.naturalHeight || 675;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(svgDataUrl);
        return;
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      try {
        resolve(canvas.toDataURL('image/png'));
      } catch {
        resolve(svgDataUrl);
      }
    };
    img.onerror = () => resolve(svgDataUrl);
    img.src = svgDataUrl;
  });
}

/**
 * Uploads any image File or Data URL to https://imgbb.com/ using the configured API key.
 * Uses the backend `/api/imgbb/upload` proxy first, with direct browser fallback to `https://api.imgbb.com/1/upload`.
 */
export async function uploadImageToImgBB(
  fileOrDataUrl: File | string,
  imageName?: string
): Promise<ImgBBUploadResult> {
  const { dataUrl, mimeType } = await toRasterDataUrl(fileOrDataUrl);
  const cleanBase64 = dataUrl.replace(/^data:[^;]+;base64,/, '');
  const safeName =
    imageName?.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 50) || `madarsa_img_${Date.now()}`;

  // 1. Try server-side proxy /api/imgbb/upload first
  try {
    const serverRes = await fetch('/api/imgbb/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageBase64: cleanBase64,
        name: safeName,
      }),
    });

    if (serverRes.ok) {
      const json = await serverRes.json();
      if (json?.ok && json?.url) {
        return {
          url: json.url,
          displayUrl: json.displayUrl || json.url,
          viewerUrl: json.viewerUrl,
          deleteUrl: json.deleteUrl,
          base64DataUrl: dataUrl,
          mimeType,
          uploadedToImgBB: true,
        };
      }
    }
  } catch {
    // Fallback to direct client-side ImgBB API call below
  }

  // 2. Direct browser call to https://api.imgbb.com/1/upload
  try {
    const formData = new FormData();
    formData.append('image', cleanBase64);
    formData.append('name', safeName);

    const directRes = await fetch(
      `https://api.imgbb.com/1/upload?key=${encodeURIComponent(IMGBB_API_KEY)}`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (directRes.ok) {
      const directJson = await directRes.json();
      const imgData = directJson?.data;
      if (imgData?.url || imgData?.display_url) {
        const finalUrl = imgData.display_url || imgData.url;
        return {
          url: finalUrl,
          displayUrl: imgData.display_url || finalUrl,
          viewerUrl: imgData.url_viewer,
          deleteUrl: imgData.delete_url,
          base64DataUrl: dataUrl,
          mimeType,
          uploadedToImgBB: true,
        };
      }
    }
  } catch (err) {
    console.warn('ImgBB direct upload fallback error:', err);
  }

  // Fallback to dataUrl if offline
  return {
    url: dataUrl,
    displayUrl: dataUrl,
    base64DataUrl: dataUrl,
    mimeType,
    uploadedToImgBB: false,
  };
}
