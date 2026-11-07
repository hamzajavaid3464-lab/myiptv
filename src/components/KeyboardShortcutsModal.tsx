import React from 'react';
import { X, Keyboard } from 'lucide-react';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SHORTCUT_ITEMS = [
  { keys: ['Space', 'K'], action: 'Play or Pause live broadcast' },
  { keys: ['M'], action: 'Mute or Unmute audio' },
  { keys: ['L'], action: 'Cycle Audio Loudness Normalizer preset' },
  { keys: ['F'], action: 'Toggle Fullscreen & Mobile Landscape' },
  { keys: ['↓', 'N'], action: 'Switch to Next Live Channel' },
  { keys: ['↑', 'P'], action: 'Switch to Previous Live Channel' },
  { keys: ['I'], action: 'Toggle Floating Picture-in-Picture Mini-Player' },
  { keys: ['T'], action: 'Toggle Cinema Mode' },
  { keys: ['R'], action: 'Open Country & Language Preferences' },
  { keys: ['?'], action: 'Show or Hide Keyboard Shortcuts' },
];

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="shortcuts-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
    >
      <div className="w-full max-w-md rounded-3xl bg-white dark:bg-zinc-900 border border-black/10 dark:border-white/10 p-6 shadow-2xl">
        <div className="flex items-center justify-between gap-3 pb-4 border-b border-black/5 dark:border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#0071E3]/15 text-[#0071E3] flex items-center justify-center">
              <Keyboard className="w-4 h-4" />
            </div>
            <div>
              <h2
                id="shortcuts-modal-title"
                className="text-base font-semibold text-zinc-900 dark:text-white tracking-tight"
              >
                Keyboard Shortcuts
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Instant studio playback & channel navigation
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close keyboard shortcuts"
            className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-500 flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-4 divide-y divide-black/5 dark:divide-white/5">
          {SHORTCUT_ITEMS.map((item) => (
            <div
              key={item.action}
              className="py-2.5 flex items-center justify-between gap-4 text-xs"
            >
              <span className="text-zinc-700 dark:text-zinc-300">
                {item.action}
              </span>
              <div className="flex items-center gap-1.5 shrink-0">
                {item.keys.map((k) => (
                  <kbd
                    key={k}
                    className="px-2 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-black/10 dark:border-white/10 font-mono text-[11px] font-semibold text-zinc-900 dark:text-zinc-100"
                  >
                    {k}
                  </kbd>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 pt-3 border-t border-black/5 dark:border-white/5 flex items-center justify-between text-[11px] text-zinc-400">
          <span>CupertinoTV Live Studio</span>
          <span>Designed by <strong className="text-zinc-700 dark:text-zinc-300 font-medium">Hamza Javaid</strong></span>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-3.5 w-full min-h-[40px] rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-xs font-semibold transition-opacity hover:opacity-90"
        >
          Got It
        </button>
      </div>
    </div>
  );
};
