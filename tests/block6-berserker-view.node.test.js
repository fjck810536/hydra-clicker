import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import { BERSERKER_VIEW_SPEC } from '../js/view/berserker-view.js';

test('Berserker placeholder defines a visible strike separate from rest pose', () => {
  assert.ok(BERSERKER_VIEW_SPEC.attackDurationMs > 0);
  assert.notEqual(
    BERSERKER_VIEW_SPEC.restRotationZ,
    BERSERKER_VIEW_SPEC.strikeRotationZ,
  );
  assert.ok(BERSERKER_VIEW_SPEC.idleBobAmplitude >= 0);
});

test('Berserker View stays isolated from Math, Systems and Core gameplay implementation', async () => {
  const source = await readFile(
    new URL('../js/view/berserker-view.js', import.meta.url),
    'utf8',
  );

  assert.doesNotMatch(source, /from ['"]\.\.\/math\//);
  assert.doesNotMatch(source, /from ['"]\.\.\/systems\//);
  assert.doesNotMatch(source, /from ['"]\.\.\/core\//);
  assert.match(source, /function playAttack/);
  assert.match(source, /function playMultiAttack/);
  assert.match(source, /createMultiStrikeAnimation/);
  assert.match(source, /scene\.beginAnimation/);
});

test('App drives Berserker animation from semantic attack:resolved events', async () => {
  const source = await readFile(new URL('../js/app.js', import.meta.url), 'utf8');

  assert.match(source, /events\.on\('attack:resolved'/);
  assert.match(source, /if \(!payload\.resolution\.accepted\) return/);
  assert.match(source, /berserkerView\.playAttack/);
  assert.match(source, /berserkerView\.playMultiAttack\(\{ count: strikeCount \}\)/);
  assert.match(source, /payload\.strikeIndex === 0/);

  // State-changing gameplay must still travel through runtime.manualAttack / Combat,
  // never through an animation callback.
  assert.match(source, /runtime\.manualAttack\(\)/);
  assert.doesNotMatch(source, /playAttack[\s\S]{0,250}runtime\.manualAttack/);
  assert.doesNotMatch(source, /playMultiAttack[\s\S]{0,250}runtime\.manualAttack/);
});
