import { createWorker } from 'tesseract.js';

/**
 * Web browser implementation of Local OCR using Tesseract.js.
 * Runs 100% on the client side in the browser.
 */
export async function performLocalOcr(base64: string): Promise<string> {
  console.log('[OCR Web] Starting local Tesseract.js OCR extraction...');
  
  let worker: any = null;
  try {
    // Initialize worker with Indonesian and English languages
    worker = await createWorker(['ind', 'eng']);
    
    // Perform recognition
    // base64 can be passed directly as a string or data URI (Tesseract handles it)
    const dataUri = base64.startsWith('data:') ? base64 : `data:image/jpeg;base64,${base64}`;
    const ret = await worker.recognize(dataUri);
    
    const extractedText = ret?.data?.text || '';
    console.log('[OCR Web] Extracted text length:', extractedText.length);
    
    await worker.terminate();
    return extractedText;
  } catch (err) {
    console.error('[OCR Web] Tesseract.js extraction failed:', err);
    if (worker) {
      try {
        await worker.terminate();
      } catch (e) {
        console.warn('[OCR Web] Failed to terminate worker:', e);
      }
    }
    return '';
  }
}
