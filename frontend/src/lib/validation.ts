// src/lib/validation.ts
// Centralised validation rules for all shop-related forms

export interface ValidationResult {
  valid: boolean;
  message: string;
}

/** Shop name: 2–100 characters */
export function validateShopName(value: string): ValidationResult {
  const v = value.trim();
  if (!v) return { valid: false, message: 'Shop name is required.' };
  if (v.length < 2) return { valid: false, message: 'Shop name must be at least 2 characters.' };
  if (v.length > 100) return { valid: false, message: `Shop name must be 100 characters or fewer (currently ${v.length}).` };
  return { valid: true, message: '' };
}

/** Phone: exactly 10 digits (ignoring spaces / dashes / +91 prefix) */
export function validatePhone(value: string): ValidationResult {
  if (!value.trim()) return { valid: false, message: 'Phone number is required.' };
  const digits = value.replace(/\D/g, '');
  // Allow leading 91 (India country code) but the core number must be 10 digits
  const core = digits.startsWith('91') && digits.length === 12 ? digits.slice(2) : digits;
  if (core.length !== 10) return { valid: false, message: 'Phone must contain exactly 10 digits.' };
  return { valid: true, message: '' };
}

/** Image: jpg/png only (validated on the file object) */
export function validateImageFile(file: File): ValidationResult {
  const allowed = ['image/jpeg', 'image/jpg', 'image/png'];
  if (!allowed.includes(file.type.toLowerCase())) {
    return { valid: false, message: 'Only JPG or PNG images are allowed.' };
  }
  if (file.size > 5 * 1024 * 1024) {
    return { valid: false, message: 'Image must be smaller than 5 MB.' };
  }
  return { valid: true, message: '' };
}

/** Description: max 500 characters */
export function validateDescription(value: string): ValidationResult {
  if (value.length > 500) {
    return { valid: false, message: `Description must be 500 characters or fewer (currently ${value.length}).` };
  }
  return { valid: true, message: '' };
}

/** Email: standard format */
export function validateEmail(value: string): ValidationResult {
  if (!value.trim()) return { valid: false, message: 'Email is required.' };
  // RFC-5322 inspired – covers the common cases without being overly strict
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  if (!re.test(value.trim())) return { valid: false, message: 'Please enter a valid email address.' };
  return { valid: true, message: '' };
}

/** Generic required-field check */
export function validateRequired(value: string, fieldLabel: string): ValidationResult {
  if (!value.trim()) return { valid: false, message: `${fieldLabel} is required.` };
  return { valid: true, message: '' };
}

/** Char-counter helper: returns remaining chars and whether over limit */
export function charCount(value: string, max: number): { remaining: number; over: boolean } {
  return { remaining: max - value.length, over: value.length > max };
}
