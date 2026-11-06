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
  countryFlag: string;
  languages: string[];
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

export const COUNTRY_NAMES: Record<string, string> = {
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
  VE: 'Venezuela',
  BD: 'Bangladesh',
  IR: 'Iran',
  IQ: 'Iraq',
  MA: 'Morocco',
  DZ: 'Algeria',
  KW: 'Kuwait',
  LB: 'Lebanon',
  OM: 'Oman',
  JO: 'Jordan',
  INT: 'International',
};

export function getCountryName(code: string): string {
  const upper = (code || 'INT').toUpperCase();
  if (upper === 'UK') return 'United Kingdom';
  return COUNTRY_NAMES[upper] || upper;
}

/**
 * Derives the Unicode national flag emoji for an ISO 3166-1 alpha-2 country code.
 */
export function getCountryFlag(code: string): string {
  if (!code || code === 'INT' || code === 'ALL') return '🌐';
  const upper = code.toUpperCase();
  const effective = upper === 'UK' ? 'GB' : upper;
  if (effective.length === 2 && /^[A-Z]{2}$/.test(effective)) {
    return String.fromCodePoint(...[...effective].map((c) => 127397 + c.charCodeAt(0)));
  }
  return '🌐';
}

export interface LanguageOption {
  code: string;
  name: string;
  nativeName: string;
}

export const POPULAR_LANGUAGES: LanguageOption[] = [
  { code: 'eng', name: 'English', nativeName: 'English' },
  { code: 'spa', name: 'Spanish', nativeName: 'Español' },
  { code: 'urd', name: 'Urdu', nativeName: 'اردو' },
  { code: 'hin', name: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'ara', name: 'Arabic', nativeName: 'العربية' },
  { code: 'fra', name: 'French', nativeName: 'Français' },
  { code: 'deu', name: 'German', nativeName: 'Deutsch' },
  { code: 'tur', name: 'Turkish', nativeName: 'Türkçe' },
  { code: 'por', name: 'Portuguese', nativeName: 'Português' },
  { code: 'ita', name: 'Italian', nativeName: 'Italiano' },
  { code: 'rus', name: 'Russian', nativeName: 'Русский' },
  { code: 'zho', name: 'Chinese', nativeName: '中文' },
  { code: 'jpn', name: 'Japanese', nativeName: '日本語' },
  { code: 'kor', name: 'Korean', nativeName: '한국어' },
  { code: 'nld', name: 'Dutch', nativeName: 'Nederlands' },
  { code: 'pol', name: 'Polish', nativeName: 'Polski' },
  { code: 'ukr', name: 'Ukrainian', nativeName: 'Українська' },
  { code: 'ind', name: 'Indonesian', nativeName: 'Bahasa Indonesia' },
  { code: 'ell', name: 'Greek', nativeName: 'Ελληνικά' },
  { code: 'vie', name: 'Vietnamese', nativeName: 'Tiếng Việt' },
  { code: 'tha', name: 'Thai', nativeName: 'ไทย' },
  { code: 'swe', name: 'Swedish', nativeName: 'Svenska' },
  { code: 'fas', name: 'Persian', nativeName: 'فارسی' },
  { code: 'heb', name: 'Hebrew', nativeName: 'עברית' },
];

const ISO_LANGUAGE_MAP: Record<string, string> = {
  eng: 'English',
  en: 'English',
  spa: 'Spanish',
  es: 'Spanish',
  urd: 'Urdu',
  ur: 'Urdu',
  hin: 'Hindi',
  hi: 'Hindi',
  ara: 'Arabic',
  ar: 'Arabic',
  fra: 'French',
  fr: 'French',
  deu: 'German',
  de: 'German',
  ger: 'German',
  tur: 'Turkish',
  tr: 'Turkish',
  por: 'Portuguese',
  pt: 'Portuguese',
  ita: 'Italian',
  it: 'Italian',
  rus: 'Russian',
  ru: 'Russian',
  zho: 'Chinese',
  zh: 'Chinese',
  chi: 'Chinese',
  jpn: 'Japanese',
  ja: 'Japanese',
  kor: 'Korean',
  ko: 'Korean',
  nld: 'Dutch',
  nl: 'Dutch',
  dut: 'Dutch',
  pol: 'Polish',
  pl: 'Polish',
  ukr: 'Ukrainian',
  uk: 'Ukrainian',
  ind: 'Indonesian',
  id: 'Indonesian',
  ell: 'Greek',
  el: 'Greek',
  gre: 'Greek',
  vie: 'Vietnamese',
  vi: 'Vietnamese',
  tha: 'Thai',
  th: 'Thai',
  swe: 'Swedish',
  sv: 'Swedish',
  fas: 'Persian',
  fa: 'Persian',
  heb: 'Hebrew',
  he: 'Hebrew',
};

const COUNTRY_DEFAULT_LANGUAGES: Record<string, string[]> = {
  US: ['English'],
  GB: ['English'],
  UK: ['English'],
  AU: ['English'],
  NZ: ['English'],
  IE: ['English'],
  CA: ['English', 'French'],
  PK: ['Urdu', 'English'],
  IN: ['Hindi', 'English'],
  DE: ['German'],
  AT: ['German'],
  CH: ['German', 'French', 'Italian'],
  FR: ['French'],
  BE: ['French', 'Dutch'],
  ES: ['Spanish'],
  MX: ['Spanish'],
  AR: ['Spanish'],
  CO: ['Spanish'],
  CL: ['Spanish'],
  PE: ['Spanish'],
  VE: ['Spanish'],
  IT: ['Italian'],
  BR: ['Portuguese'],
  PT: ['Portuguese'],
  TR: ['Turkish'],
  SA: ['Arabic'],
  AE: ['Arabic', 'English'],
  QA: ['Arabic', 'English'],
  EG: ['Arabic'],
  KW: ['Arabic'],
  LB: ['Arabic'],
  OM: ['Arabic'],
  JO: ['Arabic'],
  IQ: ['Arabic'],
  MA: ['Arabic', 'French'],
  DZ: ['Arabic', 'French'],
  CN: ['Chinese'],
  TW: ['Chinese'],
  HK: ['Chinese', 'English'],
  JP: ['Japanese'],
  KR: ['Korean'],
  RU: ['Russian'],
  UA: ['Ukrainian', 'Russian'],
  NL: ['Dutch'],
  PL: ['Polish'],
  SE: ['Swedish'],
  NO: ['Norwegian'],
  DK: ['Danish'],
  FI: ['Finnish'],
  GR: ['Greek'],
  ID: ['Indonesian'],
  TH: ['Thai'],
  VN: ['Vietnamese'],
  PH: ['Tagalog', 'English'],
  IL: ['Hebrew', 'Arabic'],
  ZA: ['English'],
  NG: ['English'],
  KE: ['English', 'Swahili'],
  INT: ['English'],
};

/**
 * Resolves one or more human-readable languages for a channel based on
 * extinf tvg-language attributes, title cues, and country standards.
 */
export function resolveChannelLanguages(
  rawLanguageAttr: string,
  rawTitle: string,
  tvgId: string,
  countryCode: string
): string[] {
  const result = new Set<string>();

  // 1. Check explicit tvg-language attribute
  if (rawLanguageAttr && rawLanguageAttr.trim()) {
    const parts = rawLanguageAttr.split(/[;,/]/);
    for (const part of parts) {
      const clean = part.trim().toLowerCase();
      if (ISO_LANGUAGE_MAP[clean]) {
        result.add(ISO_LANGUAGE_MAP[clean]);
      } else if (clean.length > 2) {
        // e.g. "English" or "Spanish"
        const cap = clean.charAt(0).toUpperCase() + clean.slice(1);
        result.add(cap);
      }
    }
  }

  // 2. Inspect channel title and tvgId for explicit language indicators
  const combined = `${rawTitle} ${tvgId}`.toLowerCase();
  if (/\b(english|world\s*news|global\s*news)\b/.test(combined)) {
    result.add('English');
  }
  if (/\b(español|espanol|spanish|noticias)\b/.test(combined)) {
    result.add('Spanish');
  }
  if (/\b(deutsch|german)\b/.test(combined)) {
    result.add('German');
  }
  if (/\b(français|francais|french)\b/.test(combined)) {
    result.add('French');
  }
  if (/\b(arabic|العربية|al jazeera|arabiya)\b/.test(combined)) {
    result.add('Arabic');
  }
  if (/\b(urdu|اردو|geo news|ary news|hum news|samaa|dunya|bol news|92 news|express news)\b/.test(combined)) {
    result.add('Urdu');
  }
  if (/\b(hindi|हिन्दी|aaj tak|zee news|ndtv|abp news|india tv)\b/.test(combined)) {
    result.add('Hindi');
  }
  if (/\b(türkçe|turkce|turkish|haber)\b/.test(combined)) {
    result.add('Turkish');
  }
  if (/\b(português|portugues|portuguese)\b/.test(combined)) {
    result.add('Portuguese');
  }
  if (/\b(italiano|italian|tg24)\b/.test(combined)) {
    result.add('Italian');
  }
  if (/\b(русский|russian)\b/.test(combined)) {
    result.add('Russian');
  }
  if (/\b(中文|chinese|cgtn)\b/.test(combined)) {
    result.add('Chinese');
  }
  if (/\b(日本語|japanese|nhk)\b/.test(combined)) {
    result.add('Japanese');
  }
  if (/\b(한국어|korean|kbs|arirang)\b/.test(combined)) {
    result.add('Korean');
  }

  // 3. If explicit language cues were found, prioritize them
  if (result.size > 0) {
    return Array.from(result);
  }

  // 4. Fallback to official languages for the country
  const countryDefaults = COUNTRY_DEFAULT_LANGUAGES[countryCode.toUpperCase()];
  if (countryDefaults && countryDefaults.length > 0) {
    return [...countryDefaults];
  }

  return ['English'];
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
        const explicitLanguage = extractAttribute(currentExtInf, 'tvg-language') || extractAttribute(currentExtInf, 'tvg-lang');

        // Extract title after the last comma outside quotes
        const commaIndex = currentExtInf.lastIndexOf(',');
        const rawName = commaIndex !== -1 ? currentExtInf.slice(commaIndex + 1).trim() : 'Live Channel';

        const { cleanName, resolution, isGeoBlocked, isNot247 } = parseChannelMetadata(rawName);
        const { primary, all } = normalizeCategories(rawGroup);
        const countryCode = parseCountryFromTvgId(tvgId, explicitCountry);
        const languages = resolveChannelLanguages(explicitLanguage, rawName, tvgId, countryCode);

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
          countryFlag: getCountryFlag(countryCode),
          languages,
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
  selectedCountries?: string[];
  selectedLanguages?: string[];
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
  const singleCountry = criteria.countryCode && criteria.countryCode !== 'ALL' ? criteria.countryCode : null;

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

    // Multi-country filter
    if (criteria.selectedCountries && criteria.selectedCountries.length > 0 && !criteria.selectedCountries.includes('ALL')) {
      if (!criteria.selectedCountries.includes(ch.countryCode)) {
        return false;
      }
    } else if (singleCountry && ch.countryCode !== singleCountry) {
      return false;
    }

    // Multi-language filter
    if (criteria.selectedLanguages && criteria.selectedLanguages.length > 0 && !criteria.selectedLanguages.includes('ALL')) {
      const hasMatch = ch.languages && ch.languages.some((l) => criteria.selectedLanguages!.includes(l));
      if (!hasMatch) {
        return false;
      }
    }

    if (query) {
      const matchesName = ch.name.toLowerCase().includes(query);
      const matchesGroup = ch.group.toLowerCase().includes(query);
      const matchesCountry = ch.countryName.toLowerCase().includes(query) || ch.countryCode.toLowerCase() === query;
      const matchesLang = ch.languages && ch.languages.some((l) => l.toLowerCase().includes(query));
      if (!matchesName && !matchesGroup && !matchesCountry && !matchesLang) {
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
        countryFlag: getCountryFlag(countryCode),
        languages: resolveChannelLanguages('', cleanName, '', countryCode),
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

