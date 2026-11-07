import React, { useState, useMemo, useEffect } from 'react';
import {
  Globe,
  Languages,
  Check,
  X,
  Search,
  Sparkles,
  MapPin,
  RotateCcw,
  SlidersHorizontal,
  ChevronRight,
  Tv,
} from 'lucide-react';
import { CountryFlag } from './CountryFlag';

export interface CountryItem {
  code: string;
  name: string;
  count: number;
}

export interface LanguageItem {
  code: string;
  name: string;
  nativeName: string;
  count: number;
}

interface CountryLanguageModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCountries: string[];
  selectedLanguages: string[];
  onApply: (countries: string[], languages: string[], promptOnRefresh: boolean) => void;
  availableCountries: CountryItem[];
  availableLanguages: LanguageItem[];
  promptOnRefresh: boolean;
  isFirstLaunch?: boolean;
}

// Representative flag for popular languages
const LANGUAGE_FLAG_MAP: Record<string, string> = {
  English: 'US',
  Spanish: 'ES',
  Urdu: 'PK',
  Hindi: 'IN',
  Arabic: 'SA',
  French: 'FR',
  German: 'DE',
  Turkish: 'TR',
  Portuguese: 'BR',
  Italian: 'IT',
  Russian: 'RU',
  Chinese: 'CN',
  Japanese: 'JP',
  Korean: 'KR',
  Dutch: 'NL',
  Polish: 'PL',
  Ukrainian: 'UA',
  Indonesian: 'ID',
  Greek: 'GR',
  Vietnamese: 'VN',
  Thai: 'TH',
  Swedish: 'SE',
  Persian: 'IR',
  Hebrew: 'IL',
};

const POPULAR_QUICK_COUNTRIES = [
  { code: 'US', name: 'United States' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'PK', name: 'Pakistan' },
  { code: 'IN', name: 'India' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'ES', name: 'Spain' },
  { code: 'TR', name: 'Turkey' },
  { code: 'SA', name: 'Saudi Arabia' },
  { code: 'AE', name: 'UAE' },
  { code: 'CA', name: 'Canada' },
  { code: 'AU', name: 'Australia' },
];

const REGIONAL_PRESETS = [
  {
    id: 'global-all',
    name: 'Worldwide (All Channels)',
    description: 'Browse the entire directory across 10,000+ live stations with no country or language filters.',
    countries: [] as string[],
    languages: [] as string[],
    flags: ['US', 'GB', 'DE', 'FR', 'PK', 'IN', 'JP', 'BR'],
    badge: '10,000+ Streams',
  },
  {
    id: 'english-world',
    name: 'English-Speaking Broadcasts',
    description: 'United States, United Kingdom, Canada, Australia and global English news networks.',
    countries: ['US', 'GB', 'CA', 'AU'],
    languages: ['English'],
    flags: ['US', 'GB', 'CA', 'AU'],
    badge: 'English News & Sports',
  },
  {
    id: 'europe',
    name: 'Europe & British Isles',
    description: 'United Kingdom, Germany, France, Spain and Italy live public & private television.',
    countries: ['GB', 'DE', 'FR', 'ES', 'IT'],
    languages: ['English', 'German', 'French', 'Spanish', 'Italian'],
    flags: ['GB', 'DE', 'FR', 'ES', 'IT'],
    badge: 'European Hub',
  },
  {
    id: 'south-asia',
    name: 'South Asia (Pakistan, India & BD)',
    description: 'Live channels in Urdu, Hindi, Bengali and English across South Asian broadcasters.',
    countries: ['PK', 'IN', 'BD'],
    languages: ['Urdu', 'Hindi', 'English'],
    flags: ['PK', 'IN', 'BD'],
    badge: 'Urdu & Hindi',
  },
  {
    id: 'middle-east',
    name: 'Middle East & Arab World',
    description: 'Saudi Arabia, UAE, Qatar, Turkey & Egypt with 24/7 Arabic and Turkish news.',
    countries: ['SA', 'AE', 'QA', 'TR', 'EG'],
    languages: ['Arabic', 'Turkish', 'English'],
    flags: ['SA', 'AE', 'QA', 'TR', 'EG'],
    badge: 'Arabic & Turkish',
  },
  {
    id: 'latin-america',
    name: 'Latin America & Spain',
    description: 'Spain, Mexico, Argentina, Colombia and Brazil featuring Spanish and Portuguese.',
    countries: ['ES', 'MX', 'AR', 'CO', 'BR'],
    languages: ['Spanish', 'Portuguese'],
    flags: ['ES', 'MX', 'AR', 'CO', 'BR'],
    badge: 'Spanish & Portuguese',
  },
];

export const CountryLanguageModal: React.FC<CountryLanguageModalProps> = ({
  isOpen,
  onClose,
  selectedCountries: initialCountries,
  selectedLanguages: initialLanguages,
  onApply,
  availableCountries,
  availableLanguages,
  promptOnRefresh: initialPromptOnRefresh,
  isFirstLaunch = false,
}) => {
  const [activeTab, setActiveTab] = useState<'countries' | 'languages' | 'presets'>('countries');
  const [draftCountries, setDraftCountries] = useState<string[]>(initialCountries);
  const [draftLanguages, setDraftLanguages] = useState<string[]>(initialLanguages);
  const [promptSetting, setPromptSetting] = useState<boolean>(initialPromptOnRefresh);
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      setDraftCountries(initialCountries);
      setDraftLanguages(initialLanguages);
      setPromptSetting(initialPromptOnRefresh);
      setSearchQuery('');
    }
  }, [isOpen, initialCountries, initialLanguages, initialPromptOnRefresh]);

  const filteredCountries = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return availableCountries;
    return availableCountries.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q)
    );
  }, [availableCountries, searchQuery]);

  const filteredLanguages = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return availableLanguages;
    return availableLanguages.filter(
      (l) =>
        l.name.toLowerCase().includes(q) ||
        l.nativeName.toLowerCase().includes(q) ||
        l.code.toLowerCase().includes(q)
    );
  }, [availableLanguages, searchQuery]);

  if (!isOpen) return null;

  const toggleCountry = (code: string) => {
    setDraftCountries((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  const toggleLanguage = (name: string) => {
    setDraftLanguages((prev) =>
      prev.includes(name) ? prev.filter((l) => l !== name) : [...prev, name]
    );
  };

  const handleSelectAllCountries = () => {
    setDraftCountries(availableCountries.map((c) => c.code));
  };

  const handleClearCountries = () => {
    setDraftCountries([]);
  };

  const handleSelectAllLanguages = () => {
    setDraftLanguages(availableLanguages.map((l) => l.name));
  };

  const handleClearLanguages = () => {
    setDraftLanguages([]);
  };

  const handleApplyPreset = (presetCountries: string[], presetLanguages: string[]) => {
    setDraftCountries(presetCountries);
    setDraftLanguages(presetLanguages);
    setActiveTab('countries');
  };

  const handleSaveAndApply = () => {
    onApply(draftCountries, draftLanguages, promptSetting);
    onClose();
  };

  const handleShowAll = () => {
    setDraftCountries([]);
    setDraftLanguages([]);
    onApply([], [], promptSetting);
    onClose();
  };

  const hasSelections = draftCountries.length > 0 || draftLanguages.length > 0;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="region-modal-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-5 bg-black/75 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="w-full max-w-3xl rounded-t-3xl sm:rounded-3xl bg-white dark:bg-[#121215] border border-black/10 dark:border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[94vh] sm:max-h-[92vh]">
        {/* Header */}
        <div className="px-4 sm:px-7 pt-4 sm:pt-6 pb-3 sm:pb-4 border-b border-black/5 dark:border-white/10 flex items-start justify-between gap-3 bg-gradient-to-b from-zinc-50/80 to-transparent dark:from-white/[0.02] dark:to-transparent">
          <div className="flex items-start gap-3">
            <div className="w-9 sm:w-10 h-9 sm:h-10 rounded-2xl bg-[#0071E3]/15 dark:bg-[#0071E3]/25 flex items-center justify-center text-[#0071E3] shrink-0 mt-0.5 shadow-xs">
              <Globe className="w-4 sm:w-5 h-4 sm:h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2
                  id="region-modal-title"
                  className="text-base sm:text-xl font-bold text-zinc-900 dark:text-white tracking-tight"
                >
                  {isFirstLaunch
                    ? 'Country & Language Setup'
                    : 'Country & Language Preferences'}
                </h2>
                <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#0071E3]/15 text-[#0071E3] border border-[#0071E3]/25">
                  Multi-Select
                </span>
              </div>
              <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-0.5 leading-relaxed">
                Filter live channels by your favorite countries and broadcast languages. Tap multiple cards to combine regions.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close preferences"
            className="w-8 sm:w-9 h-8 sm:h-9 rounded-full bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 flex items-center justify-center transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Popular Quick Select Carousel */}
        <div className="px-4 sm:px-7 py-2 bg-zinc-50/80 dark:bg-zinc-900/60 border-b border-black/5 dark:border-white/5 w-full min-w-0">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5 w-full min-w-0">
            <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 whitespace-nowrap shrink-0 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-500" />
              Quick Picks:
            </span>
            {POPULAR_QUICK_COUNTRIES.map((item) => {
              const isSelected = draftCountries.includes(item.code);
              return (
                <button
                  key={item.code}
                  type="button"
                  onClick={() => toggleCountry(item.code)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-medium transition-all shrink-0 active:scale-95 ${
                    isSelected
                      ? 'bg-[#0071E3] text-white shadow-xs'
                      : 'bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-black/5 dark:border-white/10 hover:border-black/20'
                  }`}
                >
                  <CountryFlag code={item.code} size="xs" />
                  <span>{item.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Navigation & Search Bar */}
        <div className="px-4 sm:px-7 pt-3 pb-2.5 border-b border-black/5 dark:border-white/10 bg-white dark:bg-[#121215] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 w-full min-w-0">
          {/* Segmented Tabs (Equal 3-column grid on mobile, flex on desktop) */}
          <div
            role="tablist"
            className="w-full sm:w-auto grid grid-cols-3 sm:flex items-center p-1 rounded-xl bg-zinc-100 dark:bg-zinc-800/90 shrink-0"
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'countries'}
              onClick={() => setActiveTab('countries')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeTab === 'countries'
                  ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              <MapPin className="w-3.5 h-3.5 text-[#0071E3]" />
              <span>Countries</span>
              <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-zinc-200/80 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200">
                {draftCountries.length === 0 ? 'All' : draftCountries.length}
              </span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'languages'}
              onClick={() => setActiveTab('languages')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeTab === 'languages'
                  ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              <Languages className="w-3.5 h-3.5 text-emerald-500" />
              <span>Languages</span>
              <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-zinc-200/80 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200">
                {draftLanguages.length === 0 ? 'All' : draftLanguages.length}
              </span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'presets'}
              onClick={() => setActiveTab('presets')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeTab === 'presets'
                  ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Presets</span>
            </button>
          </div>

          {/* Search Box */}
          {activeTab !== 'presets' && (
            <div className="relative flex-1 max-w-xs">
              <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  activeTab === 'countries'
                    ? 'Search countries (e.g. US, Spain, Pakistan)...'
                    : 'Search languages (e.g. English, Urdu, Spanish)...'
                }
                className="w-full h-8.5 pl-8.5 pr-7 py-1 rounded-xl bg-zinc-100/90 dark:bg-zinc-800/80 border border-transparent focus:border-[#0071E3] text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-zinc-300 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-200 flex items-center justify-center text-[10px]"
                >
                  ✕
                </button>
              )}
            </div>
          )}
        </div>

        {/* Active Selection Tray (Visible if user has made picks) */}
        {hasSelections && (
          <div className="px-5 sm:px-7 py-2 bg-[#0071E3]/5 dark:bg-[#0071E3]/10 border-b border-[#0071E3]/15 flex items-center justify-between gap-3 overflow-x-auto no-scrollbar">
            <div className="flex items-center gap-1.5 flex-1 min-w-0">
              <span className="text-[11px] font-semibold text-[#0071E3] shrink-0">
                Selected:
              </span>
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                {draftCountries.map((code) => {
                  const opt = availableCountries.find((c) => c.code === code);
                  return (
                    <span
                      key={code}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-medium bg-white dark:bg-zinc-800 border border-black/10 dark:border-white/10 shadow-2xs shrink-0"
                    >
                      <CountryFlag code={code} size="xs" />
                      <span className="text-zinc-800 dark:text-zinc-200 truncate max-w-[90px]">
                        {opt?.name || code}
                      </span>
                      <button
                        type="button"
                        onClick={() => toggleCountry(code)}
                        className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 ml-0.5"
                      >
                        ✕
                      </button>
                    </span>
                  );
                })}
                {draftLanguages.map((lang) => (
                  <span
                    key={lang}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-medium bg-white dark:bg-zinc-800 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 shadow-2xs shrink-0"
                  >
                    <Languages className="w-3 h-3" />
                    <span>{lang}</span>
                    <button
                      type="button"
                      onClick={() => toggleLanguage(lang)}
                      className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 ml-0.5"
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setDraftCountries([]);
                setDraftLanguages([]);
              }}
              className="text-[11px] font-medium text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:underline shrink-0"
            >
              Clear All
            </button>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-7">
          {/* TAB 1: COUNTRIES */}
          {activeTab === 'countries' && (
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3.5 pb-2 border-b border-black/5 dark:border-white/5">
                <div className="text-xs text-zinc-500 dark:text-zinc-400">
                  {draftCountries.length === 0 ? (
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <Globe className="w-3.5 h-3.5" />
                      Showing all global countries (no restrictions)
                    </span>
                  ) : (
                    <span>
                      <strong className="text-zinc-900 dark:text-white font-bold">
                        {draftCountries.length}
                      </strong>{' '}
                      countries selected
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSelectAllCountries}
                    className="text-xs text-[#0071E3] hover:underline font-semibold"
                  >
                    Select All
                  </button>
                  <span className="text-zinc-300 dark:text-zinc-700">·</span>
                  <button
                    type="button"
                    onClick={handleClearCountries}
                    className="text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:underline"
                  >
                    Clear Filter
                  </button>
                </div>
              </div>

              {filteredCountries.length === 0 ? (
                <div className="py-16 text-center text-zinc-400 text-sm">
                  No countries match &quot;{searchQuery}&quot;
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                  {filteredCountries.map((c) => {
                    const isSelected = draftCountries.includes(c.code);
                    return (
                      <button
                        key={c.code}
                        type="button"
                        onClick={() => toggleCountry(c.code)}
                        className={`p-3 rounded-2xl border text-left transition-all flex items-center justify-between gap-3 group cursor-pointer ${
                          isSelected
                            ? 'bg-[#0071E3]/10 dark:bg-[#0071E3]/15 border-[#0071E3] shadow-xs'
                            : 'bg-white dark:bg-zinc-800/50 border-black/5 dark:border-white/10 hover:border-black/20 dark:hover:border-white/25 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/80'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <CountryFlag code={c.code} size="md" />
                          <div className="min-w-0">
                            <div className="text-xs sm:text-sm font-semibold text-zinc-900 dark:text-white truncate">
                              {c.name}
                            </div>
                            <div className="text-[11px] text-zinc-400 font-mono flex items-center gap-1.5 mt-0.5">
                              <span className="font-semibold text-zinc-500 dark:text-zinc-400">
                                {c.code}
                              </span>
                              <span>·</span>
                              <span>{c.count} {c.count === 1 ? 'channel' : 'channels'}</span>
                            </div>
                          </div>
                        </div>

                        <div
                          className={`w-5 h-5 rounded-lg flex items-center justify-center shrink-0 transition-all ${
                            isSelected
                              ? 'bg-[#0071E3] text-white shadow-xs'
                              : 'border border-zinc-300 dark:border-zinc-600 group-hover:border-[#0071E3]'
                          }`}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: LANGUAGES */}
          {activeTab === 'languages' && (
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3.5 pb-2 border-b border-black/5 dark:border-white/5">
                <div className="text-xs text-zinc-500 dark:text-zinc-400">
                  {draftLanguages.length === 0 ? (
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <Languages className="w-3.5 h-3.5" />
                      Showing all broadcast languages
                    </span>
                  ) : (
                    <span>
                      <strong className="text-zinc-900 dark:text-white font-bold">
                        {draftLanguages.length}
                      </strong>{' '}
                      languages selected
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSelectAllLanguages}
                    className="text-xs text-[#0071E3] hover:underline font-semibold"
                  >
                    Select All
                  </button>
                  <span className="text-zinc-300 dark:text-zinc-700">·</span>
                  <button
                    type="button"
                    onClick={handleClearLanguages}
                    className="text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:underline"
                  >
                    Clear Filter
                  </button>
                </div>
              </div>

              {filteredLanguages.length === 0 ? (
                <div className="py-16 text-center text-zinc-400 text-sm">
                  No languages match &quot;{searchQuery}&quot;
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                  {filteredLanguages.map((l) => {
                    const isSelected = draftLanguages.includes(l.name);
                    const repCountry = LANGUAGE_FLAG_MAP[l.name] || 'INT';
                    return (
                      <button
                        key={l.code || l.name}
                        type="button"
                        onClick={() => toggleLanguage(l.name)}
                        className={`p-3 rounded-2xl border text-left transition-all flex items-center justify-between gap-3 group cursor-pointer ${
                          isSelected
                            ? 'bg-[#0071E3]/10 dark:bg-[#0071E3]/15 border-[#0071E3] shadow-xs'
                            : 'bg-white dark:bg-zinc-800/50 border-black/5 dark:border-white/10 hover:border-black/20 dark:hover:border-white/25 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/80'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <CountryFlag code={repCountry} size="md" />
                          <div className="min-w-0">
                            <div className="text-xs sm:text-sm font-semibold text-zinc-900 dark:text-white truncate">
                              {l.name}
                            </div>
                            <div className="text-[11px] text-zinc-400 flex items-center gap-1.5 mt-0.5 truncate">
                              {l.nativeName && l.nativeName !== l.name && (
                                <span className="font-medium text-zinc-600 dark:text-zinc-300">
                                  {l.nativeName} ·
                                </span>
                              )}
                              <span className="font-mono">{l.count} ch</span>
                            </div>
                          </div>
                        </div>

                        <div
                          className={`w-5 h-5 rounded-lg flex items-center justify-center shrink-0 transition-all ${
                            isSelected
                              ? 'bg-[#0071E3] text-white shadow-xs'
                              : 'border border-zinc-300 dark:border-zinc-600 group-hover:border-[#0071E3]'
                          }`}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: REGIONAL PRESETS */}
          {activeTab === 'presets' && (
            <div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4">
                Choose a pre-configured bundle to instantly set national flags, countries, and broadcast languages:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {REGIONAL_PRESETS.map((p) => {
                  const isMatch =
                    p.countries.length === draftCountries.length &&
                    p.countries.every((c) => draftCountries.includes(c)) &&
                    p.languages.length === draftLanguages.length &&
                    p.languages.every((l) => draftLanguages.includes(l));

                  return (
                    <div
                      key={p.name}
                      className={`p-4.5 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
                        isMatch
                          ? 'bg-[#0071E3]/10 dark:bg-[#0071E3]/15 border-[#0071E3] shadow-xs'
                          : 'bg-white dark:bg-zinc-800/40 border-black/5 dark:border-white/10 hover:border-black/20 dark:hover:border-white/20'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <h4 className="text-sm font-bold text-zinc-900 dark:text-white">
                            {p.name}
                          </h4>
                          <span className="text-[11px] font-semibold text-[#0071E3] bg-[#0071E3]/10 px-2 py-0.5 rounded-full">
                            {p.badge}
                          </span>
                        </div>

                        {/* Flag Preview Row */}
                        <div className="flex items-center gap-1.5 mb-2.5">
                          {p.flags.map((flagCode) => (
                            <CountryFlag key={flagCode} code={flagCode} size="sm" />
                          ))}
                        </div>

                        <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                          {p.description}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-2.5 border-t border-black/5 dark:border-white/5">
                        <span className="text-[11px] text-zinc-400 font-mono">
                          {p.countries.length === 0
                            ? 'Worldwide coverage'
                            : `${p.countries.length} countries · ${p.languages.length} lang`}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleApplyPreset(p.countries, p.languages)}
                          className="px-3.5 py-1.5 rounded-xl bg-[#0071E3] hover:bg-[#0077ED] text-white text-xs font-semibold transition-colors flex items-center gap-1"
                        >
                          <span>Apply Preset</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 sm:p-5 border-t border-black/5 dark:border-white/10 bg-zinc-50 dark:bg-zinc-900/90 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 w-full min-w-0 pb-safe">
          {/* Ask on startup/refresh checkbox */}
          <label className="flex items-center gap-2 cursor-pointer text-xs text-zinc-600 dark:text-zinc-300 select-none">
            <input
              type="checkbox"
              checked={promptSetting}
              onChange={(e) => setPromptSetting(e.target.checked)}
              className="w-4 h-4 rounded accent-[#0071E3] cursor-pointer"
            />
            <span>Prompt for regions on launch and refresh</span>
          </label>

          {/* Action buttons */}
          <div className="flex items-center gap-2 sm:gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleShowAll}
              className="flex-1 sm:flex-initial px-3 sm:px-4 py-2.5 rounded-xl text-xs font-medium text-zinc-600 dark:text-zinc-300 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 transition-colors text-center active:scale-95"
            >
              Show All
            </button>
            <button
              type="button"
              onClick={handleSaveAndApply}
              className="flex-1 sm:flex-initial px-4 sm:px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-[#0071E3] hover:bg-[#0077ED] transition-colors shadow-sm flex items-center justify-center gap-2 active:scale-95"
            >
              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Apply Filters</span>
              {hasSelections && (
                <span className="px-1.5 py-0.2 rounded-full bg-white/20 text-[10px] font-mono">
                  {draftCountries.length > 0 ? `${draftCountries.length} C` : ''}
                  {draftCountries.length > 0 && draftLanguages.length > 0 ? ', ' : ''}
                  {draftLanguages.length > 0 ? `${draftLanguages.length} L` : ''}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
