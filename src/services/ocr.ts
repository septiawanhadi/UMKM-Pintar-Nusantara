/**
 * Native Mobile placeholder for Local OCR.
 * Runs inside standard mobile engines where Web Tesseract.js isn't supported.
 */
export async function performLocalOcr(base64: string): Promise<string> {
  console.log('[OCR] Local OCR is not supported on mobile native platforms inside Expo Go.');
  return '';
}
