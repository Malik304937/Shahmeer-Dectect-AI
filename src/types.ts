export interface OcrWord {
  text: string;
  confidence: number;
  bbox?: { x0: number; y0: number; x1: number; y1: number };
}

export interface PredictionResult {
  digit?: number;
  text?: string;
  isTextOCR?: boolean;
  ocrWords?: OcrWord[];
  confidence: number; // 0 - 100
  probabilities?: number[]; // 10 values, 0 - 100
  thumbnailUrl: string;
  preview28x28Url?: string;
  source: 'draw' | 'camera' | 'upload';
  timestamp: number;
  preprocessingInfo?: {
    wasInverted: boolean;
    boundingBox: { x: number; y: number; width: number; height: number };
    centerOfMass: { x: number; y: number };
  };
}

export interface TrainingProgress {
  status: 'idle' | 'downloading' | 'preparing' | 'training' | 'saving' | 'ready' | 'error';
  currentEpoch: number;
  totalEpochs: number;
  currentBatch: number;
  totalBatches: number;
  progressPercent: number;
  currentLoss?: number;
  currentAccuracy?: number;
  epochAccuracies: number[];
  epochLosses: number[];
  errorMessage?: string;
  loadedFromCache?: boolean;
}

export type InputMode = 'draw' | 'camera' | 'upload';
