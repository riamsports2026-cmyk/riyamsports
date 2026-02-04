'use client';

/**
 * Themed loader using RIAM brand colors (blue #1E3A5F).
 * Use across staff, customer, and admin.
 */
interface LoaderProps {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  className?: string;
}

const sizeClasses = {
  sm: 'h-6 w-6',
  md: 'h-8 w-8',
  lg: 'h-12 w-12',
};

export function Loader({ size = 'md', label, className = '' }: LoaderProps) {
  return (
    <div className={`text-center ${className}`}>
      <div
        className={`inline-block animate-spin rounded-full border-2 border-[#1E3A5F]/20 border-t-[#1E3A5F] ${sizeClasses[size]}`}
        aria-hidden
      />
      {label && (
        <p className="mt-2 sm:mt-3 text-[#1E3A5F] font-medium text-sm sm:text-base">{label}</p>
      )}
    </div>
  );
}
