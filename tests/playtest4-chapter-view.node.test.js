import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import { createInitialState } from '../js/core/state.js';
import { HYDRA_GENERATIONS } from '../js/data/progression.js';
import { projectGenerationProgress } from '../js/view/generation-progress.js';

test('generation progress is local to the current generation rather than lifetime kills', () => {
  const state = createInitialState();
  state.statistics.totalHydrasKilled = 99n;
  state.hydra.generation = 2;
  state.progression.hydraGeneration = 2;
  state.hydra.encounter = 1n;
  state.hydra.defeated = false;

  let progress = projectGenerationProgress(state, HYDRA_GENERATIONS[2]);
  assert.equal(progress.completedKills, 0n);
  assert.equal(progress.targetKills, 99n);
  assert.equal(progress.maxHeads, 81n);

  state.hydra.encounter = 37n;
  progress = projectGenerationProgress(state, HYDRA_GENERATIONS[2]);
  assert.equal(progress.completedKills, 36n);

  state.hydra.defeated = true;
  progress = projectGenerationProgress(state, HYDRA_GENERATIONS[2]);
  assert.equal(progress.completedKills, 37n);
});

test('Hydra III shell projects no fake kill target', () => {
  const state = createInitialState();
  state.hydra.generation = 3;
  state.progression.hydraGeneration = 3;
  state.hydra.encounter = 1n;

  const progress = projectGenerationProgress(state, HYDRA_GENERATIONS[3]);
  assert.equal(progress.completedKills, 0n);
  assert.equal(progress.targetKills, null);
  assert.equal(progress.maxHeads, 729n);
});

test('chapter HUD shows generation-local progress while lifetime kills move to TEST', async () => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  const hudSource = await readFile(new URL('../js/view/hud-view.js', import.meta.url), 'utf8');
  const appSource = await readFile(new URL('../js/app.js', import.meta.url), 'utf8');

  assert.match(html, /data-hud="kills">0\/99/);
  assert.match(html, /TOTAL KILLS <strong data-test-total-kills>/);
  assert.match(hudSource, /generationProgress/);
  assert.match(hudSource, /progress\.completedKills/);
  assert.doesNotMatch(hudSource, /killCount\.textContent\s*=\s*formatInteger\(snapshot\.statistics\.totalHydrasKilled\)/);
  assert.match(appSource, /projectGenerationProgress/);
  assert.match(appSource, /totalKillsReadout\.textContent\s*=\s*snapshot\.statistics\.totalHydrasKilled\.toString\(\)/);
});

test('generation transition is presentation-only and driven by semantic generation change', async () => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  const css = await readFile(new URL('../css/style.css', import.meta.url), 'utf8');
  const transitionSource = await readFile(new URL('../js/view/generation-transition-view.js', import.meta.url), 'utf8');
  const appSource = await readFile(new URL('../js/app.js', import.meta.url), 'utf8');

  assert.match(html, /data-generation-transition/);
  assert.match(css, /@keyframes generation-chapter-cut/);
  assert.match(css, /\.generation-transition\.is-active[\s\S]*animation:/);
  assert.match(transitionSource, /animationend/);
  assert.doesNotMatch(transitionSource, /setTimeout|setInterval/);
  assert.match(appSource, /hydra:generation-changed/);
  assert.match(appSource, /generationTransition\.show/);
});

test('battle stage has distinct generation palettes and NP remains the visual override', async () => {
  const stageSource = await readFile(new URL('../js/view/battle-scene.js', import.meta.url), 'utf8');

  assert.match(stageSource, /GENERATION_STAGE_PALETTES/);
  assert.match(stageSource, /setGenerationAppearance/);
  assert.match(stageSource, /if \(npTintActive\)/);
  assert.match(stageSource, /generationAppearance/);
  assert.match(stageSource, /applyVisualState\(\)/);
});
