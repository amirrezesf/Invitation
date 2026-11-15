import React, { useState } from 'react';
import { InviteType } from '../types/invite';

interface CafeLogoProps {
  logo: string;
  name: string;
  primaryColor?: string;
  accentColor?: string;
  size?: number;
  className?: string;
}

export const CafeLogo: React.FC<CafeLogoProps> = ({
  logo,
  name,
  primaryColor = '#5C242E',
  accentColor = '#C86D51',
  size = 44,
  className = '',
}) => {
  const [imgError, setImgError] = useState(false);

  const isCustomImage =
    !imgError &&
    (logo.startsWith('http://') ||
      logo.startsWith('https://') ||
      logo.startsWith('data:image/'));

  if (isCustomImage) {
    return (
      <img
        src={logo}
        alt={name}
        referrerPolicy="no-referrer"
        onError={() => setImgError(true)}
        style={{ width: size, height: size }}
        className={`rounded-2xl object-cover shrink-0 border border-black/10 ${className}`}
      />
    );
  }

  return (
    <div
      style={{
        width: size,
        height: size,
        backgroundColor: '#FFF8F2',
        borderColor: `${primaryColor}26`,
      }}
      className={`rounded-2xl border flex items-center justify-center shrink-0 shadow-xs ${className}`}
      aria-label={name}
    >
      {logo === 'cup' && (
        <svg viewBox="0 0 48 48" className="w-[72%] h-[72%]" fill="none">
          <path
            d="M11 19h20v11a10 10 0 0 1-10 10h0a10 10 0 0 1-10-10V19Z"
            fill={primaryColor}
            fillOpacity="0.14"
            stroke={primaryColor}
            strokeWidth="2.4"
            strokeLinejoin="round"
          />
          <path
            d="M31 21h3.5a4.5 4.5 0 0 1 0 9H31"
            stroke={primaryColor}
            strokeWidth="2.4"
            strokeLinecap="round"
          />
          <path d="M16 13c0-2.5 2-3.5 2-6M22 13c0-2.5 2-3.5 2-6" stroke={accentColor} strokeWidth="2.2" strokeLinecap="round" />
          <path d="M9 40h24" stroke={primaryColor} strokeWidth="2.4" strokeLinecap="round" />
        </svg>
      )}
      {logo === 'leaf' && (
        <svg viewBox="0 0 48 48" className="w-[72%] h-[72%]" fill="none">
          <path
            d="M37 11C21 11 11 20 11 35c14 0 26-9 26-24Z"
            fill={accentColor}
            fillOpacity="0.2"
            stroke={primaryColor}
            strokeWidth="2.4"
            strokeLinejoin="round"
          />
          <path d="M11 37C16 30 23 23 32 17" stroke={primaryColor} strokeWidth="2.4" strokeLinecap="round" />
          <circle cx="24" cy="24" r="3" fill={accentColor} />
        </svg>
      )}
      {logo === 'moon' && (
        <svg viewBox="0 0 48 48" className="w-[72%] h-[72%]" fill="none">
          <path
            d="M31.5 34.5A13 13 0 0 1 17.5 11a13 13 0 1 0 18.5 18.5 12.9 12.9 0 0 1-4.5 5Z"
            fill={accentColor}
            fillOpacity="0.25"
            stroke={primaryColor}
            strokeWidth="2.4"
            strokeLinejoin="round"
          />
          <circle cx="32" cy="14" r="2.2" fill={accentColor} />
          <circle cx="36" cy="20" r="1.5" fill={primaryColor} />
        </svg>
      )}
      {(logo === 'rose' || !['cup', 'leaf', 'moon'].includes(logo)) && (
        <svg viewBox="0 0 48 48" className="w-[76%] h-[76%]" fill="none">
          {/* Botanical Rose + Coffee Cup emblem for کافه رز */}
          <path
            d="M24 10c4.5 0 8 3.2 8 7.5 0 4.5-3.6 8.5-8 8.5s-8-4-8-8.5C16 13.2 19.5 10 24 10Z"
            fill={accentColor}
            fillOpacity="0.22"
            stroke={primaryColor}
            strokeWidth="2.2"
          />
          <path
            d="M20 16.5c1.5-2 6.5-2 8 0-1.2 2.5-4.8 3.2-6 1.2"
            stroke={primaryColor}
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path d="M24 26v13" stroke={primaryColor} strokeWidth="2.2" strokeLinecap="round" />
          <path
            d="M24 33c-4.5 0-7.5-2-8-5 3.5-.5 6.5 1.5 8 5Zm0 1c4.5 0 7.5-2 8-5-3.5-.5-6.5 1.5-8 5Z"
            fill={primaryColor}
            fillOpacity="0.16"
            stroke={primaryColor}
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <circle cx="24" cy="17" r="1.8" fill={accentColor} />
        </svg>
      )}
    </div>
  );
};

interface StickerProps {
  type: InviteType;
  accentColor?: string;
  className?: string;
}

export const InviteTypeSticker: React.FC<StickerProps> = ({
  type,
  accentColor = '#C86D51',
  className = '',
}) => {
  switch (type) {
    case 'date':
      return (
        <svg viewBox="0 0 64 64" className={className} fill="none">
          <rect x="4" y="4" width="56" height="56" rx="18" fill="#FFF" stroke="#E8C6CA" strokeWidth="2" />
          <path
            d="M32 45s-14-8.8-14-18.5a8 8 0 0 1 14-5.2 8 8 0 0 1 14 5.2C46 36.2 32 45 32 45Z"
            fill="#D65A6E"
            fillOpacity="0.22"
            stroke="#B94A5A"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          <path d="M26 25c1.2-1.5 3.5-1.5 4.8 0" stroke="#B94A5A" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case 'friends':
      return (
        <svg viewBox="0 0 64 64" className={className} fill="none">
          <rect x="4" y="4" width="56" height="56" rx="18" fill="#FFF" stroke="#F0D7BA" strokeWidth="2" />
          <path d="M16 26h13v10a6.5 6.5 0 0 1-13 0V26Z" fill={accentColor} fillOpacity="0.25" stroke="#7A3E2B" strokeWidth="2.2" />
          <path d="M35 24h13v10a6.5 6.5 0 0 1-13 0V24Z" fill="#F2B866" fillOpacity="0.35" stroke="#7A3E2B" strokeWidth="2.2" />
          <path d="M29 29h2a3 3 0 0 1 0 6h-2M48 27h2a3 3 0 0 1 0 6h-2" stroke="#7A3E2B" strokeWidth="2" strokeLinecap="round" />
          <path d="M29 15l2 4M35 14l-1 4M32 13v4" stroke={accentColor} strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case 'study':
      return (
        <svg viewBox="0 0 64 64" className={className} fill="none">
          <rect x="4" y="4" width="56" height="56" rx="18" fill="#FFF" stroke="#C5DEC9" strokeWidth="2" />
          <rect x="16" y="19" width="32" height="20" rx="3" fill="#3C6E57" fillOpacity="0.16" stroke="#2F5945" strokeWidth="2.3" />
          <path d="M11 43h42l-3-4H14l-3 4Z" fill="#2F5945" fillOpacity="0.24" stroke="#2F5945" strokeWidth="2.2" strokeLinejoin="round" />
          <path d="M26 27h12M26 32h8" stroke="#2F5945" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case 'vent':
      return (
        <svg viewBox="0 0 64 64" className={className} fill="none">
          <rect x="4" y="4" width="56" height="56" rx="18" fill="#FFF" stroke="#E4CFC3" strokeWidth="2" />
          <path d="M20 28h22v10a11 11 0 0 1-22 0V28Z" fill="#8C5240" fillOpacity="0.18" stroke="#6E3D2E" strokeWidth="2.3" />
          <path d="M42 30h3.5a3.5 3.5 0 0 1 0 7H42" stroke="#6E3D2E" strokeWidth="2.3" />
          <path d="M26 22c0-3 2.5-4 2.5-7M34 22c0-3 2.5-4 2.5-7" stroke="#C86D51" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      );
    case 'owe':
      return (
        <svg viewBox="0 0 64 64" className={className} fill="none">
          <rect x="4" y="4" width="56" height="56" rx="18" fill="#FFF" stroke="#F1DC9E" strokeWidth="2" />
          <circle cx="32" cy="32" r="14" fill="#FBBF24" fillOpacity="0.28" stroke="#9A6700" strokeWidth="2.4" />
          <circle cx="32" cy="32" r="9.5" stroke="#9A6700" strokeWidth="1.5" strokeDasharray="3 3" />
          <path d="M32 26v12M27.5 30.5L32 26l4.5 4.5" stroke="#9A6700" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'apology':
      return (
        <svg viewBox="0 0 64 64" className={className} fill="none">
          <rect x="4" y="4" width="56" height="56" rx="18" fill="#FFF" stroke="#E6C6DD" strokeWidth="2" />
          <path
            d="M32 45s-13-8.2-13-17.5a7.5 7.5 0 0 1 13-5 7.5 7.5 0 0 1 13 5C45 36.8 32 45 32 45Z"
            fill="#8E4A70"
            fillOpacity="0.18"
            stroke="#7A395E"
            strokeWidth="2.3"
          />
          <rect
            x="23"
            y="29"
            width="18"
            height="7"
            rx="3.5"
            transform="rotate(-20 32 32.5)"
            fill="#FFF7EB"
            stroke="#7A395E"
            strokeWidth="1.8"
          />
        </svg>
      );
    case 'surprise':
      return (
        <svg viewBox="0 0 64 64" className={className} fill="none">
          <rect x="4" y="4" width="56" height="56" rx="18" fill="#FFF" stroke="#D5C4E3" strokeWidth="2" />
          <rect x="17" y="27" width="30" height="20" rx="4" fill="#6B3E75" fillOpacity="0.18" stroke="#532C5C" strokeWidth="2.3" />
          <rect x="14" y="21" width="36" height="7" rx="2.5" fill="#FDE68A" stroke="#532C5C" strokeWidth="2.2" />
          <path d="M32 21v26" stroke="#532C5C" strokeWidth="2.2" />
          <path d="M32 21c-2.5-5-8-5-8-1.5s5.5 1.5 8 1.5Zm0 0c2.5-5 8-5 8-1.5s-5.5 1.5-8 1.5Z" stroke="#532C5C" strokeWidth="2" />
        </svg>
      );
  }
};

export const TicketBarcodeVisual: React.FC<{ code: string; color?: string }> = ({
  code,
  color = '#2D1A1D',
}) => {
  const bars: number[] = [];
  for (let i = 0; i < 28; i++) {
    const ch = code.charCodeAt(i % code.length) || 65;
    bars.push(((ch * (i + 3)) % 4) + 1);
  }
  let x = 0;
  return (
    <svg viewBox="0 0 160 32" className="w-40 h-8 mx-auto" aria-hidden="true">
      {bars.map((w, idx) => {
        const currentX = x;
        x += w + 2.4;
        if (currentX > 158) return null;
        return (
          <rect
            key={idx}
            x={currentX}
            y={idx % 3 === 0 ? 2 : 4}
            width={w}
            height={idx % 3 === 0 ? 28 : 24}
            rx={0.5}
            fill={color}
            fillOpacity={idx % 2 === 0 ? 0.85 : 0.65}
          />
        );
      })}
    </svg>
  );
};
