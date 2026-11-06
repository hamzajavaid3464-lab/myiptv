import test from 'node:test';
import assert from 'node:assert/strict';
import {
  parseM3U,
  parseChannelMetadata,
  parseCountryFromTvgId,
  normalizeCategories,
  filterChannels,
  recordWatchedChannel,
  buildShareableChannelUrl,
  resolveSharedChannelFromQuery,
  StreamHealthStatus,
} from './m3uParser';

const SAMPLE_M3U = `#EXTM3U
#EXTINF:-1 tvg-id="NASATVPublic.us@HD" tvg-logo="https://example.com/nasa.png" group-title="Science;Education",NASA TV Public (1080p)
https://ntv1.akamaized.net/hls/live/2014075/NASA-NTV1-HLS/master.m3u8
#EXTINF:-1 tvg-id="BBCNews.uk" tvg-logo="https://example.com/bbc.png" group-title="News",BBC News (720p) [Geo-blocked] [Not 24/7]
#EXTVLCOPT:http-user-agent=Mozilla/5.0
http://stream.example.co.uk/bbc/index.m3u8
#EXTINF:-1 tvg-id="RedBullTV.at" tvg-logo="https://example.com/rb.png" group-title="Sports",Red Bull TV (2160p)
https://rbmn-live.akamaized.net/hls/live/590964/BoRB-AT/master.m3u8
`;

test('parseChannelMetadata strips resolution and status flags cleanly', () => {
  const meta = parseChannelMetadata('BBC News (720p) [Geo-blocked] [Not 24/7]');
  assert.equal(meta.cleanName, 'BBC News');
  assert.equal(meta.resolution, '720p');
  assert.equal(meta.isGeoBlocked, true);
  assert.equal(meta.isNot247, true);
});

test('parseCountryFromTvgId extracts ISO country code from iptv-org tvg-id', () => {
  assert.equal(parseCountryFromTvgId('NASATVPublic.us@HD', ''), 'US');
  assert.equal(parseCountryFromTvgId('BBCNews.uk', ''), 'GB');
  assert.equal(parseCountryFromTvgId('UnknownChannel', ''), 'INT');
});

test('normalizeCategories splits compound group titles', () => {
  const res = normalizeCategories('science;education');
  assert.equal(res.primary, 'Science');
  assert.deepEqual(res.all, ['Science', 'Education']);
});

test('parseM3U parses iptv-org playlist entries and VLC options accurately', () => {
  const channels = parseM3U(SAMPLE_M3U);
  assert.equal(channels.length, 3);

  assert.equal(channels[0].name, 'NASA TV Public');
  assert.equal(channels[0].countryCode, 'US');
  assert.equal(channels[0].resolution, '1080p');
  assert.equal(channels[0].isHttps, true);

  assert.equal(channels[1].name, 'BBC News');
  assert.equal(channels[1].countryCode, 'GB');
  assert.equal(channels[1].isGeoBlocked, true);
  assert.equal(channels[1].isHttps, false);
  assert.equal(channels[1].userAgent, 'Mozilla/5.0');

  assert.equal(channels[2].resolution, '4K');
});

test('filterChannels filters by search query, category, HTTPS, geo-blocked, and broken stream health', () => {
  const channels = parseM3U(SAMPLE_M3U);

  const httpsOnly = filterChannels(channels, { httpsOnly: true });
  assert.equal(httpsOnly.length, 2);

  const noGeoBlocked = filterChannels(channels, { hideGeoBlocked: true });
  assert.equal(noGeoBlocked.length, 2);

  const educationSearch = filterChannels(channels, { category: 'Education' });
  assert.equal(educationSearch.length, 1);
  assert.equal(educationSearch[0].name, 'NASA TV Public');

  const querySearch = filterChannels(channels, { query: 'austria' });
  assert.equal(querySearch.length, 1);
  assert.equal(querySearch[0].name, 'Red Bull TV');

  const healthMap: Record<string, StreamHealthStatus> = {
    [channels[0].id]: 'offline',
    [channels[2].id]: 'online',
  };
  const healthyOnly = filterChannels(channels, {
    httpsOnly: true,
    hideBrokenStreams: true,
    healthMap,
  });
  assert.equal(healthyOnly.length, 1);
  assert.equal(healthyOnly[0].name, 'Red Bull TV');
});

test('recordWatchedChannel deduplicates and orders most recent channel first', () => {
  const channels = parseM3U(SAMPLE_M3U);
  let history = recordWatchedChannel([], channels[0], 1000);
  history = recordWatchedChannel(history, channels[2], 2000);
  assert.equal(history.length, 2);
  assert.equal(history[0].channel.name, 'Red Bull TV');

  // Re-watching channels[0] moves it to index 0 without duplicating
  history = recordWatchedChannel(history, channels[0], 3000);
  assert.equal(history.length, 2);
  assert.equal(history[0].channel.name, 'NASA TV Public');
  assert.equal(history[0].watchedAt, 3000);
});

test('buildShareableChannelUrl and resolveSharedChannelFromQuery round-trip channel links', () => {
  const channels = parseM3U(SAMPLE_M3U);
  const shareUrl = buildShareableChannelUrl('https://cupertinotv.vercel.app/', channels[2]);
  const parsedUrl = new URL(shareUrl);

  const resolved = resolveSharedChannelFromQuery(parsedUrl.search, channels);
  assert.ok(resolved);
  assert.equal(resolved.name, 'Red Bull TV');
  assert.equal(resolved.url, channels[2].url);

  // Also test resolving an external shared stream URL not yet in the local list
  const customResolved = resolveSharedChannelFromQuery(
    '?channel=custom-1&name=Custom+Live&stream=https%3A%2F%2Fexample.com%2Flive.m3u8&country=FR&group=Music&res=1080p',
    channels
  );
  assert.ok(customResolved);
  assert.equal(customResolved.name, 'Custom Live');
  assert.equal(customResolved.countryCode, 'FR');
  assert.equal(customResolved.group, 'Music');
});
