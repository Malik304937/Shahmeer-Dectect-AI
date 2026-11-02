import React from 'react';
import { PredictionResult } from '../types.ts';
import { History, PenTool, Camera, Upload, Trash2, Type } from 'lucide-react';

interface DetectionHistoryProps {
  history: PredictionResult[];
  onSelect: (item: PredictionResult) => void;
  onClear: () => void;
  selectedTimestamp?: number;
}

export const DetectionHistory: React.FC<DetectionHistoryProps> = ({
  history,
  onSelect,
  onClear,
  selectedTimestamp,
}) => {
  if (history.length === 0) {
    return null;
  }

  return (
    <div className="w-full rounded-2xl border border-slate-800 bg-slate-900/40 p-5 backdrop-blur-sm">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-cyan-400" />
          <h3 className="text-xs font-semibold text-slate-300">Recent Detections (Last 5)</h3>
        </div>
        <button
          type="button"
          onClick={onClear}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700/80 bg-slate-900/80 px-2.5 py-1 text-xs font-medium text-slate-300 hover:border-rose-900/60 hover:bg-rose-950/30 hover:text-rose-400 transition-colors cursor-pointer"
          title="Clear detection history"
        >
          <Trash2 className="h-3.5 w-3.5" />
          <span>Clear history</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
        {history.map((item) => {
          const isSelected = selectedTimestamp === item.timestamp;
          const timeStr = new Date(item.timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          });

          return (
            <button
              key={item.timestamp}
              onClick={() => onSelect(item)}
              className={`flex items-center gap-2.5 rounded-xl border p-2 text-left transition-all cursor-pointer ${
                isSelected
                  ? 'border-cyan-500 bg-indigo-950/40 shadow-sm shadow-cyan-500/20'
                  : 'border-slate-800 bg-slate-950/40 hover:border-slate-700 hover:bg-slate-900/60'
              }`}
            >
              {/* Thumbnail */}
              <div className="h-9 w-9 shrink-0 overflow-hidden rounded-lg border border-slate-800 bg-black">
                <img
                  src={item.thumbnailUrl}
                  alt="Detection input"
                  className="h-full w-full object-contain"
                />
              </div>

              {/* Digit / Text & Confidence */}
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-1">
                  {item.category === 'letters' || item.isTextOCR ? (
                    <span className="font-mono text-sm font-bold text-cyan-400 truncate">
                      {item.text?.slice(0, 6) || 'Text'}
                    </span>
                  ) : (
                    <span className="font-mono text-base font-bold text-white truncate">
                      {item.numberString || item.digit}
                    </span>
                  )}
                  <span className="text-xs font-mono text-emerald-400 tabular-nums font-semibold shrink-0">
                    {item.confidence}%
                  </span>
                </div>

                {/* Source & Time */}
                <div className="flex items-center justify-between text-xs text-slate-400 mt-0.5">
                  <span className="flex items-center gap-1 truncate">
                    {item.source === 'draw' ? (
                      <PenTool className="h-3 w-3 text-indigo-400 shrink-0" />
                    ) : item.source === 'camera' ? (
                      <Camera className="h-3 w-3 text-cyan-400 shrink-0" />
                    ) : (
                      <Upload className="h-3 w-3 text-purple-400 shrink-0" />
                    )}
                    <span className="capitalize">{item.source}</span>
                  </span>
                  <span className="font-mono text-slate-400 shrink-0">{timeStr}</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
