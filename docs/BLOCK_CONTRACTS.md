# Hydra Clicker — Block Contracts v0.23

> v0.23：對齊 `02_player_facing/LONG_TERM_COMMAND_SPELL_ECONOMY.md`。新增 `U_n` 純 Data 計價 helper；Command Spell II / III status contract 正式支援 `pricePending`，CS II 另增加 `extensionPending`。只有已有單值的 long-term price 可以 formal purchase；range 不得被 System 自行選端點。State schema 維持1。

## 1. Attack Request

```js
{
  source: 'manual' | 'auto' | 'np' | 'tree-command',
  timestamp,
  strikeCount: 1,
  headsPerStrike: 1n,
  target: null
}
```

Contract：

- `strikeCount` positive integer。
- Manual CS II 可用 `3 / 6 / 9`。
- Auto including CS III Auto-in-NP 永遠以 ordinary auto strike resolution 為基礎，不繼承 manual multistrike。
- Input 不知道 Hydra Rule / NP / Command Spell progression。

## 2. Cut Resolution

```js
{
  accepted,
  ruleId,
  turnBefore,
  turnAfter,
  headsRemoved,
  headsSpawned,
  materialsProduced,
  regrowth,
  cancelPendingRegrowth,
  depleted,
  killed,
  effects
}
```

Logical update：

```text
heads = heads - headsRemoved + headsSpawned
```

Combat 逐 strike resolve；terminal kill 立即中止剩餘 batch。

## 3. Generation Data

```text
Gen I   start 9 · max 9   · 99 kills to next
Gen II  start 9 · max 81  · 99 kills to next
Gen III start 9 · max 729 · next undefined
```

`maxHeads` 是 logical cap，不是 visible mesh cap。

## 4. Hydra Rules

### Hydra I

```text
remove up to headsPerStrike
remaining >0 + headGrowthEnabled
→ schedule same amount delayed regrowth
remaining =0
→ killed=true
→ cancel pending regrowth
```

### Hydra II

```text
normal: CUT 1 → desired GROW 2 → clamp max81
NP: headGrowthEnabled=false → GROW0
1→0 under suppression → true kill
```

### Hydra III

Same structural rule，cap729：

```text
9→10
728→729
729→729
```

Under head-growth suppression：

```text
CUT 1 → GROW0
1→0 → true kill
```

## 5. Rule Context / NP modifier

Resolver output：

```js
{
  headGrowthEnabled: true | false,
  regrowthEnabled: true | false
}
```

NP modifier：

```js
{
  type: 'rule-modifier',
  target: 'hydra.headGrowth',
  effect: 'disable',
  startsAt,
  endsAt,
  source: 'np',
  scope: 'timed'
}
```

Legacy `hydra.regrowth` disable remains compatibility alias。

## 6. Humanity Evil income and normalized design units

Persistent currency remains only：

```text
master.humanityEvil : BigInt
```

Income helper：

```js
getHumanityEvilRewardForGeneration(generation)
```

Formal law：

```text
U_n = 11 × 3^(n-1)
```

```text
U1=11 · U2=33 · U3=99 · U4=297
```

Price conversion helper：

```js
getHumanityEvilCostForGenerationUnits(generation, units)
```

Examples：

```text
36U2 = 1188 HE
54U2 = 1782 HE
9U3 = 891 HE
```

`U_n` is design notation only：

- not stored in State；
- not emitted as currency；
- not recalculated into old prices when generation changes。

Humanity Evil System consumes only `hydra:killed`。

## 7. NP lifecycle

NP System config：

```js
getConfig(snapshot) -> {
  maxPoints,
  pointsPerHead,
  durationMs
}
```

Status：

```js
{
  points,
  maxPoints,
  ready,
  normalized
}
```

Window：

```js
{
  active,
  startsAt,
  endsAt,
  remainingMs
}
```

Invariants：

```text
NP inactive + accepted cut → charge
NP active + accepted cut → no charge
release while active → np-already-active
expiry → np:ended
```

No View timer controls gameplay lifecycle。

## 8. Auto Slash contract

Base enable：

```text
autoSlash capability
AND Hydra alive / attackable
AND heads > 0
```

Core-injected guards：

```text
Hydra II first manual cut missing → disabled
NP active + CSIII fraction 0      → disabled
NP active + CSIII fraction >0     → enabled at base APS × fraction
```

Auto Slash System itself does not know NP / Command Spell III names。

## 9. Command Spell I

Current APS/Data：

| Lv | APS | Relative design price | Raw HE | State |
|---:|---:|---:|---:|---|
| 1 | 1 | 9U1 | 99 | formal |
| 2 | 3 | 3U1 | 33 | formal |
| 3 | 9 | 6U1 | 66 | formal |
| 4 | 27 | 9U1 | 99 | formal |
| 5 | 81 | 36U2 | 1188 | formal |
| 6 | 243 | 54U2 | 1782 | formal |
| 7 | 729 | 36–54U3 | null | pricePending |

Status contract：

```js
{
  id,
  purchased,
  level,
  maxLevel,
  maxed,
  attacksPerSecond,
  nextLevel,
  nextAttacksPerSecond,
  killsMet,
  canAfford,
  pricePending,
  available,
  requiredHydraKills,
  cost,
  balance,
  kills
}
```

Pending rule：

```text
cost=null + purchasePending=true
→ pricePending=true
→ available=false
→ purchase() => price-pending
```

Purchase changes only：

```text
Humanity Evil
master.commandSpells.autoSlash
berserker.baseAttacksPerSecond
command-spell-1-lvN milestones
```

Old/test 729 owned state remains valid。

## 10. Command Spell II

Base：

```text
manual ×1 · NP66 · 3s
```

Formal currently purchasable rows：

| Lv | Eligibility | Cost | Result |
|---:|---|---:|---|
| 1 | hydra-ii-first-manual-cut + 0 kills | 297 = 9U2 | ×3 · NP132 · 3s |
| 2 | 9 Hydra II kills | 198 = 6U2 | ×3 · NP66 · 3s |
| 3 | 18 Hydra II kills | 891 = 27U2 | ×3 · NP198 · 9s |

Later rows are compatibility effect data only until exact long-term values exist：

```text
Lv4–6 intendedGeneration=3
Lv7–9 intendedGeneration=4
cost=null
purchasePending=true
requiredGenerationKills=null
```

Status contract：

```js
{
  id,
  unlocked,
  level,
  maxLevel,
  maxed,
  extensionPending,
  generation,
  generationKills,
  eligibilityMet,
  killsMet,
  canAfford,
  pricePending,
  available,
  npManualStrikeCount,
  npMaxPoints,
  npDurationMs,
  nextLevel,
  nextBranch,
  nextRewardLabel,
  nextNpManualStrikeCount,
  nextNpMaxPoints,
  nextNpDurationMs,
  requiredGenerationKills,
  cost,
  balance
}
```

Purchase rejection priority：

```text
real max → max-level
missing gameplay eligibility → eligibility-required
unresolved price/range → price-pending
known kill gate unmet → kills-required
known price unaffordable → insufficient-humanity-evil
```

### `futureExtensionPending`

If all currently defined effect rows are owned but the long-term time axis continues：

```text
maxed=false
extensionPending=true
pricePending=true
nextLevel=null
```

Thus current 81s is not a conceptual MAX。

### Gauge preservation

```text
oldPoints = round(oldNormalized × oldMax)
newPoints = min(oldPoints, newMax)
newNormalized = newPoints/newMax
```

## 11. Command Spell III

Eligibility milestone：

```text
hydra-iii-first-np-release
```

Effect ladder：

```text
base OFF
Lv1 1/9
Lv2 1/3
Lv3 FULL
```

Prices：

```text
Lv1 891 HE = 9U3 formal
Lv2 null · range 9–18U3 · pricePending
Lv3 null · range 18–36U3 · pricePending
```

Status contract：

```js
{
  id,
  generation,
  eligible,
  unlocked,
  level,
  maxLevel,
  maxed,
  autoNpNumerator,
  autoNpDenominator,
  autoNpFraction,
  autoNpAps,
  nextLevel,
  nextRewardLabel,
  nextAutoNpNumerator,
  nextAutoNpDenominator,
  nextAutoNpFraction,
  nextAutoNpAps,
  cost,
  pricePending,
  balance,
  canAfford,
  available
}
```

First Hydra III NP release：

```text
write milestone
emit command-spell:eligible
if exact-priced next step + affordable
→ emit command-spell:available
```

Formal purchase Lv1 spends 891 and writes `command-spell-3-lv1`。Lv2 currently rejects `price-pending`。

Auto-in-NP APS：

```text
base Command Spell I APS × current CSIII fraction
```

Never multiplies CS II manual strike count。

## 12. Progression events

Important semantic events：

```text
clock:tick
attack:requested
attack:resolved
head:cut
head:regrow
hydra:killed
hydra:respawned
hydra:generation-changed
hydra:intro-complete
tree-view:unlocked
np:charge
np:released
np:ended
currency:gain
currency:spend
command-spell:eligible
command-spell:available
command-spell:unlocked
command-spell:upgraded
test:preset-applied
```

View consumes semantic events; events do not replace source-of-truth State。

## 13. Tree View contract

Unlock threshold：

```text
Hydra III logical heads >=100
```

Projection：

```js
{
  unlocked,
  logicalHeads,
  visibleHeads,
  overflowHeads,
  maxHeads
}
```

Visible cap：99n。

Forbidden：

```text
Tree View → choose cut target
Tree View → mutate Hydra
Tree View → infer logical count from mesh pool
```

## 14. Command Spell panel states

```text
dormant
available
owned-dim
affordable
max
```

Semantics：

- eligibility but insufficient funds → visible/clickable detail, dim；
- `pricePending` → visible if already revealed/owned, purchase disabled；
- CS II `extensionPending` → show long-term extension TBD, not MAX；
- actual finite CS III FULL can show MAX。

View does not spend currency。

## 15. Persistence

Schema version remains **1**。

Persistent logical fields reused：

```text
master.humanityEvil
master.commandSpells.autoSlash
berserker.baseAttacksPerSecond
berserker.np
progression.milestones
progression.treeViewUnlocked
modifiers.active
```

Derived / not persisted：

```text
U_n
pricePending
extensionPending
affordability
visible heads
NP remainingMs
```

No offline progress yet。

## 16. TEST presets

TEST session remains non-persistent after any preset is applied。

Relevant presets：

```text
CS I TEST · selected levels including 729
COMMAND SPELL II · prototype/owned effect path
CS III TEST · 1 → 2 → MAX
HYDRA II · 81 HEADS
HYDRA III · 99 HEADS
NP READY
人類惡 +999
```

TEST may grant otherwise unpriced owned effects for mechanics validation, but must not be mistaken for formal economy。

## 17. Forbidden shortcuts

```text
range price → silently choose low/high endpoint
pricePending null → treat as 0
old price → multiply by current generation
U_n → save as currency
81s current CSII tail → mark true MAX
CSIII Auto → inherit manual ×9
View → buy / mutate state
Hydra Rule → know Command Spell names
```

**Weird game, sane architecture.**
