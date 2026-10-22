import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Eraser, Wand2, RotateCcw, Sparkles } from 'lucide-react';

interface DrawCanvasProps {
  onDetect: (canvas: HTMLCanvasElement) => void;
  isProcessing: boolean;
}

export const DrawCanvas: React.FC<DrawCanvasProps> = ({ onDetect, isProcessing }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [strokeWidth, setStrokeWidth] = useState<number>(24);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [showGuide, setShowGuide] = useState(true);

  // History stack for Undo
  const strokeHistoryRef = useRef<ImageData[]>([]);

  // Smooth drawing points
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
  }, [initCanvas]);

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

    // Draw single dot on tap
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

      // Draw quadratic curve between midpoint for smoothness
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

  const drawPresetDigit = (digitChar: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    saveState();
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 200px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(digitChar, canvas.width / 2, canvas.height / 2 + 10);

    setHasDrawn(true);
  };

  const handleDetectClick = () => {
    if (!canvasRef.current) return;
    onDetect(canvasRef.current);
  };

  return (
    <div className="flex flex-col items-center">
      {/* Top canvas controls bar */}
      <div className="mb-3 flex w-full max-w-[340px] items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-medium text-slate-400">Stroke:</span>
          <div className="flex items-center gap-1 rounded-lg bg-slate-900/90 p-1 border border-slate-800">
            {[18, 24, 32].map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => setStrokeWidth(size)}
                className={`rounded px-2 py-0.5 text-[11px] font-semibold transition-colors cursor-pointer ${
                  strokeWidth === size
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {size === 18 ? 'Fine' : size === 24 ? 'Medium' : 'Thick'}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowGuide(!showGuide)}
            className={`text-[11px] transition-colors cursor-pointer ${
              showGuide ? 'text-indigo-400 font-medium' : 'text-slate-500 hover:text-slate-400'
            }`}
          >
            {showGuide ? 'Hide Grid' : 'Show Grid'}
          </button>
          <button
            type="button"
            onClick={undo}
            disabled={strokeHistoryRef.current.length === 0}
            className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-200 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
            title="Undo stroke"
          >
            <RotateCcw className="h-3 w-3" />
            <span>Undo</span>
          </button>
        </div>
      </div>

      {/* Drawing Canvas Container */}
      <div className="relative touch-none overflow-hidden rounded-2xl border-2 border-slate-800 bg-black p-0 shadow-2xl transition-all hover:border-slate-700">
        <canvas
          ref={canvasRef}
          width={320}
          height={320}
          className="block h-[280px] w-[280px] sm:h-[320px] sm:w-[320px] cursor-crosshair"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          onPointerCancel={handlePointerUp}
        />

        {/* Centering crosshair grid */}
        {showGuide && (
          <div className="pointer-events-none absolute inset-0 grid grid-cols-3 grid-rows-3 opacity-20">
            <div className="border-r border-b border-indigo-400 border-dashed" />
            <div className="border-r border-b border-indigo-400 border-dashed" />
            <div className="border-b border-indigo-400 border-dashed" />
            <div className="border-r border-b border-indigo-400 border-dashed" />
            <div className="border-r border-b border-indigo-400 border-dashed" />
            <div className="border-b border-indigo-400 border-dashed" />
            <div className="border-r border-indigo-400 border-dashed" />
            <div className="border-r border-indigo-400 border-dashed" />
            <div />
          </div>
        )}

        {/* Empty canvas hint */}
        {!hasDrawn && (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
            <Sparkles className="h-6 w-6 text-slate-600 mb-2 animate-pulse" />
            <p className="text-sm font-medium text-slate-500">Draw a single digit (0–9)</p>
            <p className="text-[11px] text-slate-600 mt-0.5">Use your finger or mouse</p>
          </div>
        )}
      </div>

      {/* Preset Quick Test Buttons */}
      <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-400">
        <span className="text-[11px] text-slate-500">Quick samples:</span>
        {['3', '7', '8', '5', '0'].map((digit) => (
          <button
            key={digit}
            type="button"
            onClick={() => drawPresetDigit(digit)}
            className="flex h-6 w-6 items-center justify-center rounded-md border border-slate-800 bg-slate-900 font-mono text-xs font-semibold text-slate-300 hover:border-slate-700 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
          >
            {digit}
          </button>
        ))}
      </div>

      {/* Action Buttons: Detect and Clear */}
      <div className="mt-5 flex w-full max-w-[340px] items-center gap-3">
        <button
          type="button"
          onClick={initCanvas}
          disabled={!hasDrawn || isProcessing}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-700/80 bg-slate-900/80 py-3 text-xs font-semibold text-slate-300 hover:border-slate-600 hover:bg-slate-800 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          <Eraser className="h-4 w-4" />
          <span>Clear</span>
        </button>

        <button
          type="button"
          onClick={handleDetectClick}
          disabled={!hasDrawn || isProcessing}
          className="flex flex-[2] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 via-indigo-600 to-cyan-500 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-500/25 hover:from-indigo-400 hover:via-indigo-500 hover:to-cyan-400 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none transition-all active:scale-[0.98] cursor-pointer"
        >
          <Wand2 className="h-4 w-4" />
          <span>{isProcessing ? 'Detecting...' : 'Detect Digit'}</span>
        </button>
      </div>
    </div>
  );
};
