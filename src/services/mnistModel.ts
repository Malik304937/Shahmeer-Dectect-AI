import * as tf from '@tensorflow/tfjs';
import { loadMnistSubset, NUM_CLASSES } from './mnistData.ts';
import { TrainingProgress } from '../types.ts';

export const MODEL_STORAGE_KEY = 'indexeddb://number-detector-mnist-model';
export const NUM_TRAIN_SAMPLES = 12000;
export const NUM_EPOCHS = 4;
export const BATCH_SIZE = 128;

let activeModel: tf.LayersModel | null = null;

/**
 * Creates the small CNN architecture optimized for MNIST digit classification.
 */
export function createCNNModel(): tf.LayersModel {
  const model = tf.sequential();

  // Layer 1: Convolutional feature detector for edges & arcs
  model.add(
    tf.layers.conv2d({
      inputShape: [28, 28, 1],
      kernelSize: 3,
      filters: 16,
      activation: 'relu',
      kernelInitializer: 'varianceScaling',
    })
  );

  // Layer 2: Spatial pooling
  model.add(tf.layers.maxPooling2d({ poolSize: [2, 2] }));

  // Layer 3: Higher-order feature detector for loops & junctions
  model.add(
    tf.layers.conv2d({
      kernelSize: 3,
      filters: 32,
      activation: 'relu',
      kernelInitializer: 'varianceScaling',
    })
  );

  // Layer 4: Spatial pooling
  model.add(tf.layers.maxPooling2d({ poolSize: [2, 2] }));

  // Layer 5: Flatten and Dense representation
  model.add(tf.layers.flatten());
  model.add(tf.layers.dense({ units: 64, activation: 'relu' }));
  model.add(tf.layers.dropout({ rate: 0.25 }));

  // Output Layer: 10 probabilities summing to 1.0
  model.add(
    tf.layers.dense({
      units: 10,
      activation: 'softmax',
      kernelInitializer: 'varianceScaling',
    })
  );

  model.compile({
    optimizer: tf.train.adam(0.001),
    loss: 'categoricalCrossentropy',
    metrics: ['accuracy'],
  });

  return model;
}

/**
 * Check if the trained model exists in IndexedDB
 */
export async function isModelCached(): Promise<boolean> {
  try {
    const models = await tf.io.listModels();
    return Boolean(models[MODEL_STORAGE_KEY]);
  } catch (e) {
    console.warn('Error querying IndexedDB models:', e);
    return false;
  }
}

/**
 * Load the model from IndexedDB
 */
export async function loadCachedModel(): Promise<tf.LayersModel | null> {
  try {
    const cached = await isModelCached();
    if (!cached) return null;

    const model = await tf.loadLayersModel(MODEL_STORAGE_KEY);
    // Warm up the model with a dummy tensor to compile WebGL shaders
    tf.tidy(() => {
      const dummy = tf.zeros([1, 28, 28, 1]);
      model.predict(dummy);
    });

    activeModel = model;
    return model;
  } catch (error) {
    console.warn('Failed to load model from IndexedDB:', error);
    return null;
  }
}

/**
 * Trains the CNN on 12,000 MNIST images for 4 epochs in the browser
 * and saves to IndexedDB on completion.
 */
export async function trainAndSaveModel(
  onProgress: (progress: TrainingProgress) => void
): Promise<tf.LayersModel> {
  // Ensure WebGL backend is initialized
  await tf.ready();

  const progressState: TrainingProgress = {
    status: 'downloading',
    currentEpoch: 0,
    totalEpochs: NUM_EPOCHS,
    currentBatch: 0,
    totalBatches: Math.ceil(NUM_TRAIN_SAMPLES / BATCH_SIZE),
    progressPercent: 0,
    epochAccuracies: [],
    epochLosses: [],
  };

  onProgress({ ...progressState });

  // 1. Fetch data
  let dataset;
  try {
    dataset = await loadMnistSubset(NUM_TRAIN_SAMPLES, (stage, pct, msg) => {
      onProgress({
        ...progressState,
        status: stage,
        progressPercent: Math.round(pct * 0.4), // First 40% is download & preparation
      });
    });
  } catch (err: any) {
    onProgress({
      ...progressState,
      status: 'error',
      errorMessage: err.message || 'Failed to download MNIST training data.',
    });
    throw err;
  }

  // 2. Prepare Tensors
  progressState.status = 'training';
  progressState.progressPercent = 40;
  onProgress({ ...progressState });

  const xs = tf.tensor4d(dataset.xs, [dataset.numExamples, 28, 28, 1]);
  const ys = tf.tensor2d(dataset.ys, [dataset.numExamples, NUM_CLASSES]);

  const model = createCNNModel();
  const totalBatches = Math.ceil(dataset.numExamples / BATCH_SIZE);

  // 3. Train the model
  try {
    await model.fit(xs, ys, {
      batchSize: BATCH_SIZE,
      epochs: NUM_EPOCHS,
      shuffle: true,
      callbacks: {
        onEpochBegin: async (epoch) => {
          progressState.currentEpoch = epoch + 1;
          onProgress({ ...progressState });
          await tf.nextFrame();
        },
        onBatchEnd: async (batch, logs) => {
          progressState.currentBatch = batch + 1;
          progressState.totalBatches = totalBatches;
          progressState.currentLoss = logs?.loss ?? 0;
          progressState.currentAccuracy = logs?.acc ?? 0;

          // Training spans 40% to 95% of total progress
          const epochBase = 40 + ((progressState.currentEpoch - 1) / NUM_EPOCHS) * 55;
          const batchAdd = ((batch + 1) / totalBatches) * (55 / NUM_EPOCHS);
          progressState.progressPercent = Math.min(95, Math.round(epochBase + batchAdd));

          onProgress({ ...progressState });
          await tf.nextFrame();
        },
        onEpochEnd: async (epoch, logs) => {
          if (logs?.acc !== undefined) {
            progressState.epochAccuracies.push(Number((logs.acc * 100).toFixed(1)));
          }
          if (logs?.loss !== undefined) {
            progressState.epochLosses.push(Number(logs.loss.toFixed(4)));
          }
          onProgress({ ...progressState });
          await tf.nextFrame();
        },
      },
    });
  } finally {
    // Dispose training tensors to free memory
    xs.dispose();
    ys.dispose();
  }

  // 4. Save to IndexedDB
  progressState.status = 'saving';
  progressState.progressPercent = 98;
  onProgress({ ...progressState });

  try {
    await model.save(MODEL_STORAGE_KEY);
  } catch (saveErr) {
    console.warn('Could not save model to IndexedDB, will keep in memory:', saveErr);
  }

  progressState.status = 'ready';
  progressState.progressPercent = 100;
  onProgress({ ...progressState });

  activeModel = model;
  return model;
}

/**
 * Predict a single 28x28 grayscale image.
 * Expected input: Float32Array of 784 normalized values in [0, 1].
 */
export async function predictDigit(normalizedPixels: Float32Array): Promise<{
  digit: number;
  confidence: number;
  probabilities: number[];
}> {
  if (!activeModel) {
    // Attempt to load from storage
    activeModel = await loadCachedModel();
    if (!activeModel) {
      throw new Error('No trained neural network model is loaded in memory.');
    }
  }

  const { digit, confidence, probabilities } = tf.tidy(() => {
    const inputTensor = tf.tensor4d(normalizedPixels, [1, 28, 28, 1]);
    const outputTensor = activeModel!.predict(inputTensor) as tf.Tensor;
    const probs = outputTensor.dataSync();

    let maxIndex = 0;
    let maxProb = probs[0];
    const probsArray: number[] = [];

    for (let i = 0; i < 10; i++) {
      const p = probs[i] || 0;
      probsArray.push(Number((p * 100).toFixed(2)));
      if (p > maxProb) {
        maxProb = p;
        maxIndex = i;
      }
    }

    return {
      digit: maxIndex,
      confidence: Number((maxProb * 100).toFixed(1)),
      probabilities: probsArray,
    };
  });

  return { digit, confidence, probabilities };
}

/**
 * Deletes the saved model from IndexedDB
 */
export async function resetSavedModel(): Promise<void> {
  try {
    await tf.io.removeModel(MODEL_STORAGE_KEY);
    activeModel = null;
  } catch (e) {
    console.warn('Failed to remove model from IndexedDB:', e);
  }
}

export function getActiveModel(): tf.LayersModel | null {
  return activeModel;
}
