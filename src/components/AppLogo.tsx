import React from 'react';

interface AppLogoProps {
  className?: string;
  size?: number;
}

export const AppLogo: React.FC<AppLogoProps> = ({ className = 'h-10 w-10', size = 40 }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      fill="none"
      width={size}
      height={size}
      className={`shrink-0 ${className}`}
    >
      <defs>
        <linearGradient id="logoBgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#17224d" />
          <stop offset="100%" stopColor="#0c1126" />
        </linearGradient>
        <filter id="logoGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Rounded dark-blue square container */}
      <rect
        x="3"
        y="3"
        width="94"
        height="94"
        rx="22"
        fill="url(#logoBgGrad)"
        stroke="#273570"
        strokeWidth="2.5"
      />

      {/* Four glowing cyan-to-purple scan-corner brackets */}
      {/* Top-left: cyan */}
      <path
        d="M 23 37 L 23 27 C 23 24.5 24.5 23 27 23 L 37 23"
        stroke="#38bdf8"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter="url(#logoGlow)"
      />
      {/* Top-right: purple */}
      <path
        d="M 63 23 L 73 23 C 75.5 23 77 24.5 77 27 L 77 37"
        stroke="#a855f7"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter="url(#logoGlow)"
      />
      {/* Bottom-left: cyan */}
      <path
        d="M 23 63 L 23 73 C 23 75.5 24.5 77 27 77 L 37 77"
        stroke="#06b6d4"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter="url(#logoGlow)"
      />
      {/* Bottom-right: purple/magenta */}
      <path
        d="M 63 77 L 73 77 C 75.5 77 77 75.5 77 73 L 77 63"
        stroke="#c084fc"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter="url(#logoGlow)"
      />

      {/* Horizontal dashed scan guideline */}
      <line
        x1="16"
        y1="50"
        x2="84"
        y2="50"
        stroke="#38bdf8"
        strokeWidth="2"
        strokeDasharray="4 3"
        opacity="0.45"
      />

      {/* White handwritten 7 stroke */}
      <path
        d="M 33 40 L 67 40 L 48 70"
        stroke="#ffffff"
        strokeWidth="7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Small cyan and purple dots at the corners of the 7 */}
      <circle cx="33" cy="40" r="5.5" fill="#38bdf8" />
      <circle cx="67" cy="40" r="5.5" fill="#22d3ee" />
      <circle cx="48" cy="70" r="5.5" fill="#c084fc" />
    </svg>
  );
};
