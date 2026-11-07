import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { Volume2, VolumeX, Maximize2, X, Plus, Tv } from 'lucide-react';
import { IPTVChannel } from '../utils/m3uParser';
import { ChannelLogo } from './ChannelLogo';
import { CountryFlag } from './CountryFlag';

interface MultiViewSlotProps {
  channel: IPTVChannel | null;
  slotIndex: number;
  isAudioActive: boolean;
  onSelectAudio: () => void;
  onRemove: () => void;
  onExpandSingle: (channel: IPTVChannel) => void;
}

const MultiViewSlot: React.FC<MultiViewSlotProps> = ({
  channel,
  slotIndex,
  isAudioActive,
  onSelectAudio,
  onRemove,
  onExpandSingle,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !channel) return;

    setHasError(false);
    let hls: Hls | null = null;

    if (Hls.isSupported()) {
      hls = new Hls({
        enableWorker: true,
        capLevelToPlayerSize: true,
        manifestLoadingTimeOut: 10000,
      });
      hls.loadSource(channel.url);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(() => {});
      });
      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          setHasError(true);
          hls?.destroy();
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = channel.url;
      video.addEventListener('loadedmetadata', () => {
        video.play().catch(() => {});
      });
      video.addEventListener('error', () => setHasError(true));
    }

    return () => {
      if (hls) hls.destroy();
    };
  }, [channel]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = !isAudioActive;
    }
  }, [isAudioActive]);

  if (!channel) {
    return (
      <div className="aspect-video rounded-2xl bg-zinc-100 dark:bg-zinc-900/60 border border-dashed border-zinc-300 dark:border-zinc-800 flex flex-col items-center justify-center p-4 text-center">
        <div className="w-10 h-10 rounded-xl bg-zinc-200/70 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 mb-2">
          <Plus className="w-5 h-5" />
        </div>
        <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
          Quad Screen Slot {slotIndex + 1}
        </p>
        <p className="text-[11px] text-zinc-500 mt-0.5">
          Click any channel below to assign to this monitor
        </p>
      </div>
    );
  }

  return (
    <div
      onClick={onSelectAudio}
      className={`relative group aspect-video rounded-2xl overflow-hidden bg-black cursor-pointer transition-all border-2 ${
        isAudioActive
          ? 'border-[#0071E3] shadow-lg shadow-[#0071E3]/15'
          : 'border-black/10 dark:border-white/10 hover:border-white/30'
      }`}
    >
      <video
        ref={videoRef}
        playsInline
        autoPlay
        muted={!isAudioActive}
        className="w-full h-full object-contain bg-black"
      />

      {hasError && (
        <div className="absolute inset-0 bg-zinc-950/90 flex flex-col items-center justify-center p-4 text-center">
          <Tv className="w-5 h-5 text-amber-400 mb-1.5" />
          <p className="text-xs font-medium text-white">{channel.name}</p>
          <p className="text-[11px] text-zinc-400 mt-0.5">
            Signal unavailable in Quad View
          </p>
        </div>
      )}

      {/* Top Overlay */}
      <div className="absolute inset-x-0 top-0 p-3 bg-gradient-to-b from-black/80 via-black/30 to-transparent flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <ChannelLogo name={channel.name} logo={channel.logo} size="sm" />
          <div className="min-w-0">
            <p className="text-xs font-semibold text-white truncate">
              {channel.name}
            </p>
            <p className="text-[11px] text-zinc-300 truncate flex items-center gap-1.5 mt-0.5">
              <CountryFlag code={channel.countryCode} size="xs" />
              <span>{channel.countryName} · {channel.group}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onExpandSingle(channel);
            }}
            aria-label={`Watch ${channel.name} in full single player`}
            className="w-8 h-8 rounded-lg bg-black/50 hover:bg-black/75 text-white flex items-center justify-center backdrop-blur-md transition-colors"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            aria-label={`Remove ${channel.name} from slot ${slotIndex + 1}`}
            className="w-8 h-8 rounded-lg bg-black/50 hover:bg-rose-500/80 text-white flex items-center justify-center backdrop-blur-md transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Bottom Audio Focus Indicator */}
      <div className="absolute bottom-2.5 right-2.5">
        <span
          className={`px-2.5 py-1 rounded-lg text-[11px] font-medium flex items-center gap-1.5 backdrop-blur-md ${
            isAudioActive
              ? 'bg-[#0071E3] text-white'
              : 'bg-black/60 text-zinc-300'
          }`}
        >
          {isAudioActive ? (
            <>
              <Volume2 className="w-3.5 h-3.5" />
              <span>Active Audio</span>
            </>
          ) : (
            <>
              <VolumeX className="w-3.5 h-3.5" />
              <span>Muted (Click for Audio)</span>
            </>
          )}
        </span>
      </div>
    </div>
  );
};

interface MultiViewGridProps {
  slots: (IPTVChannel | null)[];
  activeAudioSlot: number;
  onSetActiveAudioSlot: (slot: number) => void;
  onRemoveSlot: (slot: number) => void;
  onExpandSingle: (channel: IPTVChannel) => void;
  onResetDefaultQuad: () => void;
}

export const MultiViewGrid: React.FC<MultiViewGridProps> = ({
  slots,
  activeAudioSlot,
  onSetActiveAudioSlot,
  onRemoveSlot,
  onExpandSingle,
  onResetDefaultQuad,
}) => {
  return (
    <div className="flex flex-col gap-3 sm:gap-4 w-full max-w-full min-w-0">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-base sm:text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            Quad Multi-View Studio
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Monitor four simultaneous live broadcasts. Tap any screen to switch active audio focus.
          </p>
        </div>
        <button
          type="button"
          onClick={onResetDefaultQuad}
          className="min-h-[36px] sm:min-h-[38px] px-3.5 py-1.5 rounded-xl bg-zinc-200/80 hover:bg-zinc-300/80 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-xs font-medium text-zinc-800 dark:text-zinc-200 transition-colors whitespace-nowrap shrink-0 active:scale-95"
        >
          Load Quad Preset
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-3.5 w-full min-w-0">
        {slots.map((slotChannel, index) => (
          <MultiViewSlot
            key={index}
            channel={slotChannel}
            slotIndex={index}
            isAudioActive={activeAudioSlot === index}
            onSelectAudio={() => onSetActiveAudioSlot(index)}
            onRemove={() => onRemoveSlot(index)}
            onExpandSingle={onExpandSingle}
          />
        ))}
      </div>
    </div>
  );
};
