/**
 * Customer mobile number validation and normalization for WhatsApp and profile.
 * Supports Indian 10-digit numbers and optional E.164.
 */

export const DEFAULT_COUNTRY_CODE = '+91';

/** Indian mobile: 10 digits starting with 6–9. */
const INDIAN_MOBILE_REGEX = /^[6-9]\d{9}$/;

/** E.164: optional +, digits only, typically 10–15 digits. */
const E164_REGEX = /^\+?[1-9]\d{6,14}$/;

export interface PhoneValidationResult {
  valid: boolean;
  normalized?: string;
  error?: string;
}

/**
 * Validate and optionally normalize a mobile number.
 * - Indian: 10 digits starting with 6–9 (with or without +91).
 * - E.164: + followed by 10–15 digits.
 */
export function validateMobileNumber(
  value: string | null | undefined,
  options: { countryCode?: string; normalize?: boolean } = {}
): PhoneValidationResult {
  const { countryCode = DEFAULT_COUNTRY_CODE, normalize = true } = options;

  if (value == null || typeof value !== 'string') {
    return { valid: false, error: 'Mobile number is required' };
  }

  const trimmed = value.trim().replace(/\s+/g, '');
  if (!trimmed) {
    return { valid: false, error: 'Mobile number is required' };
  }

  const digitsOnly = trimmed.replace(/\D/g, '');

  // Indian: 10 digits (6–9 start) or 12 digits (91 + 10)
  if (digitsOnly.length === 10 && INDIAN_MOBILE_REGEX.test(digitsOnly)) {
    return {
      valid: true,
      normalized: normalize ? `${countryCode}${digitsOnly}` : trimmed,
    };
  }
  if (digitsOnly.length === 12 && digitsOnly.startsWith('91') && INDIAN_MOBILE_REGEX.test(digitsOnly.slice(2))) {
    return {
      valid: true,
      normalized: normalize ? `${countryCode}${digitsOnly.slice(2)}` : `+${digitsOnly}`,
    };
  }

  // E.164 (other countries)
  const withPlus = trimmed.startsWith('+') ? trimmed : `+${digitsOnly}`;
  if (E164_REGEX.test(withPlus.replace(/\D/g, '')) && withPlus.replace(/\D/g, '').length >= 10) {
    return {
      valid: true,
      normalized: normalize ? (withPlus.startsWith('+') ? withPlus : `+${withPlus}`) : trimmed,
    };
  }

  return {
    valid: false,
    error: 'Enter a valid 10-digit mobile number (e.g. 9876543210)',
  };
}

/**
 * Quick check for Indian 10-digit format (for forms using existing regex).
 */
export function isValidIndianMobile(value: string | null | undefined): boolean {
  if (value == null || typeof value !== 'string') return false;
  const digits = value.replace(/\D/g, '');
  return (digits.length === 10 && INDIAN_MOBILE_REGEX.test(digits)) ||
    (digits.length === 12 && digits.startsWith('91') && INDIAN_MOBILE_REGEX.test(digits.slice(2)));
}
