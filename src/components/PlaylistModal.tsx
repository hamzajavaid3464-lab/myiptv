import React, { useState } from 'react';
import {
  X,
  Globe,
  Check,
  Link2,
  FileCode2,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { OFFICIAL_IPTV_SOURCES, PlaylistSource } from '../utils/m3uParser';

interface PlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeSourceUrl: string;
  onSelectSourceUrl: (url: string, label: string) => void;
  onImportRawM3U: (content: string, label: string) => void;
  totalLoadedChannels: number;
  isLoadingPlaylist: boolean;
}

export const PlaylistModal: React.FC<PlaylistModalProps> = ({
  isOpen,
  onClose,
  activeSourceUrl,
  onSelectSourceUrl,
  onImportRawM3U,
  totalLoadedChannels,
  isLoadingPlaylist,
}) => {
  const [customUrl, setCustomUrl] = useState('');
  const [rawM3U, setRawM3U] = useState('');
  const [activeTab, setActiveTab] = useState<'official' | 'custom'>('official');
  const [urlError, setUrlError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCustomUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = customUrl.trim();
    if (!trimmed) {
      setUrlError('Please enter a valid .m3u or .m3u8 playlist URL.');
      return;
    }
    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
      setUrlError('Playlist URL must start with https:// or http://');
      return;
    }
    setUrlError(null);
    onSelectSourceUrl(trimmed, 'Custom M3U URL');
    onClose();
  };

  const handleRawM3USubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = rawM3U.trim();
    if (!trimmed || !trimmed.includes('#EXTINF')) {
      setUrlError('Please paste valid M3U playlist text containing #EXTINF entries.');
      return;
    }
    setUrlError(null);
    onImportRawM3U(trimmed, 'Custom Pasted M3U');
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="playlist-modal-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-md"
    >
      <div className="w-full max-w-2xl rounded-t-3xl sm:rounded-3xl bg-white dark:bg-zinc-900 border border-black/10 dark:border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[88vh] pb-safe sm:pb-0">
        {/* Header */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-black/5 dark:border-white/10 flex items-center justify-between gap-3">
          <div>
            <h2
              id="playlist-modal-title"
              className="text-base sm:text-lg font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight"
            >
              IPTV-Org Playlist Sources & M3U Loader
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Connected to{' '}
              <span className="font-mono text-zinc-700 dark:text-zinc-300">
                iptv-org/iptv
              </span>{' '}
              ·{' '}
              <span className="font-mono tabular-nums">
                {totalLoadedChannels.toLocaleString()}
              </span>{' '}
              channels indexed
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close playlist modal"
            className="w-9 h-9 rounded-full bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Segmented Control */}
        <div className="px-4 sm:px-6 pt-3 sm:pt-4">
          <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-zinc-100 dark:bg-zinc-800/80">
            <button
              type="button"
              onClick={() => {
                setActiveTab('official');
                setUrlError(null);
              }}
              className={`py-2 px-3 rounded-lg text-xs font-medium transition-colors ${
                activeTab === 'official'
                  ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-sm'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              Official iptv-org Feeds
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('custom');
                setUrlError(null);
              }}
              className={`py-2 px-3 rounded-lg text-xs font-medium transition-colors ${
                activeTab === 'custom'
                  ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-sm'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              Custom M3U URL or Paste
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-3 flex-1">
          {activeTab === 'official' ? (
            <div className="space-y-2.5">
              {OFFICIAL_IPTV_SOURCES.map((source: PlaylistSource) => {
                const isSelected = activeSourceUrl === source.url;
                return (
                  <button
                    key={source.id}
                    type="button"
                    disabled={isLoadingPlaylist}
                    onClick={() => {
                      onSelectSourceUrl(source.url, source.name);
                      onClose();
                    }}
                    className={`w-full text-left p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-4 ${
                      isSelected
                        ? 'bg-[#0071E3]/10 border-[#0071E3] text-zinc-900 dark:text-white'
                        : 'bg-zinc-50/70 hover:bg-zinc-100 dark:bg-zinc-800/40 dark:hover:bg-zinc-800 border-black/5 dark:border-white/5'
                    }`}
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                          isSelected
                            ? 'bg-[#0071E3] text-white'
                            : 'bg-zinc-200/70 dark:bg-zinc-700/60 text-zinc-600 dark:text-zinc-300'
                        }`}
                      >
                        <Globe className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                            {source.name}
                          </span>
                          <span className="text-xs text-zinc-500 dark:text-zinc-400 font-mono">
                            · {source.badge}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 line-clamp-1">
                          {source.description}
                        </p>
                        <p className="text-[11px] font-mono text-zinc-400 dark:text-zinc-500 mt-1 truncate">
                          {source.url}
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0">
                      {isSelected ? (
                        <span className="w-7 h-7 rounded-full bg-[#0071E3] text-white flex items-center justify-center">
                          <Check className="w-4 h-4" />
                        </span>
                      ) : (
                        <span className="text-xs font-medium text-[#0071E3]">
                          Load
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="space-y-5">
              {urlError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-600 dark:text-rose-400">
                  {urlError}
                </div>
              )}

              <form onSubmit={handleCustomUrlSubmit} className="space-y-2.5">
                <label
                  htmlFor="custom-m3u-url"
                  className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200"
                >
                  Load Remote M3U / M3U8 Playlist URL
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Link2 className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      id="custom-m3u-url"
                      type="url"
                      value={customUrl}
                      onChange={(e) => setCustomUrl(e.target.value)}
                      placeholder="https://iptv-org.github.io/iptv/index.m3u"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-black/10 dark:border-white/10 text-xs sm:text-sm text-zinc-900 dark:text-white focus:outline-none focus:border-[#0071E3]"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-4 py-2.5 rounded-xl bg-[#0071E3] hover:bg-[#0077ED] text-white text-xs font-medium transition-colors whitespace-nowrap shrink-0"
                  >
                    Load URL
                  </button>
                </div>
              </form>

              <div className="border-t border-black/5 dark:border-white/10 pt-4">
                <form onSubmit={handleRawM3USubmit} className="space-y-2.5">
                  <label
                    htmlFor="raw-m3u-input"
                    className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5"
                  >
                    <FileCode2 className="w-4 h-4 text-[#0071E3]" />
                    <span>Or Paste Raw #EXTM3U Content Directly</span>
                  </label>
                  <textarea
                    id="raw-m3u-input"
                    rows={5}
                    value={rawM3U}
                    onChange={(e) => setRawM3U(e.target.value)}
                    placeholder={`#EXTM3U\n#EXTINF:-1 tvg-id="Example.us" group-title="News",Example Live Channel (1080p)\nhttps://example.com/live/master.m3u8`}
                    className="w-full p-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-black/10 dark:border-white/10 text-xs font-mono text-zinc-900 dark:text-white focus:outline-none focus:border-[#0071E3]"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2.5 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-xs font-medium hover:opacity-90 transition-opacity"
                  >
                    Parse & Load Raw M3U
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-zinc-50 dark:bg-zinc-950/60 border-t border-black/5 dark:border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-500">
          <div className="flex items-center gap-2">
            {isLoadingPlaylist && (
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#0071E3]" />
            )}
            <span>
              Vercel SPA pre-configured via <code className="font-mono">vercel.json</code>
            </span>
          </div>
          <a
            href="https://github.com/iptv-org/iptv"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#0071E3] hover:underline flex items-center gap-1 font-medium"
          >
            <span>iptv-org/iptv Repository</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
};
