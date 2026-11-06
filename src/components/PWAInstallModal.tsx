import React, { useState } from 'react';
import { Download, Smartphone, Share, PlusSquare, X, WifiOff, CheckCircle2 } from 'lucide-react';
import { usePWAInstall, useOnlineStatus } from '../utils/usePWAInstall';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();
  if (isOnline) return null;

  return (
    <div
      role="status"
      className="fixed bottom-16 md:bottom-4 left-4 z-50 flex items-center gap-2 rounded-xl bg-amber-500/95 backdrop-blur-md px-3.5 py-2 text-xs font-medium text-white shadow-lg"
    >
      <WifiOff className="w-4 h-4 shrink-0" />
      <span>Offline Mode — Using cached playlist directory</span>
    </div>
  );
};

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuideModal, setShowGuideModal] = useState(false);

  if (isInstalled) {
    return null;
  }

  const handleClick = async () => {
    if (isInstallable) {
      await install();
    } else {
      setShowGuideModal(true);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        aria-label="Install CupertinoTV App"
        className="min-h-[40px] px-3 py-1.5 rounded-xl bg-[#0071E3]/15 hover:bg-[#0071E3]/25 text-[#0071E3] dark:text-sky-400 border border-[#0071E3]/30 text-xs font-medium flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
      >
        <Download className="w-3.5 h-3.5" />
        <span>{isIOS ? 'Install on iOS' : 'Install App'}</span>
      </button>

      {showGuideModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="pwa-install-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
        >
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-zinc-900 border border-black/10 dark:border-white/10 p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-[#0071E3] text-white flex items-center justify-center shrink-0 shadow-md">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3
                    id="pwa-install-title"
                    className="text-base font-semibold text-zinc-900 dark:text-white tracking-tight"
                  >
                    Install CupertinoTV App
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Full-screen standalone player with offline M3U cache
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                aria-label="Close install guide"
                className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-500 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-5 space-y-3 text-xs text-zinc-600 dark:text-zinc-300">
              <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-black/5 dark:border-white/5 space-y-2">
                <p className="font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
                  <Share className="w-4 h-4 text-[#0071E3]" />
                  <span>iPhone & iPad (Safari)</span>
                </p>
                <p className="leading-relaxed">
                  1. Tap the <strong>Share</strong> icon in the Safari toolbar.
                  <br />
                  2. Scroll down and select <strong>Add to Home Screen</strong>.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-black/5 dark:border-white/5 space-y-2">
                <p className="font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
                  <PlusSquare className="w-4 h-4 text-[#0071E3]" />
                  <span>Android & Desktop (Chrome / Edge / macOS)</span>
                </p>
                <p className="leading-relaxed">
                  1. Click the <strong>Install CupertinoTV</strong> icon in your browser address bar, or open the browser menu and choose <strong>Install App</strong>.
                </p>
              </div>

              <div className="flex items-center gap-2 text-[11px] text-emerald-600 dark:text-emerald-400 pt-1">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Web App Manifest & Service Worker active and ready</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowGuideModal(false)}
              className="mt-5 w-full min-h-[42px] rounded-xl bg-[#0071E3] hover:bg-[#0077ED] text-white text-xs font-semibold transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </>
  );
};
