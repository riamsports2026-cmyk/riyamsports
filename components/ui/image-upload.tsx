'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';

interface ImageUploadProps {
  currentImage?: string | null;
  onImageUploaded: (url: string) => void;
  type: 'profile' | 'service';
  label?: string;
  required?: boolean;
}

export function ImageUpload({
  currentImage,
  onImageUploaded,
  type,
  label,
  required = false,
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentImage || null);
  const [uploadedUrl, setUploadedUrl] = useState<string>(currentImage || '');
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync uploadedUrl with currentImage prop
  useEffect(() => {
    if (currentImage) {
      setUploadedUrl(currentImage);
      setPreview(currentImage);
    } else {
      setUploadedUrl('');
      setPreview(null);
    }
  }, [currentImage]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB');
      return;
    }

    setError(null);
    setUploading(true);

    try {
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Upload to Cloudinary
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Upload failed');
      }

      const data = await response.json();
      setUploadedUrl(data.url);
      onImageUploaded(data.url);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
      setPreview(currentImage || null);
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    setPreview(null);
    setUploadedUrl('');
    onImageUploaded('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      
      <div className="flex items-center gap-4">
        {preview && (
          <div className="relative">
            <Image
              src={preview}
              alt="Preview"
              width={type === 'service' ? 120 : 80}
              height={type === 'service' ? 120 : 80}
              className={`rounded-lg object-cover border-2 border-gray-300 ${
                type === 'service' ? 'w-30 h-30' : 'w-20 h-20'
              }`}
            />
            {!uploading && (
              <button
                type="button"
                onClick={handleRemove}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 cursor-pointer"
              >
                ×
              </button>
            )}
          </div>
        )}

        <div className="flex-1">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            disabled={uploading}
            name={`${type}_image_upload`} // Unique name to avoid form submission
            form="" // Don't associate with any form
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-[#FF6B35] file:text-white hover:file:bg-[#E55A2B] file:cursor-pointer cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          />
          {error && (
            <p className="mt-1 text-sm text-red-600">{error}</p>
          )}
          {uploading && (
            <p className="mt-1 text-sm text-[#1E3A5F] font-medium">Uploading...</p>
          )}
          {!required && (
            <p className="mt-1 text-xs text-gray-500">(Optional)</p>
          )}
        </div>
      </div>
      
      <input
        type="hidden"
        name={type === 'service' ? 'image_url' : 'profile_image'}
        value={uploadedUrl}
      />
    </div>
  );
}

