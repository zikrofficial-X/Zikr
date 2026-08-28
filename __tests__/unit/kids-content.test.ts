import assert from 'node:assert/strict';
import test from 'node:test';
import { getKidsItemBySlug, kidsContent } from '../../lib/data/kids-content';

test('kids adventure pack includes stories, games, quiz, and supervised activities', () => {
  const requiredSlugs = [
    'story-luqman-kind-words',
    'story-anas-clean-planet',
    'story-safaa-sharing-lunch',
    'game-memory-dhikr-cards',
    'game-kindness-spinner',
    'game-scenario-smart-choice',
    'quiz-akhlaq-adventure',
    'activity-family-shukr-journal',
    'activity-wudu-science-safe',
  ];

  for (const slug of requiredSlugs) {
    assert.ok(getKidsItemBySlug(slug), `missing kids item: ${slug}`);
  }
});

test('kids content slugs remain unique', () => {
  const slugs = kidsContent.map(item => item.slug);
  assert.equal(new Set(slugs).size, slugs.length);
});

test('interactive kids content has safe structured metadata', () => {
  const memory = getKidsItemBySlug('game-memory-dhikr-cards');
  const scenarios = getKidsItemBySlug('game-scenario-smart-choice');
  const activity = getKidsItemBySlug('activity-wudu-science-safe');

  assert.equal(memory?.metadata?.gameType, 'memory');
  assert.equal(scenarios?.metadata?.gameType, 'scenario');
  assert.match(activity?.metadata?.safetyNote ?? '', /لا تستخدم الزجاج/);
});

test('kids adventure quiz answers point to valid options', () => {
  const quiz = getKidsItemBySlug('quiz-akhlaq-adventure');
  const questions = quiz?.quiz_data?.questions ?? [];

  assert.equal(questions.length, 5);
  for (const question of questions) {
    assert.ok(question.options.length >= 2);
    assert.ok(question.correctAnswer >= 0 && question.correctAnswer < question.options.length);
  }
});
