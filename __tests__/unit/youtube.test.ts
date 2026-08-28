import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizeYoutubeChannelInput } from '@/lib/services/youtube';

test('normalizes YouTube channel configuration values', () => {
  assert.equal(normalizeYoutubeChannelInput(' UC1234567890123456789012 '), 'UC1234567890123456789012');
  assert.equal(normalizeYoutubeChannelInput('https://www.youtube.com/channel/UC1234567890123456789012'), 'UC1234567890123456789012');
  assert.equal(normalizeYoutubeChannelInput('https://www.youtube.com/@ZikrMediaOfficial'), '@ZikrMediaOfficial');
  assert.equal(normalizeYoutubeChannelInput('www.youtube.com/@ZikrMediaOfficial/videos'), '@ZikrMediaOfficial');
});
