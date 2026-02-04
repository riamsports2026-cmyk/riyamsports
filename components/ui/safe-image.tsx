'use client';

import { useState, useEffect, useMemo } from 'react';

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
  // Normalize src to always be a string or null (handle arrays)
  const normalizedSrc = useMemo(() => {
    if (!src) return null;
    if (Array.isArray(src)) {
      // If it's an array, use the first valid string
      const validSrc = src.find(s => typeof s === 'string' && s.trim() !== '');
      return validSrc || null;
    }
    if (typeof src === 'string' && src.trim() !== '') {
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

