import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  SkipForward,
  Maximize2,
  X,
} from 'lucide-react';
import { IPTVChannel } from '../utils/m3uParser';

interface FloatingPiPPlayerProps {
  channel: IPTVChannel | null;
  isOpen: boolean;
  onClose: () => void;
  onExpandToMain: () => void;
  onNextChannel: () => void;
}

export const FloatingPiPPlayer: React.FC<FloatingPiPPlayerProps> = ({
  channel,
  isOpen,
  onClose,
  onExpandToMain,
  onNextChannel,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);

  useEffect(() => {
    if (!isOpen || !channel || !videoRef.current) return;
    const video = videoRef.current;
    let hls: Hls | null = null;

    if (Hls.isSupported()) {
      hls = new Hls({
        enableWorker: true,
        capLevelToPlayerSize: true,
      });
      hls.loadSource(channel.url);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.muted = isMuted;
        video
          .play()
          .then(() => setIsPlaying(true))
          .catch(() => {});
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = channel.url;
      video.addEventListener(
        'loadedmetadata',
        () => {
          video.play().catch(() => {});
        },
        { once: true }
      );
    }

    return () => {
      if (hls) hls.destroy();
    };
  }, [isOpen, channel]);

  if (!isOpen || !channel) return null;

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().then(() => setIsPlaying(true)).catch(() => {});
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  return (
    <div
      role="region"
      aria-label="Picture-in-Picture Mini Player"
      data-testid="floating-pip-player"
      className="fixed bottom-16 md:bottom-5 right-4 z-40 w-72 sm:w-80 rounded-2xl overflow-hidden bg-zinc-950 border border-white/15 shadow-2xl"
    >
      <div className="relative aspect-video bg-black">
        <video
          ref={videoRef}
          playsInline
          autoPlay
          muted={isMuted}
          className="w-full h-full object-contain bg-black"
        />

        {/* Top Bar */}
        <div className="absolute inset-x-0 top-0 p-2.5 bg-gradient-to-b from-black/85 to-transparent flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-white truncate">
              {channel.name}
            </p>
            <p className="text-[10px] text-zinc-300 truncate">
              PiP Mode · {channel.countryCode} · {channel.resolution}
            </p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={onExpandToMain}
              aria-label="Return to main studio player"
              className="w-7 h-7 rounded-lg bg-black/60 hover:bg-[#0071E3] text-white flex items-center justify-center transition-colors"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close mini-player"
              className="w-7 h-7 rounded-lg bg-black/60 hover:bg-rose-500 text-white flex items-center justify-center transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Bottom Controls */}
        <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/85 to-transparent flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={togglePlay}
              aria-label={isPlaying ? 'Pause mini-player' : 'Play mini-player'}
              className="w-8 h-8 rounded-lg bg-white/15 hover:bg-white/25 text-white flex items-center justify-center"
            >
              {isPlaying ? (
                <Pause className="w-3.5 h-3.5 fill-current" />
              ) : (
                <Play className="w-3.5 h-3.5 fill-current" />
              )}
            </button>
            <button
              type="button"
              onClick={onNextChannel}
              aria-label="Next channel in mini-player"
              className="w-8 h-8 rounded-lg bg-white/15 hover:bg-white/25 text-white flex items-center justify-center"
            >
              <SkipForward className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={toggleMute}
              aria-label={isMuted ? 'Unmute mini-player' : 'Mute mini-player'}
              className="w-8 h-8 rounded-lg bg-white/15 hover:bg-white/25 text-white flex items-center justify-center"
            >
              {isMuted ? (
                <VolumeX className="w-3.5 h-3.5" />
              ) : (
                <Volume2 className="w-3.5 h-3.5" />
              )}
            </button>
          </div>

          <button
            type="button"
            onClick={onExpandToMain}
            className="px-2.5 py-1 rounded-lg bg-[#0071E3] text-white text-[11px] font-medium"
          >
            Expand
          </button>
        </div>
      </div>
    </div>
  );
};
