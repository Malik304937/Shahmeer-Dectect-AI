import React, { useState } from 'react';
import { Database, Network, Cpu, Sliders, ArrowRight, CheckCircle, Info, Type } from 'lucide-react';

export const HowItWorks: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dataset' | 'preprocessing' | 'cnn' | 'ocr' | 'inference'>('dataset');

  return (
    <section id="how-it-works" className="mt-12 w-full rounded-2xl border border-slate-800 bg-slate-900/40 p-6 sm:p-8 backdrop-blur-sm">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-slate-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-semibold">
            <Info className="h-4 w-4" />
            <span>Shahmeer Detect AI · Architecture & Science Briefing</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white mt-1">
            How Shahmeer Detect AI Recognizes Numbers & Text
          </h2>
        </div>

        {/* Tab selection */}
        <div className="flex items-center gap-1 rounded-xl bg-slate-950/80 p-1 border border-slate-800 self-start sm:self-auto overflow-x-auto max-w-full">
          <button
            onClick={() => setActiveTab('dataset')}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'dataset'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            1. MNIST Dataset
          </button>
          <button
            onClick={() => setActiveTab('preprocessing')}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'preprocessing'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            2. Preprocessing
          </button>
          <button
            onClick={() => setActiveTab('cnn')}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'cnn'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            3. The CNN
          </button>
          <button
            onClick={() => setActiveTab('ocr')}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'ocr'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            4. Tesseract OCR
          </button>
          <button
            onClick={() => setActiveTab('inference')}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'inference'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            5. In-Browser AI
          </button>
        </div>
      </div>

      {/* Tab 1: MNIST Dataset */}
      {activeTab === 'dataset' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          <div className="md:col-span-2 space-y-3 text-sm text-slate-300 leading-relaxed">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Database className="h-4 w-4 text-indigo-400" />
              The MNIST Benchmark: The "Hello World" of Computer Vision
            </h3>
            <p>
              In machine learning, <strong className="text-cyan-300">MNIST</strong> (Modified National Institute of Standards and Technology) is a legendary benchmark dataset created in 1998 by Yann LeCun, Corinna Cortes, and Christopher Burges.
            </p>
            <p className="text-slate-400">
              It comprises 70,000 standardized 28×28 pixel grayscale images of digits (0 through 9), originally written by American high school students and US Census Bureau employees. Every machine learning student uses MNIST to learn how artificial vision works.
            </p>
            <div className="pt-2 flex flex-wrap gap-2 text-xs">
              <span className="rounded-md bg-slate-800 px-2.5 py-1 text-slate-300 font-mono">
                Size: 28 × 28 pixels (784 features)
              </span>
              <span className="rounded-md bg-slate-800 px-2.5 py-1 text-slate-300 font-mono">
                Classes: 10 digits (0 to 9)
              </span>
              <span className="rounded-md bg-slate-800 px-2.5 py-1 text-slate-300 font-mono">
                Training Subset: 12,000 images
              </span>
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 space-y-2.5 text-xs">
            <span className="font-semibold text-slate-200 block">Why MNIST Matters for Science:</span>
            <ul className="space-y-2 text-slate-400">
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Provides a scientifically verified ground truth label for every digit.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Proves that simple visual features combine mathematically into complex recognition.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Small enough to train entirely inside your browser in under 10 seconds!</span>
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* Tab 2: Preprocessing Pipeline */}
      {activeTab === 'preprocessing' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
            <span className="font-mono text-xs font-bold text-cyan-400 block mb-1">Step 1</span>
            <h4 className="text-sm font-bold text-white mb-1.5">Polarity Inversion</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              MNIST digits are white strokes on black backgrounds (0 = black, 255 = stroke). If you hold up black ink on white paper, the algorithm calculates border luminance and automatically flips it.
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
            <span className="font-mono text-xs font-bold text-cyan-400 block mb-1">Step 2</span>
            <h4 className="text-sm font-bold text-white mb-1.5">Bounding Box Crop</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Finds the tightest rectangle enclosing all stroke pixels above the noise threshold, discarding irrelevant empty paper or camera surroundings.
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
            <span className="font-mono text-xs font-bold text-cyan-400 block mb-1">Step 3</span>
            <h4 className="text-sm font-bold text-white mb-1.5">20×20 Proportional Scale</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Scales the cropped digit so its longest edge is exactly 20 pixels, strictly preserving the natural aspect ratio without squishing tall '1's or wide '0's.
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
            <span className="font-mono text-xs font-bold text-cyan-400 block mb-1">Step 4</span>
            <h4 className="text-sm font-bold text-white mb-1.5">Center of Mass Alignment</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Computes the mathematical center of mass of all pixel intensities and translates the digit so its center aligns precisely at (13.5, 13.5) inside the 28×28 grid.
            </p>
          </div>
        </div>
      )}

      {/* Tab 3: The CNN */}
      {activeTab === 'cnn' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
            <div className="rounded-xl border border-indigo-500/30 bg-indigo-950/20 p-3.5">
              <span className="font-mono text-[10px] text-indigo-300 font-bold block">Layer 1</span>
              <h4 className="text-xs font-bold text-white mt-0.5">Conv2D (16 filters)</h4>
              <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                Sixteen 3×3 sliding filters detect elementary edges, diagonals, and pen strokes.
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5">
              <span className="font-mono text-[10px] text-slate-400 font-bold block">Layer 2</span>
              <h4 className="text-xs font-bold text-white mt-0.5">MaxPool2D (2×2)</h4>
              <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                Halves spatial resolution to 14×14 while making detection invariant to small shifts.
              </p>
            </div>

            <div className="rounded-xl border border-cyan-500/30 bg-cyan-950/20 p-3.5">
              <span className="font-mono text-[10px] text-cyan-300 font-bold block">Layer 3</span>
              <h4 className="text-xs font-bold text-white mt-0.5">Conv2D (32 filters)</h4>
              <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                Thirty-two 3×3 filters combine lines into loops (8, 0, 6), curves (3, 5), and junctions.
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5">
              <span className="font-mono text-[10px] text-slate-400 font-bold block">Layer 4</span>
              <h4 className="text-xs font-bold text-white mt-0.5">Dense (64 units)</h4>
              <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                Fully connected ReLU layer aggregates abstract pattern combinations with 25% dropout.
              </p>
            </div>

            <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-3.5">
              <span className="font-mono text-[10px] text-emerald-300 font-bold block">Layer 5</span>
              <h4 className="text-xs font-bold text-white mt-0.5">Softmax (10 outputs)</h4>
              <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                Outputs a normalized probability distribution where all 10 digit scores sum to 100%.
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-slate-800/80 bg-slate-950/40 p-4 text-xs text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-3">
            <span>
              <strong>Loss Function:</strong> Categorical Crossentropy · <strong>Optimizer:</strong> Adam (lr = 0.001) · <strong>Total Weights:</strong> ~45,000 parameters
            </span>
            <span className="font-mono text-emerald-400 font-semibold shrink-0">
              Benchmark Accuracy: ~96–98%
            </span>
          </div>
        </div>
      )}

      {/* Tab 4: Tesseract OCR */}
      {activeTab === 'ocr' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400 mb-2.5">
              <Type className="h-4 w-4" />
            </div>
            <h4 className="text-sm font-bold text-white mb-1">Optical Character Recognition</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Tesseract.js analyzes full printed documents, receipts, invoices, and signs by detecting baselines, word boundaries, and character glyph geometries.
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400 mb-2.5">
              <Database className="h-4 w-4" />
            </div>
            <h4 className="text-sm font-bold text-white mb-1">Multi-Line & Numeric Parsing</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Capable of reading sentences, paragraphs, alphanumeric codes, dates, phone numbers, and serial tags across complex real-world photographic backgrounds.
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/10 text-purple-400 mb-2.5">
              <CheckCircle className="h-4 w-4" />
            </div>
            <h4 className="text-sm font-bold text-white mb-1">WebAssembly Acceleration</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Tesseract's C++ optical engine compiles directly into WebAssembly (WASM), running inside Web Workers for instantaneous local text extraction without freezing the UI.
            </p>
          </div>
        </div>
      )}

      {/* Tab 5: In-Browser AI */}
      {activeTab === 'inference' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400 mb-2.5">
              <Cpu className="h-4 w-4" />
            </div>
            <h4 className="text-sm font-bold text-white mb-1">WebGL Hardware Acceleration</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              TensorFlow.js compiles matrix multiplications into WebGL fragment shaders, executing forward passes directly on your device's GPU in under 15 milliseconds.
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400 mb-2.5">
              <Database className="h-4 w-4" />
            </div>
            <h4 className="text-sm font-bold text-white mb-1">IndexedDB Persistence</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              After training, model topology and weight tensors are serialized into your browser's persistent IndexedDB storage, enabling instant offline reloads with zero re-training.
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 mb-2.5">
              <CheckCircle className="h-4 w-4" />
            </div>
            <h4 className="text-sm font-bold text-white mb-1">100% Client-Side Privacy</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              No images, drawings, or camera frames ever leave your device. All computer vision and neural inference happen entirely inside your local sandbox.
            </p>
          </div>
        </div>
      )}
    </section>
  );
};
