export interface IPTVChannel {
  id: string;
  name: string;
  rawName: string;
  url: string;
  logo: string;
  group: string;
  categories: string[];
  countryCode: string;
  countryName: string;
  resolution: string;
  isGeoBlocked: boolean;
  isNot247: boolean;
  isHttps: boolean;
  tvgId: string;
  userAgent?: string;
  referrer?: string;
  isFeatured?: boolean;
}

export interface PlaylistSource {
  id: string;
  name: string;
  description: string;
  url: string;
  badge: string;
}

export const OFFICIAL_IPTV_SOURCES: PlaylistSource[] = [
  {
    id: 'main-index',
    name: 'Global Master Index (index.m3u)',
    description: 'Complete iptv-org global live television directory across all countries and categories',
    url: 'https://iptv-org.github.io/iptv/index.m3u',
    badge: '10,000+ Channels',
  },
  {
    id: 'cat-news',
    name: 'Global News Networks',
    description: '24/7 international breaking news, financial markets, and public affairs',
    url: 'https://iptv-org.github.io/iptv/categories/news.m3u',
    badge: 'News',
  },
  {
    id: 'cat-sports',
    name: 'Live Sports & Athletics',
    description: 'Football, motorsport, basketball, combat sports, and olympic broadcasts',
    url: 'https://iptv-org.github.io/iptv/categories/sports.m3u',
    badge: 'Sports',
  },
  {
    id: 'cat-entertainment',
    name: 'Entertainment & Pop Culture',
    description: 'General entertainment, variety shows, lifestyle, and prime-time networks',
    url: 'https://iptv-org.github.io/iptv/categories/entertainment.m3u',
    badge: 'Entertainment',
  },
  {
    id: 'cat-movies',
    name: 'Cinema & Feature Films',
    description: 'Dedicated movie channels, classic cinema, indie films, and festival streams',
    url: 'https://iptv-org.github.io/iptv/categories/movies.m3u',
    badge: 'Movies',
  },
  {
    id: 'cat-science',
    name: 'Science, Space & Nature',
    description: 'NASA TV, space exploration, wildlife documentaries, and research networks',
    url: 'https://iptv-org.github.io/iptv/categories/science.m3u',
    badge: 'Science',
  },
  {
    id: 'cat-music',
    name: 'Music & Live Concerts',
    description: 'Non-stop music videos, live electronic sets, classical, and chart hits',
    url: 'https://iptv-org.github.io/iptv/categories/music.m3u',
    badge: 'Music',
  },
  {
    id: 'cat-documentary',
    name: 'Documentaries & History',
    description: 'Deep-dive factual television, world history, architecture, and culture',
    url: 'https://iptv-org.github.io/iptv/categories/documentary.m3u',
    badge: 'Documentary',
  },
  {
    id: 'cat-kids',
    name: 'Kids & Animation',
    description: 'Family-friendly cartoons, anime, and educational youth programming',
    url: 'https://iptv-org.github.io/iptv/categories/animation.m3u',
    badge: 'Animation',
  },
];

const COUNTRY_NAMES: Record<string, string> = {
  US: 'United States',
  GB: 'United Kingdom',
  UK: 'United Kingdom',
  CA: 'Canada',
  AU: 'Australia',
  DE: 'Germany',
  FR: 'France',
  ES: 'Spain',
  IT: 'Italy',
  JP: 'Japan',
  KR: 'South Korea',
  IN: 'India',
  BR: 'Brazil',
  MX: 'Mexico',
  AR: 'Argentina',
  AE: 'United Arab Emirates',
  QA: 'Qatar',
  SA: 'Saudi Arabia',
  TR: 'Turkey',
  NL: 'Netherlands',
  CH: 'Switzerland',
  SE: 'Sweden',
  NO: 'Norway',
  DK: 'Denmark',
  FI: 'Finland',
  PL: 'Poland',
  PT: 'Portugal',
  BE: 'Belgium',
  AT: 'Austria',
  IE: 'Ireland',
  NZ: 'New Zealand',
  SG: 'Singapore',
  HK: 'Hong Kong',
  TW: 'Taiwan',
  PK: 'Pakistan',
  EG: 'Egypt',
  ZA: 'South Africa',
  NG: 'Nigeria',
  KE: 'Kenya',
  CN: 'China',
  RU: 'Russia',
  UA: 'Ukraine',
  GR: 'Greece',
  RO: 'Romania',
  CZ: 'Czechia',
  HU: 'Hungary',
  IL: 'Israel',
  ID: 'Indonesia',
  MY: 'Malaysia',
  PH: 'Philippines',
  TH: 'Thailand',
  VN: 'Vietnam',
  CL: 'Chile',
  CO: 'Colombia',
  PE: 'Peru',
  INT: 'International',
};

export function getCountryName(code: string): string {
  const upper = (code || 'INT').toUpperCase();
  if (upper === 'UK') return 'United Kingdom';
  return COUNTRY_NAMES[upper] || upper;
}

export function extractAttribute(extinfLine: string, attrName: string): string {
  const regex = new RegExp(`${attrName}="([^"]*)"`, 'i');
  const match = extinfLine.match(regex);
  return match ? match[1].trim() : '';
}

export function parseCountryFromTvgId(tvgId: string, explicitCountry: string): string {
  if (explicitCountry && explicitCountry.length >= 2) {
    const code = explicitCountry.split(';')[0].trim().toUpperCase();
    return code === 'UK' ? 'GB' : code;
  }
  if (!tvgId) return 'INT';
  // Format in iptv-org index.m3u: "ChannelName.us" or "ChannelName.uk@HD"
  const beforeAt = tvgId.split('@')[0];
  const dotParts = beforeAt.split('.');
  if (dotParts.length >= 2) {
    const tld = dotParts[dotParts.length - 1].toUpperCase();
    if (/^[A-Z]{2}$/.test(tld)) {
      return tld === 'UK' ? 'GB' : tld;
    }
  }
  return 'INT';
}

export function parseChannelMetadata(rawTitle: string): {
  cleanName: string;
  resolution: string;
  isGeoBlocked: boolean;
  isNot247: boolean;
} {
  let text = rawTitle.trim();
  const isGeoBlocked = /\[geo-blocked\]/i.test(text);
  const isNot247 = /\[not 24\/7\]/i.test(text);

  // Extract resolution like (1080p), (720p), (4K), (2160p), (576p), (480p)
  let resolution = 'HD';
  const resMatch = text.match(/\((2160p|4K|1080p|1080i|720p|576p|540p|480p|360p|240p)\)/i);
  if (resMatch) {
    const rawRes = resMatch[1].toUpperCase();
    resolution = rawRes === '2160P' ? '4K' : rawRes.replace('P', 'p').replace('I', 'i');
  }

  // Strip parenthetical resolution and bracket tags from clean display name
  text = text
    .replace(/\((2160p|4K|1080p|1080i|720p|576p|540p|480p|360p|240p)\)/gi, '')
    .replace(/\[geo-blocked\]/gi, '')
    .replace(/\[not 24\/7\]/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

  return {
    cleanName: text || rawTitle.trim() || 'Untitled Channel',
    resolution,
    isGeoBlocked,
    isNot247,
  };
}

export function normalizeCategories(rawGroup: string): { primary: string; all: string[] } {
  if (!rawGroup || !rawGroup.trim()) {
    return { primary: 'General', all: ['General'] };
  }
  const parts = rawGroup
    .split(/[;,]/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase());

  if (parts.length === 0 || (parts.length === 1 && parts[0] === 'Undefined')) {
    return { primary: 'General', all: ['General'] };
  }
  return {
    primary: parts[0],
    all: Array.from(new Set(parts)),
  };
}

/**
 * Parses an M3U playlist string from iptv-org into structured IPTVChannel objects.
 * Supports #EXTINF, #EXTVLCOPT, tvg-id, tvg-logo, group-title, and resolution tags.
 */
export function parseM3U(content: string, limit = 15000): IPTVChannel[] {
  if (!content || typeof content !== 'string') return [];

  const lines = content.split(/\r?\n/);
  const channels: IPTVChannel[] = [];
  const seenUrls = new Set<string>();

  let currentExtInf: string | null = null;
  let currentUserAgent: string | undefined;
  let currentReferrer: string | undefined;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    if (line.startsWith('#EXTINF:')) {
      currentExtInf = line;
      currentUserAgent = undefined;
      currentReferrer = undefined;
    } else if (line.startsWith('#EXTVLCOPT:')) {
      const opt = line.slice('#EXTVLCOPT:'.length);
      if (opt.toLowerCase().startsWith('http-user-agent=')) {
        currentUserAgent = opt.slice('http-user-agent='.length).trim();
      } else if (opt.toLowerCase().startsWith('http-referrer=') || opt.toLowerCase().startsWith('http-referer=')) {
        currentReferrer = opt.split('=')[1]?.trim();
      }
    } else if (!line.startsWith('#') && currentExtInf) {
      const url = line;
      if ((url.startsWith('http://') || url.startsWith('https://')) && !seenUrls.has(url)) {
        seenUrls.add(url);

        const tvgId = extractAttribute(currentExtInf, 'tvg-id');
        const logo = extractAttribute(currentExtInf, 'tvg-logo');
        const rawGroup = extractAttribute(currentExtInf, 'group-title');
        const explicitCountry = extractAttribute(currentExtInf, 'tvg-country');

        // Extract title after the last comma outside quotes
        const commaIndex = currentExtInf.lastIndexOf(',');
        const rawName = commaIndex !== -1 ? currentExtInf.slice(commaIndex + 1).trim() : 'Live Channel';

        const { cleanName, resolution, isGeoBlocked, isNot247 } = parseChannelMetadata(rawName);
        const { primary, all } = normalizeCategories(rawGroup);
        const countryCode = parseCountryFromTvgId(tvgId, explicitCountry);

        channels.push({
          id: `${tvgId || cleanName}-${channels.length}`.replace(/[^a-zA-Z0-9_-]/g, '_'),
          name: cleanName,
          rawName,
          url,
          logo,
          group: primary,
          categories: all,
          countryCode,
          countryName: getCountryName(countryCode),
          resolution,
          isGeoBlocked,
          isNot247,
          isHttps: url.startsWith('https://'),
          tvgId,
          userAgent: currentUserAgent,
          referrer: currentReferrer,
        });

        if (channels.length >= limit) {
          break;
        }
      }
      currentExtInf = null;
    }
  }

  return channels;
}

export type StreamHealthStatus = 'online' | 'offline' | 'checking' | 'unknown';

export interface WatchedEntry {
  channel: IPTVChannel;
  watchedAt: number;
}

export interface FilterCriteria {
  query?: string;
  category?: string;
  countryCode?: string;
  httpsOnly?: boolean;
  hideGeoBlocked?: boolean;
  hideBrokenStreams?: boolean;
  healthMap?: Record<string, StreamHealthStatus>;
  favoritesOnly?: boolean;
  favoriteIds?: Set<string>;
  sortBy?: 'featured' | 'name' | 'resolution';
}

const RESOLUTION_RANK: Record<string, number> = {
  '4K': 5,
  '1080p': 4,
  '1080i': 3,
  '720p': 2,
  HD: 1,
  '576p': 0,
  '540p': 0,
  '480p': 0,
  '360p': 0,
  '240p': 0,
};

export function filterChannels(channels: IPTVChannel[], criteria: FilterCriteria): IPTVChannel[] {
  const query = (criteria.query || '').trim().toLowerCase();
  const category = criteria.category && criteria.category !== 'All' ? criteria.category : null;
  const country = criteria.countryCode && criteria.countryCode !== 'ALL' ? criteria.countryCode : null;

  const filtered = channels.filter((ch) => {
    if (criteria.hideBrokenStreams && criteria.healthMap && criteria.healthMap[ch.id] === 'offline') {
      return false;
    }
    if (criteria.favoritesOnly && criteria.favoriteIds && !criteria.favoriteIds.has(ch.id)) {
      return false;
    }
    if (criteria.httpsOnly && !ch.isHttps) {
      return false;
    }
    if (criteria.hideGeoBlocked && ch.isGeoBlocked) {
      return false;
    }
    if (category && !ch.categories.includes(category) && ch.group !== category) {
      return false;
    }
    if (country && ch.countryCode !== country) {
      return false;
    }
    if (query) {
      const matchesName = ch.name.toLowerCase().includes(query);
      const matchesGroup = ch.group.toLowerCase().includes(query);
      const matchesCountry = ch.countryName.toLowerCase().includes(query) || ch.countryCode.toLowerCase() === query;
      if (!matchesName && !matchesGroup && !matchesCountry) {
        return false;
      }
    }
    return true;
  });

  if (criteria.sortBy === 'name') {
    filtered.sort((a, b) => a.name.localeCompare(b.name));
  } else if (criteria.sortBy === 'resolution') {
    filtered.sort((a, b) => {
      const rankDiff = (RESOLUTION_RANK[b.resolution] ?? 0) - (RESOLUTION_RANK[a.resolution] ?? 0);
      if (rankDiff !== 0) return rankDiff;
      return a.name.localeCompare(b.name);
    });
  } else {
    // Featured & verified online first, then HTTPS 1080p/720p with logos
    filtered.sort((a, b) => {
      const healthA = criteria.healthMap?.[a.id] === 'online' ? 1 : 0;
      const healthB = criteria.healthMap?.[b.id] === 'online' ? 1 : 0;
      if (healthA !== healthB) return healthB - healthA;
      if (Boolean(a.isFeatured) !== Boolean(b.isFeatured)) {
        return a.isFeatured ? -1 : 1;
      }
      if (a.isHttps !== b.isHttps) {
        return a.isHttps ? -1 : 1;
      }
      const logoA = a.logo ? 1 : 0;
      const logoB = b.logo ? 1 : 0;
      if (logoA !== logoB) return logoB - logoA;
      return (RESOLUTION_RANK[b.resolution] ?? 0) - (RESOLUTION_RANK[a.resolution] ?? 0);
    });
  }

  return filtered;
}

/**
 * Records a channel into the recently watched list, deduplicating by ID/URL
 * and keeping the most recent entry at index 0.
 */
export function recordWatchedChannel(
  history: WatchedEntry[],
  channel: IPTVChannel,
  now = Date.now(),
  maxEntries = 12
): WatchedEntry[] {
  const filtered = history.filter(
    (entry) => entry.channel.id !== channel.id && entry.channel.url !== channel.url
  );
  return [{ channel, watchedAt: now }, ...filtered].slice(0, maxEntries);
}

/**
 * Generates a shareable deep link URL that opens a channel directly in CupertinoTV.
 */
export function buildShareableChannelUrl(baseUrl: string, channel: IPTVChannel): string {
  const urlObj = new URL(baseUrl);
  urlObj.searchParams.set('channel', channel.id);
  urlObj.searchParams.set('name', channel.name);
  urlObj.searchParams.set('stream', channel.url);
  urlObj.searchParams.set('country', channel.countryCode);
  urlObj.searchParams.set('group', channel.group);
  urlObj.searchParams.set('res', channel.resolution);
  return urlObj.toString();
}

/**
 * Resolves URL query parameters (?channel=...&stream=...) into a target IPTVChannel.
 */
export function resolveSharedChannelFromQuery(
  searchString: string,
  channels: IPTVChannel[]
): IPTVChannel | null {
  if (!searchString) return null;
  const params = new URLSearchParams(searchString);
  const channelId = params.get('channel');
  const streamUrl = params.get('stream');
  const name = params.get('name');

  if (channelId) {
    const foundById = channels.find(
      (c) => c.id === channelId || c.tvgId.toLowerCase() === channelId.toLowerCase()
    );
    if (foundById) return foundById;
  }

  if (streamUrl) {
    const foundByUrl = channels.find((c) => c.url === streamUrl);
    if (foundByUrl) return foundByUrl;

    if (streamUrl.startsWith('http://') || streamUrl.startsWith('https://')) {
      const countryCode = (params.get('country') || 'INT').toUpperCase();
      const group = params.get('group') || 'General';
      const resolution = params.get('res') || 'HD';
      const cleanName = name?.trim() || 'Shared Live Broadcast';
      return {
        id: channelId || `shared-${cleanName.replace(/[^a-zA-Z0-9_-]/g, '_')}`,
        name: cleanName,
        rawName: cleanName,
        url: streamUrl,
        logo: '',
        group,
        categories: [group],
        countryCode,
        countryName: getCountryName(countryCode),
        resolution,
        isGeoBlocked: false,
        isNot247: false,
        isHttps: streamUrl.startsWith('https://'),
        tvgId: '',
      };
    }
  }

  return null;
}

