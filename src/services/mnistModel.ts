import * as tf from '@tensorflow/tfjs';
import { loadMnistTrainAndTest, NUM_CLASSES } from './mnistData.ts';
import { TrainingProgress } from '../types.ts';

export const MODEL_STORAGE_KEY = 'indexeddb://number-detector-mnist-model';
export const NUM_TRAIN_SAMPLES = 8000;
export const NUM_TEST_SAMPLES = 500;
export const NUM_EPOCHS = 3;
export const BATCH_SIZE = 64;

let activeModel: tf.LayersModel | null = null;
let cachedTestAccuracy: number | null = null;

/**
 * Creates the lightweight CNN architecture requested:
 * Conv2D(8 filters, 3x3, relu) -> MaxPool -> Conv2D(16 filters, 3x3, relu) -> MaxPool -> Flatten -> Dense(32, relu) -> Dense(10, softmax)
 * Compiled with Adam(0.003).
 */
export function createCNNModel(): tf.LayersModel {
  const model = tf.sequential();

  // Layer 1: Conv2D(8 filters, 3x3, relu)
  model.add(
    tf.layers.conv2d({
      inputShape: [28, 28, 1],
      kernelSize: 3,
      filters: 8,
      activation: 'relu',
      kernelInitializer: 'varianceScaling',
    })
  );

  // Layer 2: MaxPool
  model.add(tf.layers.maxPooling2d({ poolSize: [2, 2] }));

  // Layer 3: Conv2D(16 filters, 3x3, relu)
  model.add(
    tf.layers.conv2d({
      kernelSize: 3,
      filters: 16,
      activation: 'relu',
      kernelInitializer: 'varianceScaling',
    })
  );

  // Layer 4: MaxPool
  model.add(tf.layers.maxPooling2d({ poolSize: [2, 2] }));

  // Layer 5: Flatten
  model.add(tf.layers.flatten());

  // Layer 6: Dense(32, relu)
  model.add(tf.layers.dense({ units: 32, activation: 'relu' }));

  // Layer 7: Dense(10, softmax)
  model.add(
    tf.layers.dense({
      units: 10,
      activation: 'softmax',
      kernelInitializer: 'varianceScaling',
    })
  );

  // Compiled with Adam optimizer learning rate 0.003
  model.compile({
    optimizer: tf.train.adam(0.003),
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
    // Ensure WebGL backend is used
    try {
      await tf.setBackend('webgl');
    } catch (e) {
      console.warn('Could not set webgl backend:', e);
    }
    await tf.ready();

    const cached = await isModelCached();
    if (!cached) return null;

    const model = await tf.loadLayersModel(MODEL_STORAGE_KEY);
    // Warm up the model with a dummy tensor to compile WebGL shaders
    tf.tidy(() => {
      const dummy = tf.zeros([1, 28, 28, 1]);
      model.predict(dummy);
    });

    activeModel = model;

    // Check if test accuracy was stored
    const savedAcc = localStorage.getItem('shahmeer_model_accuracy');
    if (savedAcc) {
      cachedTestAccuracy = parseFloat(savedAcc);
    }

    return model;
  } catch (error) {
    console.warn('Failed to load model from IndexedDB:', error);
    return null;
  }
}

/**
 * Trains the CNN on 8,000 MNIST images for 3 epochs with batch size 64,
 * updates progress every 10 batches and per epoch, tests on 500 unseen images,
 * and saves to IndexedDB.
 */
export async function trainAndSaveModel(
  onProgress: (progress: TrainingProgress) => void
): Promise<{ model: tf.LayersModel; testAccuracy: number }> {
  // 4. Await tf.ready() and make sure WebGL backend is used
  try {
    await tf.setBackend('webgl');
  } catch (e) {
    console.warn('WebGL backend unavailable, defaulting to:', tf.getBackend());
  }
  await tf.ready();

  const totalBatches = Math.ceil(NUM_TRAIN_SAMPLES / BATCH_SIZE);

  const progressState: TrainingProgress = {
    status: 'downloading',
    currentEpoch: 0,
    totalEpochs: NUM_EPOCHS,
    currentBatch: 0,
    totalBatches,
    progressPercent: 0,
    epochAccuracies: [],
    epochLosses: [],
  };

  onProgress({ ...progressState });

  // 1. Fetch 8,000 training + 500 test images
  let data;
  try {
    data = await loadMnistTrainAndTest(NUM_TRAIN_SAMPLES, NUM_TEST_SAMPLES, (stage, pct, msg) => {
      onProgress({
        ...progressState,
        status: stage,
        progressPercent: Math.round(pct * 0.35), // First 35% is download & slice
      });
    });
  } catch (err: any) {
    onProgress({
      ...progressState,
      status: 'error',
      errorMessage: err.message || 'Failed to download MNIST data.',
    });
    throw err;
  }

  // 2. Prepare Tensors
  progressState.status = 'training';
  progressState.progressPercent = 35;
  onProgress({ ...progressState });

  const trainXs = tf.tensor4d(data.trainXs, [data.numTrain, 28, 28, 1]);
  const trainYs = tf.tensor2d(data.trainYs, [data.numTrain, NUM_CLASSES]);
  const testXs = tf.tensor4d(data.testXs, [data.numTest, 28, 28, 1]);
  const testYs = tf.tensor2d(data.testYs, [data.numTest, NUM_CLASSES]);

  const model = createCNNModel();

  // 3. Train the model
  try {
    await model.fit(trainXs, trainYs, {
      batchSize: BATCH_SIZE,
      epochs: NUM_EPOCHS,
      shuffle: true,
      callbacks: {
        onEpochBegin: async (epoch) => {
          progressState.currentEpoch = epoch + 1;
          onProgress({ ...progressState });
          await tf.nextFrame();
        },
        // 5. Update progress UI only every 10 batches and at end of each epoch
        onBatchEnd: async (batch, logs) => {
          const isEvery10 = (batch + 1) % 10 === 0;
          const isLast = batch + 1 === totalBatches;

          if (isEvery10 || isLast) {
            progressState.currentBatch = batch + 1;
            if (logs?.loss !== undefined) progressState.currentLoss = logs.loss;

            // Training progress spans 35% to 85%
            const epochBase = 35 + ((progressState.currentEpoch - 1) / NUM_EPOCHS) * 50;
            const batchAdd = ((batch + 1) / totalBatches) * (50 / NUM_EPOCHS);
            progressState.progressPercent = Math.min(85, Math.round(epochBase + batchAdd));

            onProgress({ ...progressState });
            await tf.nextFrame();
          }
        },
        // 7. Show real epoch accuracy (not just the last-batch value)
        onEpochEnd: async (epoch, logs) => {
          if (logs?.acc !== undefined) {
            const realEpochAcc = Number((logs.acc * 100).toFixed(1));
            progressState.epochAccuracies.push(realEpochAcc);
            progressState.currentAccuracy = logs.acc;
          }
          if (logs?.loss !== undefined) {
            progressState.epochLosses.push(Number(logs.loss.toFixed(4)));
          }
          onProgress({ ...progressState });
          await tf.nextFrame();
        },
      },
    });

    // 9. Run a quick test on 500 unseen MNIST images and measure accuracy
    progressState.status = 'testing';
    progressState.progressPercent = 88;
    onProgress({ ...progressState });
    await tf.nextFrame();

    const evalResult = model.evaluate(testXs, testYs, { batchSize: 64 }) as tf.Scalar[];
    const testLoss = (await evalResult[0].data())[0];
    const testAcc = (await evalResult[1].data())[0];

    // Dispose evaluation tensors
    evalResult[0].dispose();
    evalResult[1].dispose();

    const finalTestAccuracy = Number((testAcc * 100).toFixed(1));
    progressState.testAccuracy = finalTestAccuracy;
    cachedTestAccuracy = finalTestAccuracy;
    try {
      localStorage.setItem('shahmeer_model_accuracy', String(finalTestAccuracy));
    } catch (e) {
      console.warn('Could not save accuracy to localStorage:', e);
    }

    // 8. Save trained model to IndexedDB so training never runs again on same device
    progressState.status = 'saving';
    progressState.progressPercent = 96;
    onProgress({ ...progressState });

    try {
      await model.save(MODEL_STORAGE_KEY);
    } catch (saveErr) {
      console.warn('Could not save model to IndexedDB:', saveErr);
    }

    progressState.status = 'ready';
    progressState.progressPercent = 100;
    onProgress({ ...progressState });

    activeModel = model;
    return { model, testAccuracy: finalTestAccuracy };
  } finally {
    // 6. Dispose of unused tensors with tf.tidy() and tensor.dispose()
    trainXs.dispose();
    trainYs.dispose();
    testXs.dispose();
    testYs.dispose();
  }
}

/**
 * Predict a single 28x28 grayscale image using tf.tidy to avoid leaks.
 */
export async function predictDigit(normalizedPixels: Float32Array): Promise<{
  digit: number;
  confidence: number;
  probabilities: number[];
}> {
  if (!activeModel) {
    activeModel = await loadCachedModel();
    if (!activeModel) {
      throw new Error('No trained neural network model is loaded in memory.');
    }
  }

  // 6. Dispose of unused tensors with tf.tidy()
  const result = tf.tidy(() => {
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

  return result;
}

/**
 * Deletes the saved model from IndexedDB
 */
export async function resetSavedModel(): Promise<void> {
  try {
    await tf.io.removeModel(MODEL_STORAGE_KEY);
    activeModel = null;
    cachedTestAccuracy = null;
    localStorage.removeItem('shahmeer_model_accuracy');
  } catch (e) {
    console.warn('Failed to remove model from IndexedDB:', e);
  }
}

export function getActiveModel(): tf.LayersModel | null {
  return activeModel;
}

export function getCachedTestAccuracy(): number | null {
  return cachedTestAccuracy;
}
