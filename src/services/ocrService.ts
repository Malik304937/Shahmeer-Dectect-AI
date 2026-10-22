import { createWorker } from 'tesseract.js';
import { OcrWord } from '../types.ts';

let workerPromise: Promise<any> | null = null;

async function getWorker(onProgress?: (progress: number, status: string) => void) {
  if (!workerPromise) {
    workerPromise = (async () => {
      const worker = await createWorker('eng', 1, {
        logger: (m) => {
          if (m.status === 'recognizing text' && typeof m.progress === 'number') {
            onProgress?.(Math.round(m.progress * 100), 'Recognizing characters...');
          } else if (m.status) {
            onProgress?.(30, m.status.replace(/_/g, ' '));
          }
        },
      });
      return worker;
    })();
  }
  return workerPromise;
}

export interface OcrOptions {
  whitelist?: string;
}

export interface OcrResult {
  text: string;
  confidence: number;
  words: OcrWord[];
}

export const LETTERS_WHITELIST = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

export async function performOcr(
  imageSource: string | HTMLCanvasElement,
  options?: OcrOptions,
  onProgress?: (progress: number, status: string) => void
): Promise<OcrResult> {
  onProgress?.(15, 'Loading Tesseract engine...');
  const worker = await getWorker(onProgress);

  // Set whitelist parameter if provided
  if (options?.whitelist) {
    await worker.setParameters({
      tessedit_char_whitelist: options.whitelist,
    });
  } else {
    await worker.setParameters({
      tessedit_char_whitelist: '',
    });
  }

  onProgress?.(45, 'Scanning letter glyphs...');
  const res = await worker.recognize(imageSource);

  const cleanText = res.data.text ? res.data.text.trim() : '';
  const avgConfidence = res.data.confidence ? Math.round(res.data.confidence) : 0;

  const words: OcrWord[] = (res.data.words || []).map((w: any) => ({
    text: w.text,
    confidence: Math.round(w.confidence || 0),
    bbox: w.bbox,
  }));

  onProgress?.(100, 'Recognition complete.');

  return {
    text: cleanText,
    confidence: avgConfidence,
    words,
  };
}
