'use client';

import { useState, useEffect, useMemo } from 'react';

/** Reject empty or invalid data URLs that cause net::ERR_INVALID_URL (e.g. data:;base64,= from auth/profile) */
function isEmptyDataUrl(s: string): boolean {
  const t = s.trim().toLowerCase();
  if (!t.startsWith('data:')) return false;
  // data:;base64,= or data:image/...;base64,= (empty payload)
  if (t === 'data:;base64,=' || t.endsWith(';base64,=') || t.endsWith(';base64,')) return true;
  return false;
}

interface SafeImageProps {
  src: string | null | undefined | string[];
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  fallback?: string | null;
  /** When true, image fills container (100% w/h, object-fit cover). Use for avatars. Avoids height:auto that can clip in overflow-hidden circles. */
  fill?: boolean;
}

export function SafeImage({
  src,
  alt,
  width,
  height,
  className,
  fallback,
  fill = false,
}: SafeImageProps) {
  // Normalize src to always be a string or null (handle arrays, empty/invalid data URLs)
  const normalizedSrc = useMemo(() => {
    if (!src) return null;
    if (Array.isArray(src)) {
      const validSrc = src.find(s => typeof s === 'string' && s.trim() !== '' && !isEmptyDataUrl(s));
      return validSrc || null;
    }
    if (typeof src === 'string' && src.trim() !== '' && !isEmptyDataUrl(src)) {
      return src;
    }
    return null;
  }, [src]);

  const [imgSrc, setImgSrc] = useState<string | null>(normalizedSrc);
  const [hasError, setHasError] = useState(false);

  // Sync with normalized src changes - use normalizedSrc to ensure stable dependency
  useEffect(() => {
    setImgSrc(normalizedSrc);
    setHasError(false);
  }, [normalizedSrc]);

  // Don't render if no image source or error
  if (!imgSrc || hasError) {
    return null;
  }

  const style = fill
    ? { display: 'block' as const, width: '100%', height: '100%', objectFit: 'cover' as const }
    : { display: 'block' as const, maxWidth: '100%', height: 'auto' };

  return (
    <img
      src={imgSrc}
      alt={alt}
      width={width}
      height={height}
      className={className}
      onError={() => {
        if (fallback && imgSrc !== fallback) {
          setImgSrc(fallback);
          setHasError(false);
        } else {
          setHasError(true);
        }
      }}
      style={style}
      loading="lazy"
    />
  );
}

