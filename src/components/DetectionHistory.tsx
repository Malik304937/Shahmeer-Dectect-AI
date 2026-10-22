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
      <div className="mb-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-cyan-400" />
          <h3 className="text-xs font-semibold text-slate-300">Recent Detections (Last 5)</h3>
        </div>
        <button
          onClick={onClear}
          className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
          title="Clear detection history"
        >
          <Trash2 className="h-3 w-3" />
          <span>Clear</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5">
        {history.map((item) => {
          const isSelected = selectedTimestamp === item.timestamp;
          const timeStr = new Date(item.timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          });

          return (
            <button
              key={item.timestamp}
              onClick={() => onSelect(item)}
              className={`flex sm:flex-col items-center justify-between sm:justify-start gap-3 rounded-xl border p-2.5 text-left transition-all cursor-pointer ${
                isSelected
                  ? 'border-cyan-500 bg-indigo-950/40 shadow-sm shadow-cyan-500/20'
                  : 'border-slate-800 bg-slate-950/40 hover:border-slate-700 hover:bg-slate-900/60'
              }`}
            >
              {/* Thumbnail + Digit or Text */}
              <div className="flex sm:flex-col items-center gap-2.5 sm:w-full">
                <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-slate-800 bg-black">
                  <img
                    src={item.thumbnailUrl}
                    alt="Detection input"
                    className="h-full w-full object-contain"
                  />
                </div>

                <div className="flex sm:flex-col items-baseline sm:items-center gap-1.5 sm:gap-0 sm:w-full min-w-0">
                  {item.isTextOCR ? (
                    <span className="font-mono text-xs font-bold text-cyan-300 truncate max-w-[120px] sm:max-w-full">
                      {item.text?.slice(0, 10) || 'Text'}
                    </span>
                  ) : (
                    <span className="font-mono text-xl sm:text-2xl font-black text-white">
                      {item.digit}
                    </span>
                  )}
                  <span className="text-[10px] font-mono text-emerald-400 tabular-nums">
                    {item.confidence}%
                  </span>
                </div>
              </div>

              {/* Source & Timestamp */}
              <div className="flex items-center sm:justify-between w-auto sm:w-full text-[10px] text-slate-400 border-t sm:border-slate-800/60 sm:pt-1.5">
                <span className="flex items-center gap-1">
                  {item.source === 'draw' ? (
                    <PenTool className="h-2.5 w-2.5 text-indigo-400" />
                  ) : item.source === 'camera' ? (
                    <Camera className="h-2.5 w-2.5 text-cyan-400" />
                  ) : (
                    <Upload className="h-2.5 w-2.5 text-purple-400" />
                  )}
                  <span className="capitalize">{item.source}</span>
                </span>
                <span className="hidden sm:inline font-mono">{timeStr}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
