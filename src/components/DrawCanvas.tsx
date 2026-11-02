import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Eraser, Wand2, RotateCcw, Sparkles, Lightbulb } from 'lucide-react';
import { DetectionCategory } from '../types.ts';

interface DrawCanvasProps {
  onDetect: (canvas: HTMLCanvasElement) => void;
  isProcessing: boolean;
  targetType: DetectionCategory;
}

export const DrawCanvas: React.FC<DrawCanvasProps> = ({
  onDetect,
  isProcessing,
  targetType,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [strokeWidth, setStrokeWidth] = useState<number>(20);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [showGuide, setShowGuide] = useState(true);

  // History stack for Undo
  const strokeHistoryRef = useRef<ImageData[]>([]);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);

  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
    strokeHistoryRef.current = [];
  }, []);

  useEffect(() => {
    initCanvas();
  }, [initCanvas, targetType]);

  const saveState = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;
    const current = ctx.getImageData(0, 0, canvas.width, canvas.height);
    strokeHistoryRef.current.push(current);
    if (strokeHistoryRef.current.length > 10) {
      strokeHistoryRef.current.shift();
    }
  };

  const undo = () => {
    const canvas = canvasRef.current;
    if (!canvas || strokeHistoryRef.current.length === 0) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const previous = strokeHistoryRef.current.pop();
    if (previous) {
      ctx.putImageData(previous, 0, 0);
      setHasDrawn(strokeHistoryRef.current.length > 0);
    } else {
      initCanvas();
    }
  };

  const getCanvasCoordinates = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    saveState();

    const coords = getCanvasCoordinates(e);
    lastPointRef.current = coords;
    setIsDrawing(true);
    setHasDrawn(true);

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    ctx.strokeStyle = '#ffffff';
    ctx.fillStyle = '#ffffff';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = strokeWidth;

    ctx.beginPath();
    ctx.arc(coords.x, coords.y, strokeWidth / 2, 0, Math.PI * 2);
    ctx.fill();
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const currentCoords = getCanvasCoordinates(e);
    const lastCoords = lastPointRef.current;

    if (lastCoords) {
      ctx.strokeStyle = '#ffffff';
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineWidth = strokeWidth;

      ctx.beginPath();
      ctx.moveTo(lastCoords.x, lastCoords.y);
      const midX = (lastCoords.x + currentCoords.x) / 2;
      const midY = (lastCoords.y + currentCoords.y) / 2;
      ctx.quadraticCurveTo(lastCoords.x, lastCoords.y, midX, midY);
      ctx.lineTo(currentCoords.x, currentCoords.y);
      ctx.stroke();
    }

    lastPointRef.current = currentCoords;
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    setIsDrawing(false);
    lastPointRef.current = null;
  };

  // Quick preset template drawer
  const drawPresetText = (text: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    saveState();
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#ffffff';

    if (text.length === 1) {
      ctx.font = 'bold 150px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, canvas.width / 2, canvas.height / 2 + 10);
    } else if (text.length === 2) {
      // 2 digits with clear gap
      ctx.font = 'bold 130px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text[0], canvas.width * 0.35, canvas.height / 2 + 10);
      ctx.fillText(text[1], canvas.width * 0.65, canvas.height / 2 + 10);
    } else {
      // 3 digits (e.g. 305 or ABC) with clear gaps
      ctx.font = 'bold 110px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text[0], canvas.width * 0.22, canvas.height / 2 + 10);
      ctx.fillText(text[1], canvas.width * 0.50, canvas.height / 2 + 10);
      ctx.fillText(text[2], canvas.width * 0.78, canvas.height / 2 + 10);
    }

    setHasDrawn(true);
  };

  const handleDetectClick = () => {
    if (!canvasRef.current) return;
    onDetect(canvasRef.current);
  };

  return (
    <div className="flex flex-col items-center w-full">
      {/* Top canvas controls bar */}
      <div className="mb-3 flex w-full max-w-[560px] flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-400">Stroke:</span>
          <div
            role="radiogroup"
            aria-label="Brush stroke weight"
            className="inline-flex items-center gap-1 rounded-xl bg-slate-950/90 p-1 border border-slate-800 shadow-inner"
          >
            {[
              { size: 16, label: 'Fine' },
              { size: 22, label: 'Medium' },
              { size: 28, label: 'Thick' },
            ].map(({ size, label }) => {
              const isSelected = strokeWidth === size;
              return (
                <button
                  key={size}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  onClick={() => setStrokeWidth(size)}
                  className={`rounded-lg px-3 py-1 text-xs font-medium transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-cyan-600 text-white shadow-sm border border-cyan-500/40'
                      : 'border border-transparent text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowGuide(!showGuide)}
            className={`inline-flex items-center rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer ${
              showGuide
                ? 'border-cyan-500/40 bg-cyan-950/30 text-cyan-400'
                : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700 hover:text-white'
            }`}
          >
            {showGuide ? 'Hide Separators' : 'Show Separators'}
          </button>
          <button
            type="button"
            onClick={undo}
            disabled={strokeHistoryRef.current.length === 0}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/60 px-2.5 py-1 text-xs font-medium text-slate-400 hover:border-slate-700 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
            title="Undo stroke"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Undo</span>
          </button>
        </div>
      </div>

      {/* Wide Drawing Canvas (560x240) */}
      <div className="relative w-full max-w-[560px] touch-none overflow-hidden rounded-2xl border-2 border-slate-800 bg-black p-0 shadow-2xl transition-all hover:border-slate-700">
        <canvas
          ref={canvasRef}
          width={560}
          height={240}
          className="block w-full h-[180px] sm:h-[220px] md:h-[240px] cursor-crosshair object-contain"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          onPointerCancel={handlePointerUp}
        />

        {/* 3-digit guide separators */}
        {showGuide && (
          <div className="pointer-events-none absolute inset-0 grid grid-cols-3 opacity-15">
            <div className="border-r border-cyan-400 border-dashed" />
            <div className="border-r border-cyan-400 border-dashed" />
            <div />
          </div>
        )}

        {/* Empty canvas hint */}
        {!hasDrawn && (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
            <Sparkles className="h-6 w-6 text-slate-600 mb-1.5 animate-pulse" />
            <p className="text-sm font-semibold text-slate-400">
              {targetType === 'numbers' ? 'Draw 1, 2, or 3 digits (e.g. 7, 42, 305)' : 'Draw letters (e.g. A, B, ABC)'}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              {targetType === 'numbers' ? 'Leave clear gaps between digits' : 'Write thick, distinct letters'}
            </p>
          </div>
        )}
      </div>

      {/* Mandatory Tip Under Canvas (Requirement 4) */}
      <div className="mt-2.5 flex items-center gap-1.5 rounded-lg border border-cyan-500/20 bg-cyan-950/20 px-3 py-1.5 text-xs text-cyan-400 w-full max-w-[560px]">
        <Lightbulb className="h-3.5 w-3.5 shrink-0 text-cyan-400" />
        <span className="font-medium">
          Tip:{' '}
          {targetType === 'numbers'
            ? 'Write digits with clear gaps between them'
            : 'Write big, thick, separate letters'}
        </span>
      </div>

      {/* Preset Quick Test Buttons (Requirement 6 & Issue 10) */}
      <div className="mt-3 flex flex-wrap items-center gap-2 w-full max-w-[560px] text-xs text-slate-400">
        <span className="text-xs font-medium text-slate-400">Quick examples:</span>
        <div className="flex flex-wrap items-center gap-2">
          {targetType === 'numbers' ? (
            <>
              {['7', '42', '305', '89', '100'].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => drawPresetText(val)}
                  className="inline-flex items-center justify-center min-h-[32px] rounded-lg border border-slate-800 bg-slate-900/90 px-3 py-1 font-mono text-xs font-medium text-slate-300 hover:border-cyan-500/50 hover:bg-slate-800 hover:text-white active:scale-95 transition-all cursor-pointer shadow-sm"
                >
                  {val}
                </button>
              ))}
            </>
          ) : (
            <>
              {['A', 'B', 'ABC', 'AI', 'OK'].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => drawPresetText(val)}
                  className="inline-flex items-center justify-center min-h-[32px] rounded-lg border border-slate-800 bg-slate-900/90 px-3 py-1 font-mono text-xs font-medium text-slate-300 hover:border-cyan-500/50 hover:bg-slate-800 hover:text-white active:scale-95 transition-all cursor-pointer shadow-sm"
                >
                  {val}
                </button>
              ))}
            </>
          )}
        </div>
      </div>

      {/* Action Buttons: Detect and Clear */}
      <div className="mt-4 flex w-full max-w-[560px] items-center gap-3">
        <button
          type="button"
          onClick={initCanvas}
          disabled={!hasDrawn || isProcessing}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-700/80 bg-slate-900/80 py-2.5 text-xs font-semibold text-slate-300 hover:border-slate-600 hover:bg-slate-800 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          <Eraser className="h-4 w-4" />
          <span>Clear</span>
        </button>

        <button
          type="button"
          onClick={handleDetectClick}
          disabled={!hasDrawn || isProcessing}
          className="flex flex-[2] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 via-indigo-600 to-purple-600 py-2.5 text-sm font-bold text-white shadow-lg shadow-cyan-500/20 hover:from-cyan-400 hover:via-indigo-500 hover:to-purple-500 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none transition-all active:scale-[0.98] cursor-pointer"
        >
          <Wand2 className="h-4 w-4" />
          <span>
            {isProcessing
              ? 'Detecting...'
              : targetType === 'numbers'
              ? 'Detect Number'
              : 'Detect Letters'}
          </span>
        </button>
      </div>
    </div>
  );
};
