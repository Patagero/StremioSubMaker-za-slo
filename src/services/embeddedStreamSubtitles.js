const { execFile } = require('child_process');
const { promisify } = require('util');
const { randomUUID } = require('crypto');
const execFileAsync = promisify(execFile);

const MAX_STREAM_URL_LENGTH = 4096;
const MAX_TRACK_INDEX = 99;
const MAX_OUTPUT_BYTES = 25 * 1024 * 1024;

function validateStreamUrl(value) {
  const raw = String(value || '').trim();
  if (!raw || raw.length > MAX_STREAM_URL_LENGTH) throw new Error('Invalid stream URL');
  const url = new URL(raw);
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Only HTTP(S) stream URLs are supported');
  if (url.username || url.password) throw new Error('Stream URLs with embedded credentials are not supported');
  return url.toString();
}

function parseProbeOutput(stdout) {
  const data = JSON.parse(stdout || '{}');
  return (data.streams || [])
    .filter(stream => stream.codec_type === 'subtitle')
    .slice(0, MAX_TRACK_INDEX + 1)
    .map((stream, index) => ({
      index,
      streamIndex: Number.isInteger(stream.index) ? stream.index : index,
      codec: stream.codec_name || '',
      language: stream.tags?.language || stream.tags?.LANGUAGE || 'und',
      title: stream.tags?.title || stream.tags?.handler_name || `Embedded subtitle ${index + 1}`,
      forced: stream.disposition?.forced === 1,
      default: stream.disposition?.default === 1
    }));
}

async function probeStream(streamUrl) {
  const url = validateStreamUrl(streamUrl);
  const { stdout } = await execFileAsync('ffprobe', [
    '-v', 'error', '-print_format', 'json', '-show_streams', '-select_streams', 's', url
  ], { timeout: 30000, maxBuffer: 2 * 1024 * 1024 });
  return parseProbeOutput(stdout);
}

async function extractSubtitle(streamUrl, streamIndex) {
  const url = validateStreamUrl(streamUrl);
  const index = Number(streamIndex);
  if (!Number.isInteger(index) || index < 0 || index > MAX_TRACK_INDEX) throw new Error('Invalid subtitle track index');
  const output = await execFileAsync('ffmpeg', [
    '-nostdin', '-v', 'error', '-i', url, '-map', `0:${index}`, '-f', 'srt', 'pipe:1'
  ], { timeout: 180000, maxBuffer: MAX_OUTPUT_BYTES });
  const content = String(output.stdout || '').trim();
  if (!content || !/\d+\s*\r?\n[^\r\n]+-->[^\r\n]+/m.test(content)) throw new Error('Embedded track is not a text subtitle stream');
  return content;
}

function createJobId() {
  return randomUUID().replace(/-/g, '');
}

module.exports = {
  MAX_OUTPUT_BYTES,
  createJobId,
  extractSubtitle,
  parseProbeOutput,
  probeStream,
  validateStreamUrl
};
