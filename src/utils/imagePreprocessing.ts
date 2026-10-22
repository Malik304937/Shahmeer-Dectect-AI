/**
 * Image preprocessing pipeline replicating standard MNIST formatting:
 * 1. Automatic dark-on-light vs light-on-dark contrast detection & inversion.
 * 2. Background noise suppression.
 * 3. Bounding-box detection around the digit stroke.
 * 4. Aspect-ratio preserving scaling into a 20x20 box.
 * 5. Centering into a 28x28 canvas using center-of-mass alignment.
 * 6. Pixel normalization to [0.0, 1.0].
 */

export interface PreprocessingResult {
  normalizedPixels: Float32Array; // 784 floats
  preview28x28DataUrl: string;
  sourceThumbnailUrl: string;
  wasInverted: boolean;
  boundingBox: { x: number; y: number; width: number; height: number };
  centerOfMass: { x: number; y: number };
}

export function preprocessDigitCanvas(
  sourceCanvas: HTMLCanvasElement,
  forcedInversion?: boolean | 'auto'
): PreprocessingResult {
  const width = sourceCanvas.width;
  const height = sourceCanvas.height;

  const ctx = sourceCanvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) {
    throw new Error('Could not access canvas context for preprocessing.');
  }

  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  // 1. Analyze border luminance to determine polarity
  const borderMarginX = Math.max(2, Math.floor(width * 0.08));
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
  // If border luminance is high (> 125), digit is dark ink on light background
  const shouldInvert =
    forcedInversion === true
      ? true
      : forcedInversion === false
      ? false
      : avgBorderLuma > 125;

  // 2. Build single-channel intensity map (where stroke > 0, background = 0)
  const grayscale = new Float32Array(width * height);
  let maxIntensity = 0;

  for (let i = 0; i < width * height; i++) {
    const idx = i * 4;
    // Standard RGB to Luminance
    const luma = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];

    let strokeVal = shouldInvert ? avgBorderLuma - luma : luma - avgBorderLuma;
    if (strokeVal < 0) strokeVal = 0;

    // Remove background low-intensity noise
    if (strokeVal < 25) {
      strokeVal = 0;
    }

    grayscale[i] = strokeVal;
    if (strokeVal > maxIntensity) {
      maxIntensity = strokeVal;
    }
  }

  // Contrast boost if stroke is visible
  if (maxIntensity > 30) {
    const scale = 255.0 / maxIntensity;
    for (let i = 0; i < width * height; i++) {
      grayscale[i] = Math.min(255, grayscale[i] * scale);
    }
  }

  // 3. Find Bounding Box of the digit
  let minX = width;
  let maxX = -1;
  let minY = height;
  let maxY = -1;
  let nonZeroCount = 0;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const val = grayscale[y * width + x];
      if (val > 35) {
        nonZeroCount++;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (nonZeroCount < 15 || maxX < minX || maxY < minY) {
    throw new Error('No digit detected! Please draw or place a clear digit inside the guide area.');
  }

  // Add small padding to bounding box if possible
  const pad = 2;
  minX = Math.max(0, minX - pad);
  minY = Math.max(0, minY - pad);
  maxX = Math.min(width - 1, maxX + pad);
  maxY = Math.min(height - 1, maxY + pad);

  const bbWidth = maxX - minX + 1;
  const bbHeight = maxY - minY + 1;

  // 4. Create an intermediate canvas for the cropped bounding box
  const cropCanvas = document.createElement('canvas');
  cropCanvas.width = bbWidth;
  cropCanvas.height = bbHeight;
  const cropCtx = cropCanvas.getContext('2d')!;
  const cropImgData = cropCtx.createImageData(bbWidth, bbHeight);

  for (let cy = 0; cy < bbHeight; cy++) {
    for (let cx = 0; cx < bbWidth; cx++) {
      const srcIdx = (minY + cy) * width + (minX + cx);
      const dstIdx = (cy * bbWidth + cx) * 4;
      const val = grayscale[srcIdx];
      cropImgData.data[dstIdx] = val;
      cropImgData.data[dstIdx + 1] = val;
      cropImgData.data[dstIdx + 2] = val;
      cropImgData.data[dstIdx + 3] = 255;
    }
  }
  cropCtx.putImageData(cropImgData, 0, 0);

  // 5. Scale the bounding box to fit inside 20x20 (preserving aspect ratio)
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

  // 6. Center into 28x28 grid
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

  // 7. Center of Mass alignment (MNIST standard)
  let totalMass = 0;
  let sumX = 0;
  let sumY = 0;

  for (let y = 0; y < 28; y++) {
    for (let x = 0; x < 28; x++) {
      const idx = (y * 28 + x) * 4;
      const mass = initData[idx]; // red channel = intensity
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

    // Optimal center in 28x28 is (13.5, 13.5)
    shiftX = Math.round(13.5 - comX);
    shiftY = Math.round(13.5 - comY);

    // Limit shift to avoid pushing stroke edges outside 28x28 boundary
    shiftX = Math.max(-3, Math.min(3, shiftX));
    shiftY = Math.max(-3, Math.min(3, shiftY));
  }

  // Draw final shifted 28x28 canvas
  const finalCanvas = document.createElement('canvas');
  finalCanvas.width = 28;
  finalCanvas.height = 28;
  const finalCtx = finalCanvas.getContext('2d')!;
  finalCtx.fillStyle = '#000000';
  finalCtx.fillRect(0, 0, 28, 28);
  finalCtx.drawImage(initialCanvas, shiftX, shiftY);

  const finalImageData = finalCtx.getImageData(0, 0, 28, 28);
  const finalData = finalImageData.data;

  // 8. Convert to Float32Array normalized [0, 1]
  const normalizedPixels = new Float32Array(784);
  for (let i = 0; i < 784; i++) {
    normalizedPixels[i] = finalData[i * 4] / 255.0;
  }

  // Capture preview representations
  const preview28x28DataUrl = finalCanvas.toDataURL('image/png');
  const sourceThumbnailUrl = sourceCanvas.toDataURL('image/png');

  return {
    normalizedPixels,
    preview28x28DataUrl,
    sourceThumbnailUrl,
    wasInverted: shouldInvert,
    boundingBox: { x: minX, y: minY, width: bbWidth, height: bbHeight },
    centerOfMass: {
      x: Number((finalComX + shiftX).toFixed(1)),
      y: Number((finalComY + shiftY).toFixed(1)),
    },
  };
}
