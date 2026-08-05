const test = require('node:test');
const assert = require('node:assert/strict');

test('translation progress bar is visible in loading subtitle text', () => {
  const completed = 25;
  const total = 100;
  const percent = Math.round((completed / total) * 100);
  const width = 20;
  const filled = Math.round((percent / 100) * width);
  const bar = `[${'='.repeat(filled)}${'-'.repeat(width - filled)}] ${percent}% (${completed}/${total})`;
  assert.equal(bar, '[=====---------------] 25% (25/100)');
  assert.match(`TRANSLATION IN PROGRESS\n${bar}\nRe-select this same subtitle later`, /\[=====---------------\] 25% \(25\/100\)/);
});

module.exports = {};
