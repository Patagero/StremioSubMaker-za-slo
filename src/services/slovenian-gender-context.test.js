const test = require('node:test');
const assert = require('node:assert/strict');
const TranslationEngine = require('./translationEngine');

function createEngine() {
  return new TranslationEngine({
    translateSubtitle: async () => '',
    countTokensForTranslation: async () => 1
  }, 'test-model', {
    enableBatchContext: true,
    contextSize: 3,
    translationWorkflow: 'xml'
  }, { enableStreaming: false });
}

test('builds Slovenian prompts with character memory, surrounding context and gender rules', () => {
  const engine = createEngine();
  const batch = [
    { id: 4, text: 'I am ready.', timecode: '00:00:04,000 --> 00:00:06,000' }
  ];
  const context = {
    surroundingOriginal: [
      { id: 1, text: 'SARAH: She was scared.', timecode: '' },
      { id: 2, text: 'JOHN: He is safe now.', timecode: '' }
    ],
    previousTranslations: [
      { id: 1, text: 'SARAH: Bila sem prestrašena.' },
      { id: 2, text: 'JOHN: Zdaj si na varnem.' }
    ],
    characterMemory: {
      SARAH: { gender: 'female', evidence: 'bila sem' },
      JOHN: { gender: 'male', evidence: 'bil sem' }
    }
  };

  const prompt = engine.createXmlBatchPrompt(
    engine.prepareBatchXml(batch, context),
    'Slovene',
    null,
    1,
    context,
    1,
    2
  );

  assert.match(prompt, /CHARACTER MEMORY/i);
  assert.match(prompt, /SARAH.*female/i);
  assert.match(prompt, /previous translations/i);
  assert.match(prompt, /masculine\/feminine|gender/i);
  assert.match(prompt, /ona\/on/i);
});

test('prepareContextForBatch includes preceding and following subtitle context', () => {
  const engine = createEngine();
  const entries = Array.from({ length: 6 }, (_, index) => ({
    id: index + 1,
    text: `Line ${index + 1}`,
    timecode: ''
  }));
  const context = engine.prepareContextForBatch(entries.slice(2, 4), entries, [], 1);

  assert.equal(context.surroundingOriginal.length, 2);
  assert.equal(context.surroundingOriginal[0].text, 'Line 1');
  assert.equal(context.surroundingOriginal[1].text, 'Line 2');
  assert.equal(context.followingOriginal.length, 2);
  assert.equal(context.followingOriginal[0].text, 'Line 5');
  assert.equal(context.followingOriginal[1].text, 'Line 6');
});

 test('gender review prompt requests corrected Slovenian SRT only', () => {
  const engine = createEngine();
  const prompt = engine.createSlovenianGenderReviewPrompt(
    '1\n00:00:00,000 --> 00:00:01,000\nBila sem pripravljena.'
  );

  assert.match(prompt, /review/i);
  assert.match(prompt, /spol|gender/i);
  assert.match(prompt, /ONLY.*SRT/i);
});

module.exports = {};
