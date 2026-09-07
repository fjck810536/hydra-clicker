function assertSnapshot(snapshot) {
  if (!snapshot?.hydra) {
    throw new TypeError('Generation progress requires a Hydra snapshot.');
  }
  if (!Number.isInteger(snapshot.hydra.generation) || snapshot.hydra.generation < 1) {
    throw new TypeError('snapshot.hydra.generation must be a positive integer.');
  }
  if (typeof snapshot.hydra.encounter !== 'bigint' || snapshot.hydra.encounter < 1n) {
    throw new TypeError('snapshot.hydra.encounter must be a positive BigInt.');
  }
}

export function projectGenerationProgress(snapshot, generationConfig = null) {
  assertSnapshot(snapshot);

  const completedKills = snapshot.hydra.defeated
    ? snapshot.hydra.encounter
    : snapshot.hydra.encounter - 1n;

  const targetKills = generationConfig?.killsToNextGeneration ?? null;
  if (targetKills != null && (typeof targetKills !== 'bigint' || targetKills < 1n)) {
    throw new TypeError('generationConfig.killsToNextGeneration must be a positive BigInt or null.');
  }

  return Object.freeze({
    generation: snapshot.hydra.generation,
    encounter: snapshot.hydra.encounter,
    completedKills,
    targetKills,
    maxHeads: generationConfig?.maxHeads ?? null,
  });
}
