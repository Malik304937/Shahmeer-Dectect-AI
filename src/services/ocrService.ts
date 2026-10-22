import { createWorker } from 'tesseract.js';
import { OcrWord } from '../types.ts';

let workerPromise: Promise<any> | null = null;

async function getWorker(onProgress?: (progress: number, status: string) => void) {
  if (!workerPromise) {
    workerPromise = (async () => {
      const worker = await createWorker('eng', 1, {
        logger: (m) => {
          if (m.status === 'recognizing text' && typeof m.progress === 'number') {
            onProgress?.(Math.round(m.progress * 100), 'Recognizing text & numbers...');
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

export interface OcrResult {
  text: string;
  confidence: number;
  words: OcrWord[];
}

export async function performOcr(
  imageSource: string | HTMLCanvasElement,
  onProgress?: (progress: number, status: string) => void
): Promise<OcrResult> {
  onProgress?.(15, 'Initializing Tesseract OCR engine...');
  const worker = await getWorker(onProgress);

  onProgress?.(45, 'Scanning visual characters & bounding lines...');
  const res = await worker.recognize(imageSource);

  const cleanText = res.data.text ? res.data.text.trim() : '';
  const avgConfidence = res.data.confidence ? Math.round(res.data.confidence) : 0;

  const words: OcrWord[] = (res.data.words || []).map((w: any) => ({
    text: w.text,
    confidence: Math.round(w.confidence || 0),
    bbox: w.bbox,
  }));

  onProgress?.(100, 'OCR scan complete.');
  return {
    text: cleanText,
    confidence: avgConfidence,
    words,
  };
}
