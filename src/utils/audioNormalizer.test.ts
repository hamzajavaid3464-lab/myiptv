import test from 'node:test';
import assert from 'node:assert/strict';
import {
  dbToLinearGain,
  getCompressorPreset,
  formatGainReductionDb,
} from './audioNormalizer';

test('dbToLinearGain accurately converts decibels to linear gain', () => {
  assert.equal(dbToLinearGain(0), 1);
  assert.ok(dbToLinearGain(6) > 1.99 && dbToLinearGain(6) < 2.01);
  assert.ok(dbToLinearGain(-6) > 0.49 && dbToLinearGain(-6) < 0.51);
});

test('getCompressorPreset returns expected compressor parameters for each mode', () => {
  const broadcast = getCompressorPreset('broadcast');
  assert.equal(broadcast.threshold, -24);
  assert.equal(broadcast.ratio, 6);
  assert.equal(broadcast.makeupGainDb, 4.5);

  const night = getCompressorPreset('night');
  assert.equal(night.threshold, -32);
  assert.equal(night.ratio, 12);
  assert.ok(night.makeupGainDb > broadcast.makeupGainDb);

  const off = getCompressorPreset('off');
  assert.equal(off.ratio, 1);
  assert.equal(off.makeupGainDb, 0);
});

test('formatGainReductionDb formats live compressor attenuation cleanly', () => {
  assert.equal(formatGainReductionDb(0), '0.0 dB');
  assert.equal(formatGainReductionDb(-0.02), '0.0 dB');
  assert.equal(formatGainReductionDb(-4.36), '-4.4 dB');
});
