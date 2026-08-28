import test from 'node:test';
import assert from 'node:assert/strict';
import { classifyQuestion, detectEmotion, isCrisisMessage } from '../../lib/services/spiritual-ai-policy';
import {
  deriveQuranSearchVariants,
  deriveSpiritualSearchTerm,
  formatSourcesForPrompt,
  type SpiritualSource,
} from '../../lib/services/spiritual-retriever';

test('classifies fiqh and spiritual questions separately', () => {
  assert.equal(classifyQuestion('ما حكم الربا؟'), 'fatwa');
  assert.equal(classifyQuestion('أشعر بالحزن وأحتاج مواساة'), 'spiritual');
  assert.equal(classifyQuestion('أريد دعاء للنوم'), 'dhikr');
});

test('detects Arabic emotional context for fallback dhikr', () => {
  assert.equal(detectEmotion('أشعر بقلق شديد من المستقبل'), 'قلق');
  assert.equal(detectEmotion('أذنبت وأريد التوبة'), 'ذنب');
});

test('blocks crisis language before model generation', () => {
  assert.equal(isCrisisMessage('لا أريد أن أعيش'), true);
  assert.equal(isCrisisMessage('أفكر في الانتحار'), true);
  assert.equal(isCrisisMessage('أشعر بالتعب وأحتاج مواساة'), false);
});

test('prioritizes the central Islamic term in compound questions', () => {
  assert.equal(deriveSpiritualSearchTerm('ما حكم الإسلام في الربا والقروض البنكية بالفائدة؟'), 'الربا');
});

test('uses a narrow Uthmani stem for Quran retrieval', () => {
  assert.deepEqual(deriveQuranSearchVariants('الربا'), ['الربا', 'ٱلرِّب']);
});

test('formats only retrieved source content for the model context', () => {
    const sources: SpiritualSource[] = [{
      kind: 'hadith',
      label: 'حديث',
      title: 'حديث نبوي',
      reference: 'حديث رقم 1',
      excerpt: 'نص موثق من قاعدة البيانات',
      authority: 'primary',
    }];
    const promptContext = formatSourcesForPrompt(sources);
  assert.match(promptContext, /نص موثق من قاعدة البيانات/);
  assert.match(promptContext, /\[المصدر 1\]/);
  assert.doesNotMatch(promptContext, /لا يوجد مصدر/);
});
