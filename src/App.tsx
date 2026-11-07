import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import {
  Search,
  Heart,
  Grid,
  List,
  Sun,
  Moon,
  ShieldCheck,
  Globe,
  Tv,
  Layers,
  Sparkles,
  RefreshCw,
  ChevronRight,
  SlidersHorizontal,
  X,
  Activity,
  History,
  Play,
  Trash2,
  Languages,
  MapPin,
  CheckSquare,
} from 'lucide-react';
import {
  IPTVChannel,
  parseM3U,
  filterChannels,
  OFFICIAL_IPTV_SOURCES,
  StreamHealthStatus,
  WatchedEntry,
  recordWatchedChannel,
  resolveSharedChannelFromQuery,
  buildShareableChannelUrl,
  getCountryFlag,
  POPULAR_LANGUAGES,
} from './utils/m3uParser';
import { CURATED_FEATURED_CHANNELS } from './utils/curatedChannels';
import { VideoPlayer } from './components/VideoPlayer';
import { ChannelLogo } from './components/ChannelLogo';
import { MultiViewGrid } from './components/MultiViewGrid';
import { PlaylistModal } from './components/PlaylistModal';
import { CountryLanguageModal } from './components/CountryLanguageModal';
import { CountryFlag } from './components/CountryFlag';
import { PWAInstallButton, OfflineIndicator } from './components/PWAInstallModal';
import { KeyboardShortcutsModal } from './components/KeyboardShortcutsModal';
import { FloatingPiPPlayer } from './components/FloatingPiPPlayer';

type ActiveSection = 'live' | 'categories' | 'favorites' | 'multiview';

const FAVORITES_STORAGE_KEY = 'cupertinotv_favorites_v1';
const THEME_STORAGE_KEY = 'cupertinotv_theme_v1';
const WATCH_HISTORY_STORAGE_KEY = 'cupertinotv_watch_history_v1';
const HEALTH_STORAGE_KEY = 'cupertinotv_health_map_v1';
const REGION_COUNTRIES_KEY = 'cupertinotv_selected_countries_v2';
const REGION_LANGUAGES_KEY = 'cupertinotv_selected_languages_v2';
const PROMPT_ON_REFRESH_KEY = 'cupertinotv_prompt_on_refresh_v2';
const PROMPT_SHOWN_SESSION_KEY = 'cupertinotv_prompt_shown_session_v2';
const CONFIGURED_KEY = 'cupertinotv_configured_v2';

export default function App() {
  // Theme state (Dark mode default for Apple TV+ cinema experience)
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    return saved ? saved === 'dark' : true;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try {
      localStorage.setItem(THEME_STORAGE_KEY, isDark ? 'dark' : 'light');
    } catch {
      // Ignore storage errors
    }
  }, [isDark]);

  // Channels & Playlist state
  const [remoteChannels, setRemoteChannels] = useState<IPTVChannel[]>([]);
  const [isLoadingPlaylist, setIsLoadingPlaylist] = useState<boolean>(true);
  const [playlistError, setPlaylistError] = useState<string | null>(null);
  const [activeSourceUrl, setActiveSourceUrl] = useState<string>(
    OFFICIAL_IPTV_SOURCES[0].url
  );
  const [activeSourceLabel, setActiveSourceLabel] = useState<string>(
    OFFICIAL_IPTV_SOURCES[0].name
  );

  // Combine curated verified channels with parsed remote M3U channels
  const allChannels = useMemo(() => {
    const curatedUrls = new Set(CURATED_FEATURED_CHANNELS.map((c) => c.url));
    const deduplicatedRemote = remoteChannels.filter(
      (c) => !curatedUrls.has(c.url)
    );
    return [...CURATED_FEATURED_CHANNELS, ...deduplicatedRemote];
  }, [remoteChannels]);

  // Channel Health Monitoring state
  const [healthMap, setHealthMap] = useState<Record<string, StreamHealthStatus>>(
    () => {
      const initial: Record<string, StreamHealthStatus> = {};
      for (const ch of CURATED_FEATURED_CHANNELS) {
        initial[ch.id] = 'online';
      }
      try {
        const raw = sessionStorage.getItem(HEALTH_STORAGE_KEY);
        if (raw) {
          return { ...initial, ...JSON.parse(raw) };
        }
      } catch {
        // Ignore storage errors
      }
      return initial;
    }
  );
  const [hideBrokenStreams, setHideBrokenStreams] = useState<boolean>(true);
  const [isProbingHealth, setIsProbingHealth] = useState<boolean>(false);

  const updateChannelHealth = useCallback(
    (channelId: string, status: StreamHealthStatus) => {
      setHealthMap((prev) => {
        if (prev[channelId] === status) return prev;
        const next = { ...prev, [channelId]: status };
        try {
          sessionStorage.setItem(HEALTH_STORAGE_KEY, JSON.stringify(next));
        } catch {
          // Ignore storage errors
        }
        return next;
      });
    },
    []
  );

  const brokenStreamsCount = useMemo(
    () =>
      Object.values(healthMap).filter((status) => status === 'offline').length,
    [healthMap]
  );

  // Active channel for single player (initialized from URL deep link if present)
  const [activeChannel, setActiveChannel] = useState<IPTVChannel>(() => {
    if (typeof window !== 'undefined' && window.location.search) {
      const shared = resolveSharedChannelFromQuery(
        window.location.search,
        CURATED_FEATURED_CHANNELS
      );
      if (shared) return shared;
    }
    return CURATED_FEATURED_CHANNELS[0];
  });

  // Resolve deep-linked channel once remote playlist finishes loading
  const resolvedDeepLinkRef = useRef(false);
  useEffect(() => {
    if (
      !resolvedDeepLinkRef.current &&
      remoteChannels.length > 0 &&
      typeof window !== 'undefined' &&
      window.location.search
    ) {
      const shared = resolveSharedChannelFromQuery(
        window.location.search,
        allChannels
      );
      if (shared) {
        setActiveChannel(shared);
        resolvedDeepLinkRef.current = true;
      }
    }
  }, [remoteChannels, allChannels]);

  // Recently Watched & Continue Watching History persisted in localStorage
  const [watchHistory, setWatchHistory] = useState<WatchedEntry[]>(() => {
    try {
      const raw = localStorage.getItem(WATCH_HISTORY_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // Ignore storage errors
    }
    return [
      { channel: CURATED_FEATURED_CHANNELS[0], watchedAt: Date.now() - 120000 },
      { channel: CURATED_FEATURED_CHANNELS[1], watchedAt: Date.now() - 360000 },
      { channel: CURATED_FEATURED_CHANNELS[2], watchedAt: Date.now() - 720000 },
    ];
  });

  useEffect(() => {
    if (!activeChannel) return;
    setWatchHistory((prev) => {
      const next = recordWatchedChannel(prev, activeChannel, Date.now(), 12);
      try {
        localStorage.setItem(WATCH_HISTORY_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // Ignore storage errors
      }
      return next;
    });

    // Keep browser URL synchronized with active channel for direct sharing
    if (typeof window !== 'undefined') {
      try {
        const updatedUrl = buildShareableChannelUrl(
          window.location.href,
          activeChannel
        );
        window.history.replaceState({}, '', updatedUrl);
      } catch {
        // Ignore history errors
      }
    }
  }, [activeChannel]);

  const clearWatchHistory = useCallback(() => {
    setWatchHistory([]);
    try {
      localStorage.removeItem(WATCH_HISTORY_STORAGE_KEY);
    } catch {
      // Ignore
    }
  }, []);

  // Multi-View 4-slot state
  const [multiViewSlots, setMultiViewSlots] = useState<(IPTVChannel | null)[]>([
    CURATED_FEATURED_CHANNELS[0],
    CURATED_FEATURED_CHANNELS[1],
    CURATED_FEATURED_CHANNELS[2],
    CURATED_FEATURED_CHANNELS[3],
  ]);
  const [activeAudioSlot, setActiveAudioSlot] = useState<number>(0);

  // Favorites state persisted in localStorage
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(() => {
    try {
      const raw = localStorage.getItem(FAVORITES_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return new Set(parsed);
      }
    } catch {
      // Ignore
    }
    return new Set([
      CURATED_FEATURED_CHANNELS[0].id,
      CURATED_FEATURED_CHANNELS[3].id,
    ]);
  });

  const toggleFavorite = useCallback((channelId: string) => {
    setFavoriteIds((prev) => {
      const next = new Set(prev);
      if (next.has(channelId)) {
        next.delete(channelId);
      } else {
        next.add(channelId);
      }
      try {
        localStorage.setItem(
          FAVORITES_STORAGE_KEY,
          JSON.stringify(Array.from(next))
        );
      } catch {
        // Ignore
      }
      return next;
    });
  }, []);

  // Navigation & Filters
  const [activeSection, setActiveSection] = useState<ActiveSection>('live');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedCountry, setSelectedCountry] = useState<string>('ALL');

  // Country & Language Multi-Select Preferences (Persisted across sessions)
  const [selectedCountries, setSelectedCountries] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(REGION_COUNTRIES_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // Ignore
    }
    return [];
  });

  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(REGION_LANGUAGES_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // Ignore
    }
    return [];
  });

  const [promptOnRefresh, setPromptOnRefresh] = useState<boolean>(() => {
    try {
      const val = localStorage.getItem(PROMPT_ON_REFRESH_KEY);
      if (val !== null) return val === 'true';
    } catch {
      // Ignore
    }
    return true; // Default to true per user requirement: ask on first launch or refresh
  });

  // Automatically prompt on first launch OR on hard refresh / page load
  const [isCountryLanguageModalOpen, setIsCountryLanguageModalOpen] =
    useState<boolean>(() => {
      if (typeof window === 'undefined') return false;
      try {
        const hasConfigured = localStorage.getItem(CONFIGURED_KEY) === 'true';
        const promptPref = localStorage.getItem(PROMPT_ON_REFRESH_KEY);
        const shouldPromptEveryTime = promptPref !== null ? promptPref === 'true' : true;
        const shownInSession = sessionStorage.getItem(PROMPT_SHOWN_SESSION_KEY) === 'true';

        // Prompt if first launch (not yet configured) OR if shouldPromptEveryTime and fresh reload
        if (!hasConfigured || shouldPromptEveryTime || !shownInSession) {
          return true;
        }
      } catch {
        // Fallback to opening
      }
      return true;
    });

  const [httpsOnly, setHttpsOnly] = useState<boolean>(true);
  const [hideGeoBlocked, setHideGeoBlocked] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<'featured' | 'name' | 'resolution'>(
    'featured'
  );
  const [viewLayout, setViewLayout] = useState<'list' | 'grid'>('list');
  const [isTheaterMode, setIsTheaterMode] = useState<boolean>(false);
  const [isPlaylistModalOpen, setIsPlaylistModalOpen] = useState<boolean>(false);
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] =
    useState<boolean>(false);
  const [isFloatingPiPOpen, setIsFloatingPiPOpen] = useState<boolean>(false);
  const [visibleCount, setVisibleCount] = useState<number>(60);

  // Global Keyboard Shortcuts (R = Region & Language modal, ? = Shortcuts modal)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }
      if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        setIsCountryLanguageModalOpen((prev) => !prev);
      } else if (e.key === '?') {
        e.preventDefault();
        setIsShortcutsModalOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  // Load M3U Playlist from iptv-org
  const loadPlaylistFromUrl = useCallback(async (url: string, label: string) => {
    setIsLoadingPlaylist(true);
    setPlaylistError(null);
    setActiveSourceUrl(url);
    setActiveSourceLabel(label);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000);

      const response = await fetch(url, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const m3uText = await response.text();
      const parsed = parseM3U(m3uText, 12000);
      setRemoteChannels(parsed);
      setVisibleCount(60);
    } catch {
      setPlaylistError(
        'Using verified cached iptv-org channels. Remote playlist fetch timed out or was blocked by network rules.'
      );
    } finally {
      setIsLoadingPlaylist(false);
    }
  }, []);

  const handleImportRawM3U = useCallback((content: string, label: string) => {
    const parsed = parseM3U(content, 12000);
    if (parsed.length > 0) {
      setRemoteChannels(parsed);
      setActiveSourceLabel(label);
      setActiveSourceUrl('custom://raw-m3u');
      setActiveChannel(parsed[0]);
      setPlaylistError(null);
    }
  }, []);

  useEffect(() => {
    loadPlaylistFromUrl(
      OFFICIAL_IPTV_SOURCES[0].url,
      OFFICIAL_IPTV_SOURCES[0].name
    );
  }, [loadPlaylistFromUrl]);

  // Extract top categories with counts
  const categoryStats = useMemo(() => {
    const counts = new Map<string, number>();
    for (const ch of allChannels) {
      if (httpsOnly && !ch.isHttps) continue;
      if (hideBrokenStreams && healthMap[ch.id] === 'offline') continue;
      counts.set(ch.group, (counts.get(ch.group) || 0) + 1);
    }
    const sorted = Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 14);
    return sorted;
  }, [allChannels, httpsOnly, hideBrokenStreams, healthMap]);

  // Extract available countries with counts
  const countryOptions = useMemo(() => {
    const map = new Map<string, { code: string; name: string; count: number }>();
    for (const ch of allChannels) {
      if (httpsOnly && !ch.isHttps) continue;
      if (hideBrokenStreams && healthMap[ch.id] === 'offline') continue;
      const existing = map.get(ch.countryCode);
      if (existing) {
        existing.count += 1;
      } else {
        map.set(ch.countryCode, {
          code: ch.countryCode,
          name: ch.countryName,
          count: 1,
        });
      }
    }
    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [allChannels, httpsOnly, hideBrokenStreams, healthMap]);

  // Extract available languages with counts
  const languageOptions = useMemo(() => {
    const map = new Map<
      string,
      { code: string; name: string; nativeName: string; count: number }
    >();

    // Seed with popular languages
    for (const item of POPULAR_LANGUAGES) {
      map.set(item.name, {
        code: item.code,
        name: item.name,
        nativeName: item.nativeName,
        count: 0,
      });
    }

    for (const ch of allChannels) {
      if (httpsOnly && !ch.isHttps) continue;
      if (hideBrokenStreams && healthMap[ch.id] === 'offline') continue;
      if (ch.languages && ch.languages.length > 0) {
        for (const lang of ch.languages) {
          const existing = map.get(lang);
          if (existing) {
            existing.count += 1;
          } else {
            map.set(lang, {
              code: lang.slice(0, 3).toLowerCase(),
              name: lang,
              nativeName: lang,
              count: 1,
            });
          }
        }
      }
    }

    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [allChannels, httpsOnly, hideBrokenStreams, healthMap]);

  // Handle saving Country & Language preferences from modal
  const handleApplyCountryLanguagePreferences = useCallback(
    (countries: string[], languages: string[], promptSetting: boolean) => {
      setSelectedCountries(countries);
      setSelectedLanguages(languages);
      setPromptOnRefresh(promptSetting);
      setVisibleCount(60);

      try {
        localStorage.setItem(CONFIGURED_KEY, 'true');
        localStorage.setItem(REGION_COUNTRIES_KEY, JSON.stringify(countries));
        localStorage.setItem(REGION_LANGUAGES_KEY, JSON.stringify(languages));
        localStorage.setItem(
          PROMPT_ON_REFRESH_KEY,
          promptSetting ? 'true' : 'false'
        );
        sessionStorage.setItem(PROMPT_SHOWN_SESSION_KEY, 'true');
      } catch {
        // Ignore storage errors
      }
    },
    []
  );

  const handleRemoveCountry = useCallback((code: string) => {
    setSelectedCountries((prev) => {
      const next = prev.filter((c) => c !== code);
      try {
        localStorage.setItem(REGION_COUNTRIES_KEY, JSON.stringify(next));
      } catch {
        // Ignore
      }
      return next;
    });
  }, []);

  const handleRemoveLanguage = useCallback((lang: string) => {
    setSelectedLanguages((prev) => {
      const next = prev.filter((l) => l !== lang);
      try {
        localStorage.setItem(REGION_LANGUAGES_KEY, JSON.stringify(next));
      } catch {
        // Ignore
      }
      return next;
    });
  }, []);

  const handleClearAllRegionalFilters = useCallback(() => {
    setSelectedCountries([]);
    setSelectedLanguages([]);
    try {
      localStorage.setItem(REGION_COUNTRIES_KEY, JSON.stringify([]));
      localStorage.setItem(REGION_LANGUAGES_KEY, JSON.stringify([]));
    } catch {
      // Ignore
    }
  }, []);

  // Filtered channels based on active section, health monitor, countries, languages & search criteria
  const filteredChannels = useMemo(() => {
    return filterChannels(allChannels, {
      query: searchQuery,
      category: selectedCategory,
      countryCode: selectedCountry,
      selectedCountries,
      selectedLanguages,
      httpsOnly,
      hideGeoBlocked,
      hideBrokenStreams,
      healthMap,
      favoritesOnly: activeSection === 'favorites',
      favoriteIds,
      sortBy,
    });
  }, [
    allChannels,
    searchQuery,
    selectedCategory,
    selectedCountry,
    selectedCountries,
    selectedLanguages,
    httpsOnly,
    hideGeoBlocked,
    hideBrokenStreams,
    healthMap,
    activeSection,
    favoriteIds,
    sortBy,
  ]);

  // When filtered channels change, tune to first matching channel if active channel is filtered out
  useEffect(() => {
    if (filteredChannels.length > 0) {
      const isCurrentInFiltered = filteredChannels.some(
        (c) => c.id === activeChannel?.id
      );
      if (!isCurrentInFiltered) {
        setActiveChannel(filteredChannels[0]);
      }
    }
  }, [filteredChannels, activeChannel?.id]);

  const displayedChannels = useMemo(
    () => filteredChannels.slice(0, visibleCount),
    [filteredChannels, visibleCount]
  );

  // Batch Stream Health Prober to automatically test & hide broken streams
  const probeVisibleChannelsHealth = useCallback(async () => {
    if (isProbingHealth) return;
    setIsProbingHealth(true);

    const targets = displayedChannels
      .filter((ch) => !healthMap[ch.id])
      .slice(0, 12);

    await Promise.allSettled(
      targets.map(async (ch) => {
        if (!ch.isHttps) {
          updateChannelHealth(ch.id, 'offline');
          return;
        }
        updateChannelHealth(ch.id, 'checking');
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 4500);
        try {
          const res = await fetch(ch.url, {
            method: 'GET',
            signal: controller.signal,
          });
          clearTimeout(timer);
          controller.abort(); // Abort body download immediately after headers
          if (res.ok) {
            updateChannelHealth(ch.id, 'online');
          } else {
            updateChannelHealth(ch.id, 'offline');
          }
        } catch {
          clearTimeout(timer);
          updateChannelHealth(ch.id, 'offline');
        }
      })
    );

    setIsProbingHealth(false);
  }, [displayedChannels, healthMap, isProbingHealth, updateChannelHealth]);

  // Select channel handler (either plays in main player or assigns to Multi-View slot)
  const handleSelectChannel = useCallback(
    (channel: IPTVChannel) => {
      if (activeSection === 'multiview') {
        setMultiViewSlots((prev) => {
          const emptyIdx = prev.findIndex((s) => s === null);
          if (emptyIdx !== -1) {
            const copy = [...prev];
            copy[emptyIdx] = channel;
            return copy;
          }
          const copy = [...prev];
          copy[activeAudioSlot] = channel;
          return copy;
        });
      } else {
        setActiveChannel(channel);
      }
    },
    [activeSection, activeAudioSlot]
  );

  const handleNextChannel = useCallback(() => {
    if (filteredChannels.length === 0) return;
    const currentIndex = filteredChannels.findIndex(
      (c) => c.id === activeChannel.id
    );
    const nextIndex =
      currentIndex >= 0 ? (currentIndex + 1) % filteredChannels.length : 0;
    setActiveChannel(filteredChannels[nextIndex]);
  }, [filteredChannels, activeChannel]);

  const handlePrevChannel = useCallback(() => {
    if (filteredChannels.length === 0) return;
    const currentIndex = filteredChannels.findIndex(
      (c) => c.id === activeChannel.id
    );
    const prevIndex =
      currentIndex > 0 ? currentIndex - 1 : filteredChannels.length - 1;
    setActiveChannel(filteredChannels[prevIndex]);
  }, [filteredChannels, activeChannel]);

  const handleAddToMultiView = useCallback((channel: IPTVChannel) => {
    setMultiViewSlots((prev) => {
      const existing = prev.findIndex((s) => s?.id === channel.id);
      if (existing !== -1) return prev;
      const emptyIdx = prev.findIndex((s) => s === null);
      const copy = [...prev];
      if (emptyIdx !== -1) {
        copy[emptyIdx] = channel;
      } else {
        copy[3] = channel;
      }
      return copy;
    });
    setActiveSection('multiview');
  }, []);

  // Previous channel for "Continue Watching" banner (most recent channel different from activeChannel)
  const continueWatchingEntry = useMemo(
    () =>
      watchHistory.find((entry) => entry.channel.id !== activeChannel.id) ||
      watchHistory[0] ||
      null,
    [watchHistory, activeChannel]
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F5F7] dark:bg-[#09090B] text-[#1D1D1F] dark:text-[#F5F5F7] pb-20 lg:pb-10">
      <OfflineIndicator />

      {/* Mandatory 3-Zone Top Bar Contract */}
      <header className="sticky top-0 z-30 h-14 px-4 sm:px-8 bg-white/80 dark:bg-[#09090B]/80 backdrop-blur-xl border-b border-black/5 dark:border-white/10 flex items-center justify-between gap-8">
        {/* Zone 1: Brand wordmark & designer credit */}
        <div className="flex items-center gap-2.5 shrink-0">
          <a
            href="#top"
            onClick={(e) => {
              e.preventDefault();
              setActiveSection('live');
            }}
            className="text-base sm:text-lg font-bold tracking-tight text-zinc-900 dark:text-white whitespace-nowrap"
          >
            CupertinoTV
          </a>
          <span className="hidden xl:inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-zinc-100 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-400 border border-black/5 dark:border-white/5">
            Designed by Hamza Javaid
          </span>
        </div>

        {/* Zone 2: 4 concise single-line text navigation links */}
        <nav
          aria-label="Primary Navigation"
          className="hidden md:flex items-center gap-7 text-xs sm:text-sm font-medium text-zinc-500 dark:text-zinc-400"
        >
          <a
            href="#live"
            onClick={(e) => {
              e.preventDefault();
              setActiveSection('live');
            }}
            className={`transition-colors whitespace-nowrap shrink-0 py-1 ${
              activeSection === 'live'
                ? 'text-zinc-900 dark:text-white font-semibold underline decoration-[#0071E3] decoration-2 underline-offset-8'
                : 'hover:text-zinc-900 dark:hover:text-white hover:underline underline-offset-8'
            }`}
          >
            Live Broadcast
          </a>
          <a
            href="#categories"
            onClick={(e) => {
              e.preventDefault();
              setActiveSection('categories');
            }}
            className={`transition-colors whitespace-nowrap shrink-0 py-1 ${
              activeSection === 'categories'
                ? 'text-zinc-900 dark:text-white font-semibold underline decoration-[#0071E3] decoration-2 underline-offset-8'
                : 'hover:text-zinc-900 dark:hover:text-white hover:underline underline-offset-8'
            }`}
          >
            Categories
          </a>
          <a
            href="#favorites"
            onClick={(e) => {
              e.preventDefault();
              setActiveSection('favorites');
            }}
            className={`transition-colors whitespace-nowrap shrink-0 py-1 ${
              activeSection === 'favorites'
                ? 'text-zinc-900 dark:text-white font-semibold underline decoration-[#0071E3] decoration-2 underline-offset-8'
                : 'hover:text-zinc-900 dark:hover:text-white hover:underline underline-offset-8'
            }`}
          >
            Favorites ({favoriteIds.size})
          </a>
          <a
            href="#multiview"
            onClick={(e) => {
              e.preventDefault();
              setActiveSection('multiview');
            }}
            className={`transition-colors whitespace-nowrap shrink-0 py-1 ${
              activeSection === 'multiview'
                ? 'text-zinc-900 dark:text-white font-semibold underline decoration-[#0071E3] decoration-2 underline-offset-8'
                : 'hover:text-zinc-900 dark:hover:text-white hover:underline underline-offset-8'
            }`}
          >
            Multi-View
          </a>
        </nav>

        {/* Zone 3: Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setIsCountryLanguageModalOpen(true)}
            aria-label="Change Country and Language Filters"
            className="min-h-[38px] px-3 sm:px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 border border-black/5 dark:border-white/10 flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 shadow-xs"
          >
            {selectedCountries.length > 0 ? (
              <div className="flex items-center -space-x-1 shrink-0">
                {selectedCountries.slice(0, 3).map((code) => (
                  <CountryFlag
                    key={code}
                    code={code}
                    size="xs"
                    className="ring-1 ring-white dark:ring-zinc-900"
                  />
                ))}
              </div>
            ) : (
              <Globe className="w-3.5 h-3.5 text-[#0071E3]" />
            )}
            <span className="hidden sm:inline">Region & Lang</span>
            <span className="sm:hidden">Filters</span>
            {(selectedCountries.length > 0 || selectedLanguages.length > 0) && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-[#0071E3] text-white">
                {selectedCountries.length > 0 ? `${selectedCountries.length}C` : ''}
                {selectedCountries.length > 0 && selectedLanguages.length > 0 ? '·' : ''}
                {selectedLanguages.length > 0 ? `${selectedLanguages.length}L` : ''}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setIsPlaylistModalOpen(true)}
            className="min-h-[38px] px-3.5 sm:px-4 py-2 text-xs font-medium text-white bg-[#0071E3] hover:bg-[#0077ED] rounded-xl transition-colors whitespace-nowrap shrink-0 shadow-sm"
          >
            Playlist Source
          </button>
        </div>
      </header>

      {/* Secondary Workspace Filter, Health Monitor & PWA Install Bar */}
      <section
        aria-label="Stream Directory Controls"
        className="w-full max-w-[1440px] mx-auto px-4 sm:px-8 pt-4 pb-2"
      >
        <div className="p-3 sm:p-4 rounded-2xl bg-white dark:bg-zinc-900/90 border border-black/5 dark:border-white/10 flex flex-col gap-3">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1 min-w-0">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <label htmlFor="global-channel-search" className="sr-only">
                Search live channels, countries, or categories
              </label>
              <input
                id="global-channel-search"
                type="search"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setVisibleCount(60);
                }}
                placeholder="Search live channels, networks, or countries (e.g. DW, Red Bull, CBS, Sports)..."
                className="w-full min-h-[42px] pl-10 pr-9 py-2 rounded-xl bg-zinc-100/90 dark:bg-zinc-800/80 border border-transparent focus:border-[#0071E3] text-xs sm:text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search query"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-zinc-300/70 dark:bg-zinc-700 flex items-center justify-center text-zinc-700 dark:text-zinc-200"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Country & Language Filter, Health Filter, HTTPS Toggle, PWA Install & Theme Controls */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0">
              <button
                type="button"
                onClick={() => setIsCountryLanguageModalOpen(true)}
                className={`min-h-[40px] px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 ${
                  selectedCountries.length > 0 || selectedLanguages.length > 0
                    ? 'bg-[#0071E3]/15 text-[#0071E3] border border-[#0071E3]/30 font-semibold'
                    : 'bg-zinc-100 dark:bg-zinc-800/80 text-zinc-700 dark:text-zinc-300 border border-transparent hover:bg-zinc-200 dark:hover:bg-zinc-700'
                }`}
              >
                {selectedCountries.length > 0 ? (
                  <div className="flex items-center -space-x-1 shrink-0">
                    {selectedCountries.slice(0, 3).map((code) => (
                      <CountryFlag
                        key={code}
                        code={code}
                        size="xs"
                        className="ring-1 ring-white dark:ring-zinc-900"
                      />
                    ))}
                  </div>
                ) : (
                  <Globe className="w-3.5 h-3.5 text-[#0071E3]" />
                )}
                <span>
                  {selectedCountries.length === 0 && selectedLanguages.length === 0
                    ? 'All Regions & Langs'
                    : `${selectedCountries.length > 0 ? `${selectedCountries.length} Countries` : 'All Countries'} · ${selectedLanguages.length > 0 ? `${selectedLanguages.length} Langs` : 'All Langs'}`}
                </span>
              </button>

            <div className="flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-800/80 rounded-xl px-3 min-h-[40px] shrink-0">
              <SlidersHorizontal className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
              <label htmlFor="sort-order-select" className="sr-only">
                Sort channels by
              </label>
              <select
                id="sort-order-select"
                value={sortBy}
                onChange={(e) =>
                  setSortBy(
                    e.target.value as 'featured' | 'name' | 'resolution'
                  )
                }
                className="bg-transparent text-xs font-medium text-zinc-800 dark:text-zinc-200 focus:outline-none cursor-pointer"
              >
                <option value="featured" className="bg-white dark:bg-zinc-900">
                  Sort: Featured & Verified
                </option>
                <option
                  value="resolution"
                  className="bg-white dark:bg-zinc-900"
                >
                  Sort: Highest Resolution
                </option>
                <option value="name" className="bg-white dark:bg-zinc-900">
                  Sort: Alphabetical (A–Z)
                </option>
              </select>
            </div>

            <button
              type="button"
              onClick={() => setHideBrokenStreams((prev) => !prev)}
              aria-pressed={hideBrokenStreams}
              className={`min-h-[40px] px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
                hideBrokenStreams
                  ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                  : 'bg-zinc-100 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-400 border border-transparent'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>
                Auto-Hide Broken
                {brokenStreamsCount > 0 ? ` (${brokenStreamsCount})` : ''}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setHttpsOnly((prev) => !prev)}
              aria-pressed={httpsOnly}
              className={`min-h-[40px] px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
                httpsOnly
                  ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                  : 'bg-zinc-100 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-400 border border-transparent'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>HTTPS</span>
            </button>

            <PWAInstallButton />

            <button
              type="button"
              onClick={() => setIsDark((prev) => !prev)}
              aria-label={
                isDark ? 'Switch to Light Appearance' : 'Switch to Dark Appearance'
              }
              className="min-w-[40px] min-h-[40px] px-3 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800/80 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 flex items-center justify-center gap-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0"
            >
              {isDark ? (
                <>
                  <Sun className="w-4 h-4 text-amber-400" />
                  <span className="hidden sm:inline">Light</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-zinc-700" />
                  <span className="hidden sm:inline">Dark</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Active Regional & Language Filters Strip */}
        {(selectedCountries.length > 0 || selectedLanguages.length > 0) && (
          <div className="flex flex-wrap items-center gap-1.5 pt-2.5 border-t border-black/5 dark:border-white/5 text-xs">
            <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 flex items-center gap-1 mr-1">
              <MapPin className="w-3 h-3 text-[#0071E3]" />
              Active Filters:
            </span>
            {selectedCountries.map((code) => {
              const opt = countryOptions.find((c) => c.code === code);
              return (
                <span
                  key={code}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-[#0071E3]/10 text-[#0071E3] border border-[#0071E3]/25"
                >
                  <CountryFlag code={code} size="xs" />
                  <span>{opt?.name || code}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveCountry(code)}
                    className="ml-0.5 hover:opacity-75 transition-opacity"
                    aria-label={`Remove country ${opt?.name || code}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              );
            })}
            {selectedLanguages.map((lang) => (
              <span
                key={lang}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25"
              >
                <Languages className="w-3 h-3" />
                <span>{lang}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveLanguage(lang)}
                  className="ml-0.5 hover:opacity-75 transition-opacity"
                  aria-label={`Remove language ${lang}`}
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            <button
              type="button"
              onClick={() => setIsCountryLanguageModalOpen(true)}
              className="text-xs text-[#0071E3] hover:underline font-semibold ml-1 py-1"
            >
              + Edit Filters
            </button>
            <span className="text-zinc-300 dark:text-zinc-700">·</span>
            <button
              type="button"
              onClick={handleClearAllRegionalFilters}
              className="text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:underline py-1"
            >
              Clear All
            </button>
          </div>
        )}
      </div>

        {/* Category Filter Bar (Interactive Functional Segmented Tabs) */}
        <div
          role="tablist"
          aria-label="Channel Categories"
          className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-3 pb-1"
        >
          <button
            type="button"
            role="tab"
            aria-selected={selectedCategory === 'All'}
            onClick={() => {
              setSelectedCategory('All');
              setVisibleCount(60);
            }}
            className={`min-h-[36px] px-3.5 py-1.5 rounded-xl text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
              selectedCategory === 'All'
                ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-sm'
                : 'bg-white/80 dark:bg-zinc-900/80 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white border border-black/5 dark:border-white/5'
            }`}
          >
            All Categories ({allChannels.length.toLocaleString()})
          </button>

          {categoryStats.map(([cat, count]) => (
            <button
              key={cat}
              type="button"
              role="tab"
              aria-selected={selectedCategory === cat}
              onClick={() => {
                setSelectedCategory(cat);
                setVisibleCount(60);
              }}
              className={`min-h-[36px] px-3.5 py-1.5 rounded-xl text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                selectedCategory === cat
                  ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-sm'
                  : 'bg-white/80 dark:bg-zinc-900/80 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white border border-black/5 dark:border-white/5'
              }`}
            >
              {cat} ({count})
            </button>
          ))}
        </div>
      </section>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-[1440px] mx-auto px-4 sm:px-8 py-3">
        {/* Category Explorer View when 'categories' tab is active */}
        {activeSection === 'categories' && (
          <section className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
                  Browse by Genre & Official Playlist
                </h1>
                <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Select a genre below to filter the global directory or load its dedicated iptv-org category feed
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {OFFICIAL_IPTV_SOURCES.map((src) => (
                <div
                  key={src.id}
                  className="p-5 rounded-2xl bg-white dark:bg-zinc-900/90 border border-black/5 dark:border-white/10 flex flex-col justify-between gap-4 hover:border-[#0071E3]/50 transition-colors"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-base font-semibold text-zinc-900 dark:text-white">
                        {src.name}
                      </h3>
                      <span className="text-xs font-mono text-[#0071E3] shrink-0">
                        {src.badge}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1.5 leading-relaxed">
                      {src.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-black/5 dark:border-white/5">
                    <span className="text-[11px] font-mono text-zinc-400 truncate max-w-[200px]">
                      {src.url.replace('https://iptv-org.github.io/iptv/', '')}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        loadPlaylistFromUrl(src.url, src.name);
                        setSelectedCategory('All');
                        setActiveSection('live');
                      }}
                      className="min-h-[36px] px-3.5 py-1.5 rounded-xl bg-[#0071E3] hover:bg-[#0077ED] text-white text-xs font-medium flex items-center gap-1 transition-colors whitespace-nowrap shrink-0"
                    >
                      <span>Tune Feed</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Primary Split Studio Layout: Player Stage + Live Guide */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left / Top Stage: Either Single HLS Cinema Player or Quad Multi-View */}
          <div
            className={`${
              isTheaterMode || activeSection === 'multiview'
                ? 'lg:col-span-12'
                : 'lg:col-span-7 xl:col-span-8'
            } flex flex-col gap-5`}
          >
            {activeSection === 'multiview' ? (
              <MultiViewGrid
                slots={multiViewSlots}
                activeAudioSlot={activeAudioSlot}
                onSetActiveAudioSlot={setActiveAudioSlot}
                onRemoveSlot={(idx) =>
                  setMultiViewSlots((prev) =>
                    prev.map((item, i) => (i === idx ? null : item))
                  )
                }
                onExpandSingle={(ch) => {
                  setActiveChannel(ch);
                  setActiveSection('live');
                }}
                onResetDefaultQuad={() =>
                  setMultiViewSlots([
                    CURATED_FEATURED_CHANNELS[0],
                    CURATED_FEATURED_CHANNELS[1],
                    CURATED_FEATURED_CHANNELS[2],
                    CURATED_FEATURED_CHANNELS[3],
                  ])
                }
              />
            ) : (
              <VideoPlayer
                channel={activeChannel}
                isFavorite={favoriteIds.has(activeChannel.id)}
                onToggleFavorite={toggleFavorite}
                onNextChannel={handleNextChannel}
                onPrevChannel={handlePrevChannel}
                isTheaterMode={isTheaterMode}
                onToggleTheaterMode={() => setIsTheaterMode((prev) => !prev)}
                onAddToMultiView={handleAddToMultiView}
                onStreamHealthy={(id) => updateChannelHealth(id, 'online')}
                onStreamBroken={(id) => updateChannelHealth(id, 'offline')}
                autoHideBroken={hideBrokenStreams}
                isFloatingPiPOpen={isFloatingPiPOpen}
                onToggleFloatingPiP={() =>
                  setIsFloatingPiPOpen((prev) => !prev)
                }
                onOpenShortcuts={() => setIsShortcutsModalOpen(true)}
              />
            )}

            {/* Continue Watching & Recently Watched Section */}
            {watchHistory.length > 0 && (
              <section
                aria-label="Continue Watching and Recently Tuned"
                className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-zinc-900/90 border border-black/5 dark:border-white/10"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3.5">
                  <div className="flex items-center gap-2">
                    <History className="w-4 h-4 text-[#0071E3]" />
                    <div>
                      <h2 className="text-sm sm:text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
                        Continue Watching & Recently Tuned
                      </h2>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {continueWatchingEntry &&
                      continueWatchingEntry.channel.id !== activeChannel.id && (
                        <button
                          type="button"
                          onClick={() =>
                            handleSelectChannel(continueWatchingEntry.channel)
                          }
                          className="min-h-[34px] px-3 py-1 rounded-xl bg-[#0071E3] hover:bg-[#0077ED] text-white text-xs font-medium flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
                        >
                          <Play className="w-3 h-3 fill-current" />
                          <span>
                            Resume {continueWatchingEntry.channel.name}
                          </span>
                        </button>
                      )}
                    <button
                      type="button"
                      onClick={clearWatchHistory}
                      aria-label="Clear recently watched history"
                      className="min-h-[34px] px-2.5 py-1 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-400 text-xs font-medium flex items-center gap-1 transition-colors whitespace-nowrap shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Clear</span>
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar pb-1">
                  {watchHistory.map((entry) => {
                    const ch = entry.channel;
                    const isCurrent =
                      activeSection !== 'multiview' &&
                      activeChannel.id === ch.id;
                    return (
                      <button
                        key={ch.id}
                        type="button"
                        onClick={() => handleSelectChannel(ch)}
                        className={`min-w-[170px] sm:min-w-[190px] p-3 rounded-xl border text-left transition-all flex items-center gap-3 shrink-0 ${
                          isCurrent
                            ? 'bg-[#0071E3]/10 border-[#0071E3]'
                            : 'bg-zinc-50/80 hover:bg-zinc-100 dark:bg-zinc-800/50 dark:hover:bg-zinc-800 border-black/5 dark:border-white/5'
                        }`}
                      >
                        <ChannelLogo name={ch.name} logo={ch.logo} size="sm" />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                            {ch.name}
                          </p>
                          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
                            {isCurrent ? 'Playing Now' : 'Resume'} ·{' '}
                            {ch.resolution}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Verified Instant-Play Spotlight Dock */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-zinc-900/90 border border-black/5 dark:border-white/10">
              <div className="flex items-center justify-between gap-2 mb-3.5">
                <div>
                  <h2 className="text-sm sm:text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
                    Verified Instant-Stream Networks
                  </h2>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    High-availability 24/7 global HTTPS feeds from iptv-org
                  </p>
                </div>
                <span className="text-xs font-mono tabular-nums text-zinc-500 dark:text-zinc-400">
                  {CURATED_FEATURED_CHANNELS.length} networks
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-2.5">
                {CURATED_FEATURED_CHANNELS.map((item) => {
                  const isCurrent =
                    activeSection !== 'multiview' &&
                    activeChannel.id === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleSelectChannel(item)}
                      className={`p-3 rounded-xl border text-left transition-all flex flex-col gap-2 ${
                        isCurrent
                          ? 'bg-[#0071E3]/10 border-[#0071E3] shadow-sm'
                          : 'bg-zinc-50/80 hover:bg-zinc-100 dark:bg-zinc-800/50 dark:hover:bg-zinc-800 border-black/5 dark:border-white/5'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <ChannelLogo
                          name={item.name}
                          logo={item.logo}
                          size="sm"
                        />
                        <span className="text-[11px] font-mono tabular-nums text-zinc-500 dark:text-zinc-400">
                          {item.resolution}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                          {item.name}
                        </p>
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
                          {item.countryCode} · {item.group}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right / Bottom Directory: Live Channel Guide */}
          <aside
            aria-label="Live Channel Directory"
            className={`${
              isTheaterMode || activeSection === 'multiview'
                ? 'lg:col-span-12'
                : 'lg:col-span-5 xl:col-span-4'
            } rounded-2xl bg-white dark:bg-zinc-900/90 border border-black/5 dark:border-white/10 flex flex-col overflow-hidden`}
          >
            {/* Directory Header */}
            <div className="p-4 border-b border-black/5 dark:border-white/10 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm sm:text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 truncate">
                    {activeSection === 'favorites'
                      ? 'Saved Favorite Channels'
                      : activeSection === 'multiview'
                        ? 'Select Channel for Active Quad Slot'
                        : 'Live Channel Directory'}
                  </h2>
                  {isLoadingPlaylist && (
                    <RefreshCw
                      className="w-3.5 h-3.5 animate-spin text-[#0071E3] shrink-0"
                      aria-label="Syncing M3U playlist"
                    />
                  )}
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
                  <span className="font-mono tabular-nums">
                    {filteredChannels.length.toLocaleString()}
                  </span>{' '}
                  healthy channels · {activeSourceLabel}
                </p>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={probeVisibleChannelsHealth}
                  disabled={isProbingHealth}
                  aria-label="Scan visible channels for broken streams"
                  className="min-h-[34px] px-2.5 py-1 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-[11px] font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-1 transition-colors whitespace-nowrap shrink-0"
                >
                  <Activity
                    className={`w-3.5 h-3.5 text-emerald-500 ${
                      isProbingHealth ? 'animate-spin' : ''
                    }`}
                  />
                  <span>{isProbingHealth ? 'Probing...' : 'Scan Health'}</span>
                </button>

                <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl shrink-0">
                  <button
                    type="button"
                    onClick={() => setViewLayout('list')}
                    aria-label="List view"
                    className={`p-1.5 rounded-lg transition-colors ${
                      viewLayout === 'list'
                        ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-sm'
                        : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
                    }`}
                  >
                    <List className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewLayout('grid')}
                    aria-label="Grid view"
                    className={`p-1.5 rounded-lg transition-colors ${
                      viewLayout === 'grid'
                        ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-sm'
                        : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
                    }`}
                  >
                    <Grid className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {playlistError && (
              <div className="px-4 py-2 bg-amber-500/10 border-b border-amber-500/20 text-[11px] text-amber-700 dark:text-amber-300 flex items-center justify-between gap-2">
                <span>{playlistError}</span>
                <button
                  type="button"
                  onClick={() =>
                    loadPlaylistFromUrl(activeSourceUrl, activeSourceLabel)
                  }
                  className="font-semibold underline shrink-0"
                >
                  Retry
                </button>
              </div>
            )}

            {/* Channel List / Grid Container */}
            <div className="max-h-[640px] overflow-y-auto divide-y divide-black/5 dark:divide-white/5">
              {displayedChannels.length === 0 ? (
                <div className="p-10 text-center flex flex-col items-center justify-center">
                  <Tv className="w-8 h-8 text-zinc-400 mb-2.5" />
                  <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    No matching channels found
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-xs mt-1">
                    {activeSection === 'favorites'
                      ? 'Tap the heart icon on any live channel to save it to your personal Favorites list.'
                      : 'Try clearing your search query or switching category and country filters.'}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedCategory('All');
                      setSelectedCountry('ALL');
                      if (activeSection === 'favorites') {
                        setActiveSection('live');
                      }
                    }}
                    className="mt-4 min-h-[40px] px-4 py-2 rounded-xl bg-[#0071E3] text-white text-xs font-medium hover:bg-[#0077ED] transition-colors"
                  >
                    Reset All Filters
                  </button>
                </div>
              ) : viewLayout === 'list' ? (
                displayedChannels.map((ch) => {
                  const isSelected = activeChannel.id === ch.id;
                  const isFav = favoriteIds.has(ch.id);
                  const health = healthMap[ch.id];
                  return (
                    <div
                      key={ch.id}
                      className={`group flex items-center justify-between gap-3 px-4 py-3 transition-colors ${
                        isSelected
                          ? 'bg-[#0071E3]/10 dark:bg-[#0071E3]/15'
                          : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => handleSelectChannel(ch)}
                        className="flex-1 flex items-center gap-3 min-w-0 text-left min-h-[44px]"
                      >
                        <ChannelLogo name={ch.name} logo={ch.logo} size="md" />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-xs sm:text-sm font-semibold truncate ${
                                isSelected
                                  ? 'text-[#0071E3]'
                                  : 'text-zinc-900 dark:text-zinc-100'
                              }`}
                            >
                              {ch.name}
                            </span>
                          </div>
                          {/* Unboxed static metadata with middle-dot separators */}
                          <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
                            <CountryFlag code={ch.countryCode} size="xs" />
                            <span>{ch.countryName}</span>
                            <span aria-hidden="true">·</span>
                            <span>{ch.group}</span>
                            <span aria-hidden="true">·</span>
                            <span className="font-mono tabular-nums">
                              {ch.resolution}
                            </span>
                            {(ch.isFeatured || health === 'online') && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                                  Healthy
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => toggleFavorite(ch.id)}
                        aria-label={
                          isFav
                            ? `Remove ${ch.name} from Favorites`
                            : `Favorite ${ch.name}`
                        }
                        className={`min-w-[40px] min-h-[40px] rounded-xl flex items-center justify-center transition-colors shrink-0 ${
                          isFav
                            ? 'text-rose-500 bg-rose-500/10'
                            : 'text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                        }`}
                      >
                        <Heart
                          className={`w-4 h-4 ${isFav ? 'fill-current' : ''}`}
                        />
                      </button>
                    </div>
                  );
                })
              ) : (
                <div className="p-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 gap-2.5">
                  {displayedChannels.map((ch) => {
                    const isSelected = activeChannel.id === ch.id;
                    const isFav = favoriteIds.has(ch.id);
                    return (
                      <div
                        key={ch.id}
                        className={`p-3 rounded-xl border transition-all flex flex-col justify-between gap-2.5 ${
                          isSelected
                            ? 'bg-[#0071E3]/10 border-[#0071E3]'
                            : 'bg-zinc-50/60 dark:bg-zinc-800/40 border-black/5 dark:border-white/5 hover:border-zinc-300 dark:hover:border-zinc-700'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => handleSelectChannel(ch)}
                            className="text-left flex items-center gap-2 min-w-0 flex-1"
                          >
                            <ChannelLogo
                              name={ch.name}
                              logo={ch.logo}
                              size="sm"
                            />
                            <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                              {ch.name}
                            </span>
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleFavorite(ch.id)}
                            aria-label={
                              isFav
                                ? `Remove ${ch.name} from Favorites`
                                : `Favorite ${ch.name}`
                            }
                            className={`p-1.5 rounded-lg ${
                              isFav ? 'text-rose-500' : 'text-zinc-400'
                            }`}
                          >
                            <Heart
                              className={`w-3.5 h-3.5 ${
                                isFav ? 'fill-current' : ''
                              }`}
                            />
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleSelectChannel(ch)}
                          className="text-left flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400 pt-1 border-t border-black/5 dark:border-white/5"
                        >
                          <span className="truncate flex items-center gap-1.5">
                            <CountryFlag code={ch.countryCode} size="xs" />
                            <span>{ch.countryCode} · {ch.group}</span>
                          </span>
                          <span className="font-mono tabular-nums">
                            {ch.resolution}
                          </span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Load More Pagination */}
              {filteredChannels.length > visibleCount && (
                <div className="p-4 text-center">
                  <button
                    type="button"
                    onClick={() => setVisibleCount((prev) => prev + 80)}
                    className="w-full min-h-[42px] py-2.5 px-4 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-xs font-semibold text-zinc-800 dark:text-zinc-200 transition-colors"
                  >
                    Show More Channels (
                    <span className="font-mono tabular-nums">
                      {(filteredChannels.length - visibleCount).toLocaleString()}
                    </span>{' '}
                    remaining)
                  </button>
                </div>
              )}
            </div>
          </aside>
        </div>
      </main>

      {/* Quiet Editorial Footer */}
      <footer className="mt-auto border-t border-black/5 dark:border-white/10 py-6 px-4 sm:px-8 text-xs text-zinc-500 dark:text-zinc-400">
        <div className="max-w-[1440px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="flex flex-wrap items-center gap-1.5 text-center sm:text-left">
            <span>CupertinoTV Live Streaming Studio</span>
            <span aria-hidden="true" className="text-zinc-400">·</span>
            <span>
              Designed by{' '}
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                Hamza Javaid
              </span>
            </span>
            <span aria-hidden="true" className="text-zinc-400">·</span>
            <span>
              Powered by{' '}
              <a
                href="https://github.com/iptv-org/iptv"
                target="_blank"
                rel="noopener noreferrer"
                className="text-zinc-800 dark:text-zinc-200 hover:underline font-medium"
              >
                iptv-org/iptv
              </a>{' '}
              public M3U streams
            </span>
          </p>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setIsShortcutsModalOpen(true)}
              className="hover:text-zinc-900 dark:hover:text-white transition-colors"
            >
              Keyboard Shortcuts (?)
            </button>
            <span aria-hidden="true">·</span>
            <button
              type="button"
              onClick={() => setIsPlaylistModalOpen(true)}
              className="hover:text-zinc-900 dark:hover:text-white transition-colors"
            >
              Switch M3U Feed
            </button>
            <span aria-hidden="true">·</span>
            <a
              href="https://iptv-org.github.io/iptv/index.m3u"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-zinc-900 dark:hover:text-white transition-colors font-mono"
            >
              index.m3u
            </a>
          </div>
        </div>
      </footer>

      {/* Mobile Fixed Bottom Tab Bar (Ergonomic Thumb Zone <= 15% Viewport Cap) */}
      <nav
        aria-label="Mobile Bottom Navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 h-14 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl border-t border-black/10 dark:border-white/10 grid grid-cols-4 items-center px-2"
      >
        <button
          type="button"
          onClick={() => setActiveSection('live')}
          className={`min-h-[44px] flex flex-col items-center justify-center ${
            activeSection === 'live'
              ? 'text-[#0071E3]'
              : 'text-zinc-500 dark:text-zinc-400'
          }`}
        >
          <Tv className="w-5 h-5" />
          <span className="text-[10px] font-medium tracking-tight mt-0.5">
            Live TV
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('categories')}
          className={`min-h-[44px] flex flex-col items-center justify-center ${
            activeSection === 'categories'
              ? 'text-[#0071E3]'
              : 'text-zinc-500 dark:text-zinc-400'
          }`}
        >
          <Layers className="w-5 h-5" />
          <span className="text-[10px] font-medium tracking-tight mt-0.5">
            Categories
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('favorites')}
          className={`min-h-[44px] flex flex-col items-center justify-center ${
            activeSection === 'favorites'
              ? 'text-[#0071E3]'
              : 'text-zinc-500 dark:text-zinc-400'
          }`}
        >
          <Heart className="w-5 h-5" />
          <span className="text-[10px] font-medium tracking-tight mt-0.5">
            Favorites
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('multiview')}
          className={`min-h-[44px] flex flex-col items-center justify-center ${
            activeSection === 'multiview'
              ? 'text-[#0071E3]'
              : 'text-zinc-500 dark:text-zinc-400'
          }`}
        >
          <Sparkles className="w-5 h-5" />
          <span className="text-[10px] font-medium tracking-tight mt-0.5">
            Multi-View
          </span>
        </button>
      </nav>

      {/* In-App Picture-in-Picture Floating Mini-Player while browsing */}
      <FloatingPiPPlayer
        channel={activeChannel}
        isOpen={isFloatingPiPOpen || activeSection === 'categories'}
        onClose={() => setIsFloatingPiPOpen(false)}
        onExpandToMain={() => {
          setIsFloatingPiPOpen(false);
          setActiveSection('live');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onNextChannel={handleNextChannel}
      />

      {/* Keyboard Shortcuts Modal */}
      <KeyboardShortcutsModal
        isOpen={isShortcutsModalOpen}
        onClose={() => setIsShortcutsModalOpen(false)}
      />

      {/* Playlist Source & Custom M3U Modal */}
      <PlaylistModal
        isOpen={isPlaylistModalOpen}
        onClose={() => setIsPlaylistModalOpen(false)}
        activeSourceUrl={activeSourceUrl}
        onSelectSourceUrl={loadPlaylistFromUrl}
        onImportRawM3U={handleImportRawM3U}
        totalLoadedChannels={allChannels.length}
        isLoadingPlaylist={isLoadingPlaylist}
      />

      {/* Country & Language Preferences Modal (shown on first launch, hard refresh, and when user edits filters) */}
      <CountryLanguageModal
        isOpen={isCountryLanguageModalOpen}
        onClose={() => {
          setIsCountryLanguageModalOpen(false);
          try {
            sessionStorage.setItem(PROMPT_SHOWN_SESSION_KEY, 'true');
          } catch {
            // Ignore
          }
        }}
        selectedCountries={selectedCountries}
        selectedLanguages={selectedLanguages}
        onApply={handleApplyCountryLanguagePreferences}
        availableCountries={countryOptions}
        availableLanguages={languageOptions}
        promptOnRefresh={promptOnRefresh}
        isFirstLaunch={
          typeof window !== 'undefined'
            ? localStorage.getItem(CONFIGURED_KEY) !== 'true'
            : false
        }
      />
    </div>
  );
}
