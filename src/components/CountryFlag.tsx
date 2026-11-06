import React, { useState } from 'react';
import { Globe } from 'lucide-react';

export interface CountryFlagProps {
  code: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  alt?: string;
}

const SIZE_CLASSES = {
  xs: 'w-4 h-3 text-[9px]',
  sm: 'w-5 h-3.5 text-[10px]',
  md: 'w-7 h-5 text-xs',
  lg: 'w-10 h-7 text-sm',
  xl: 'w-12 h-8 text-base',
};

/**
 * Returns a high-res flag URL for ISO 3166-1 alpha-2 country codes.
 */
export function getCountryFlagUrl(code: string): string | null {
  if (!code || code === 'INT' || code === 'ALL' || code === 'GLOBAL') {
    return null;
  }
  const clean = code.trim().toLowerCase();
  const normalized = clean === 'uk' ? 'gb' : clean;
  if (/^[a-z]{2}$/.test(normalized)) {
    return `https://flagcdn.com/w80/${normalized}.png`;
  }
  return null;
}

export const CountryFlag: React.FC<CountryFlagProps> = ({
  code,
  size = 'md',
  className = '',
  alt,
}) => {
  const [hasError, setHasError] = useState(false);
  const flagUrl = getCountryFlagUrl(code);
  const sizeClass = SIZE_CLASSES[size] || SIZE_CLASSES.md;
  const upperCode = (code || 'INT').toUpperCase();
  const label = alt || `${upperCode} Flag`;

  if (!flagUrl || hasError) {
    if (upperCode === 'INT' || upperCode === 'ALL') {
      return (
        <span
          className={`inline-flex items-center justify-center rounded-[4px] bg-zinc-200/80 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 shrink-0 ring-1 ring-black/5 dark:ring-white/10 ${sizeClass} ${className}`}
          title={label}
        >
          <Globe className="w-3/4 h-3/4" />
        </span>
      );
    }
    return (
      <span
        className={`inline-flex items-center justify-center font-mono font-bold tracking-tight rounded-[4px] bg-zinc-200/80 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 shrink-0 ring-1 ring-black/5 dark:ring-white/10 uppercase select-none ${sizeClass} ${className}`}
        title={label}
      >
        {upperCode.slice(0, 2)}
      </span>
    );
  }

  const clean = (code.trim().toLowerCase() === 'uk' ? 'gb' : code.trim().toLowerCase());

  return (
    <span
      className={`inline-flex shrink-0 rounded-[4px] overflow-hidden ring-1 ring-black/10 dark:ring-white/15 shadow-xs bg-zinc-100 dark:bg-zinc-800 select-none ${sizeClass} ${className}`}
    >
      <img
        src={flagUrl}
        srcSet={`https://flagcdn.com/w80/${clean}.png 1x, https://flagcdn.com/w160/${clean}.png 2x`}
        alt={label}
        loading="lazy"
        onError={() => setHasError(true)}
        className="w-full h-full object-cover"
      />
    </span>
  );
};
