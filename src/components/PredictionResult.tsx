import React, { useState } from 'react';
import { PredictionResult as PredictionResultType } from '../types.ts';
import {
  CheckCircle2,
  AlertCircle,
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
  const [selectedDigitIdx, setSelectedDigitIdx] = useState<number>(0);

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
          <div className="absolute inset-0 rounded-full border-4 border-cyan-500/20 border-t-cyan-500 animate-spin" />
          <Binary className="h-6 w-6 text-cyan-400 animate-pulse" />
        </div>
        <h3 className="text-base font-bold text-white">Segmenting & Running Neural Inference...</h3>
        <p className="text-xs text-slate-400 mt-1 max-w-xs">
          Detecting column gaps, isolating characters, and classifying with browser AI.
        </p>
      </div>
    );
  }

  // If error during preprocessing or prediction (Requirement 5)
  if (errorMessage) {
    return (
      <div className="flex h-full min-h-[380px] flex-col items-center justify-center rounded-2xl border border-rose-900/40 bg-rose-950/20 p-8 text-center backdrop-blur-sm">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
          <AlertCircle className="h-6 w-6" />
        </div>
        <h3 className="text-base font-bold text-white">Detection Notice</h3>
        <p className="text-sm font-semibold text-rose-300 mt-1 max-w-xs">
          {errorMessage === 'No digit detected! Please draw or place a clear digit inside the guide area.'
            ? 'I could not see anything, please try again'
            : errorMessage}
        </p>
        <p className="text-xs text-slate-400 mt-2">
          Make sure to write bold strokes with clear gaps between characters.
        </p>
      </div>
    );
  }

  // Empty state before first detection
  if (!result) {
    return (
      <div className="flex h-full min-h-[380px] flex-col items-center justify-center rounded-2xl border border-slate-800/80 bg-slate-900/30 p-8 text-center backdrop-blur-sm">
        <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-800/60 border border-slate-700 text-slate-400">
          <Hash className="h-7 w-7 text-cyan-400" />
        </div>
        <h3 className="text-base font-bold text-white">Awaiting Input</h3>
        <p className="text-xs text-slate-400 mt-1.5 max-w-xs leading-relaxed">
          Draw numbers (1–3 digits like 7, 42, 305) or letters (like A, B, ABC) to see instant AI detection.
        </p>
        <div className="mt-5 flex items-center gap-1.5 text-[11px] text-slate-400">
          <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
          <span>Column Gap Segmentation + CNN + Tesseract OCR</span>
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

  // LETTERS Mode Output View
  if (result.category === 'letters' || result.isTextOCR) {
    const textToShow = result.text || '';
    return (
      <div className="flex flex-col gap-5 rounded-2xl border border-slate-800 bg-slate-900/60 p-5 sm:p-6 backdrop-blur-md">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-cyan-300 flex items-center gap-1.5">
                <Type className="h-3.5 w-3.5" />
                <span>Detected Letters</span>
              </span>
              <span className="text-[11px] text-slate-400">· Tesseract OCR (A-Z)</span>
            </div>
            <div className="mt-1.5 flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-xs font-bold font-mono ${badgeColor}`}
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>{result.confidence}% Confidence</span>
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {textToShow.length} {textToShow.length === 1 ? 'letter' : 'letters'}
              </span>
            </div>
          </div>

          {/* Original Thumbnail */}
          <div className="h-12 w-20 overflow-hidden rounded-lg border border-slate-700 bg-black shrink-0">
            <img
              src={result.thumbnailUrl}
              alt="Source"
              className="h-full w-full object-contain"
            />
          </div>
        </div>

        {/* Large Text Display (Requirement 3) */}
        <div className="flex flex-col items-center justify-center rounded-2xl border border-cyan-500/25 bg-gradient-to-br from-cyan-950/40 via-slate-900 to-purple-950/40 p-6 shadow-xl">
          <span className="font-mono text-5xl sm:text-7xl font-black tracking-widest text-white drop-shadow-[0_0_20px_rgba(34,211,238,0.5)]">
            {textToShow || '—'}
          </span>
          <span className="text-xs text-cyan-300/80 mt-2 font-medium">
            Alphabet Recognition (A–Z)
          </span>
        </div>

        {/* Extracted Details Box */}
        <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400">Output Text:</span>
            {textToShow && (
              <button
                onClick={() => handleCopyText(textToShow)}
                className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            )}
          </div>
          <div className="font-mono text-lg font-bold text-white tracking-wide">
            {textToShow || <span className="italic text-slate-500">I could not see anything, please try again</span>}
          </div>
        </div>
      </div>
    );
  }

  // NUMBERS Mode Output View (1, 2, or 3 digits like 7, 42, 305)
  const fullNumberStr =
    result.numberString ||
    (result.digits ? result.digits.map((d) => d.digit).join('') : String(result.digit ?? ''));

  const digitsList = result.digits && result.digits.length > 0
    ? result.digits
    : result.digit !== undefined
    ? [
        {
          digit: result.digit,
          confidence: result.confidence,
          probabilities: result.probabilities || [],
          preview28x28Url: result.preview28x28Url || '',
          boundingBox: result.preprocessingInfo?.boundingBox || { x: 0, y: 0, width: 28, height: 28 },
        },
      ]
    : [];

  const activeDigit = digitsList[selectedDigitIdx] || digitsList[0];

  return (
    <div className="flex flex-col gap-5 rounded-2xl border border-slate-800 bg-slate-900/60 p-5 sm:p-6 backdrop-blur-md">
      {/* Top Section: Full Combined Number in Large Text (Requirement 2) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div className="flex items-center gap-4">
          {/* Giant Hero Combined Number Box (e.g. "305", "42", "7") */}
          <div className="relative flex min-h-[96px] min-w-[96px] px-5 items-center justify-center rounded-2xl border-2 border-cyan-500/30 bg-gradient-to-br from-cyan-950/60 via-slate-900 to-indigo-950 shadow-xl shadow-cyan-500/10">
            <span className="font-mono text-5xl sm:text-7xl font-black tracking-tight text-white drop-shadow-[0_0_20px_rgba(6,182,212,0.6)]">
              {fullNumberStr}
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-400">Detected Number</span>
              <span className="text-[11px] text-slate-400">
                · {digitsList.length} {digitsList.length === 1 ? 'Digit' : 'Digits'}
              </span>
            </div>
            <div className="mt-1.5 flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-xs font-bold font-mono ${badgeColor}`}
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>{result.confidence}% Overall</span>
              </span>
            </div>
            <p className="mt-1 text-[11px] text-slate-400">
              Joined from left to right via vertical gap segmentation
            </p>
          </div>
        </div>

        {/* Original Input Thumbnail */}
        <div className="flex flex-col items-end gap-1 text-right shrink-0">
          <span className="text-[11px] font-medium text-slate-400">Input Image</span>
          <div className="h-12 w-20 overflow-hidden rounded-lg border border-slate-700 bg-black">
            <img
              src={result.thumbnailUrl}
              alt="Source number"
              className="h-full w-full object-contain"
            />
          </div>
        </div>
      </div>

      {/* Segmented Digits Breakdown: Each digit with confidence below it (Requirement 2) */}
      <div>
        <div className="mb-2 flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-300">
            Segmented Digit Confidences ({digitsList.length}):
          </span>
          <span className="text-[10px] text-slate-400">Click a digit to inspect softmax</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {digitsList.map((d, idx) => {
            const isSelected = selectedDigitIdx === idx;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => setSelectedDigitIdx(idx)}
                className={`flex items-center gap-3 rounded-xl border p-3 text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'border-cyan-400 bg-cyan-950/40 shadow-sm shadow-cyan-500/20'
                    : 'border-slate-800 bg-slate-950/50 hover:border-slate-700 hover:bg-slate-900/50'
                }`}
              >
                {/* 28x28 Tensor Thumbnail */}
                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-slate-700 bg-black p-0.5">
                  <img
                    src={d.preview28x28Url}
                    alt={`Digit ${d.digit}`}
                    style={{ imageRendering: 'pixelated' }}
                    className="h-full w-full object-contain"
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between">
                    <span className="font-mono text-2xl font-black text-white">{d.digit}</span>
                    <span className="text-[10px] text-slate-400 font-mono">Pos #{idx + 1}</span>
                  </div>
                  {/* Confidence of each digit below it */}
                  <span className="font-mono text-xs font-bold text-emerald-400 block tabular-nums">
                    {d.confidence}% conf
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Digit 0-9 Softmax Probability Distribution Bar Chart */}
      {activeDigit && activeDigit.probabilities && activeDigit.probabilities.length > 0 && (
        <div className="rounded-xl border border-slate-800/90 bg-slate-950/60 p-4">
          <div className="mb-2 flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-300">
              Softmax Probabilities for Digit '{activeDigit.digit}' (Position #{selectedDigitIdx + 1})
            </span>
            <span className="text-[11px] text-slate-400">Class Likelihood</span>
          </div>

          <div className="space-y-1.5">
            {activeDigit.probabilities.map((prob, digit) => {
              const isWinner = digit === activeDigit.digit;
              return (
                <div
                  key={digit}
                  className={`flex items-center gap-2.5 rounded-lg px-2 py-0.5 transition-colors ${
                    isWinner ? 'bg-cyan-950/40 border border-cyan-500/30' : ''
                  }`}
                >
                  <span
                    className={`w-4 font-mono text-xs font-bold text-center ${
                      isWinner ? 'text-cyan-300 scale-110' : 'text-slate-400'
                    }`}
                  >
                    {digit}
                  </span>

                  <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-slate-800/80">
                    <div
                      className={`h-full transition-all duration-300 rounded-full ${
                        isWinner
                          ? 'bg-gradient-to-r from-cyan-400 to-indigo-500 shadow-sm'
                          : 'bg-slate-700/60'
                      }`}
                      style={{ width: `${Math.max(1, prob)}%` }}
                    />
                  </div>

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
    </div>
  );
};
