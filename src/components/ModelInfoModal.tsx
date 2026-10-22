import React, { useState, useEffect } from 'react';
import * as tf from '@tensorflow/tfjs';
import { X, Cpu, RefreshCw, Trash2, CheckCircle2, HardDrive, Layers, Activity } from 'lucide-react';
import { MODEL_STORAGE_KEY } from '../services/mnistModel.ts';

interface ModelInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  isCached: boolean;
  onRetrain: () => void;
  onClearStorage: () => void;
}

export const ModelInfoModal: React.FC<ModelInfoModalProps> = ({
  isOpen,
  onClose,
  isCached,
  onRetrain,
  onClearStorage,
}) => {
  const [memoryInfo, setMemoryInfo] = useState<{ numTensors: number; numBytes: number } | null>(null);

  useEffect(() => {
    if (isOpen) {
      try {
        const mem = tf.memory();
        setMemoryInfo({
          numTensors: mem.numTensors,
          numBytes: mem.numBytes,
        });
      } catch (e) {
        console.warn('tf.memory() error:', e);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const layersList = [
    { name: 'conv2d_1', type: 'Conv2D (16 filters, 3×3)', shape: '[None, 26, 26, 16]', params: 160 },
    { name: 'max_pooling2d_1', type: 'MaxPooling2D (2×2)', shape: '[None, 13, 13, 16]', params: 0 },
    { name: 'conv2d_2', type: 'Conv2D (32 filters, 3×3)', shape: '[None, 11, 11, 32]', params: 4640 },
    { name: 'max_pooling2d_2', type: 'MaxPooling2D (2×2)', shape: '[None, 5, 5, 32]', params: 0 },
    { name: 'flatten_1', type: 'Flatten', shape: '[None, 800]', params: 0 },
    { name: 'dense_1', type: 'Dense (ReLU)', shape: '[None, 64]', params: 51264 },
    { name: 'dropout_1', type: 'Dropout (rate=0.25)', shape: '[None, 64]', params: 0 },
    { name: 'dense_2 (output)', type: 'Dense (Softmax)', shape: '[None, 10]', params: 650 },
  ];

  const totalParams = 56714;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl rounded-2xl border border-slate-800 bg-slate-900/95 p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Cpu className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Neural Network Architecture</h3>
              <p className="text-xs text-slate-400">TensorFlow.js CNN Specification</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Quick Stats Grid */}
        <div className="my-5 grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
            <span className="text-[11px] font-medium text-slate-400 block">Total Parameters</span>
            <span className="font-mono text-sm font-bold text-white tabular-nums">
              {totalParams.toLocaleString()}
            </span>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
            <span className="text-[11px] font-medium text-slate-400 block">Storage Cache</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <HardDrive className="h-3.5 w-3.5 text-emerald-400" />
              <span className="font-mono text-xs font-bold text-emerald-400">
                {isCached ? 'IndexedDB' : 'RAM'}
              </span>
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
            <span className="text-[11px] font-medium text-slate-400 block">GPU Memory</span>
            <span className="font-mono text-xs font-bold text-cyan-400 tabular-nums">
              {memoryInfo ? `${(memoryInfo.numBytes / (1024 * 1024)).toFixed(1)} MB` : 'Active'}
            </span>
          </div>
        </div>

        {/* Layers Table */}
        <div className="rounded-xl border border-slate-800 bg-slate-950/60 overflow-hidden">
          <div className="bg-slate-900/80 px-4 py-2 border-b border-slate-800 flex items-center justify-between text-xs font-semibold text-slate-300">
            <span>Layer & Activation</span>
            <span>Output Shape</span>
          </div>
          <div className="max-h-56 overflow-y-auto divide-y divide-slate-800/60">
            {layersList.map((layer, idx) => (
              <div
                key={idx}
                className="px-4 py-2 flex items-center justify-between text-xs hover:bg-slate-900/40 transition-colors"
              >
                <div>
                  <span className="font-mono font-medium text-slate-200 block">{layer.type}</span>
                  <span className="text-[10px] text-slate-400 font-mono">{layer.name} · {layer.params.toLocaleString()} params</span>
                </div>
                <span className="font-mono text-slate-400 text-[11px]">{layer.shape}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-800/80 pt-4">
          <button
            onClick={() => {
              onClearStorage();
              onClose();
            }}
            className="flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 transition-colors cursor-pointer self-start sm:self-auto"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Clear IndexedDB Cache</span>
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => {
                onClose();
                onRetrain();
              }}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-500 transition-colors cursor-pointer shadow-sm shadow-indigo-500/20"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Retrain Model (12,000 MNIST)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
