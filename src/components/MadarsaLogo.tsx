import React from 'react';

/**
 * Automatically removes white / near-white background from any uploaded logo image
 * and returns a transparent PNG data URL.
 */
export async function removeLogoBackground(fileOrDataUrl: File | string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const maxDim = 512;
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(typeof fileOrDataUrl === 'string' ? fileOrDataUrl : '');
        return;
      }

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      // Strip white & light-gray background pixels with smooth edge feathering
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        // Calculate brightness & saturation
        const maxC = Math.max(r, g, b);
        const minC = Math.min(r, g, b);
        const diff = maxC - minC;

        // Pure white / near-white neutral background
        if (r > 236 && g > 236 && b > 236 && diff < 18) {
          data[i + 3] = 0;
        } else if (r > 215 && g > 215 && b > 215 && diff < 22) {
          // Feather anti-aliased border pixels smoothly
          const whiteness = (r + g + b) / 3;
          const alphaFactor = Math.max(0, Math.min(1, (240 - whiteness) / 25));
          data[i + 3] = Math.round(data[i + 3] * alphaFactor);
        }
      }

      ctx.putImageData(imageData, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = (err) => reject(err);

    if (typeof fileOrDataUrl === 'string') {
      img.src = fileOrDataUrl;
    } else {
      const reader = new FileReader();
      reader.onload = () => {
        img.src = reader.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(fileOrDataUrl);
    }
  });
}

interface MadarsaLogoProps {
  logoUrl?: string;
  className?: string;
  variant?: 'default' | 'on-dark';
}

/**
 * Renders the Graduation 'G' Emblem with Open Book & Red Star on a 100% transparent background.
 * When `variant="on-dark"` is passed (e.g., on dark green headers/sidebars), a subtle white halo
 * is applied to the black silhouette elements so both the black graduation cap/book and red G/star
 * pop with crisp contrast without any box background.
 */
export const MadarsaLogo: React.FC<MadarsaLogoProps> = ({
  logoUrl,
  className = 'w-10 h-10',
  variant = 'default',
}) => {
  const dropShadowStyle =
    variant === 'on-dark'
      ? { filter: 'drop-shadow(0 0 2px rgba(255,255,255,0.95)) drop-shadow(0 2px 6px rgba(0,0,0,0.35))' }
      : { filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.12))' };

  if (logoUrl && logoUrl.trim().length > 0) {
    return (
      <img
        src={logoUrl}
        alt="Madarsa Gausiya Razviya Emblem"
        referrerPolicy="no-referrer"
        style={dropShadowStyle}
        className={`object-contain select-none bg-transparent ${className}`}
      />
    );
  }

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 500 500"
      fill="none"
      style={dropShadowStyle}
      className={`select-none bg-transparent ${className}`}
      aria-label="Madarsa Gausiya Razviya Logo"
    >
      <defs>
        <linearGradient id="mgrRedGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ff1f1f" />
          <stop offset="55%" stopColor="#dc0000" />
          <stop offset="100%" stopColor="#990000" />
        </linearGradient>
        <linearGradient id="mgrDarkGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#343434" />
          <stop offset="50%" stopColor="#191919" />
          <stop offset="100%" stopColor="#050505" />
        </linearGradient>
      </defs>

      {/* 3D Faceted Red Star at Top Right */}
      <g transform="translate(375, 62)">
        <polygon
          points="0,-46 11,-14 45,-14 18,7 28,40 0,20 -28,40 -18,7 -45,-14 -11,-14"
          fill="url(#mgrRedGrad)"
        />
        <polygon points="0,-46 11,-14 0,2" fill="#ff5252" />
        <polygon points="0,2 45,-14 18,7" fill="#b30000" />
        <polygon points="0,2 28,40 0,20" fill="#8f0000" />
        <polygon points="0,2 -28,40 -18,7" fill="#cc0000" />
        <polygon points="0,2 -45,-14 -11,-14" fill="#ff3838" />
      </g>

      {/* Black Graduation Cap (Mortarboard) */}
      <polygon points="152,130 226,72 322,72 282,115" fill="url(#mgrDarkGrad)" />
      <path
        d="M 197 115 C 220 93, 265 89, 283 99 L 291 117 C 262 110, 224 118, 206 142 Z"
        fill="url(#mgrDarkGrad)"
      />

      {/* Red Tassel Hanging Left */}
      <rect x="162" y="128" width="4" height="25" fill="#d60000" />
      <circle cx="164" cy="155" r="6" fill="#d60000" />
      <path
        d="M 160 160 L 155 196 L 161 195 L 164 197 L 167 195 L 173 196 L 168 160 Z"
        fill="url(#mgrRedGrad)"
      />

      {/* Graduate Head Silhouette */}
      <ellipse
        cx="250"
        cy="150"
        rx="35"
        ry="30"
        transform="rotate(-18 250 150)"
        fill="url(#mgrDarkGrad)"
      />

      {/* Outer Left Black Shoulder / Crescent Curve */}
      <path
        d="M 124 352 C 95 255, 152 176, 286 177 C 218 205, 140 258, 124 352 Z"
        fill="url(#mgrDarkGrad)"
      />

      {/* Inner Black 'G' C-Curve */}
      <path
        d="M 222 250 C 190 305, 212 385, 290 385 C 304 385, 315 378, 315 368 L 315 403 C 282 418, 200 412, 180 342 C 165 290, 195 258, 222 250 Z"
        fill="url(#mgrDarkGrad)"
      />

      {/* Sweeping Red Ribbon from Bottom-Left of G up to the Star */}
      <path
        d="M 218 402 C 138 388, 120 315, 165 255 C 212 195, 332 155, 374 78 C 362 162, 282 212, 218 265 C 168 308, 172 372, 218 402 Z"
        fill="url(#mgrRedGrad)"
      />

      {/* Red Upper Right Terminal of G */}
      <path
        d="M 284 228 L 328 195 L 377 212 L 352 256 C 334 234, 312 226, 284 228 Z"
        fill="url(#mgrRedGrad)"
      />

      {/* Red Right Horizontal Bar & Vertical Stem of G */}
      <path
        d="M 264 312 C 280 292, 305 285, 338 285 L 390 285 C 378 290, 375 296, 375 308 L 375 358 L 315 388 L 315 312 C 315 303, 292 301, 264 312 Z"
        fill="url(#mgrRedGrad)"
      />

      {/* Open Book Pages - Left Red Upper Pages */}
      <path
        d="M 88 370 C 155 370, 215 398, 246 456 C 206 414, 152 396, 94 393 Z"
        fill="url(#mgrRedGrad)"
      />
      <path
        d="M 68 401 C 142 398, 208 420, 246 458 C 198 428, 140 418, 78 422 Z"
        fill="url(#mgrRedGrad)"
      />

      {/* Open Book Pages - Right Red Upper Pages */}
      <path
        d="M 415 370 C 348 370, 288 398, 254 456 C 294 414, 348 396, 408 393 Z"
        fill="url(#mgrRedGrad)"
      />
      <path
        d="M 434 401 C 360 398, 294 420, 254 458 C 302 428, 360 418, 424 422 Z"
        fill="url(#mgrRedGrad)"
      />

      {/* Open Book Pages - Bottom Black Base Curve */}
      <path
        d="M 47 434 C 132 414, 206 435, 250 472 C 294 435, 368 414, 453 434 L 433 460 C 358 442, 292 456, 250 484 C 208 456, 142 442, 67 460 Z"
        fill="url(#mgrDarkGrad)"
      />
    </svg>
  );
};
