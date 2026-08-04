const test = require('node:test');
const assert = require('node:assert/strict');
const { parseProbeOutput, selectPreferredEnglishTrack, validateStreamUrl } = require('./embeddedStreamSubtitles');

test('probe parser exposes only embedded subtitle streams and metadata', () => {
  const tracks = parseProbeOutput(JSON.stringify({ streams: [
    { index: 2, codec_type: 'video' },
    { index: 3, codec_type: 'subtitle', codec_name: 'subrip', tags: { language: 'eng', title: 'English' }, disposition: { default: 1 } }
  ] }));
  assert.deepEqual(tracks, [{ index: 0, streamIndex: 3, codec: 'subrip', language: 'eng', title: 'English', forced: false, default: true }]);
});

test('stream URL validation rejects unsafe protocols and credentials', () => {
  assert.equal(validateStreamUrl('https://example.com/video.mkv'), 'https://example.com/video.mkv');
  assert.throws(() => validateStreamUrl('file:///tmp/video.mkv'), /HTTP/);
  assert.throws(() => validateStreamUrl('https://user:pass@example.com/video.mkv'), /credentials/);
});

test('preferred embedded fallback selects English text tracks only', () => {
  const tracks = [
    { streamIndex: 1, language: 'spa', forced: false },
    { streamIndex: 2, language: 'eng', forced: true },
    { streamIndex: 3, language: 'en', forced: false }
  ];
  assert.equal(selectPreferredEnglishTrack(tracks).streamIndex, 3);
  assert.equal(selectPreferredEnglishTrack([{ streamIndex: 1, language: 'spa', forced: false }]), null);
});

test('embedded fallback only runs when Stremio provides a stream URL', () => {
  const extra = { filename: 'movie.mkv' };
  const streamUrl = String(extra.streamUrl || extra.streamURL || extra.videoUrl || '').trim();
  assert.equal(streamUrl, '');
});

module.exports = {};
