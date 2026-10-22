import React from 'react';
import { Cpu, BookOpen } from 'lucide-react';
import { AppLogo } from './AppLogo.tsx';

interface HeaderProps {
  modelStatus: 'ready' | 'loading' | 'training' | 'error';
  isCached: boolean;
  onOpenModelInfo: () => void;
  onScrollToExplanation: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  modelStatus,
  isCached,
  onOpenModelInfo,
  onScrollToExplanation,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        {/* Brand Zone with custom Logo */}
        <div className="flex items-center gap-3 shrink-0">
          <AppLogo size={42} className="h-10 w-10 drop-shadow-md" />
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white whitespace-nowrap flex items-center gap-1.5">
              <span>Shahmeer</span>
              <span className="bg-gradient-to-r from-cyan-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
                Detect AI
              </span>
            </h1>
            <p className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
              SEE · DETECT · LEARN
            </p>
          </div>
        </div>

        {/* Center / Nav Zone */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-400">
          <button
            onClick={onScrollToExplanation}
            className="flex items-center gap-1.5 hover:text-slate-200 transition-colors cursor-pointer"
          >
            <BookOpen className="h-4 w-4 text-cyan-400" />
            <span>How Neural Nets & OCR Work</span>
          </button>
        </nav>

        {/* Action Zone */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={onOpenModelInfo}
            className="flex items-center gap-2 rounded-lg border border-slate-700/80 bg-slate-900/80 px-3 py-1.5 text-xs font-medium text-slate-200 hover:border-slate-600 hover:bg-slate-800 transition-colors shadow-sm cursor-pointer"
            title="Inspect neural network model architecture or retrain"
          >
            <Cpu className="h-3.5 w-3.5 text-cyan-400" />
            <span className="hidden sm:inline">CNN Model</span>
            <span
              className={`inline-block h-2 w-2 rounded-full ${
                modelStatus === 'ready'
                  ? 'bg-emerald-400'
                  : modelStatus === 'training'
                  ? 'bg-amber-400 animate-pulse'
                  : 'bg-rose-400'
              }`}
            />
            {isCached && <span className="text-[10px] text-slate-400 hidden lg:inline">Cached</span>}
          </button>
        </div>
      </div>
    </header>
  );
};
