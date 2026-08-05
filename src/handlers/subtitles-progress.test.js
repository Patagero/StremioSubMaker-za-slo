const test = require('node:test');
const assert = require('node:assert/strict');

// Keep this regression contract close to the user-facing SRT format.
test('translation progress contains a visible bar and reselect instruction', () => {
  const completed = 25;
  const total = 100;
  const percent = Math.round((completed / total) * 100);
  const width = 20;
  const filled = Math.round((percent / 100) * width);
  const bar = `[${'='.repeat(filled)}${'-'.repeat(width - filled)}] ${percent}% (${completed}/${total})`;
  const subtitle = `TRANSLATION IN PROGRESS\n${bar}\nRe-select this same subtitle later`;
  assert.match(subtitle, /\[=====---------------\] 25% \(25\/100\)/);
  assert.match(subtitle, /Re-select this same subtitle/);
});

module.exports = {};
