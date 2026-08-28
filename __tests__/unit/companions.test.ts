import assert from 'node:assert/strict';
import test from 'node:test';
import {
  companionCategoryLabel,
  uniqueCompanionSummaries,
} from '../../lib/utils/companions';

test('uniqueCompanionSummaries prefers a categorized record for duplicate names', () => {
  const rows = [
    { id: 'new', name_ar: 'بلال بن رباح', category: null },
    { id: 'canonical', name_ar: 'بلال بن رباح', category: 'sabiqun' },
    { id: 'other', name_ar: 'خالد بن الوليد', category: 'qada' },
  ];

  assert.deepEqual(uniqueCompanionSummaries(rows), [rows[1], rows[2]]);
});

test('uniqueCompanionSummaries normalizes Arabic diacritics before deduplication', () => {
  const rows = [
    { id: 'one', name_ar: 'عَلِيّ بن أبي طالب', category: null },
    { id: 'two', name_ar: 'علي بن أبي طالب', category: 'khulafa' },
  ];

  assert.deepEqual(uniqueCompanionSummaries(rows), [rows[1]]);
});

test('companionCategoryLabel localizes known import categories', () => {
  assert.equal(companionCategoryLabel('khulafa'), 'الخلفاء الراشدون');
  assert.equal(companionCategoryLabel('sabiqun'), 'السابقون إلى الإسلام');
  assert.equal(companionCategoryLabel(null), 'الصحابة الكرام');
});
