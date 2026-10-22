import React, { useState, useRef } from 'react';
import { Upload, Wand2, X, RefreshCw } from 'lucide-react';
import { performOcr, LETTERS_WHITELIST } from '../services/ocrService.ts';
import { OcrWord, DetectionCategory } from '../types.ts';

interface UploadDetectorProps {
  onDetectNumber: (canvas: HTMLCanvasElement) => void;
  onDetectOcr: (result: { text: string; confidence: number; words: OcrWord[]; thumbnailUrl: string }) => void;
  isProcessing: boolean;
  targetType: DetectionCategory;
}

export const UploadDetector: React.FC<UploadDetectorProps> = ({
  onDetectNumber,
  onDetectOcr,
  isProcessing,
  targetType,
}) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageName, setImageName] = useState<string>('');
  const [ocrProgress, setOcrProgress] = useState<{ percent: number; message: string } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (PNG, JPG, WEBP).');
      return;
    }
    setImageName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      setSelectedImage(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  // Helper to load sample synthetic image
  const loadSampleImage = (type: '7' | '42' | '305' | 'A' | 'B' | 'ABC') => {
    const canvas = document.createElement('canvas');
    canvas.width = 560;
    canvas.height = 240;
    const ctx = canvas.getContext('2d')!;

    // Black background, white stroke
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, 560, 240);
    ctx.fillStyle = '#ffffff';

    if (type.length === 1) {
      ctx.font = 'bold 150px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(type, 280, 125);
    } else if (type.length === 2) {
      ctx.font = 'bold 130px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(type[0], 190, 125);
      ctx.fillText(type[1], 370, 125);
    } else {
      ctx.font = 'bold 110px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(type[0], 130, 125);
      ctx.fillText(type[1], 280, 125);
      ctx.fillText(type[2], 430, 125);
    }

    setImageName(`sample-${type.toLowerCase()}.png`);
    setSelectedImage(canvas.toDataURL('image/png'));
  };

  const handleRunDetection = async () => {
    if (!selectedImage) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = async () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth || img.width;
      canvas.height = img.naturalHeight || img.height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0);

      if (targetType === 'numbers') {
        onDetectNumber(canvas);
      } else {
        try {
          setOcrProgress({ percent: 10, message: 'Starting letter OCR scan...' });
          const ocrRes = await performOcr(
            canvas,
            { whitelist: LETTERS_WHITELIST },
            (pct, msg) => {
              setOcrProgress({ percent: pct, message: msg });
            }
          );
          setOcrProgress(null);

          if (!ocrRes.text || ocrRes.text.trim() === '') {
            alert('I could not see anything, please try again');
            return;
          }

          onDetectOcr({
            text: ocrRes.text,
            confidence: ocrRes.confidence,
            words: ocrRes.words,
            thumbnailUrl: selectedImage,
          });
        } catch (err: any) {
          setOcrProgress(null);
          alert('I could not see anything, please try again');
        }
      }
    };
    img.src = selectedImage;
  };

  return (
    <div className="flex flex-col items-center w-full max-w-[560px] mx-auto">
      {/* Upload Box / Dropzone */}
      {!selectedImage ? (
        <div
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`flex w-full h-[200px] sm:h-[240px] flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center transition-all cursor-pointer ${
            isDragging
              ? 'border-cyan-400 bg-cyan-950/20 scale-[1.01]'
              : 'border-slate-800 bg-slate-950/60 hover:border-slate-700 hover:bg-slate-900/40'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFileChange(e.target.files[0]);
              }
            }}
          />

          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <Upload className="h-6 w-6" />
          </div>

          <h3 className="text-sm font-bold text-white mb-1">Upload or Drag Image</h3>
          <p className="text-xs text-slate-400 max-w-xs mb-3">
            {targetType === 'numbers'
              ? 'Upload handwritten or printed numbers (1 to 3 digits like 7, 42, 305)'
              : 'Upload letters or words (e.g. A, B, ABC)'}
          </p>

          <span className="rounded-lg bg-cyan-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-cyan-500 transition-colors">
            Browse File
          </span>
        </div>
      ) : (
        /* Image Preview Box */
        <div className="relative w-full h-[200px] sm:h-[240px] overflow-hidden rounded-2xl border-2 border-slate-800 bg-black shadow-2xl flex items-center justify-center">
          <img
            src={selectedImage}
            alt="Uploaded preview"
            className="max-h-full max-w-full object-contain"
          />

          {/* Remove / Change Button */}
          <button
            type="button"
            onClick={() => {
              setSelectedImage(null);
              setImageName('');
            }}
            className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-slate-900/80 text-slate-300 hover:bg-slate-800 hover:text-white backdrop-blur-md border border-slate-700 transition-colors cursor-pointer"
            title="Remove image"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Filename Tag */}
          <div className="absolute bottom-3 left-3 right-3 truncate rounded-lg bg-slate-950/80 px-2.5 py-1 text-[11px] font-mono text-slate-300 backdrop-blur-md border border-slate-800">
            {imageName}
          </div>
        </div>
      )}

      {/* Quick Sample Presets */}
      <div className="mt-3 flex flex-wrap items-center justify-between w-full text-xs text-slate-400">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-slate-500">Quick samples:</span>
          {targetType === 'numbers' ? (
            <>
              {(['7', '42', '305'] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => loadSampleImage(s)}
                  className="rounded-md border border-slate-800 bg-slate-900 px-2 py-0.5 text-[11px] font-mono font-medium text-slate-300 hover:border-slate-700 hover:text-white transition-colors cursor-pointer"
                >
                  {s}
                </button>
              ))}
            </>
          ) : (
            <>
              {(['A', 'B', 'ABC'] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => loadSampleImage(s)}
                  className="rounded-md border border-slate-800 bg-slate-900 px-2 py-0.5 text-[11px] font-mono font-medium text-slate-300 hover:border-slate-700 hover:text-white transition-colors cursor-pointer"
                >
                  {s}
                </button>
              ))}
            </>
          )}
        </div>
      </div>

      {/* OCR Progress Indicator if active */}
      {ocrProgress && (
        <div className="mt-3 w-full rounded-xl border border-cyan-500/30 bg-cyan-950/30 p-3 text-xs">
          <div className="flex items-center justify-between text-cyan-300 mb-1.5">
            <span className="font-semibold flex items-center gap-1.5">
              <RefreshCw className="h-3 w-3 animate-spin" />
              {ocrProgress.message}
            </span>
            <span className="font-mono tabular-nums">{ocrProgress.percent}%</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full bg-gradient-to-r from-cyan-400 to-indigo-500 transition-all duration-200"
              style={{ width: `${Math.max(5, ocrProgress.percent)}%` }}
            />
          </div>
        </div>
      )}

      {/* Detect Button */}
      <div className="mt-4 w-full">
        <button
          type="button"
          onClick={handleRunDetection}
          disabled={!selectedImage || isProcessing || !!ocrProgress}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 via-indigo-600 to-purple-600 py-3 text-sm font-bold text-white shadow-lg shadow-cyan-500/20 hover:from-cyan-400 hover:via-indigo-500 hover:to-purple-500 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none transition-all active:scale-[0.98] cursor-pointer"
        >
          <Wand2 className="h-4 w-4" />
          <span>
            {isProcessing || !!ocrProgress
              ? 'Recognizing with AI...'
              : targetType === 'numbers'
              ? 'Segment & Detect Numbers (CNN)'
              : 'Recognize Letters (Tesseract OCR)'}
          </span>
        </button>
      </div>
    </div>
  );
};
