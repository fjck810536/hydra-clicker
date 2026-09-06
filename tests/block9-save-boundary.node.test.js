import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const APP_PATH = new URL('../js/app.js', import.meta.url);
const SAVE_PATH = new URL('../js/core/save.js', import.meta.url);

test('browser app restores logical state before creating the gameplay runtime', async () => {
  const source = await readFile(APP_PATH, 'utf8');

  assert.match(source, /createSaveStore/);
  assert.match(source, /saveStore\.load\(\)/);
  assert.match(source, /createHydraIGameRuntime\(\{ initialState: restoredSave\.state \}\)/);
});

test('browser lifecycle autosaves on simulation cadence and iOS page/background transitions', async () => {
  const source = await readFile(APP_PATH, 'utf8');

  assert.match(source, /AUTOSAVE_INTERVAL_MS = 5000/);
  assert.match(source, /clock:tick/);
  assert.match(source, /visibilitychange/);
  assert.match(source, /pagehide/);
  assert.match(source, /saveStore\.save\(runtime\.snapshot\(\)\)/);
});

test('Save core stays independent from Babylon, DOM and gameplay systems', async () => {
  const source = await readFile(SAVE_PATH, 'utf8');

  assert.equal(source.includes('BABYLON'), false);
  assert.equal(source.includes('document.'), false);
  assert.equal(source.includes('window.'), false);
  assert.doesNotMatch(source, /from ['"]\.\.\/systems\//);
  assert.doesNotMatch(source, /from ['"]\.\.\/view\//);
});

test('app never passes scene, mesh or View objects into saveStore.save()', async () => {
  const source = await readFile(APP_PATH, 'utf8');
  const saveCalls = [...source.matchAll(/saveStore\.save\(([^)]*(?:\)[^)]*)?)\)/g)].map((match) => match[0]);

  assert.ok(saveCalls.length >= 1);
  assert.match(source, /saveStore\.save\(runtime\.snapshot\(\)\)/);
  assert.equal(source.includes('saveStore.save(stage'), false);
  assert.equal(source.includes('saveStore.save(hydraView'), false);
  assert.equal(source.includes('saveStore.save(berserkerView'), false);
});
