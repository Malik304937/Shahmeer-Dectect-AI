import React, { useState } from 'react';
import { PredictionResult as PredictionResultType } from '../types.ts';
import {
  CheckCircle2,
  AlertCircle,
  BarChart3,
  Binary,
  Sparkles,
  Copy,
  Check,
  Type,
  Hash,
} from 'lucide-react';

interface PredictionResultProps {
  result: PredictionResultType | null;
  isProcessing: boolean;
  errorMessage?: string | null;
}

export const PredictionResult: React.FC<PredictionResultProps> = ({
  result,
  isProcessing,
  errorMessage,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // If processing
  if (isProcessing) {
    return (
      <div className="flex h-full min-h-[380px] flex-col items-center justify-center rounded-2xl border border-slate-800 bg-slate-900/40 p-8 text-center backdrop-blur-sm">
        <div className="relative flex h-16 w-16 items-center justify-center mb-4">
          <div className="absolute inset-0 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin" />
          <Binary className="h-6 w-6 text-indigo-400 animate-pulse" />
        </div>
        <h3 className="text-base font-bold text-white">Running Forward Pass...</h3>
        <p className="text-xs text-slate-400 mt-1 max-w-xs">
          Preprocessing image, normalizing tensors, and evaluating through neural layers.
        </p>
      </div>
    );
  }

  // If error during preprocessing or prediction
  if (errorMessage) {
    return (
      <div className="flex h-full min-h-[380px] flex-col items-center justify-center rounded-2xl border border-rose-900/40 bg-rose-950/20 p-8 text-center backdrop-blur-sm">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
          <AlertCircle className="h-6 w-6" />
        </div>
        <h3 className="text-base font-bold text-white">Detection Issue</h3>
        <p className="text-xs text-rose-300 mt-1 max-w-xs">{errorMessage}</p>
        <p className="text-[11px] text-slate-400 mt-3">
          Tip: Draw a bold digit or bring the paper closer inside the camera guide box.
        </p>
      </div>
    );
  }

  // Empty state before first detection
  if (!result) {
    return (
      <div className="flex h-full min-h-[380px] flex-col items-center justify-center rounded-2xl border border-slate-800/80 bg-slate-900/30 p-8 text-center backdrop-blur-sm">
        <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-800/60 border border-slate-700 text-slate-400">
          <BarChart3 className="h-7 w-7 text-indigo-400" />
        </div>
        <h3 className="text-base font-bold text-white">Awaiting Input</h3>
        <p className="text-xs text-slate-400 mt-1.5 max-w-xs leading-relaxed">
          Draw a digit, scan with your camera, or upload an image to see instant neural network & OCR detections.
        </p>
        <div className="mt-5 flex items-center gap-1.5 text-[11px] text-slate-400">
          <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
          <span>TensorFlow.js CNN + Tesseract.js OCR</span>
        </div>
      </div>
    );
  }

  const confidenceLevel =
    result.confidence >= 80 ? 'high' : result.confidence >= 50 ? 'medium' : 'low';

  const badgeColor =
    confidenceLevel === 'high'
      ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
      : confidenceLevel === 'medium'
      ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
      : 'bg-rose-500/15 text-rose-400 border-rose-500/30';

  // OCR Text Mode View
  if (result.isTextOCR) {
    return (
      <div className="flex flex-col gap-5 rounded-2xl border border-slate-800 bg-slate-900/60 p-5 sm:p-6 backdrop-blur-md">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-cyan-300 flex items-center gap-1.5">
                <Type className="h-3.5 w-3.5" />
                <span>Printed Text & Numbers Detected</span>
              </span>
              <span className="text-[11px] text-slate-400">· Tesseract.js OCR</span>
            </div>
            <div className="mt-1.5 flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-xs font-bold font-mono ${badgeColor}`}
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>{result.confidence}% Confidence</span>
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {result.text ? `${result.text.length} chars` : '0 chars'}
              </span>
            </div>
          </div>

          {/* Original Thumbnail */}
          <div className="h-12 w-12 overflow-hidden rounded-lg border border-slate-700 bg-black shrink-0">
            <img
              src={result.thumbnailUrl}
              alt="Source"
              className="h-full w-full object-contain"
            />
          </div>
        </div>

        {/* Extracted Text Content Box */}
        <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400">Extracted Text Output:</span>
            {result.text && (
              <button
                onClick={() => handleCopyText(result.text || '')}
                className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copied ? 'Copied' : 'Copy Text'}</span>
              </button>
            )}
          </div>
          <div className="max-h-48 overflow-y-auto whitespace-pre-wrap font-mono text-sm leading-relaxed text-white select-all">
            {result.text || <span className="italic text-slate-500">No clear printed text detected.</span>}
          </div>
        </div>

        {/* Detected Word & Number tokens */}
        {result.ocrWords && result.ocrWords.length > 0 && (
          <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-3.5">
            <span className="text-[11px] font-semibold text-slate-400 block mb-2">
              Recognized Words & Numerical Tokens ({result.ocrWords.length}):
            </span>
            <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto">
              {result.ocrWords.map((word, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 rounded-md border border-slate-800 bg-slate-900/80 px-2 py-0.5 text-xs font-mono text-slate-200"
                  title={`Confidence: ${word.confidence}%`}
                >
                  <span>{word.text}</span>
                  <span className="text-[10px] text-cyan-400">{word.confidence}%</span>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Standard CNN Digit Mode View
  return (
    <div className="flex flex-col gap-5 rounded-2xl border border-slate-800 bg-slate-900/60 p-5 sm:p-6 backdrop-blur-md">
      {/* Top Section: Large Digit + Confidence Badge */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-5">
        <div className="flex items-center gap-4">
          {/* Hero Detected Digit Display */}
          <div className="relative flex h-24 w-24 sm:h-28 sm:w-28 items-center justify-center rounded-2xl border-2 border-indigo-500/30 bg-gradient-to-br from-indigo-950/60 via-slate-900 to-slate-950 shadow-xl shadow-indigo-500/10">
            <span className="font-mono text-6xl sm:text-7xl font-black tracking-tight text-white drop-shadow-[0_0_16px_rgba(99,102,241,0.6)]">
              {result.digit}
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-400">Detected Digit</span>
              <span className="text-[11px] text-slate-400">
                · {result.source === 'draw' ? 'Draw Mode' : result.source === 'camera' ? 'Camera Scan' : 'Image Upload'}
              </span>
            </div>
            <div className="mt-1.5 flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-xs font-bold font-mono ${badgeColor}`}
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>{result.confidence}% Confidence</span>
              </span>
            </div>
            <p className="mt-1 text-[11px] text-slate-400">
              {confidenceLevel === 'high'
                ? 'High network certainty'
                : confidenceLevel === 'medium'
                ? 'Moderate network certainty'
                : 'Ambiguous or faint stroke'}
            </p>
          </div>
        </div>

        {/* Small Original vs Preprocessed Thumbnail */}
        <div className="hidden sm:flex flex-col items-end gap-1 text-right">
          <span className="text-[11px] font-medium text-slate-400">Input Sample</span>
          <div className="h-12 w-12 overflow-hidden rounded-lg border border-slate-700 bg-black">
            <img
              src={result.thumbnailUrl}
              alt="Source digit"
              className="h-full w-full object-contain"
            />
          </div>
        </div>
      </div>

      {/* Center Section: All Digits 0–9 Probability Distribution Bar Chart */}
      {result.probabilities && (
        <div>
          <div className="mb-2 flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-300">Softmax Probabilities (0–9)</span>
            <span className="text-[11px] text-slate-400">Class Likelihood</span>
          </div>

          <div className="space-y-1.5">
            {result.probabilities.map((prob, digit) => {
              const isWinner = digit === result.digit;
              return (
                <div
                  key={digit}
                  className={`group flex items-center gap-2.5 rounded-lg px-2.5 py-1 transition-colors ${
                    isWinner ? 'bg-indigo-950/40 border border-indigo-500/30' : 'hover:bg-slate-800/40'
                  }`}
                >
                  {/* Digit Label */}
                  <span
                    className={`w-4 font-mono text-xs font-bold text-center ${
                      isWinner ? 'text-indigo-300 scale-110' : 'text-slate-400'
                    }`}
                  >
                    {digit}
                  </span>

                  {/* Progress Track */}
                  <div className="relative h-2.5 flex-1 overflow-hidden rounded-full bg-slate-800/80">
                    <div
                      className={`h-full transition-all duration-500 ease-out rounded-full ${
                        isWinner
                          ? 'bg-gradient-to-r from-indigo-500 via-cyan-400 to-emerald-400 shadow-sm'
                          : 'bg-slate-700/60'
                      }`}
                      style={{ width: `${Math.max(1, prob)}%` }}
                    />
                  </div>

                  {/* Exact Numeric Value */}
                  <span
                    className={`w-12 text-right font-mono text-xs tabular-nums ${
                      isWinner ? 'font-bold text-white' : 'text-slate-400'
                    }`}
                  >
                    {prob.toFixed(1)}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Science Fair Insight: MNIST Preprocessed 28x28 Tensor Inspection */}
      {result.preview28x28Url && result.preprocessingInfo && (
        <div className="rounded-xl border border-slate-800/90 bg-slate-950/60 p-3.5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-300">
              Pipeline: 28×28 Tensor Inspection
            </span>
            <span className="text-[10px] text-slate-400 font-mono">Input Layer Shape: [1, 28, 28, 1]</span>
          </div>

          <div className="flex items-center gap-4">
            {/* Pixelated 28x28 Canvas Preview */}
            <div className="relative shrink-0 overflow-hidden rounded-lg border-2 border-indigo-500/40 bg-black p-0.5">
              <img
                src={result.preview28x28Url}
                alt="28x28 Preprocessed Tensor"
                style={{ imageRendering: 'pixelated' }}
                className="h-16 w-16 sm:h-20 sm:w-20 block object-contain"
              />
            </div>

            {/* Preprocessing details */}
            <div className="space-y-1 text-xs text-slate-400 flex-1">
              <div className="flex items-center justify-between border-b border-slate-800/60 pb-1">
                <span>Contrast Inversion:</span>
                <span className="font-mono text-slate-300">
                  {result.preprocessingInfo.wasInverted ? 'Dark-on-light (Inverted)' : 'Light-on-dark (Preserved)'}
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-800/60 pb-1">
                <span>Bounding Box:</span>
                <span className="font-mono text-slate-300">
                  {result.preprocessingInfo.boundingBox.width}×{result.preprocessingInfo.boundingBox.height}px → 20×20px
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Center of Mass:</span>
                <span className="font-mono text-slate-300">
                  ({result.preprocessingInfo.centerOfMass.x}, {result.preprocessingInfo.centerOfMass.y})
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
