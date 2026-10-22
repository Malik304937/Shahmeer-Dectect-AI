/**
 * MNIST Dataset Loader for browser-based TensorFlow.js training.
 * Downloads the standard MNIST image sprite and label buffers from Google Cloud Storage.
 */

const MNIST_IMAGES_SPRITE_PATH = 'https://storage.googleapis.com/learnjs-data/model-builder/mnist_images.png';
const MNIST_LABELS_PATH = 'https://storage.googleapis.com/learnjs-data/model-builder/mnist_labels_uint8';

export const NUM_CLASSES = 10;
export const IMAGE_SIZE = 784; // 28 * 28

export interface MnistDataset {
  xs: Float32Array; // shape: [numExamples, 28, 28, 1]
  ys: Float32Array; // shape: [numExamples, 10]
  numExamples: number;
}

export async function loadMnistSubset(
  numExamples: number = 12000,
  onProgress?: (stage: 'downloading' | 'preparing', progress: number, message: string) => void
): Promise<MnistDataset> {
  onProgress?.('downloading', 10, 'Fetching MNIST image sprite and labels...');

  // 1. Fetch labels buffer
  let labelsBuffer: ArrayBuffer;
  try {
    const labelsResponse = await fetch(MNIST_LABELS_PATH, { mode: 'cors' });
    if (!labelsResponse.ok) {
      throw new Error(`Failed to download labels: ${labelsResponse.statusText}`);
    }
    labelsBuffer = await labelsResponse.arrayBuffer();
  } catch (err: any) {
    console.warn('Network error fetching MNIST labels, attempting fallback...', err);
    throw new Error(`Could not download MNIST labels: ${err.message || 'Network error'}`);
  }

  onProgress?.('downloading', 40, 'MNIST labels received. Downloading 10MB image sprite...');

  // 2. Load MNIST image sprite
  const img = new Image();
  img.crossOrigin = 'anonymous';

  const imgLoadPromise = new Promise<HTMLImageElement>((resolve, reject) => {
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load MNIST image sprite from remote storage.'));
    img.src = MNIST_IMAGES_SPRITE_PATH;
  });

  await imgLoadPromise;

  onProgress?.('preparing', 70, `Extracting ${numExamples} images into normalized tensors...`);

  // 3. Extract pixels into Float32Array in manageable chunks
  const totalPixels = numExamples * IMAGE_SIZE;
  const xsArray = new Float32Array(totalPixels);

  const chunkSize = 2000;
  const canvas = document.createElement('canvas');
  canvas.width = 784;
  canvas.height = chunkSize;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });

  if (!ctx) {
    throw new Error('Unable to create 2D canvas context for image decoding.');
  }

  for (let start = 0; start < numExamples; start += chunkSize) {
    const currentChunk = Math.min(chunkSize, numExamples - start);
    canvas.height = currentChunk;
    ctx.clearRect(0, 0, 784, currentChunk);

    // In mnist_images.png, each row is 784 pixels representing one 28x28 image
    ctx.drawImage(img, 0, start, 784, currentChunk, 0, 0, 784, currentChunk);

    const imgData = ctx.getImageData(0, 0, 784, currentChunk);
    const data = imgData.data;

    // RGBA: since image is grayscale, data[i*4] is the pixel value
    const offset = start * IMAGE_SIZE;
    const chunkPixels = currentChunk * IMAGE_SIZE;
    for (let p = 0; p < chunkPixels; p++) {
      xsArray[offset + p] = data[p * 4] / 255.0;
    }

    const pct = Math.round(70 + ((start + currentChunk) / numExamples) * 25);
    onProgress?.('preparing', pct, `Processed ${Math.min(start + currentChunk, numExamples)} / ${numExamples} samples...`);
    // Yield to event loop to keep UI smooth
    await new Promise((resolve) => setTimeout(resolve, 0));
  }

  // 4. Extract labels (each label is 10 bytes one-hot encoded)
  const labelsUint8 = new Uint8Array(labelsBuffer);
  const ysArray = new Float32Array(numExamples * NUM_CLASSES);
  for (let i = 0; i < numExamples * NUM_CLASSES; i++) {
    ysArray[i] = labelsUint8[i];
  }

  onProgress?.('preparing', 100, 'MNIST dataset ready for neural network training.');

  return {
    xs: xsArray,
    ys: ysArray,
    numExamples,
  };
}
