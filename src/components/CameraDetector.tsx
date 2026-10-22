import React, { useRef, useState, useEffect, useCallback } from 'react';
import { SwitchCamera, AlertTriangle, Wand2, RefreshCw, Flashlight } from 'lucide-react';
import { DetectionCategory } from '../types.ts';

interface CameraDetectorProps {
  onDetect: (canvas: HTMLCanvasElement, contrastOverride?: boolean | 'auto') => void;
  isProcessing: boolean;
  onSwitchToDraw: () => void;
  targetType: DetectionCategory;
}

export const CameraDetector: React.FC<CameraDetectorProps> = ({
  onDetect,
  isProcessing,
  onSwitchToDraw,
  targetType,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const guideBoxRef = useRef<HTMLDivElement | null>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [isStarting, setIsStarting] = useState(true);
  const [hasTorch, setHasTorch] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [contrastMode, setContrastMode] = useState<'auto' | 'inverted' | 'normal'>('auto');

  const stopStream = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  }, [stream]);

  const startCamera = useCallback(async () => {
    setIsStarting(true);
    setCameraError(null);
    stopStream();

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access API is not supported in this browser environment.');
      }

      let mediaStream: MediaStream;
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: facingMode },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });
      } catch (err) {
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      }

      setStream(mediaStream);

      const videoTrack = mediaStream.getVideoTracks()[0];
      if (videoTrack) {
        const capabilities: any = videoTrack.getCapabilities ? videoTrack.getCapabilities() : {};
        setHasTorch(Boolean(capabilities?.torch));
      }

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setIsStarting(false);
    } catch (err: any) {
      console.error('Camera initialization failed:', err);
      setIsStarting(false);
      let message = 'Unable to access camera.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        message = 'Camera permission was denied. Please allow camera access in your browser settings.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        message = 'No camera device found on your hardware. Please use Draw mode instead.';
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        message = 'Camera is already in use by another application or tab.';
      } else {
        message = err.message || 'Camera failed to start.';
      }
      setCameraError(message);
    }
  }, [facingMode, stopStream]);

  useEffect(() => {
    startCamera();
    return () => {
      stopStream();
    };
  }, [startCamera, stopStream]);

  const toggleTorch = async () => {
    if (!stream) return;
    const track: any = stream.getVideoTracks()[0];
    if (track && track.applyConstraints) {
      try {
        const nextState = !torchOn;
        await track.applyConstraints({
          advanced: [{ torch: nextState }],
        });
        setTorchOn(nextState);
      } catch (e) {
        console.warn('Torch constraint failed:', e);
      }
    }
  };

  const flipCamera = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  const handleDetect = () => {
    const video = videoRef.current;
    const guideBox = guideBoxRef.current;
    if (!video || !guideBox) return;

    if (video.videoWidth === 0 || video.videoHeight === 0) {
      return;
    }

    const videoRect = video.getBoundingClientRect();
    const guideRect = guideBox.getBoundingClientRect();

    const scaleX = video.videoWidth / videoRect.width;
    const scaleY = video.videoHeight / videoRect.height;

    const relLeft = guideRect.left - videoRect.left;
    const relTop = guideRect.top - videoRect.top;

    const sourceX = Math.max(0, Math.round(relLeft * scaleX));
    const sourceY = Math.max(0, Math.round(relTop * scaleY));
    const sourceW = Math.min(video.videoWidth - sourceX, Math.round(guideRect.width * scaleX));
    const sourceH = Math.min(video.videoHeight - sourceY, Math.round(guideRect.height * scaleY));

    // Capture to offscreen canvas (wide 560x240 aspect)
    const cropCanvas = document.createElement('canvas');
    cropCanvas.width = 560;
    cropCanvas.height = 240;
    const cropCtx = cropCanvas.getContext('2d');
    if (!cropCtx) return;

    if (facingMode === 'user') {
      cropCtx.translate(560, 0);
      cropCtx.scale(-1, 1);
    }

    cropCtx.drawImage(video, sourceX, sourceY, sourceW, sourceH, 0, 0, 560, 240);

    const override =
      contrastMode === 'auto' ? 'auto' : contrastMode === 'inverted' ? true : false;

    onDetect(cropCanvas, override);
  };

  return (
    <div className="flex flex-col items-center w-full max-w-[560px] mx-auto">
      {/* Camera Controls Bar */}
      <div className="mb-3 flex w-full items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-medium text-slate-400">Contrast:</span>
          <div className="flex items-center gap-1 rounded-lg bg-slate-900/90 p-1 border border-slate-800">
            <button
              type="button"
              onClick={() => setContrastMode('auto')}
              className={`rounded px-2.5 py-0.5 text-[11px] font-semibold transition-colors cursor-pointer ${
                contrastMode === 'auto'
                  ? 'bg-cyan-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Auto
            </button>
            <button
              type="button"
              onClick={() => setContrastMode('inverted')}
              title="Black ink on white paper"
              className={`rounded px-2.5 py-0.5 text-[11px] font-semibold transition-colors cursor-pointer ${
                contrastMode === 'inverted'
                  ? 'bg-cyan-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Paper
            </button>
            <button
              type="button"
              onClick={() => setContrastMode('normal')}
              title="White digit on dark surface"
              className={`rounded px-2.5 py-0.5 text-[11px] font-semibold transition-colors cursor-pointer ${
                contrastMode === 'normal'
                  ? 'bg-cyan-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Chalk
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {hasTorch && (
            <button
              type="button"
              onClick={toggleTorch}
              className={`flex items-center gap-1 text-[11px] transition-colors cursor-pointer ${
                torchOn ? 'text-amber-400' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Toggle Flashlight"
            >
              <Flashlight className="h-3.5 w-3.5" />
              <span>{torchOn ? 'Torch On' : 'Torch'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={flipCamera}
            className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
            title="Switch front/back camera"
          >
            <SwitchCamera className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">
              {facingMode === 'environment' ? 'Back' : 'Front'}
            </span>
          </button>
        </div>
      </div>

      {/* Camera Viewport Container */}
      <div className="relative w-full h-[220px] sm:h-[260px] md:h-[280px] overflow-hidden rounded-2xl border-2 border-slate-800 bg-black shadow-2xl">
        {/* Live Video Feed */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`h-full w-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
        />

        {/* Loading Overlay */}
        {isStarting && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950 p-6 text-center">
            <RefreshCw className="h-8 w-8 animate-spin text-cyan-400 mb-3" />
            <p className="text-sm font-semibold text-slate-200">Starting device camera...</p>
            <p className="text-xs text-slate-500 mt-1">Please allow camera permissions if prompted</p>
          </div>
        )}

        {/* Camera Error Overlay */}
        {cameraError && !isStarting && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/95 p-6 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <h3 className="text-sm font-bold text-white mb-1">Camera Unavailable</h3>
            <p className="text-xs text-slate-400 mb-4 max-w-xs">{cameraError}</p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={startCamera}
                className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition-colors cursor-pointer"
              >
                <RefreshCw className="h-3 w-3" />
                <span>Retry</span>
              </button>
              <button
                type="button"
                onClick={onSwitchToDraw}
                className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500 transition-colors cursor-pointer"
              >
                Switch to Draw Tab
              </button>
            </div>
          </div>
        )}

        {/* Wide Guide Rectangle for 1-3 digits or letters */}
        {!cameraError && !isStarting && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-4">
            <div
              ref={guideBoxRef}
              className="relative w-full max-w-[340px] sm:max-w-[420px] h-[140px] sm:h-[180px] rounded-xl border border-cyan-400/40 shadow-[0_0_0_9999px_rgba(0,0,0,0.55)]"
            >
              {/* Corner reticles */}
              <div className="absolute -top-1 -left-1 h-5 w-5 border-t-2 border-l-2 border-cyan-400" />
              <div className="absolute -top-1 -right-1 h-5 w-5 border-t-2 border-r-2 border-cyan-400" />
              <div className="absolute -bottom-1 -left-1 h-5 w-5 border-b-2 border-l-2 border-cyan-400" />
              <div className="absolute -bottom-1 -right-1 h-5 w-5 border-b-2 border-r-2 border-cyan-400" />

              {/* Subdued horizontal line */}
              <div className="absolute top-1/2 left-0 w-full h-[1px] bg-cyan-400/30 -translate-y-1/2 border-dashed" />

              {/* Alignment Tip */}
              <div className="absolute -bottom-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-900/90 px-2.5 py-0.5 text-[10px] font-medium text-cyan-300 backdrop-blur-sm border border-cyan-500/20">
                {targetType === 'numbers' ? 'Hold 1–3 digits with clear gaps' : 'Hold letters inside frame'}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Detect Button */}
      <div className="mt-4 w-full">
        <button
          type="button"
          onClick={handleDetect}
          disabled={!stream || isProcessing || !!cameraError}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 via-indigo-600 to-purple-600 py-3 text-sm font-bold text-white shadow-lg shadow-cyan-500/20 hover:from-cyan-400 hover:via-indigo-500 hover:to-purple-500 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none transition-all active:scale-[0.98] cursor-pointer"
        >
          <Wand2 className="h-4 w-4" />
          <span>
            {isProcessing
              ? 'Recognizing...'
              : targetType === 'numbers'
              ? 'Capture & Detect Number'
              : 'Capture & Detect Letters'}
          </span>
        </button>
      </div>
    </div>
  );
};
