/**
 * Image preprocessing and segmentation pipeline:
 * 1. Multi-digit segmentation (1, 2, or 3 digits like 7, 42, 305) via vertical column ink projection.
 * 2. Automatic dark-on-light vs light-on-dark contrast detection & inversion.
 * 3. Aspect-ratio preserving scaling into 20x20 box.
 * 4. Centering into 28x28 grid with center-of-mass alignment (MNIST standard).
 * 5. Stroke thickening and 2x scaling for Letters mode (Tesseract OCR).
 */

export interface SinglePreprocessedDigit {
  normalizedPixels: Float32Array; // 784 floats
  preview28x28DataUrl: string;
  boundingBox: { x: number; y: number; width: number; height: number };
  centerOfMass: { x: number; y: number };
}

export interface MultiDigitPreprocessingResult {
  digits: SinglePreprocessedDigit[];
  sourceThumbnailUrl: string;
  wasInverted: boolean;
}

export interface PreprocessingResult {
  normalizedPixels: Float32Array; // 784 floats
  preview28x28DataUrl: string;
  sourceThumbnailUrl: string;
  wasInverted: boolean;
  boundingBox: { x: number; y: number; width: number; height: number };
  centerOfMass: { x: number; y: number };
}

/**
 * Preprocesses a canvas into an inverted, noise-cleaned grayscale float buffer.
 */
function extractGrayscaleIntensity(
  sourceCanvas: HTMLCanvasElement,
  forcedInversion?: boolean | 'auto'
): { grayscale: Float32Array; width: number; height: number; shouldInvert: boolean } {
  const width = sourceCanvas.width;
  const height = sourceCanvas.height;

  const ctx = sourceCanvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) {
    throw new Error('Could not access canvas context for preprocessing.');
  }

  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  // 1. Analyze border luminance to determine polarity
  const borderMarginX = Math.max(2, Math.floor(width * 0.06));
  const borderMarginY = Math.max(2, Math.floor(height * 0.08));
  let borderLumaSum = 0;
  let borderLumaCount = 0;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const isBorder =
        x < borderMarginX ||
        x >= width - borderMarginX ||
        y < borderMarginY ||
        y >= height - borderMarginY;

      if (isBorder) {
        const idx = (y * width + x) * 4;
        const luma = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
        borderLumaSum += luma;
        borderLumaCount++;
      }
    }
  }

  const avgBorderLuma = borderLumaCount > 0 ? borderLumaSum / borderLumaCount : 0;
  const shouldInvert =
    forcedInversion === true
      ? true
      : forcedInversion === false
      ? false
      : avgBorderLuma > 125;

  // 2. Build single-channel intensity map (stroke > 0, background = 0)
  const grayscale = new Float32Array(width * height);
  let maxIntensity = 0;

  for (let i = 0; i < width * height; i++) {
    const idx = i * 4;
    const luma = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];

    let strokeVal = shouldInvert ? avgBorderLuma - luma : luma - avgBorderLuma;
    if (strokeVal < 0) strokeVal = 0;

    // Suppress low-intensity paper or sensor noise
    if (strokeVal < 25) {
      strokeVal = 0;
    }

    grayscale[i] = strokeVal;
    if (strokeVal > maxIntensity) {
      maxIntensity = strokeVal;
    }
  }

  // Contrast stretch
  if (maxIntensity > 30) {
    const scale = 255.0 / maxIntensity;
    for (let i = 0; i < width * height; i++) {
      grayscale[i] = Math.min(255, grayscale[i] * scale);
    }
  }

  return { grayscale, width, height, shouldInvert };
}

/**
 * Formats a bounded crop into a 28x28 normalized MNIST-compatible tensor.
 */
function formatCropToMnist28x28(
  grayscale: Float32Array,
  srcWidth: number,
  srcHeight: number,
  minX: number,
  maxX: number,
  minY: number,
  maxY: number
): {
  normalizedPixels: Float32Array;
  preview28x28DataUrl: string;
  boundingBox: { x: number; y: number; width: number; height: number };
  centerOfMass: { x: number; y: number };
} {
  // Add small padding to bounding box
  const pad = 2;
  const cMinX = Math.max(0, minX - pad);
  const cMinY = Math.max(0, minY - pad);
  const cMaxX = Math.min(srcWidth - 1, maxX + pad);
  const cMaxY = Math.min(srcHeight - 1, maxY + pad);

  const bbWidth = cMaxX - cMinX + 1;
  const bbHeight = cMaxY - cMinY + 1;

  // 1. Intermediate canvas for cropped bounding box
  const cropCanvas = document.createElement('canvas');
  cropCanvas.width = bbWidth;
  cropCanvas.height = bbHeight;
  const cropCtx = cropCanvas.getContext('2d')!;
  const cropImgData = cropCtx.createImageData(bbWidth, bbHeight);

  for (let cy = 0; cy < bbHeight; cy++) {
    for (let cx = 0; cx < bbWidth; cx++) {
      const srcIdx = (cMinY + cy) * srcWidth + (cMinX + cx);
      const dstIdx = (cy * bbWidth + cx) * 4;
      const val = grayscale[srcIdx];
      cropImgData.data[dstIdx] = val;
      cropImgData.data[dstIdx + 1] = val;
      cropImgData.data[dstIdx + 2] = val;
      cropImgData.data[dstIdx + 3] = 255;
    }
  }
  cropCtx.putImageData(cropImgData, 0, 0);

  // 2. Scale bounding box to fit inside 20x20 preserving aspect ratio
  const maxDim = Math.max(bbWidth, bbHeight);
  const scale = 20.0 / maxDim;
  const scaledW = Math.max(1, Math.round(bbWidth * scale));
  const scaledH = Math.max(1, Math.round(bbHeight * scale));

  const scaledCanvas = document.createElement('canvas');
  scaledCanvas.width = scaledW;
  scaledCanvas.height = scaledH;
  const scaledCtx = scaledCanvas.getContext('2d')!;
  scaledCtx.imageSmoothingEnabled = true;
  scaledCtx.imageSmoothingQuality = 'high';
  scaledCtx.drawImage(cropCanvas, 0, 0, bbWidth, bbHeight, 0, 0, scaledW, scaledH);

  // 3. Center into 28x28 grid
  const initialCanvas = document.createElement('canvas');
  initialCanvas.width = 28;
  initialCanvas.height = 28;
  const initCtx = initialCanvas.getContext('2d')!;
  initCtx.fillStyle = '#000000';
  initCtx.fillRect(0, 0, 28, 28);

  const startX = Math.floor((28 - scaledW) / 2);
  const startY = Math.floor((28 - scaledH) / 2);
  initCtx.drawImage(scaledCanvas, startX, startY);

  const initData = initCtx.getImageData(0, 0, 28, 28).data;

  // 4. Center of Mass alignment (MNIST standard)
  let totalMass = 0;
  let sumX = 0;
  let sumY = 0;

  for (let y = 0; y < 28; y++) {
    for (let x = 0; x < 28; x++) {
      const idx = (y * 28 + x) * 4;
      const mass = initData[idx];
      totalMass += mass;
      sumX += x * mass;
      sumY += y * mass;
    }
  }

  let shiftX = 0;
  let shiftY = 0;
  let finalComX = 14;
  let finalComY = 14;

  if (totalMass > 0) {
    const comX = sumX / totalMass;
    const comY = sumY / totalMass;
    finalComX = comX;
    finalComY = comY;

    shiftX = Math.round(13.5 - comX);
    shiftY = Math.round(13.5 - comY);

    shiftX = Math.max(-3, Math.min(3, shiftX));
    shiftY = Math.max(-3, Math.min(3, shiftY));
  }

  // Final shifted 28x28 canvas
  const finalCanvas = document.createElement('canvas');
  finalCanvas.width = 28;
  finalCanvas.height = 28;
  const finalCtx = finalCanvas.getContext('2d')!;
  finalCtx.fillStyle = '#000000';
  finalCtx.fillRect(0, 0, 28, 28);
  finalCtx.drawImage(initialCanvas, shiftX, shiftY);

  const finalImageData = finalCtx.getImageData(0, 0, 28, 28);
  const finalData = finalImageData.data;

  // Normalize to [0, 1]
  const normalizedPixels = new Float32Array(784);
  for (let i = 0; i < 784; i++) {
    normalizedPixels[i] = finalData[i * 4] / 255.0;
  }

  return {
    normalizedPixels,
    preview28x28DataUrl: finalCanvas.toDataURL('image/png'),
    boundingBox: { x: cMinX, y: cMinY, width: bbWidth, height: bbHeight },
    centerOfMass: {
      x: Number((finalComX + shiftX).toFixed(1)),
      y: Number((finalComY + shiftY).toFixed(1)),
    },
  };
}

/**
 * Segment image into 1, 2, or 3 separate digits (e.g. 7, 42, 305)
 * using vertical column ink projection and clear gap splitting.
 */
export function segmentAndPreprocessDigits(
  sourceCanvas: HTMLCanvasElement,
  forcedInversion?: boolean | 'auto'
): MultiDigitPreprocessingResult {
  const { grayscale, width, height, shouldInvert } = extractGrayscaleIntensity(
    sourceCanvas,
    forcedInversion
  );

  // 1. Calculate ink count per column
  const colInkCounts = new Int32Array(width);
  for (let x = 0; x < width; x++) {
    let count = 0;
    for (let y = 0; y < height; y++) {
      if (grayscale[y * width + x] > 35) {
        count++;
      }
    }
    colInkCounts[x] = count;
  }

  // 2. Identify segments separated by vertical gaps
  interface ColumnSpan {
    startX: number;
    endX: number;
  }

  const minGap = 4; // minimum empty columns that define a gap
  const rawSegments: ColumnSpan[] = [];
  let inSegment = false;
  let segStart = 0;
  let gapCount = 0;

  for (let x = 0; x < width; x++) {
    const hasInk = colInkCounts[x] > 2;

    if (!inSegment) {
      if (hasInk) {
        inSegment = true;
        segStart = x;
        gapCount = 0;
      }
    } else {
      if (!hasInk) {
        gapCount++;
        if (gapCount >= minGap) {
          const segEnd = x - gapCount;
          rawSegments.push({ startX: segStart, endX: segEnd });
          inSegment = false;
        }
      } else {
        gapCount = 0;
      }
    }
  }

  if (inSegment) {
    rawSegments.push({ startX: segStart, endX: width - 1 - gapCount });
  }

  // 3. For each segment, find exact bounding box & filter noise
  interface ValidDigitSpan {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
    inkPixels: number;
  }

  const validSpans: ValidDigitSpan[] = [];

  for (const span of rawSegments) {
    let sMinX = span.endX;
    let sMaxX = span.startX;
    let sMinY = height;
    let sMaxY = 0;
    let inkPixels = 0;

    for (let y = 0; y < height; y++) {
      for (let x = span.startX; x <= span.endX; x++) {
        if (grayscale[y * width + x] > 35) {
          inkPixels++;
          if (x < sMinX) sMinX = x;
          if (x > sMaxX) sMaxX = x;
          if (y < sMinY) sMinY = y;
          if (y > sMaxY) sMaxY = y;
        }
      }
    }

    // Require sufficient pixels and non-empty bounds
    if (inkPixels >= 18 && sMaxX >= sMinX && sMaxY >= sMinY) {
      validSpans.push({
        minX: sMinX,
        maxX: sMaxX,
        minY: sMinY,
        maxY: sMaxY,
        inkPixels,
      });
    }
  }

  // Friendly message if nothing detected
  if (validSpans.length === 0) {
    throw new Error('I could not see anything, please try again');
  }

  // Sort from left to right
  validSpans.sort((a, b) => a.minX - b.minX);

  // Accept a maximum of 3 digits
  const cappedSpans = validSpans.slice(0, 3);

  // 4. Preprocess each segmented digit
  const processedDigits: SinglePreprocessedDigit[] = cappedSpans.map((span) => {
    return formatCropToMnist28x28(
      grayscale,
      width,
      height,
      span.minX,
      span.maxX,
      span.minY,
      span.maxY
    );
  });

  return {
    digits: processedDigits,
    sourceThumbnailUrl: sourceCanvas.toDataURL('image/png'),
    wasInverted: shouldInvert,
  };
}

/**
 * Single digit preprocessing (for fallback or single digit tasks).
 */
export function preprocessDigitCanvas(
  sourceCanvas: HTMLCanvasElement,
  forcedInversion?: boolean | 'auto'
): PreprocessingResult {
  const multi = segmentAndPreprocessDigits(sourceCanvas, forcedInversion);
  const first = multi.digits[0];
  return {
    normalizedPixels: first.normalizedPixels,
    preview28x28DataUrl: first.preview28x28DataUrl,
    sourceThumbnailUrl: multi.sourceThumbnailUrl,
    wasInverted: multi.wasInverted,
    boundingBox: first.boundingBox,
    centerOfMass: first.centerOfMass,
  };
}

/**
 * Prepares the draw canvas for Letters mode:
 * Converts white strokes on black canvas to thick black ink on a pure white background,
 * and scales it up 2x before sending to Tesseract.js.
 */
export function prepareDrawingForLetterOcr(sourceCanvas: HTMLCanvasElement): HTMLCanvasElement {
  const width = sourceCanvas.width;
  const height = sourceCanvas.height;
  const srcCtx = sourceCanvas.getContext('2d', { willReadFrequently: true });
  if (!srcCtx) return sourceCanvas;

  const srcData = srcCtx.getImageData(0, 0, width, height).data;

  const outCanvas = document.createElement('canvas');
  outCanvas.width = width * 2;
  outCanvas.height = height * 2;
  const outCtx = outCanvas.getContext('2d')!;

  // 1. Pure white background
  outCtx.fillStyle = '#ffffff';
  outCtx.fillRect(0, 0, outCanvas.width, outCanvas.height);

  // 2. Thick black ink
  outCtx.fillStyle = '#000000';
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const luma = 0.299 * srcData[idx] + 0.587 * srcData[idx + 1] + 0.114 * srcData[idx + 2];
      if (luma > 35) {
        // Draw 2x scaled dot with radius 4 for thick strokes
        outCtx.beginPath();
        outCtx.arc(x * 2, y * 2, 4.5, 0, Math.PI * 2);
        outCtx.fill();
      }
    }
  }

  return outCanvas;
}
