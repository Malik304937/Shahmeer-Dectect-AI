import React, { useState, useRef } from 'react';
import { Upload, FileImage, Wand2, Type, Hash, Sparkles, X, RefreshCw } from 'lucide-react';
import { performOcr } from '../services/ocrService.ts';
import { OcrWord } from '../types.ts';

interface UploadDetectorProps {
  onDetectDigit: (canvas: HTMLCanvasElement) => void;
  onDetectOcr: (result: { text: string; confidence: number; words: OcrWord[]; thumbnailUrl: string }) => void;
  isProcessing: boolean;
}

export const UploadDetector: React.FC<UploadDetectorProps> = ({
  onDetectDigit,
  onDetectOcr,
  isProcessing,
}) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageName, setImageName] = useState<string>('');
  const [detectionMode, setDetectionMode] = useState<'ocr' | 'digit'>('ocr');
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
  const loadSampleImage = (type: 'digit7' | 'invoice' | 'digits') => {
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 300;
    const ctx = canvas.getContext('2d')!;

    if (type === 'digit7') {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 400, 300);
      ctx.fillStyle = '#111827';
      ctx.font = 'bold 180px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('7', 200, 160);
      setImageName('handwritten-sample-7.png');
      setDetectionMode('digit');
    } else if (type === 'invoice') {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 400, 300);
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 24px "Plus Jakarta Sans", sans-serif';
      ctx.fillText('INVOICE #94821', 40, 60);
      ctx.font = '16px monospace';
      ctx.fillStyle = '#334155';
      ctx.fillText('Customer ID: SH-7702', 40, 100);
      ctx.fillText('Total Items: 14 Units', 40, 135);
      ctx.fillText('Batch Code: 8904-ALPHA', 40, 170);
      ctx.font = 'bold 28px monospace';
      ctx.fillStyle = '#0284c7';
      ctx.fillText('AMOUNT: $4,850.00', 40, 230);
      setImageName('printed-receipt-sample.png');
      setDetectionMode('ocr');
    } else {
      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, 400, 300);
      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 72px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('384 920 157', 200, 160);
      setImageName('printed-numbers-sample.png');
      setDetectionMode('ocr');
    }

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

      if (detectionMode === 'digit') {
        onDetectDigit(canvas);
      } else {
        try {
          setOcrProgress({ percent: 10, message: 'Starting Tesseract OCR...' });
          const ocrRes = await performOcr(canvas, (pct, msg) => {
            setOcrProgress({ percent: pct, message: msg });
          });
          setOcrProgress(null);
          onDetectOcr({
            text: ocrRes.text,
            confidence: ocrRes.confidence,
            words: ocrRes.words,
            thumbnailUrl: selectedImage,
          });
        } catch (err: any) {
          setOcrProgress(null);
          alert('OCR detection error: ' + (err.message || 'Failed to parse text'));
        }
      }
    };
    img.src = selectedImage;
  };

  return (
    <div className="flex flex-col items-center w-full max-w-md mx-auto">
      {/* Mode toggle between Tesseract OCR & CNN Digit */}
      <div className="mb-3 flex w-full items-center justify-between text-xs text-slate-400">
        <span className="text-[11px] font-medium text-slate-400">Recognition Engine:</span>
        <div className="flex items-center gap-1 rounded-lg bg-slate-900/90 p-1 border border-slate-800">
          <button
            type="button"
            onClick={() => setDetectionMode('ocr')}
            className={`flex items-center gap-1 rounded px-2.5 py-1 text-[11px] font-semibold transition-colors cursor-pointer ${
              detectionMode === 'ocr'
                ? 'bg-gradient-to-r from-cyan-600 to-indigo-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Type className="h-3 w-3" />
            <span>Printed Text (OCR)</span>
          </button>
          <button
            type="button"
            onClick={() => setDetectionMode('digit')}
            className={`flex items-center gap-1 rounded px-2.5 py-1 text-[11px] font-semibold transition-colors cursor-pointer ${
              detectionMode === 'digit'
                ? 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Hash className="h-3 w-3" />
            <span>Single Digit (CNN)</span>
          </button>
        </div>
      </div>

      {/* Upload Box / Dropzone */}
      {!selectedImage ? (
        <div
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`flex aspect-square w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center transition-all cursor-pointer ${
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

          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <Upload className="h-7 w-7" />
          </div>

          <h3 className="text-sm font-bold text-white mb-1">Upload or Drag Image</h3>
          <p className="text-xs text-slate-400 max-w-xs mb-3">
            Upload printed receipts, documents, license plates, or handwritten numbers
          </p>

          <span className="rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500 transition-colors">
            Browse File
          </span>
        </div>
      ) : (
        /* Image Preview Box */
        <div className="relative aspect-square w-full overflow-hidden rounded-2xl border-2 border-slate-800 bg-black shadow-2xl flex items-center justify-center">
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
      <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-400">
        <span className="text-[11px] text-slate-500">Demo samples:</span>
        <button
          type="button"
          onClick={() => loadSampleImage('invoice')}
          className="rounded-md border border-slate-800 bg-slate-900 px-2 py-0.5 text-[11px] font-medium text-slate-300 hover:border-slate-700 hover:text-white transition-colors cursor-pointer"
        >
          Invoice Text
        </button>
        <button
          type="button"
          onClick={() => loadSampleImage('digits')}
          className="rounded-md border border-slate-800 bg-slate-900 px-2 py-0.5 text-[11px] font-medium text-slate-300 hover:border-slate-700 hover:text-white transition-colors cursor-pointer"
        >
          Printed Numbers
        </button>
        <button
          type="button"
          onClick={() => loadSampleImage('digit7')}
          className="rounded-md border border-slate-800 bg-slate-900 px-2 py-0.5 text-[11px] font-medium text-slate-300 hover:border-slate-700 hover:text-white transition-colors cursor-pointer"
        >
          Digit "7"
        </button>
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
      <div className="mt-5 w-full">
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
              : detectionMode === 'ocr'
              ? 'Extract Printed Text (Tesseract OCR)'
              : 'Detect Digit (CNN Model)'}
          </span>
        </button>
      </div>
    </div>
  );
};
