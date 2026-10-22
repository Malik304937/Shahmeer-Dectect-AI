import React from 'react';
import { TrainingProgress } from '../types.ts';
import { Loader2, AlertCircle, CheckCircle2, Database, Sparkles, Layers, Award } from 'lucide-react';

interface TrainingModalProps {
  progress: TrainingProgress;
  onRetry: () => void;
  onClose?: () => void;
}

export const TrainingModal: React.FC<TrainingModalProps> = ({ progress, onRetry, onClose }) => {
  if (progress.status === 'idle') {
    return null;
  }

  // If ready but has testAccuracy, we let user see the final accuracy card before dismissing
  const isReady = progress.status === 'ready';
  const isError = progress.status === 'error';

  const getStatusLabel = () => {
    switch (progress.status) {
      case 'downloading':
        return 'Downloading MNIST dataset (8,000 train + 500 test)...';
      case 'preparing':
        return 'Slicing & normalizing 28x28 pixel tensors...';
      case 'training':
        return `Training Epoch ${progress.currentEpoch} of ${progress.totalEpochs} via WebGL GPU...`;
      case 'testing':
        return 'Evaluating on 500 unseen MNIST test images...';
      case 'saving':
        return 'Saving trained model to IndexedDB...';
      case 'ready':
        return 'Model training & evaluation complete!';
      case 'error':
        return 'Training encountered an issue';
      default:
        return 'Initializing neural network...';
    }
  };

  const latestRealEpochAccuracy =
    progress.epochAccuracies.length > 0
      ? progress.epochAccuracies[progress.epochAccuracies.length - 1]
      : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900/95 p-6 shadow-2xl sm:p-8">
        {/* Glow ambient background */}
        <div className="pointer-events-none absolute -top-20 left-1/2 -translate-x-1/2 h-40 w-72 rounded-full bg-cyan-500/15 blur-3xl" />

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            {isError ? (
              <AlertCircle className="h-5 w-5 text-rose-400" />
            ) : isReady ? (
              <Award className="h-5 w-5 text-emerald-400" />
            ) : progress.status === 'saving' ? (
              <Database className="h-5 w-5 text-emerald-400" />
            ) : (
              <Layers className="h-5 w-5 text-indigo-400" />
            )}
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-white">
              {isError
                ? 'Training Interrupted'
                : isReady
                ? 'Training Complete!'
                : 'Fast CNN Training on MNIST'}
            </h2>
            <p className="text-xs text-slate-400">
              8,000 images · Batch size 64 · 3 epochs · WebGL GPU acceleration
            </p>
          </div>
        </div>

        {/* Status text */}
        <div className="my-5 flex items-center justify-between text-xs text-slate-300">
          <div className="flex items-center gap-2">
            {!isError && !isReady && <Loader2 className="h-3.5 w-3.5 animate-spin text-cyan-400" />}
            {isReady && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />}
            <span className="font-medium">{getStatusLabel()}</span>
          </div>
          <span className="font-mono text-slate-400 tabular-nums">
            {progress.progressPercent}%
          </span>
        </div>

        {/* Progress Bar */}
        <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-slate-800">
          <div
            className={`h-full transition-all duration-300 ease-out ${
              isError
                ? 'bg-rose-500'
                : 'bg-gradient-to-r from-cyan-400 via-indigo-500 to-emerald-400'
            }`}
            style={{ width: `${Math.max(5, progress.progressPercent)}%` }}
          />
        </div>

        {/* Test Accuracy Highlight (Requirement 9) */}
        {progress.testAccuracy !== undefined && (
          <div className="mt-5 rounded-xl border border-emerald-500/40 bg-emerald-950/40 p-4 text-center">
            <span className="text-xs text-emerald-300 font-medium block">
              Tested on 500 Unseen MNIST Images:
            </span>
            <span className="font-mono text-3xl font-black text-white mt-1 block tracking-tight text-emerald-300">
              Model accuracy: {progress.testAccuracy}%
            </span>
            <p className="text-[11px] text-slate-400 mt-1">
              Model weights saved to IndexedDB. Next visits will load instantly!
            </p>
          </div>
        )}

        {/* Live Metrics Grid */}
        {!isError && (
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
              <span className="text-[11px] font-medium text-slate-400 block">Epoch</span>
              <span className="font-mono text-sm font-bold text-white tabular-nums">
                {progress.currentEpoch > 0 ? `${progress.currentEpoch} / ${progress.totalEpochs}` : 'Preparing'}
              </span>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
              <span className="text-[11px] font-medium text-slate-400 block">Batch (Step 10)</span>
              <span className="font-mono text-sm font-bold text-white tabular-nums">
                {progress.currentBatch > 0 ? `${progress.currentBatch} / ${progress.totalBatches}` : '—'}
              </span>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
              <span className="text-[11px] font-medium text-slate-400 block">Real Epoch Acc</span>
              <span className="font-mono text-sm font-bold text-emerald-400 tabular-nums">
                {latestRealEpochAccuracy !== null ? `${latestRealEpochAccuracy}%` : 'Calculating...'}
              </span>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
              <span className="text-[11px] font-medium text-slate-400 block">Loss</span>
              <span className="font-mono text-sm font-bold text-cyan-400 tabular-nums">
                {progress.currentLoss !== undefined ? progress.currentLoss.toFixed(3) : '—'}
              </span>
            </div>
          </div>
        )}

        {/* Real Epoch Accuracies List (Requirement 7) */}
        {progress.epochAccuracies.length > 0 && !isError && (
          <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/40 p-3">
            <span className="text-[11px] font-medium text-slate-400 block mb-1.5">
              Real Epoch Accuracies (Full Epoch Evaluation):
            </span>
            <div className="flex flex-wrap gap-2">
              {progress.epochAccuracies.map((acc, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-1.5 rounded-md bg-slate-800/80 px-2.5 py-1 text-xs font-mono text-slate-200"
                >
                  <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                  <span>Epoch {idx + 1}:</span>
                  <span className="font-bold text-emerald-300">{acc}%</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Error message if failed */}
        {isError && (
          <div className="mt-4 rounded-xl border border-rose-900/50 bg-rose-950/30 p-4 text-xs text-rose-300">
            <p className="font-semibold mb-1">Failed to initialize model:</p>
            <p className="text-slate-400 mb-3">{progress.errorMessage}</p>
            <button
              onClick={onRetry}
              className="rounded-lg bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-500 transition-colors cursor-pointer"
            >
              Retry Training
            </button>
          </div>
        )}

        {/* Ready Action Button */}
        {isReady && onClose && (
          <div className="mt-5">
            <button
              onClick={onClose}
              className="w-full rounded-xl bg-gradient-to-r from-cyan-500 via-indigo-600 to-purple-600 py-3 text-sm font-bold text-white shadow-lg shadow-cyan-500/25 hover:from-cyan-400 hover:via-indigo-500 hover:to-purple-500 transition-all cursor-pointer"
            >
              Start Detecting (Model Ready)
            </button>
          </div>
        )}

        {/* Footnote */}
        <div className="mt-5 border-t border-slate-800/80 pt-3.5 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-1.5">
            <Sparkles className="h-3 w-3 text-cyan-400" />
            <span>Lightweight CNN · Adam(0.003) · WebGL</span>
          </div>
          <span>IndexedDB Persistent</span>
        </div>
      </div>
    </div>
  );
};
