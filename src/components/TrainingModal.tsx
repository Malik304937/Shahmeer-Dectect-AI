import React from 'react';
import { TrainingProgress } from '../types.ts';
import { Loader2, AlertCircle, CheckCircle2, Database, Sparkles, Layers } from 'lucide-react';

interface TrainingModalProps {
  progress: TrainingProgress;
  onRetry: () => void;
}

export const TrainingModal: React.FC<TrainingModalProps> = ({ progress, onRetry }) => {
  if (progress.status === 'idle' || progress.status === 'ready') {
    return null;
  }

  const isError = progress.status === 'error';

  const getStatusLabel = () => {
    switch (progress.status) {
      case 'downloading':
        return 'Downloading MNIST dataset (12,000 samples)...';
      case 'preparing':
        return 'Slicing & normalizing 28x28 pixel tensors...';
      case 'training':
        return `Training Epoch ${progress.currentEpoch} of ${progress.totalEpochs} via WebGL GPU...`;
      case 'saving':
        return 'Saving trained model weights to IndexedDB...';
      case 'error':
        return 'Training encountered an issue';
      default:
        return 'Initializing neural network...';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900/95 p-6 shadow-2xl sm:p-8">
        {/* Glow ambient background */}
        <div className="pointer-events-none absolute -top-20 left-1/2 -translate-x-1/2 h-40 w-72 rounded-full bg-indigo-500/15 blur-3xl" />

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            {isError ? (
              <AlertCircle className="h-5 w-5 text-rose-400" />
            ) : progress.status === 'saving' ? (
              <Database className="h-5 w-5 text-emerald-400" />
            ) : (
              <Layers className="h-5 w-5 text-indigo-400" />
            )}
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-white">
              {isError ? 'Training Interrupted' : 'Training CNN on MNIST'}
            </h2>
            <p className="text-xs text-slate-400">
              12,000 handwritten digits · 4 training epochs · Local WebGL GPU
            </p>
          </div>
        </div>

        {/* Status text */}
        <div className="my-5 flex items-center justify-between text-xs text-slate-300">
          <div className="flex items-center gap-2">
            {!isError && <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-400" />}
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
                : 'bg-gradient-to-r from-indigo-500 via-cyan-400 to-emerald-400'
            }`}
            style={{ width: `${Math.max(5, progress.progressPercent)}%` }}
          />
        </div>

        {/* Live Metrics Grid */}
        {!isError && (
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
              <span className="text-[11px] font-medium text-slate-400 block">Epoch</span>
              <span className="font-mono text-sm font-bold text-white tabular-nums">
                {progress.currentEpoch > 0 ? `${progress.currentEpoch} / ${progress.totalEpochs}` : 'Preparing'}
              </span>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
              <span className="text-[11px] font-medium text-slate-400 block">Batch</span>
              <span className="font-mono text-sm font-bold text-white tabular-nums">
                {progress.currentBatch > 0 ? `${progress.currentBatch} / ${progress.totalBatches}` : '—'}
              </span>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
              <span className="text-[11px] font-medium text-slate-400 block">Live Accuracy</span>
              <span className="font-mono text-sm font-bold text-emerald-400 tabular-nums">
                {progress.currentAccuracy !== undefined
                  ? `${(progress.currentAccuracy * 100).toFixed(1)}%`
                  : '—'}
              </span>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
              <span className="text-[11px] font-medium text-slate-400 block">Live Loss</span>
              <span className="font-mono text-sm font-bold text-cyan-400 tabular-nums">
                {progress.currentLoss !== undefined ? progress.currentLoss.toFixed(3) : '—'}
              </span>
            </div>
          </div>
        )}

        {/* Epoch History Accuracies */}
        {progress.epochAccuracies.length > 0 && !isError && (
          <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/40 p-3">
            <span className="text-[11px] font-medium text-slate-400 block mb-1.5">
              Completed Epoch Accuracies:
            </span>
            <div className="flex flex-wrap gap-2">
              {progress.epochAccuracies.map((acc, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-1.5 rounded-md bg-slate-800/80 px-2 py-1 text-xs font-mono text-slate-200"
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

        {/* Science footnote */}
        <div className="mt-6 border-t border-slate-800/80 pt-4 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-1.5">
            <Sparkles className="h-3 w-3 text-indigo-400" />
            <span>Zero server latency · Client-side TensorFlow.js</span>
          </div>
          <span>IndexedDB persistent</span>
        </div>
      </div>
    </div>
  );
};
