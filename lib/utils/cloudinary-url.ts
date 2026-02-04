/**
 * Apply Cloudinary transformations to image URLs
 * This allows us to optimize images on-the-fly without signature issues
 */

export function getOptimizedImageUrl(
  imageUrl: string | null | undefined,
  options?: {
    width?: number;
    height?: number;
    crop?: 'limit' | 'fill' | 'fit' | 'scale';
    quality?: 'auto' | number;
    format?: 'auto' | 'webp' | 'jpg' | 'png';
  }
): string | null {
  if (!imageUrl) return null;

  // If it's not a Cloudinary URL, return as-is
  if (!imageUrl.includes('cloudinary.com')) {
    return imageUrl;
  }

  // If no options provided, return original URL
  if (!options) {
    return imageUrl;
  }

  try {
    const url = new URL(imageUrl);
    const pathParts = url.pathname.split('/');
    
    // Find the version index (usually after /upload/)
    const uploadIndex = pathParts.findIndex(part => part === 'upload');
    if (uploadIndex === -1) {
      return imageUrl; // Not a standard Cloudinary URL
    }

    // Build transformation string
    const transformations: string[] = [];
    
    if (options.width) transformations.push(`w_${options.width}`);
    if (options.height) transformations.push(`h_${options.height}`);
    if (options.crop) transformations.push(`c_${options.crop}`);
    if (options.quality) transformations.push(`q_${options.quality}`);
    if (options.format) transformations.push(`f_${options.format}`);

    if (transformations.length === 0) {
      return imageUrl;
    }

    // Insert transformations after /upload/
    const transformationString = transformations.join(',');
    pathParts.splice(uploadIndex + 1, 0, transformationString);

    // Reconstruct URL
    url.pathname = pathParts.join('/');
    return url.toString();
  } catch (error) {
    // If URL parsing fails, return original
    return imageUrl;
  }
}

/**
 * Get optimized service image URL
 */
export function getServiceImageUrl(imageUrl: string | null | undefined): string | null {
  return getOptimizedImageUrl(imageUrl, {
    width: 800,
    height: 600,
    crop: 'limit',
    quality: 'auto',
    format: 'auto',
  });
}

/**
 * Get optimized profile image URL
 */
export function getProfileImageUrl(imageUrl: string | null | undefined): string | null {
  return getOptimizedImageUrl(imageUrl, {
    width: 400,
    height: 400,
    crop: 'limit',
    quality: 'auto',
    format: 'auto',
  });
}



