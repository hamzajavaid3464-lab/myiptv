export type AudioNormalizerMode = 'off' | 'gentle' | 'broadcast' | 'night';

export interface CompressorPreset {
  mode: AudioNormalizerMode;
  label: string;
  shortLabel: string;
  description: string;
  threshold: number; // dB (-100 to 0)
  knee: number; // dB (0 to 40)
  ratio: number; // 1 to 20
  attack: number; // seconds (0 to 1)
  release: number; // seconds (0 to 1)
  makeupGainDb: number; // dB
}

export const AUDIO_NORMALIZER_PRESETS: Record<
  AudioNormalizerMode,
  CompressorPreset
> = {
  off: {
    mode: 'off',
    label: 'Bypass (Original Stream Audio)',
    shortLabel: 'Normalizer Off',
    description: 'Unprocessed stream audio with no dynamic range compression',
    threshold: 0,
    knee: 0,
    ratio: 1,
    attack: 0.003,
    release: 0.25,
    makeupGainDb: 0,
  },
  gentle: {
    mode: 'gentle',
    label: 'Gentle Studio Balance',
    shortLabel: 'Gentle',
    description: 'Smoothly evens out minor volume jumps between channels',
    threshold: -18,
    knee: 24,
    ratio: 3,
    attack: 0.005,
    release: 0.25,
    makeupGainDb: 2.5,
  },
  broadcast: {
    mode: 'broadcast',
    label: 'Broadcast Standard (Recommended)',
    shortLabel: 'Normalize: Broadcast',
    description:
      'Consistent loudness across global IPTV feeds; boosts quiet speech and tames loud commercials',
    threshold: -24,
    knee: 30,
    ratio: 6,
    attack: 0.003,
    release: 0.2,
    makeupGainDb: 4.5,
  },
  night: {
    mode: 'night',
    label: 'Reduce Loud Sounds (Night Mode)',
    shortLabel: 'Normalize: Night',
    description:
      'High-ratio compression for late-night viewing; whispers stay clear while loud peaks are capped',
    threshold: -32,
    knee: 36,
    ratio: 12,
    attack: 0.002,
    release: 0.15,
    makeupGainDb: 6.5,
  },
};

/**
 * Converts decibels (dB) to linear Web Audio GainNode value.
 */
export function dbToLinearGain(db: number): number {
  if (!Number.isFinite(db)) return 1;
  const clamped = Math.max(-24, Math.min(24, db));
  return Number(Math.pow(10, clamped / 20).toFixed(4));
}

export function getCompressorPreset(
  mode: AudioNormalizerMode
): CompressorPreset {
  return AUDIO_NORMALIZER_PRESETS[mode] || AUDIO_NORMALIZER_PRESETS.broadcast;
}

/**
 * Formats DynamicsCompressorNode.reduction (typically <= 0 dB) into a clean display value.
 */
export function formatGainReductionDb(rawReduction: number): string {
  if (!Number.isFinite(rawReduction) || rawReduction >= -0.05) {
    return '0.0 dB';
  }
  const clamped = Math.max(-30, Math.min(0, rawReduction));
  return `${clamped.toFixed(1)} dB`;
}

interface MediaElementAudioPipeline {
  context: AudioContext;
  source: MediaElementAudioSourceNode;
  compressor: DynamicsCompressorNode;
  makeupGain: GainNode;
}

const elementPipelineMap = new WeakMap<
  HTMLMediaElement,
  MediaElementAudioPipeline
>();

/**
 * Attaches or updates an AudioContext DynamicsCompressorNode + GainNode pipeline
 * on an HTMLVideoElement for consistent loudness across IPTV streams.
 */
export function applyAudioNormalizerToVideo(
  video: HTMLMediaElement,
  mode: AudioNormalizerMode
): MediaElementAudioPipeline | null {
  if (typeof window === 'undefined') return null;

  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!AudioCtx) return null;

  let pipeline = elementPipelineMap.get(video) || null;

  if (!pipeline) {
    // Only create AudioContext once user/app activates normalizer or interacts
    if (mode === 'off') return null;
    try {
      const context = new AudioCtx();
      const source = context.createMediaElementSource(video);
      const compressor = context.createDynamicsCompressor();
      const makeupGain = context.createGain();

      source.connect(compressor);
      compressor.connect(makeupGain);
      makeupGain.connect(context.destination);

      pipeline = { context, source, compressor, makeupGain };
      elementPipelineMap.set(video, pipeline);
    } catch {
      return null;
    }
  }

  const preset = getCompressorPreset(mode);
  const now = pipeline.context.currentTime;

  pipeline.compressor.threshold.setTargetAtTime(preset.threshold, now, 0.015);
  pipeline.compressor.knee.setTargetAtTime(preset.knee, now, 0.015);
  pipeline.compressor.ratio.setTargetAtTime(preset.ratio, now, 0.015);
  pipeline.compressor.attack.setTargetAtTime(preset.attack, now, 0.015);
  pipeline.compressor.release.setTargetAtTime(preset.release, now, 0.015);

  const linearMakeup = dbToLinearGain(preset.makeupGainDb);
  pipeline.makeupGain.gain.setTargetAtTime(linearMakeup, now, 0.02);

  if (pipeline.context.state === 'suspended' && !video.muted && !video.paused) {
    pipeline.context.resume().catch(() => {});
  }

  return pipeline;
}

/**
 * Resumes the AudioContext associated with a video element on user gesture (play/unmute).
 */
export function resumeVideoAudioContext(video: HTMLMediaElement | null): void {
  if (!video) return;
  const pipeline = elementPipelineMap.get(video);
  if (pipeline && pipeline.context.state === 'suspended') {
    pipeline.context.resume().catch(() => {});
  }
}

/**
 * Reads the instantaneous gain reduction in dB from the video's DynamicsCompressorNode.
 */
export function getVideoGainReductionDb(video: HTMLMediaElement | null): number {
  if (!video) return 0;
  const pipeline = elementPipelineMap.get(video);
  if (!pipeline) return 0;
  return pipeline.compressor.reduction || 0;
}
