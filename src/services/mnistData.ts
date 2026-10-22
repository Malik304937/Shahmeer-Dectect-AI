/**
 * MNIST Dataset Loader for browser-based TensorFlow.js training.
 * Downloads the standard MNIST image sprite and label buffers from Google Cloud Storage.
 */

const MNIST_IMAGES_SPRITE_PATH = 'https://storage.googleapis.com/learnjs-data/model-builder/mnist_images.png';
const MNIST_LABELS_PATH = 'https://storage.googleapis.com/learnjs-data/model-builder/mnist_labels_uint8';

export const NUM_CLASSES = 10;
export const IMAGE_SIZE = 784; // 28 * 28

export interface MnistTrainAndTestData {
  trainXs: Float32Array; // [trainCount, 28, 28, 1]
  trainYs: Float32Array; // [trainCount, 10]
  testXs: Float32Array;  // [testCount, 28, 28, 1]
  testYs: Float32Array;  // [testCount, 10]
  numTrain: number;
  numTest: number;
}

export async function loadMnistTrainAndTest(
  numTrain: number = 8000,
  numTest: number = 500,
  onProgress?: (stage: 'downloading' | 'preparing', progress: number, message: string) => void
): Promise<MnistTrainAndTestData> {
  const totalExamples = numTrain + numTest; // 8500 total
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

  onProgress?.('downloading', 35, 'Labels loaded. Downloading image sprite...');

  // 2. Load MNIST image sprite
  const img = new Image();
  img.crossOrigin = 'anonymous';

  const imgLoadPromise = new Promise<HTMLImageElement>((resolve, reject) => {
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load MNIST image sprite from remote storage.'));
    img.src = MNIST_IMAGES_SPRITE_PATH;
  });

  await imgLoadPromise;

  onProgress?.('preparing', 60, `Extracting ${numTrain} training + ${numTest} test images...`);

  // 3. Extract pixels into Float32Array in manageable chunks
  const trainPixels = numTrain * IMAGE_SIZE;
  const testPixels = numTest * IMAGE_SIZE;
  const trainXsArray = new Float32Array(trainPixels);
  const testXsArray = new Float32Array(testPixels);

  const chunkSize = 2500;
  const canvas = document.createElement('canvas');
  canvas.width = 784;
  canvas.height = chunkSize;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });

  if (!ctx) {
    throw new Error('Unable to create 2D canvas context for image decoding.');
  }

  for (let start = 0; start < totalExamples; start += chunkSize) {
    const currentChunk = Math.min(chunkSize, totalExamples - start);
    canvas.height = currentChunk;
    ctx.clearRect(0, 0, 784, currentChunk);

    // In mnist_images.png, each row is 784 pixels representing one 28x28 image
    ctx.drawImage(img, 0, start, 784, currentChunk, 0, 0, 784, currentChunk);

    const imgData = ctx.getImageData(0, 0, 784, currentChunk);
    const data = imgData.data;

    const chunkPixels = currentChunk * IMAGE_SIZE;
    for (let p = 0; p < chunkPixels; p++) {
      const globalPixelIdx = start * IMAGE_SIZE + p;
      const normalizedVal = data[p * 4] / 255.0;

      if (globalPixelIdx < trainPixels) {
        trainXsArray[globalPixelIdx] = normalizedVal;
      } else {
        testXsArray[globalPixelIdx - trainPixels] = normalizedVal;
      }
    }

    const pct = Math.round(60 + ((start + currentChunk) / totalExamples) * 35);
    onProgress?.('preparing', pct, `Normalized ${Math.min(start + currentChunk, totalExamples)} / ${totalExamples} images...`);
    // Yield to event loop to keep UI smooth
    await new Promise((resolve) => setTimeout(resolve, 0));
  }

  // 4. Extract labels (each label is 10 bytes one-hot encoded)
  const labelsUint8 = new Uint8Array(labelsBuffer);
  const trainYsArray = new Float32Array(numTrain * NUM_CLASSES);
  const testYsArray = new Float32Array(numTest * NUM_CLASSES);

  for (let i = 0; i < numTrain * NUM_CLASSES; i++) {
    trainYsArray[i] = labelsUint8[i];
  }

  const offset = numTrain * NUM_CLASSES;
  for (let i = 0; i < numTest * NUM_CLASSES; i++) {
    testYsArray[i] = labelsUint8[offset + i];
  }

  onProgress?.('preparing', 100, 'MNIST dataset ready.');

  return {
    trainXs: trainXsArray,
    trainYs: trainYsArray,
    testXs: testXsArray,
    testYs: testYsArray,
    numTrain,
    numTest,
  };
}
