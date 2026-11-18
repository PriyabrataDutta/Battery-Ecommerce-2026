/**
 * Indian mobile → "+91XXXXXXXXXX", or null if it isn't one.
 * Accepts spaces, dashes, "+91", "91" and a leading "0".
 * Mirrors public.normalize_in_phone(), which enforces the same on save.
 */
export function normalizeIndianMobile(input: string): string | null {
  let d = input.replace(/\D/g, "");
  if (d.length === 12 && d.startsWith("91")) d = d.slice(2);
  else if (d.length === 11 && d.startsWith("0")) d = d.slice(1);
  return /^[6-9]\d{9}$/.test(d) ? `+91${d}` : null;
}

export const INVALID_MOBILE = "Enter a valid 10-digit Indian mobile number";

/**
 * Customer mobile OTP verification (/add-phone → /verify-phone before account
 * and checkout). Off for now — set to true to require it again. The pages, the
 * send-phone-verification-code function and verify_phone_code stay in place.
 */
export const PHONE_VERIFICATION_REQUIRED = false;
