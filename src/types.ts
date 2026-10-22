export type DetectionCategory = 'numbers' | 'letters';

export interface OcrWord {
  text: string;
  confidence: number;
  bbox?: { x0: number; y0: number; x1: number; y1: number };
}

export interface SingleDigitDetection {
  digit: number;
  confidence: number;
  probabilities: number[];
  preview28x28Url: string;
  boundingBox: { x: number; y: number; width: number; height: number };
}

export interface PredictionResult {
  category: DetectionCategory; // 'numbers' | 'letters'
  // For numbers mode (1, 2, or 3 digits like 7, 42, 305):
  numberString?: string;
  digits?: SingleDigitDetection[];
  digit?: number;
  probabilities?: number[];
  preview28x28Url?: string;
  // For letters mode (A-Z / words like ABC):
  text?: string;
  isTextOCR?: boolean;
  ocrWords?: OcrWord[];
  // Common:
  confidence: number; // 0 - 100
  thumbnailUrl: string;
  source: 'draw' | 'camera' | 'upload';
  timestamp: number;
  preprocessingInfo?: {
    wasInverted: boolean;
    segmentCount?: number;
    boundingBox?: { x: number; y: number; width: number; height: number };
    centerOfMass?: { x: number; y: number };
  };
}

export interface TrainingProgress {
  status: 'idle' | 'downloading' | 'preparing' | 'training' | 'testing' | 'saving' | 'ready' | 'error';
  currentEpoch: number;
  totalEpochs: number;
  currentBatch: number;
  totalBatches: number;
  progressPercent: number;
  currentLoss?: number;
  currentAccuracy?: number;
  epochAccuracies: number[];
  epochLosses: number[];
  testAccuracy?: number; // accuracy on 500 unseen images
  errorMessage?: string;
  loadedFromCache?: boolean;
}

export type InputMode = 'draw' | 'camera' | 'upload';
