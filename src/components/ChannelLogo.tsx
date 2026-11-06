import React, { useState } from 'react';
import { Tv } from 'lucide-react';

interface ChannelLogoProps {
  name: string;
  logo?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const PALETTE_GRADIENTS = [
  'from-sky-500/20 to-blue-600/20 text-sky-600 dark:text-sky-400',
  'from-indigo-500/20 to-violet-600/20 text-indigo-600 dark:text-indigo-400',
  'from-emerald-500/20 to-teal-600/20 text-emerald-600 dark:text-emerald-400',
  'from-amber-500/20 to-orange-600/20 text-amber-600 dark:text-amber-400',
  'from-rose-500/20 to-pink-600/20 text-rose-600 dark:text-rose-400',
];

export const ChannelLogo: React.FC<ChannelLogoProps> = ({
  name,
  logo,
  size = 'md',
  className = '',
}) => {
  const [failed, setFailed] = useState(false);

  const initials = name
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join('') || 'TV';

  const hashIndex =
    name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) %
    PALETTE_GRADIENTS.length;

  const sizeClasses = {
    sm: 'w-9 h-9 rounded-lg text-xs',
    md: 'w-11 h-11 rounded-xl text-xs',
    lg: 'w-14 h-14 rounded-2xl text-sm',
  }[size];

  if (!logo || failed) {
    return (
      <div
        className={`${sizeClasses} bg-gradient-to-br ${PALETTE_GRADIENTS[hashIndex]} border border-black/5 dark:border-white/10 flex items-center justify-center font-semibold tracking-tight shrink-0 select-none ${className}`}
        aria-hidden="true"
      >
        {initials.length > 0 ? initials : <Tv className="w-4 h-4" />}
      </div>
    );
  }

  return (
    <div
      className={`${sizeClasses} bg-white dark:bg-zinc-900 border border-black/5 dark:border-white/10 flex items-center justify-center p-1.5 shrink-0 overflow-hidden ${className}`}
    >
      <img
        src={logo}
        alt={`${name} logo`}
        referrerPolicy="no-referrer"
        loading="lazy"
        onError={() => setFailed(true)}
        className="w-full h-full object-contain"
      />
    </div>
  );
};
