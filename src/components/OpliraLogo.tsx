import React, { useState } from 'react';

interface OpliraLogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
}

export const OpliraLogo: React.FC<OpliraLogoProps> = ({
  className = '',
  size = 36,
  showText = false,
}) => {
  const [imageError, setImageError] = useState(false);

  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      {!imageError ? (
        <img
          src="/icon.png"
          alt="Oplira Logo"
          width={size}
          height={size}
          onError={() => setImageError(true)}
          referrerPolicy="no-referrer"
          className="rounded-xl object-contain shadow-2xs flex-shrink-0"
          style={{ width: `${size}px`, height: `${size}px` }}
        />
      ) : (
        <svg
          width={size}
          height={size}
          viewBox="0 0 120 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="flex-shrink-0"
        >
          <defs>
            <linearGradient id="opliraRingGradient" x1="15" y1="15" x2="105" y2="105" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#00A8FF" />
              <stop offset="45%" stopColor="#0066FF" />
              <stop offset="100%" stopColor="#6C2BD9" />
            </linearGradient>
            <linearGradient id="signatureGrad" x1="42" y1="52" x2="68" y2="62" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#0284C7" />
              <stop offset="100%" stopColor="#2563EB" />
            </linearGradient>
          </defs>

          <circle
            cx="60"
            cy="60"
            r="48"
            stroke="url(#opliraRingGradient)"
            strokeWidth="11"
            fill="#FFFFFF"
          />

          <rect
            x="44"
            y="31"
            width="32"
            height="54"
            rx="6"
            fill="#0F172A"
          />

          <rect
            x="47"
            y="37"
            width="26"
            height="41"
            rx="2"
            fill="#FFFFFF"
          />

          <rect
            x="56"
            y="33.5"
            width="8"
            height="1.5"
            rx="0.75"
            fill="#64748B"
          />

          <circle
            cx="60"
            cy="81.5"
            r="1.8"
            fill="#E2E8F0"
          />

          <path
            d="M 51 58 C 52 50, 56 46, 57 47 C 58 48, 56 57, 56 61 C 58 57, 61 54, 64 56 C 66 57.5, 65 61, 68 60"
            stroke="url(#signatureGrad)"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          <circle cx="64" cy="51" r="1.2" fill="#0284C7" />

          <g id="hand-touch">
            <path
              d="M 64 57 C 62 55, 66 48, 71 52 L 77 60 C 80 62, 82 62, 84 65 C 87 69, 87 75, 84 79 L 78 84 C 75 86, 70 85, 67 80 L 61 72 C 60 70, 62 67, 65 67 L 70 67"
              fill="#FFFFFF"
              stroke="#0F172A"
              strokeWidth="3.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M 73 66 C 76 68, 78 71, 79 74"
              stroke="#0F172A"
              strokeWidth="2"
              strokeLinecap="round"
              fill="none"
            />
          </g>
        </svg>
      )}

      {/* Optional Wordmark */}
      {showText && (
        <span className="font-extrabold tracking-tight text-slate-900 text-xl font-sans">
          Oplira
        </span>
      )}
    </div>
  );
};
