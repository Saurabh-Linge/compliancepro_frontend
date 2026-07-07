import { Injectable } from '@angular/core';

/**
 * Common validation service providing reusable validation methods
 * for mobile numbers, pincodes, and text normalization.
 */
@Injectable({ providedIn: 'root' })
export class ValidationService {

  /**
   * Normalizes text by trimming whitespace and replacing
   * multiple consecutive spaces with a single space.
   */
  normalizeText(text: string): string {
    return (text || '').trim().replace(/\s+/g, ' ');
  }

  /**
   * Validates an Indian mobile number.
   * Valid format: 10 digits starting with 6, 7, 8, or 9.
   */
  isValidIndianMobile(phone: string): boolean {
    const cleaned = (phone || '').replace(/\D/g, '');
    return /^[6-9]\d{9}$/.test(cleaned);
  }

  /**
   * Validates an Indian pincode.
   * Valid format: exactly 6 digits.
   */
  isValidIndianPincode(pincode: string): boolean {
    const cleaned = (pincode || '').replace(/\D/g, '');
    return /^\d{6}$/.test(cleaned);
  }

  /**
   * Gets the validation error message for a mobile number.
   * Returns empty string if valid.
   */
  getMobileError(phone: string, required: boolean = true): string {
    const trimmed = (phone || '').trim();
    if (!trimmed) {
      return required ? 'Phone number is required' : '';
    }
    if (!this.isValidIndianMobile(trimmed)) {
      return 'Enter valid 10-digit mobile (starting with 6-9)';
    }
    return '';
  }

  /**
   * Gets the validation error message for a pincode.
   * Returns empty string if valid or empty (when not required).
   */
  getPincodeError(pincode: string, required: boolean = false): string {
    const trimmed = (pincode || '').trim();
    if (!trimmed) {
      return required ? 'Pincode is required' : '';
    }
    if (!this.isValidIndianPincode(trimmed)) {
      return 'Enter valid 6-digit pincode';
    }
    return '';
  }

  /**
   * Validates an email address.
   */
  isValidEmail(email: string): boolean {
    const trimmed = (email || '').trim();
    if (!trimmed) return false;
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(trimmed);
  }

  /**
   * Gets the validation error message for an email address.
   * Returns empty string if valid or empty (when not required).
   */
  getEmailError(email: string, required: boolean = false): string {
    const trimmed = (email || '').trim();
    if (!trimmed) {
      return required ? 'Email is required' : '';
    }
    if (!this.isValidEmail(trimmed)) {
      return 'Enter a valid email address';
    }
    return '';
  }
}
