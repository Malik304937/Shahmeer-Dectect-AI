import React, { useState, useEffect, useCallback } from 'react';
import { PenTool, Camera, UploadCloud, Sparkles, AlertCircle, RefreshCw, CheckCircle2 } from 'lucide-react';
import { Header } from './components/Header.tsx';
import { DrawCanvas } from './components/DrawCanvas.tsx';
import { CameraDetector } from './components/CameraDetector.tsx';
import { UploadDetector } from './components/UploadDetector.tsx';
import { PredictionResult } from './components/PredictionResult.tsx';
import { DetectionHistory } from './components/DetectionHistory.tsx';
import { HowItWorks } from './components/HowItWorks.tsx';
import { TrainingModal } from './components/TrainingModal.tsx';
import { ModelInfoModal } from './components/ModelInfoModal.tsx';
import {
  isModelCached,
  loadCachedModel,
  trainAndSaveModel,
  predictDigit,
  resetSavedModel,
  getCachedTestAccuracy,
} from './services/mnistModel.ts';
import { preprocessDigitCanvas } from './utils/imagePreprocessing.ts';
import {
  PredictionResult as PredictionResultType,
  TrainingProgress,
  InputMode,
  OcrWord,
} from './types.ts';

const LOCAL_STORAGE_HISTORY_KEY = 'shahmeer_detect_ai_history_v1';

export default function App() {
  const [inputMode, setInputMode] = useState<InputMode>('draw');
  const [modelStatus, setModelStatus] = useState<'loading' | 'training' | 'ready' | 'error'>('loading');
  const [isCached, setIsCached] = useState<boolean>(false);
  const [modelAccuracy, setModelAccuracy] = useState<number | null>(getCachedTestAccuracy());

  const [trainingProgress, setTrainingProgress] = useState<TrainingProgress>({
    status: 'idle',
    currentEpoch: 0,
    totalEpochs: 3,
    currentBatch: 0,
    totalBatches: 0,
    progressPercent: 0,
    epochAccuracies: [],
    epochLosses: [],
  });

  const [currentResult, setCurrentResult] = useState<PredictionResultType | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [detectionError, setDetectionError] = useState<string | null>(null);
  const [history, setHistory] = useState<PredictionResultType[]>([]);
  const [isModelInfoOpen, setIsModelInfoOpen] = useState<boolean>(false);

  // Load history from localStorage on mount
  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem(LOCAL_STORAGE_HISTORY_KEY);
      if (savedHistory) {
        const parsed = JSON.parse(savedHistory);
        if (Array.isArray(parsed)) {
          setHistory(parsed.slice(0, 5));
          if (parsed.length > 0) {
            setCurrentResult(parsed[0]);
          }
        }
      }
    } catch (e) {
      console.warn('Could not load history:', e);
    }
  }, []);

  // Save history to localStorage
  const updateHistory = (newResult: PredictionResultType) => {
    setHistory((prev) => {
      const updated = [newResult, ...prev.filter((item) => item.timestamp !== newResult.timestamp)].slice(0, 5);
      try {
        localStorage.setItem(LOCAL_STORAGE_HISTORY_KEY, JSON.stringify(updated));
      } catch (e) {
        console.warn('Could not save history to localStorage:', e);
      }
      return updated;
    });
  };

  const handleClearHistory = () => {
    setHistory([]);
    try {
      localStorage.removeItem(LOCAL_STORAGE_HISTORY_KEY);
    } catch (e) {
      console.warn('Could not clear history:', e);
    }
  };

  // Initialize model: check IndexedDB, load or train
  const initModel = useCallback(async (forceRetrain: boolean = false) => {
    try {
      if (!forceRetrain) {
        setModelStatus('loading');
        const cached = await isModelCached();
        if (cached) {
          const loaded = await loadCachedModel();
          if (loaded) {
            setIsCached(true);
            setModelStatus('ready');
            const acc = getCachedTestAccuracy();
            if (acc) setModelAccuracy(acc);
            return;
          }
        }
      }

      // If not cached or forceRetrain is true: Train from scratch
      setModelStatus('training');
      setIsCached(false);
      const { testAccuracy } = await trainAndSaveModel((progress) => {
        setTrainingProgress({ ...progress });
      });

      setIsCached(true);
      setModelStatus('ready');
      setModelAccuracy(testAccuracy);
    } catch (err: any) {
      console.error('Model initialization error:', err);
      setModelStatus('error');
    }
  }, []);

  useEffect(() => {
    initModel();
  }, [initModel]);

  // Execute CNN detection on canvas (from Draw, Camera, or Upload)
  const handleDetect = async (
    canvas: HTMLCanvasElement,
    contrastOverride?: boolean | 'auto'
  ) => {
    setIsProcessing(true);
    setDetectionError(null);

    try {
      // 1. Preprocessing (Crop, 20x20 scale, 28x28 center of mass, normalize)
      const preprocessed = preprocessDigitCanvas(canvas, contrastOverride);

      // 2. Inference via TensorFlow.js CNN
      const prediction = await predictDigit(preprocessed.normalizedPixels);

      const resultItem: PredictionResultType = {
        digit: prediction.digit,
        confidence: prediction.confidence,
        probabilities: prediction.probabilities,
        thumbnailUrl: preprocessed.sourceThumbnailUrl,
        preview28x28Url: preprocessed.preview28x28DataUrl,
        source: inputMode,
        timestamp: Date.now(),
        preprocessingInfo: {
          wasInverted: preprocessed.wasInverted,
          boundingBox: preprocessed.boundingBox,
          centerOfMass: preprocessed.centerOfMass,
        },
      };

      setCurrentResult(resultItem);
      updateHistory(resultItem);
    } catch (err: any) {
      console.warn('Detection failed:', err);
      setDetectionError(err.message || 'Detection failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle OCR detection from Upload
  const handleDetectOcr = (ocrData: {
    text: string;
    confidence: number;
    words: OcrWord[];
    thumbnailUrl: string;
  }) => {
    const resultItem: PredictionResultType = {
      isTextOCR: true,
      text: ocrData.text,
      confidence: ocrData.confidence,
      ocrWords: ocrData.words,
      thumbnailUrl: ocrData.thumbnailUrl,
      source: 'upload',
      timestamp: Date.now(),
    };

    setCurrentResult(resultItem);
    updateHistory(resultItem);
  };

  const handleClearStorage = async () => {
    await resetSavedModel();
    setIsCached(false);
    setModelAccuracy(null);
    await initModel(true);
  };

  const scrollToExplanation = () => {
    const el = document.getElementById('how-it-works');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Navigation */}
      <Header
        modelStatus={modelStatus}
        isCached={isCached}
        modelAccuracy={modelAccuracy}
        onOpenModelInfo={() => setIsModelInfoOpen(true)}
        onScrollToExplanation={scrollToExplanation}
      />

      {/* Main Workspace */}
      <main className="flex-1 mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        {/* Description Banner under header */}
        <div className="mb-8 text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3.5 py-1 text-xs font-semibold text-cyan-300 mb-3.5 shadow-sm">
            <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
            <span>AI-Powered Recognition · Draw · Camera · Upload</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
            <span>Shahmeer </span>
            <span className="bg-gradient-to-r from-cyan-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
              Detect AI
            </span>
          </h2>

          {/* Requested Description under Header */}
          <p className="mt-3.5 text-xs sm:text-sm text-slate-300 leading-relaxed text-balance max-w-2xl mx-auto font-normal">
            Shahmeer Detect AI is an AI-powered app that detects handwritten numbers and printed text using drawing, camera scanning, and image uploads. Designed for smart learning and innovation, it makes AI detection simple, fast, and user-friendly.
          </p>

          {/* Accuracy Proof Badge */}
          {modelAccuracy !== null && (
            <div className="mt-3 inline-flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-950/30 px-3 py-1 text-xs font-mono text-emerald-300">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
              <span>Model accuracy: {modelAccuracy}%</span>
              <span className="text-[10px] text-slate-400 hidden sm:inline">(tested on 500 unseen MNIST digits)</span>
            </div>
          )}
        </div>

        {/* Global Model Error Warning if any */}
        {modelStatus === 'error' && (
          <div className="mb-6 rounded-2xl border border-rose-900/60 bg-rose-950/30 p-4 text-xs text-rose-300 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-rose-400 shrink-0" />
              <span>CNN Model failed to initialize. Check network connection or retry.</span>
            </div>
            <button
              onClick={() => initModel(true)}
              className="flex items-center gap-1.5 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-500 transition-colors cursor-pointer"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Retry</span>
            </button>
          </div>
        )}

        {/* Two-Column Interactive Stage */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Interactive Input Card (Draw, Camera, or Upload) */}
          <div className="lg:col-span-6 flex flex-col rounded-2xl border border-slate-800 bg-slate-900/40 p-5 sm:p-6 backdrop-blur-sm">
            {/* Tab Selector (Draw, Camera, Upload) */}
            <div className="mb-5 flex items-center justify-center">
              <div className="flex items-center gap-1 rounded-xl bg-slate-950/90 p-1 border border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setInputMode('draw');
                    setDetectionError(null);
                  }}
                  className={`flex items-center gap-2 rounded-lg px-4 sm:px-5 py-2 text-xs font-bold transition-all cursor-pointer ${
                    inputMode === 'draw'
                      ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <PenTool className="h-3.5 w-3.5" />
                  <span>Draw</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setInputMode('camera');
                    setDetectionError(null);
                  }}
                  className={`flex items-center gap-2 rounded-lg px-4 sm:px-5 py-2 text-xs font-bold transition-all cursor-pointer ${
                    inputMode === 'camera'
                      ? 'bg-gradient-to-r from-cyan-600 to-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Camera className="h-3.5 w-3.5" />
                  <span>Camera</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setInputMode('upload');
                    setDetectionError(null);
                  }}
                  className={`flex items-center gap-2 rounded-lg px-4 sm:px-5 py-2 text-xs font-bold transition-all cursor-pointer ${
                    inputMode === 'upload'
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <UploadCloud className="h-3.5 w-3.5" />
                  <span>Upload</span>
                </button>
              </div>
            </div>

            {/* Input Viewport (Draw Canvas, Camera, or Upload) */}
            <div className="w-full flex justify-center">
              {inputMode === 'draw' ? (
                <DrawCanvas onDetect={handleDetect} isProcessing={isProcessing} />
              ) : inputMode === 'camera' ? (
                <CameraDetector
                  onDetect={handleDetect}
                  isProcessing={isProcessing}
                  onSwitchToDraw={() => setInputMode('draw')}
                />
              ) : (
                <UploadDetector
                  onDetectDigit={handleDetect}
                  onDetectOcr={handleDetectOcr}
                  isProcessing={isProcessing}
                />
              )}
            </div>
          </div>

          {/* Right Column: Prediction Results Card */}
          <div className="lg:col-span-6 flex flex-col">
            <PredictionResult
              result={currentResult}
              isProcessing={isProcessing}
              errorMessage={detectionError}
            />
          </div>
        </div>

        {/* History Strip */}
        <div className="mt-8">
          <DetectionHistory
            history={history}
            onSelect={(item) => setCurrentResult(item)}
            onClear={handleClearHistory}
            selectedTimestamp={currentResult?.timestamp}
          />
        </div>

        {/* Educational "How it works" Section */}
        <HowItWorks />
      </main>

      {/* Footer */}
      <footer className="mt-16 border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-400">
        <div className="mx-auto max-w-6xl px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="font-medium text-slate-300">Shahmeer Detect AI</span>
          <span className="font-semibold text-slate-200">Created by Muhammad Shahmeer Malik</span>
        </div>
      </footer>

      {/* Live Training Progress Modal (shows during initial train or retrain) */}
      <TrainingModal
        progress={trainingProgress}
        onRetry={() => initModel(true)}
        onClose={() => setTrainingProgress((prev) => ({ ...prev, status: 'idle' }))}
      />

      {/* Model Architecture & IndexedDB Inspector Modal */}
      <ModelInfoModal
        isOpen={isModelInfoOpen}
        onClose={() => setIsModelInfoOpen(false)}
        isCached={isCached}
        onRetrain={() => initModel(true)}
        onClearStorage={handleClearStorage}
      />
    </div>
  );
}
