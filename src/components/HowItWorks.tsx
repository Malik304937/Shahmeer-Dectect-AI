import React, { useState } from 'react';
import { Database, Cpu, CheckCircle, Info, Type, Layers } from 'lucide-react';

export const HowItWorks: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'examples' | 'dataset' | 'preprocessing' | 'cnn' | 'ocr'>('examples');

  return (
    <section id="how-it-works" className="mt-12 w-full rounded-2xl border border-slate-800 bg-slate-900/40 p-6 sm:p-8 backdrop-blur-sm">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-slate-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-semibold">
            <Info className="h-4 w-4" />
            <span>Shahmeer Detect AI · Architecture & Science Briefing</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white mt-1">
            How Shahmeer Detect AI Recognizes Numbers & Letters
          </h2>
        </div>

        {/* Tab selection */}
        <div className="flex items-center gap-1 rounded-xl bg-slate-950/80 p-1 border border-slate-800 self-start sm:self-auto overflow-x-auto max-w-full">
          <button
            onClick={() => setActiveTab('examples')}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'examples'
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Examples: 7, 42, 305 & ABC
          </button>
          <button
            onClick={() => setActiveTab('dataset')}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'dataset'
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            1. MNIST Dataset
          </button>
          <button
            onClick={() => setActiveTab('preprocessing')}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'preprocessing'
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            2. Multi-Digit Segmentation
          </button>
          <button
            onClick={() => setActiveTab('cnn')}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'cnn'
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            3. The CNN
          </button>
          <button
            onClick={() => setActiveTab('ocr')}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'ocr'
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            4. Letter OCR (A-Z)
          </button>
        </div>
      </div>

      {/* Tab 0: Core Examples (7, 42, 305 & ABC) (Requirement 6) */}
      {activeTab === 'examples' && (
        <div className="space-y-4">
          <p className="text-xs sm:text-sm text-slate-300">
            Shahmeer Detect AI combines <strong>Column Gap Segmentation</strong> with a <strong>Convolutional Neural Network</strong> for multi-digit numbers, and <strong>Tesseract OCR</strong> for Latin letters:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {/* Example 7 */}
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-2xl font-black text-cyan-300">7</span>
                  <span className="rounded bg-cyan-950 px-2 py-0.5 text-[10px] font-mono text-cyan-400 border border-cyan-800">
                    Single Digit
                  </span>
                </div>
                <h4 className="text-xs font-bold text-white mb-1">Single Digit Pipeline</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  A single column segment is detected. The digit "7" is cropped, scaled into a 20×20 box, centered in a 28×28 grid by center-of-mass, and classified with high certainty.
                </p>
              </div>
              <div className="mt-3 text-[10px] text-slate-500 font-mono">
                Segments: 1 · Result: "7"
              </div>
            </div>

            {/* Example 42 */}
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-2xl font-black text-indigo-300">42</span>
                  <span className="rounded bg-indigo-950 px-2 py-0.5 text-[10px] font-mono text-indigo-400 border border-indigo-800">
                    2 Digits
                  </span>
                </div>
                <h4 className="text-xs font-bold text-white mb-1">Two-Digit Segmentation</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Column projection spots a clear vertical gap between "4" and "2". Each digit is preprocessed separately, evaluated via the CNN, and concatenated left-to-right into "42".
                </p>
              </div>
              <div className="mt-3 text-[10px] text-slate-500 font-mono">
                Segments: 2 · Result: "42"
              </div>
            </div>

            {/* Example 305 */}
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-2xl font-black text-emerald-300">305</span>
                  <span className="rounded bg-emerald-950 px-2 py-0.5 text-[10px] font-mono text-emerald-400 border border-emerald-800">
                    3 Digits
                  </span>
                </div>
                <h4 className="text-xs font-bold text-white mb-1">Three-Digit Segmentation</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Identifies two clear vertical gaps separating columns: [3] - gap - [0] - gap - [5]. All 3 are recognized in parallel and joined into the full number "305" with individual confidences.
                </p>
              </div>
              <div className="mt-3 text-[10px] text-slate-500 font-mono">
                Segments: 3 · Result: "305"
              </div>
            </div>

            {/* Example ABC */}
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-2xl font-black text-purple-300">ABC</span>
                  <span className="rounded bg-purple-950 px-2 py-0.5 text-[10px] font-mono text-purple-400 border border-purple-800">
                    Letters (A-Z)
                  </span>
                </div>
                <h4 className="text-xs font-bold text-white mb-1">Alphabet OCR Whitelist</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  In Letters mode, strokes are thickened and scaled 2x to white background black ink. Tesseract parses Latin letter glyphs (A-Z) with a strict character whitelist.
                </p>
              </div>
              <div className="mt-3 text-[10px] text-slate-500 font-mono">
                Engine: Tesseract · Result: "ABC"
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 1: MNIST Dataset */}
      {activeTab === 'dataset' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          <div className="md:col-span-2 space-y-3 text-sm text-slate-300 leading-relaxed">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Database className="h-4 w-4 text-cyan-400" />
              The MNIST Benchmark: The "Hello World" of Computer Vision
            </h3>
            <p>
              In machine learning, <strong className="text-cyan-300">MNIST</strong> (Modified National Institute of Standards and Technology) is a legendary benchmark dataset created in 1998 by Yann LeCun, Corinna Cortes, and Christopher Burges.
            </p>
            <p className="text-slate-400">
              It comprises standardized 28×28 pixel grayscale images of digits (0 through 9), originally written by American high school students and US Census Bureau employees. Every machine learning student uses MNIST to learn how artificial vision works.
            </p>
            <div className="pt-2 flex flex-wrap gap-2 text-xs">
              <span className="rounded-md bg-slate-800 px-2.5 py-1 text-slate-300 font-mono">
                Input Shape: 28 × 28 pixels
              </span>
              <span className="rounded-md bg-slate-800 px-2.5 py-1 text-slate-300 font-mono">
                Classes: 10 digits (0 to 9)
              </span>
              <span className="rounded-md bg-slate-800 px-2.5 py-1 text-slate-300 font-mono">
                Fast Training: 8,000 samples · 3 epochs
              </span>
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 space-y-2.5 text-xs">
            <span className="font-semibold text-slate-200 block">Highlights:</span>
            <ul className="space-y-2 text-slate-400">
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Provides ground truth labels for digits 0 through 9.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Supports multi-digit concatenation up to 3 digits (e.g. 7, 42, 305).</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Runs 100% locally in the browser with WebGL GPU acceleration.</span>
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* Tab 2: Multi-Digit Segmentation */}
      {activeTab === 'preprocessing' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
            <span className="font-mono text-xs font-bold text-cyan-400 block mb-1">Step 1</span>
            <h4 className="text-sm font-bold text-white mb-1.5">Polarity Inversion</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Calculates border luminance. Dark ink on light paper is flipped to white strokes on a black background, matching MNIST training distribution.
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
            <span className="font-mono text-xs font-bold text-cyan-400 block mb-1">Step 2</span>
            <h4 className="text-sm font-bold text-white mb-1.5">Column Projection</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Scans all columns from left to right. When columns contain no ink for 4+ consecutive pixels, it marks a vertical gap separating digits (e.g. between 4 and 2 in 42).
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
            <span className="font-mono text-xs font-bold text-cyan-400 block mb-1">Step 3</span>
            <h4 className="text-sm font-bold text-white mb-1.5">20×20 Crop & Scale</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Each segmented digit is individually bounded and scaled so its longest dimension fits in 20 pixels while preserving the stroke's aspect ratio.
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
            <span className="font-mono text-xs font-bold text-cyan-400 block mb-1">Step 4</span>
            <h4 className="text-sm font-bold text-white mb-1.5">Center of Mass Alignment</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Calculates pixel mass center and shifts the digit directly to (13.5, 13.5) inside 28×28. Results are fed through the CNN and joined left to right.
            </p>
          </div>
        </div>
      )}

      {/* Tab 3: The CNN */}
      {activeTab === 'cnn' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
            <div className="rounded-xl border border-cyan-500/30 bg-cyan-950/20 p-3.5">
              <span className="font-mono text-[10px] text-cyan-300 font-bold block">Layer 1</span>
              <h4 className="text-xs font-bold text-white mt-0.5">Conv2D (8 filters, 3×3)</h4>
              <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                8 sliding filters detect elementary edges, diagonals, and pen strokes with ReLU.
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5">
              <span className="font-mono text-[10px] text-slate-400 font-bold block">Layer 2</span>
              <h4 className="text-xs font-bold text-white mt-0.5">MaxPool2D (2×2)</h4>
              <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                Halves spatial resolution to 13×13 while conferring translation invariance.
              </p>
            </div>

            <div className="rounded-xl border border-indigo-500/30 bg-indigo-950/20 p-3.5">
              <span className="font-mono text-[10px] text-indigo-300 font-bold block">Layer 3</span>
              <h4 className="text-xs font-bold text-white mt-0.5">Conv2D (16 filters, 3×3)</h4>
              <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                16 filters combine lines into loops (8, 0, 6), curves (3, 5), and junctions.
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5">
              <span className="font-mono text-[10px] text-slate-400 font-bold block">Layer 4</span>
              <h4 className="text-xs font-bold text-white mt-0.5">Dense (32 units, ReLU)</h4>
              <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                Dense representation layer for fast, accurate classification.
              </p>
            </div>

            <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-3.5">
              <span className="font-mono text-[10px] text-emerald-300 font-bold block">Layer 5</span>
              <h4 className="text-xs font-bold text-white mt-0.5">Softmax (10 outputs)</h4>
              <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                Outputs probabilities for digits 0 through 9 summing to 100%.
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-slate-800/80 bg-slate-950/40 p-4 text-xs text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-3">
            <span>
              <strong>Optimizer:</strong> Adam (lr = 0.003) · <strong>Total Parameters:</strong> 14,410 · <strong>Batch Size:</strong> 64
            </span>
            <span className="font-mono text-emerald-400 font-semibold shrink-0">
              Trained on 8,000 images · Tested on 500 images
            </span>
          </div>
        </div>
      )}

      {/* Tab 4: Letter OCR (A-Z) */}
      {activeTab === 'ocr' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400 mb-2.5">
              <Type className="h-4 w-4" />
            </div>
            <h4 className="text-sm font-bold text-white mb-1">Latin Character Whitelist</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Tesseract.js is constrained to character whitelist: <code>A-Z, a-z</code>. This eliminates numeric and symbol misclassifications when the user intends to draw or scan letters.
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400 mb-2.5">
              <Layers className="h-4 w-4" />
            </div>
            <h4 className="text-sm font-bold text-white mb-1">Thick Stroke & 2x Upscaling</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Draw canvas inputs are dynamically converted to high-contrast black ink on pure white background, thickened with circular dilation, and upscaled 2x for optimal OCR recognition.
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/10 text-purple-400 mb-2.5">
              <CheckCircle className="h-4 w-4" />
            </div>
            <h4 className="text-sm font-bold text-white mb-1">WebAssembly Execution</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Tesseract's engine executes client-side inside Web Workers via WebAssembly, guaranteeing fast response times and complete device privacy.
            </p>
          </div>
        </div>
      )}
    </section>
  );
};
