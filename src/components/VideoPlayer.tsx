import React, { useEffect, useRef, useState, useCallback } from 'react';
import Hls from 'hls.js';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  PictureInPicture2,
  Heart,
  SkipForward,
  SkipBack,
  AlertCircle,
  ExternalLink,
  Share2,
  Check,
  Sparkles,
  SlidersHorizontal,
  RefreshCw,
  Smartphone,
  Keyboard,
  AudioWaveform,
} from 'lucide-react';
import { IPTVChannel, buildShareableChannelUrl } from '../utils/m3uParser';
import {
  AudioNormalizerMode,
  AUDIO_NORMALIZER_PRESETS,
  applyAudioNormalizerToVideo,
  resumeVideoAudioContext,
  getVideoGainReductionDb,
  formatGainReductionDb,
  getCompressorPreset,
} from '../utils/audioNormalizer';
import { ChannelLogo } from './ChannelLogo';

const NORMALIZER_STORAGE_KEY = 'cupertinotv_audio_normalizer_v1';
const NORMALIZER_MODES_ORDER: AudioNormalizerMode[] = [
  'broadcast',
  'night',
  'gentle',
  'off',
];

interface VideoPlayerProps {
  channel: IPTVChannel | null;
  isFavorite: boolean;
  onToggleFavorite: (channelId: string) => void;
  onNextChannel: () => void;
  onPrevChannel?: () => void;
  isTheaterMode: boolean;
  onToggleTheaterMode: () => void;
  onAddToMultiView?: (channel: IPTVChannel) => void;
  onStreamHealthy?: (channelId: string) => void;
  onStreamBroken?: (channelId: string) => void;
  autoHideBroken?: boolean;
  isFloatingPiPOpen?: boolean;
  onToggleFloatingPiP?: () => void;
  onOpenShortcuts?: () => void;
}

interface QualityLevel {
  index: number;
  height: number;
  bitrate: number;
  label: string;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  channel,
  isFavorite,
  onToggleFavorite,
  onNextChannel,
  onPrevChannel,
  isTheaterMode,
  onToggleTheaterMode,
  onAddToMultiView,
  onStreamHealthy,
  onStreamBroken,
  autoHideBroken = true,
  isFloatingPiPOpen = false,
  onToggleFloatingPiP,
  onOpenShortcuts,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [volume, setVolume] = useState(0.8);
  const [isBuffering, setIsBuffering] = useState(true);
  const [streamError, setStreamError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [sharedCopied, setSharedCopied] = useState(false);
  const [qualities, setQualities] = useState<QualityLevel[]>([]);
  const [currentQuality, setCurrentQuality] = useState<number>(-1);
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [liveResolution, setLiveResolution] = useState<string>('');
  const [retrySeed, setRetrySeed] = useState(0);
  const [shortcutFeedback, setShortcutFeedback] = useState<string | null>(null);

  // AudioContext Loudness Normalizer / Compressor state
  const [normalizerMode, setNormalizerMode] = useState<AudioNormalizerMode>(
    () => {
      if (typeof window === 'undefined') return 'broadcast';
      const saved = localStorage.getItem(
        NORMALIZER_STORAGE_KEY
      ) as AudioNormalizerMode | null;
      return saved && AUDIO_NORMALIZER_PRESETS[saved] ? saved : 'broadcast';
    }
  );
  const [showNormalizerMenu, setShowNormalizerMenu] = useState(false);
  const [gainReductionDb, setGainReductionDb] = useState<number>(0);

  const handleSelectNormalizerMode = useCallback(
    (mode: AudioNormalizerMode) => {
      setNormalizerMode(mode);
      try {
        localStorage.setItem(NORMALIZER_STORAGE_KEY, mode);
      } catch {
        // Ignore storage errors
      }
      if (videoRef.current) {
        applyAudioNormalizerToVideo(videoRef.current, mode);
        resumeVideoAudioContext(videoRef.current);
      }
    },
    []
  );

  // Keep compressor parameters synced when channel or mode changes while unmuted
  useEffect(() => {
    const video = videoRef.current;
    if (!video || isMuted) return;
    applyAudioNormalizerToVideo(video, normalizerMode);
    resumeVideoAudioContext(video);
  }, [channel, isMuted, normalizerMode]);

  // Poll live gain reduction in dB while normalizer menu is open or audio is unmuted
  useEffect(() => {
    if (isMuted || normalizerMode === 'off') {
      setGainReductionDb(0);
      return;
    }
    const interval = setInterval(() => {
      setGainReductionDb(getVideoGainReductionDb(videoRef.current));
    }, 250);
    return () => clearInterval(interval);
  }, [isMuted, normalizerMode]);

  const triggerShortcutHud = useCallback((label: string) => {
    setShortcutFeedback(label);
  }, []);

  useEffect(() => {
    if (!shortcutFeedback) return;
    const timer = setTimeout(() => setShortcutFeedback(null), 1400);
    return () => clearTimeout(timer);
  }, [shortcutFeedback]);

  const cleanupHls = useCallback(() => {
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !channel) return;

    cleanupHls();
    setStreamError(null);
    setIsBuffering(true);
    setQualities([]);
    setCurrentQuality(-1);
    setLiveResolution('');
    setShowQualityMenu(false);

    const isPageHttps =
      typeof window !== 'undefined' && window.location.protocol === 'https:';
    if (isPageHttps && !channel.isHttps) {
      setIsBuffering(false);
      onStreamBroken?.(channel.id);
      setStreamError(
        'This broadcast uses an unencrypted HTTP stream, which modern browsers block on HTTPS pages. It has been flagged by the Stream Health Monitor.'
      );
      return;
    }

    const startPlayback = async () => {
      try {
        video.muted = isMuted;
        await video.play();
        setIsPlaying(true);
        setIsBuffering(false);
        onStreamHealthy?.(channel.id);
      } catch {
        video.muted = true;
        setIsMuted(true);
        try {
          await video.play();
          setIsPlaying(true);
          setIsBuffering(false);
          onStreamHealthy?.(channel.id);
        } catch {
          setIsPlaying(false);
          setIsBuffering(false);
        }
      }
    };

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 30,
        manifestLoadingTimeOut: 12000,
        manifestLoadingMaxRetry: 1,
        levelLoadingTimeOut: 12000,
      });
      hlsRef.current = hls;

      hls.loadSource(channel.url);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
        const levels: QualityLevel[] = data.levels
          .map((lvl, idx) => ({
            index: idx,
            height: lvl.height || 0,
            bitrate: lvl.bitrate || 0,
            label: lvl.height
              ? `${lvl.height}p`
              : `${Math.round((lvl.bitrate || 1000000) / 1000)} kbps`,
          }))
          .filter(
            (lvl, idx, arr) =>
              arr.findIndex((item) => item.label === lvl.label) === idx
          )
          .sort((a, b) => b.height - a.height);

        setQualities(levels);
        onStreamHealthy?.(channel.id);
        startPlayback();
      });

      hls.on(Hls.Events.LEVEL_SWITCHED, (_, data) => {
        const level = hls.levels[data.level];
        if (level && level.height) {
          setLiveResolution(`${level.height}p`);
        }
      });

      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              setIsBuffering(false);
              onStreamBroken?.(channel.id);
              setStreamError(
                autoHideBroken
                  ? 'Stream feed is offline or geo-restricted. Marked unhealthy and hidden from your active directory.'
                  : 'Stream feed is currently unreachable or geo-restricted in your region (CORS / Network timeout).'
              );
              hls.destroy();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls.recoverMediaError();
              break;
            default:
              setIsBuffering(false);
              onStreamBroken?.(channel.id);
              setStreamError(
                'Unable to decode this live broadcast stream in the browser.'
              );
              hls.destroy();
              break;
          }
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = channel.url;
      video.addEventListener('loadedmetadata', startPlayback, { once: true });
      video.addEventListener(
        'error',
        () => {
          setIsBuffering(false);
          onStreamBroken?.(channel.id);
          setStreamError(
            'Stream feed is currently offline or restricted in your region.'
          );
        },
        { once: true }
      );
    } else {
      setIsBuffering(false);
      setStreamError('HLS playback is not supported in this browser environment.');
    }

    return () => {
      cleanupHls();
    };
  }, [channel, cleanupHls, retrySeed]);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video
        .play()
        .then(() => {
          setIsPlaying(true);
          triggerShortcutHud('Play');
        })
        .catch(() => {});
    } else {
      video.pause();
      setIsPlaying(false);
      triggerShortcutHud('Paused');
    }
  }, [triggerShortcutHud]);

  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    const nextMuted = !isMuted;
    video.muted = nextMuted;
    setIsMuted(nextMuted);
    if (!nextMuted) {
      if (volume === 0) {
        video.volume = 0.7;
        setVolume(0.7);
      }
      applyAudioNormalizerToVideo(video, normalizerMode);
      resumeVideoAudioContext(video);
    }
    triggerShortcutHud(nextMuted ? 'Muted' : 'Unmuted');
  }, [isMuted, volume, normalizerMode, triggerShortcutHud]);

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (video) {
      video.volume = val;
      video.muted = val === 0;
      if (val > 0) {
        applyAudioNormalizerToVideo(video, normalizerMode);
        resumeVideoAudioContext(video);
      }
    }
    setIsMuted(val === 0);
  };

  const handleQualityChange = (levelIndex: number) => {
    setCurrentQuality(levelIndex);
    if (hlsRef.current) {
      hlsRef.current.currentLevel = levelIndex;
    }
    setShowQualityMenu(false);
  };

  const togglePictureInPicture = useCallback(async () => {
    const video = videoRef.current;
    if (
      video &&
      typeof document !== 'undefined' &&
      document.pictureInPictureEnabled &&
      video.readyState >= 1
    ) {
      try {
        if (document.pictureInPictureElement) {
          await document.exitPictureInPicture();
        } else {
          await video.requestPictureInPicture();
        }
        return;
      } catch {
        // Fallback to in-app floating PiP player
      }
    }
    onToggleFloatingPiP?.();
  }, [onToggleFloatingPiP]);

  // One-tap Fullscreen + Mobile Landscape Orientation Lock
  const enterFullscreenLandscape = useCallback(async () => {
    const container = containerRef.current;
    const video = videoRef.current as HTMLVideoElement & {
      webkitEnterFullscreen?: () => void;
    };
    try {
      if (!document.fullscreenElement && container) {
        await container.requestFullscreen();
        setIsFullscreen(true);
      } else if (document.fullscreenElement) {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch {
      if (video?.webkitEnterFullscreen) {
        video.webkitEnterFullscreen();
      }
    }

    try {
      const orientation = screen.orientation as ScreenOrientation & {
        lock?: (mode: string) => Promise<void>;
        unlock?: () => void;
      };
      if (orientation?.lock) {
        await orientation.lock('landscape');
      }
    } catch {
      // Orientation lock is optional on desktop/unsupported mobile browsers
    }
    triggerShortcutHud('Fullscreen Landscape');
  }, [triggerShortcutHud]);

  // Global Keyboard Shortcuts for Play/Pause, Mute, Fullscreen, and Channel Switching
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return;
      }

      if (e.key === ' ' || e.key.toLowerCase() === 'k') {
        e.preventDefault();
        togglePlay();
      } else if (e.key.toLowerCase() === 'm') {
        e.preventDefault();
        toggleMute();
      } else if (e.key.toLowerCase() === 'f') {
        e.preventDefault();
        enterFullscreenLandscape();
      } else if (e.key === 'ArrowDown' || e.key.toLowerCase() === 'n') {
        e.preventDefault();
        onNextChannel();
        triggerShortcutHud('Next Channel');
      } else if (
        (e.key === 'ArrowUp' || e.key.toLowerCase() === 'p') &&
        onPrevChannel
      ) {
        e.preventDefault();
        onPrevChannel();
        triggerShortcutHud('Previous Channel');
      } else if (e.key.toLowerCase() === 'i' && onToggleFloatingPiP) {
        e.preventDefault();
        onToggleFloatingPiP();
        triggerShortcutHud('Mini-Player PiP');
      } else if (e.key.toLowerCase() === 't') {
        e.preventDefault();
        onToggleTheaterMode();
        triggerShortcutHud('Cinema Mode');
      } else if (e.key.toLowerCase() === 'l') {
        e.preventDefault();
        const currentIdx = NORMALIZER_MODES_ORDER.indexOf(normalizerMode);
        const nextMode =
          NORMALIZER_MODES_ORDER[
            (currentIdx + 1) % NORMALIZER_MODES_ORDER.length
          ];
        handleSelectNormalizerMode(nextMode);
        triggerShortcutHud(
          `Loudness Normalizer: ${getCompressorPreset(nextMode).shortLabel}`
        );
      } else if (e.key === '?' && onOpenShortcuts) {
        e.preventDefault();
        onOpenShortcuts();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    togglePlay,
    toggleMute,
    enterFullscreenLandscape,
    onNextChannel,
    onPrevChannel,
    onToggleFloatingPiP,
    onToggleTheaterMode,
    onOpenShortcuts,
    normalizerMode,
    handleSelectNormalizerMode,
    triggerShortcutHud,
  ]);

  const handleShareChannel = async () => {
    if (!channel || typeof window === 'undefined') return;
    const shareUrl = buildShareableChannelUrl(window.location.href, channel);

    // Update browser address bar so current URL is also directly shareable
    try {
      window.history.replaceState({}, '', shareUrl);
    } catch {
      // Ignore history errors
    }

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${channel.name} — Live on CupertinoTV`,
          text: `Watch ${channel.name} (${channel.countryName}) live on CupertinoTV`,
          url: shareUrl,
        });
        return;
      } catch {
        // Fallback to clipboard copy
      }
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      setSharedCopied(true);
      setTimeout(() => setSharedCopied(false), 2200);
    } catch {
      // Fallback ignored
    }
  };

  if (!channel) {
    return (
      <div className="w-full aspect-video rounded-2xl bg-zinc-900 border border-white/10 flex items-center justify-center text-zinc-400">
        Select a live channel to begin streaming
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Main Apple TV+ Glass Video Stage */}
      <div
        ref={containerRef}
        data-testid="video-player-stage"
        className="relative group w-full aspect-video rounded-2xl sm:rounded-3xl overflow-hidden bg-black border border-black/10 dark:border-white/10 shadow-xl"
      >
        <video
          ref={videoRef}
          playsInline
          autoPlay
          muted={isMuted}
          onPlay={() => {
            setIsPlaying(true);
            setIsBuffering(false);
          }}
          onPause={() => setIsPlaying(false)}
          onWaiting={() => setIsBuffering(true)}
          onPlaying={() => {
            setIsBuffering(false);
            setStreamError(null);
            onStreamHealthy?.(channel.id);
            if (videoRef.current?.videoHeight) {
              setLiveResolution(`${videoRef.current.videoHeight}p`);
            }
          }}
          onClick={togglePlay}
          className="w-full h-full object-contain cursor-pointer bg-black"
        />

        {/* Keyboard Shortcut Feedback Pill */}
        {shortcutFeedback && (
          <div
            role="status"
            className="pointer-events-none absolute top-16 left-1/2 -translate-x-1/2 px-3.5 py-1.5 rounded-xl bg-black/75 backdrop-blur-md border border-white/15 text-white text-xs font-medium shadow-lg z-30"
          >
            {shortcutFeedback}
          </div>
        )}

        {/* Top Measured Scrim with Live Broadcast Identity */}
        <div className="pointer-events-none absolute inset-x-0 top-0 p-3 sm:p-5 bg-gradient-to-b from-black/90 via-black/50 to-transparent flex items-start justify-between gap-2 transition-opacity duration-200">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <ChannelLogo
              name={channel.name}
              logo={channel.logo}
              size="sm"
              className="sm:w-11 sm:h-11"
            />
            <div className="min-w-0 drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)]">
              <div className="flex items-center gap-2">
                <h2 className="text-white font-semibold text-sm sm:text-lg tracking-tight truncate">
                  {channel.name}
                </h2>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-zinc-200 truncate">
                <span>{channel.countryName}</span>
                <span aria-hidden="true">·</span>
                <span>{channel.group}</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono tabular-nums">
                  {liveResolution || channel.resolution}
                </span>
                {channel.isGeoBlocked && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="text-amber-300">Geo-restricted</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="pointer-events-auto flex items-center gap-1.5 shrink-0">
            {isMuted && !streamError && (
              <button
                type="button"
                onClick={toggleMute}
                aria-label="Unmute live broadcast"
                className="min-h-[36px] sm:min-h-[40px] px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-xl bg-black/55 hover:bg-black/75 backdrop-blur-md text-white text-[11px] sm:text-xs font-medium flex items-center gap-1.5 border border-white/20 transition-colors whitespace-nowrap shrink-0"
              >
                <VolumeX className="w-3.5 h-3.5 text-sky-400" />
                <span>Tap to Unmute</span>
              </button>
            )}
          </div>
        </div>

        {/* Buffering Spinner */}
        {isBuffering && !streamError && (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center bg-black/35 backdrop-blur-[2px]">
            <div className="w-11 h-11 rounded-full border-2 border-white/20 border-t-white animate-spin" />
            <p className="mt-3 text-xs font-medium text-white/80 tracking-tight">
              Connecting to live broadcast...
            </p>
          </div>
        )}

        {/* Stream Error & Instant Recovery Overlay */}
        {streamError && (
          <div className="absolute inset-0 bg-zinc-950/90 backdrop-blur-md p-6 flex flex-col items-center justify-center text-center z-20">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-3">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-white font-semibold text-base sm:text-lg max-w-md">
              Broadcast Signal Unavailable in Browser
            </h3>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-md mt-1.5 leading-relaxed">
              {streamError}
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
              <button
                type="button"
                onClick={onNextChannel}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-[#0071E3] hover:bg-[#0077ED] text-white text-xs sm:text-sm font-medium flex items-center gap-2 transition-colors whitespace-nowrap shrink-0"
              >
                <SkipForward className="w-4 h-4" />
                <span>Try Next Healthy Stream</span>
              </button>
              <button
                type="button"
                onClick={() => setRetrySeed((s) => s + 1)}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs sm:text-sm font-medium flex items-center gap-2 border border-white/10 transition-colors whitespace-nowrap shrink-0"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Retry Stream</span>
              </button>
              <a
                href={channel.url}
                target="_blank"
                rel="noopener noreferrer"
                className="min-h-[44px] px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-zinc-200 text-xs sm:text-sm font-medium flex items-center gap-2 border border-white/10 transition-colors whitespace-nowrap shrink-0"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Open Direct .m3u8</span>
              </a>
            </div>
          </div>
        )}

        {/* Bottom Glass Control Bar */}
        <div className="absolute inset-x-0 bottom-0 p-2.5 sm:p-5 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex items-center justify-between gap-1.5 sm:gap-4">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={togglePlay}
              aria-label={isPlaying ? 'Pause stream' : 'Play stream'}
              className="w-10 h-10 sm:min-w-[44px] sm:min-h-[44px] rounded-xl bg-black/55 hover:bg-black/75 backdrop-blur-md text-white flex items-center justify-center border border-white/15 transition-colors shrink-0"
            >
              {isPlaying ? (
                <Pause className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
              ) : (
                <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-current ml-0.5" />
              )}
            </button>

            {onPrevChannel && (
              <button
                type="button"
                onClick={onPrevChannel}
                aria-label="Previous live channel"
                className="hidden sm:flex min-w-[44px] min-h-[44px] rounded-xl bg-black/55 hover:bg-black/75 backdrop-blur-md text-white items-center justify-center border border-white/15 transition-colors shrink-0"
              >
                <SkipBack className="w-4 h-4" />
              </button>
            )}

            <button
              type="button"
              onClick={onNextChannel}
              aria-label="Next live channel"
              className="w-10 h-10 sm:min-w-[44px] sm:min-h-[44px] rounded-xl bg-black/55 hover:bg-black/75 backdrop-blur-md text-white flex items-center justify-center border border-white/15 transition-colors shrink-0"
            >
              <SkipForward className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 bg-black/55 backdrop-blur-md rounded-xl px-2.5 h-10 sm:min-h-[44px] border border-white/15 shrink-0">
              <button
                type="button"
                onClick={toggleMute}
                aria-label={isMuted ? 'Unmute audio' : 'Mute audio'}
                className="text-white hover:text-sky-400 transition-colors p-1"
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-4 h-4" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                aria-label="Volume level"
                className="hidden sm:block w-20 accent-[#0071E3] cursor-pointer"
              />
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Quality Selector if HLS manifest provides multiple levels */}
            {qualities.length > 1 && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowQualityMenu((prev) => !prev)}
                  aria-label="Stream resolution quality"
                  className="h-10 sm:min-h-[44px] px-2.5 sm:px-3 rounded-xl bg-black/55 hover:bg-black/75 backdrop-blur-md text-white text-[11px] sm:text-xs font-mono tabular-nums flex items-center gap-1.5 border border-white/15 transition-colors whitespace-nowrap shrink-0"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>
                    {currentQuality === -1
                      ? liveResolution || channel.resolution
                      : qualities.find((q) => q.index === currentQuality)?.label ||
                        'Auto'}
                  </span>
                </button>
                {showQualityMenu && (
                  <div className="absolute right-0 bottom-12 w-40 rounded-2xl bg-zinc-900/95 backdrop-blur-xl border border-white/15 p-1.5 shadow-2xl z-30">
                    <button
                      type="button"
                      onClick={() => handleQualityChange(-1)}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium flex items-center justify-between ${
                        currentQuality === -1
                          ? 'bg-[#0071E3] text-white'
                          : 'text-zinc-200 hover:bg-white/10'
                      }`}
                    >
                      <span>Auto Quality</span>
                      <span className="font-mono opacity-75">ABR</span>
                    </button>
                    {qualities.map((q) => (
                      <button
                        key={q.index}
                        type="button"
                        onClick={() => handleQualityChange(q.index)}
                        className={`w-full text-left px-3 py-2 rounded-xl text-xs font-mono tabular-nums flex items-center justify-between ${
                          currentQuality === q.index
                            ? 'bg-[#0071E3] text-white'
                            : 'text-zinc-200 hover:bg-white/10'
                        }`}
                      >
                        <span>{q.label}</span>
                        <span className="text-[11px] opacity-70">
                          {Math.round(q.bitrate / 1000)}k
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <button
              type="button"
              onClick={() => onToggleFavorite(channel.id)}
              aria-label={
                isFavorite
                  ? `Remove ${channel.name} from Favorites`
                  : `Add ${channel.name} to Favorites`
              }
              className={`w-10 h-10 sm:min-w-[44px] sm:min-h-[44px] rounded-xl backdrop-blur-md flex items-center justify-center border transition-colors shrink-0 ${
                isFavorite
                  ? 'bg-rose-500/30 border-rose-400/50 text-rose-400'
                  : 'bg-black/55 hover:bg-black/75 border-white/15 text-white'
              }`}
            >
              <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
            </button>

            <button
              type="button"
              onClick={togglePictureInPicture}
              aria-label="Picture in Picture"
              className={`hidden sm:flex min-w-[44px] min-h-[44px] rounded-xl backdrop-blur-md items-center justify-center border transition-colors shrink-0 ${
                isFloatingPiPOpen
                  ? 'bg-[#0071E3] border-[#0071E3] text-white'
                  : 'bg-black/55 hover:bg-black/75 border-white/15 text-white'
              }`}
            >
              <PictureInPicture2 className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={enterFullscreenLandscape}
              aria-label={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
              className="w-10 h-10 sm:min-w-[44px] sm:min-h-[44px] rounded-xl bg-black/55 hover:bg-black/75 backdrop-blur-md text-white flex items-center justify-center border border-white/15 transition-colors shrink-0"
            >
              {isFullscreen ? (
                <Minimize className="w-4 h-4" />
              ) : (
                <Maximize className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Apple Studio Sub-Deck Metadata & Quick Actions Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 px-4 py-3 rounded-2xl bg-white dark:bg-zinc-900/90 border border-black/5 dark:border-white/10">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-zinc-500 dark:text-zinc-400 min-w-0">
          <span className="font-semibold text-zinc-900 dark:text-zinc-100 whitespace-nowrap">
            {channel.name}
          </span>
          <span aria-hidden="true">·</span>
          <span className="whitespace-nowrap">{channel.countryName}</span>
          <span aria-hidden="true">·</span>
          <span className="whitespace-nowrap">
            {channel.categories.join(' / ')}
          </span>
          <span aria-hidden="true">·</span>
          <span className="font-mono tabular-nums whitespace-nowrap">
            {channel.isHttps ? 'HTTPS HLS' : 'HTTP Stream'}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 shrink-0">
          <button
            type="button"
            onClick={enterFullscreenLandscape}
            aria-label="One-tap Fullscreen & Landscape mode"
            className="sm:hidden min-h-[38px] px-3 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-medium flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
          >
            <Smartphone className="w-3.5 h-3.5 rotate-90 text-[#0071E3]" />
            <span>Landscape Fullscreen</span>
          </button>

          {/* AudioContext Volume Compressor / Loudness Normalizer */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowNormalizerMenu((prev) => !prev)}
              aria-expanded={showNormalizerMenu}
              aria-label="Audio Loudness Normalizer & Dynamics Compressor"
              className={`min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
                normalizerMode !== 'off'
                  ? 'bg-[#0071E3]/10 hover:bg-[#0071E3]/20 text-[#0071E3] dark:text-sky-400 border border-[#0071E3]/20'
                  : 'bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200'
              }`}
            >
              <AudioWaveform className="w-3.5 h-3.5" />
              <span>{getCompressorPreset(normalizerMode).shortLabel}</span>
            </button>

            {showNormalizerMenu && (
              <div
                role="dialog"
                aria-label="Audio Loudness Normalizer Settings"
                className="absolute left-0 bottom-12 w-72 sm:w-80 rounded-2xl bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-black/10 dark:border-white/15 p-3 shadow-2xl z-30"
              >
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-black/5 dark:border-white/10">
                  <div>
                    <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                      AudioContext Loudness Leveler
                    </p>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                      Real-time Web Audio dynamics compressor
                    </p>
                  </div>
                  <span className="font-mono tabular-nums text-[11px] font-medium text-[#0071E3] dark:text-sky-400">
                    {formatGainReductionDb(gainReductionDb)}
                  </span>
                </div>

                <div className="space-y-1">
                  {NORMALIZER_MODES_ORDER.map((modeKey) => {
                    const preset = AUDIO_NORMALIZER_PRESETS[modeKey];
                    const isSelected = normalizerMode === modeKey;
                    return (
                      <button
                        key={modeKey}
                        type="button"
                        onClick={() => {
                          handleSelectNormalizerMode(modeKey);
                          setShowNormalizerMenu(false);
                        }}
                        className={`w-full text-left px-2.5 py-2 rounded-xl transition-colors flex items-start justify-between gap-2 ${
                          isSelected
                            ? 'bg-[#0071E3] text-white'
                            : 'hover:bg-zinc-100 dark:hover:bg-white/5 text-zinc-800 dark:text-zinc-200'
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="text-xs font-semibold flex items-center gap-1.5">
                            <span>{preset.label}</span>
                          </div>
                          <p
                            className={`text-[11px] leading-snug mt-0.5 ${
                              isSelected
                                ? 'text-white/85'
                                : 'text-zinc-500 dark:text-zinc-400'
                            }`}
                          >
                            {preset.description}
                          </p>
                        </div>
                        <span
                          className={`font-mono tabular-nums text-[11px] shrink-0 mt-0.5 ${
                            isSelected
                              ? 'text-white/90'
                              : 'text-zinc-400 dark:text-zinc-500'
                          }`}
                        >
                          {modeKey === 'off'
                            ? '1:1'
                            : `${preset.ratio}:1 · +${preset.makeupGainDb}dB`}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-2.5 pt-2 border-t border-black/5 dark:border-white/10 flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400 font-mono tabular-nums">
                  <span>
                    Thresh: {getCompressorPreset(normalizerMode).threshold} dB
                  </span>
                  <span>·</span>
                  <span>
                    Ratio: {getCompressorPreset(normalizerMode).ratio}:1
                  </span>
                  <span>·</span>
                  <span>
                    Gain: +{getCompressorPreset(normalizerMode).makeupGainDb} dB
                  </span>
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handleShareChannel}
            aria-label={`Share direct link to ${channel.name}`}
            className="min-h-[38px] px-3 py-1.5 rounded-xl bg-[#0071E3]/10 hover:bg-[#0071E3]/20 text-[#0071E3] dark:text-sky-400 text-xs font-medium flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
          >
            {sharedCopied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                <span>Share Link Copied</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5" />
                <span>Share Channel</span>
              </>
            )}
          </button>

          {onToggleFloatingPiP && (
            <button
              type="button"
              onClick={onToggleFloatingPiP}
              aria-pressed={isFloatingPiPOpen}
              className={`min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
                isFloatingPiPOpen
                  ? 'bg-[#0071E3] text-white'
                  : 'bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200'
              }`}
            >
              <PictureInPicture2 className="w-3.5 h-3.5" />
              <span>Mini-Player PiP</span>
            </button>
          )}

          {onAddToMultiView && (
            <button
              type="button"
              onClick={() => onAddToMultiView(channel)}
              className="min-h-[38px] px-3 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-medium flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#0071E3]" />
              <span>Send to Multi-View</span>
            </button>
          )}

          {onOpenShortcuts && (
            <button
              type="button"
              onClick={onOpenShortcuts}
              aria-label="Keyboard Shortcuts"
              className="hidden sm:flex min-h-[38px] px-3 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-medium items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
            >
              <Keyboard className="w-3.5 h-3.5" />
              <span>Shortcuts</span>
            </button>
          )}

          <button
            type="button"
            onClick={onToggleTheaterMode}
            className="hidden lg:flex min-h-[38px] px-3 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-medium items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
          >
            <span>{isTheaterMode ? 'Standard Layout' : 'Cinema Mode'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
