# Hydra Clicker — Block Contracts v0.24

> v0.24：對齊 `02_player_facing/tree_scene_shell/` 並封住令咒購買 gate 回歸。Command Spell II 的 `hydra-ii-first-manual-cut` 是一次性揭露 milestone；目前已定價 Lv.2 / Lv.3 的 `requiredGenerationKills=null`，購買只看前級與當前 Humanity Evil。Command Spell III status 增加 derived `chapterReached`，讓進蛇三但尚未寶解時投影 `NP TO REVEAL`。Tree View 改為右側 Scene 2 drawer，覆蓋戰鬥 Scene 1 但不得覆蓋固定底部操作列，且 Scene 背景不是 dismiss backdrop。State schema 維持1。

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

Auto Slash System itself does not know NP / Command Spell III names。HUD must consume the projected effective state; it cannot hard-code all Hydra III Auto as paused。

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

Current formal Lv1–6 have `requiredHydraKills=null`。Pending rule：

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
| 1 | `hydra-ii-first-manual-cut` · 0 Hydra II kills required | 297 = 9U2 | ×3 · NP132 · 3s |
| 2 | previous level + affordability | 198 = 6U2 | ×3 · NP66 · 3s |
| 3 | previous level + affordability | 891 = 27U2 | ×3 · NP198 · 9s |

Current Data：

```text
Lv1.requiredGenerationKills = 0n
Lv2.requiredGenerationKills = null
Lv3.requiredGenerationKills = null
```

Contract meaning：

```text
0n   = explicit zero-kill requirement
null = no per-level generation-kill gate
```

Once first-reversal eligibility is established, System must **not** synthesize a kill gate from old cadence, `intendedGeneration`, level number, encounter number, or lifetime kills。A player with zero Hydra-II kills and enough HE can buy Lv1 → Lv2 → Lv3 sequentially。

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
  chapterReached,
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
missing one-time gameplay reveal → eligibility-required
unresolved price/range → price-pending
explicit known kill gate unmet → kills-required
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

Chapter / eligibility：

```text
enter Hydra III
→ chapterReached=true
→ eligible=false
→ UI preview = NP TO REVEAL

first NP release while generation=3
→ write hydra-iii-first-np-release
→ eligible=true
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
  chapterReached,
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

Formal purchase Lv1 spends 891 and writes `command-spell-3-lv1`。Once revealed, Lv1 has no extra kill/APS/CSII gate。Lv2 currently rejects `price-pending` only because no single formal price exists yet。

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

## 13. Tree View / Scene shell contract

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

Presentation shell：

```text
closed → Scene2 translated to right, right-center TREE ◀ tab visible
open   → Scene2 translated to x=0, fully covers Scene1 above bottom bar
close  → explicit left-center ▶ TREE control
```

Global bottom action bar remains above Scene1/Scene2 and contains：

```text
NP release card
Humanity Evil + kill progress
Command Spell I / II / III
```

Forbidden：

```text
Tree View → choose cut target
Tree View → mutate Hydra
Tree View → infer logical count from mesh pool
Tree Scene → cover global bottom action bar
Tree Scene background tap → dismiss drawer
```

The last rule preserves Scene2 background for future pan / click / branch inspection。

## 14. Command Spell panel states

```text
dormant
preview
available
owned-dim
affordable
max
```

Semantics：

- `dormant` = chapter/system not reached；
- `preview` = chapter reached but one-time reveal interaction missing；
- CS II preview = `CUT TO REVEAL`；
- CS III preview = `NP TO REVEAL`；
- eligibility but insufficient funds → visible/clickable detail, dim；
- `pricePending` → visible if already revealed/owned, purchase disabled；
- CS II `extensionPending` → show long-term extension TBD, not MAX；
- actual finite CS III FULL can show MAX。

View does not spend currency or invent gates。

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
chapterReached
preview state
affordability
Tree Scene open/closed
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
one-time reveal milestone → silently reuse as every-level purchase gate
null requiredGenerationKills → infer an old kill threshold
range price → silently choose low/high endpoint
pricePending null → treat as 0
old price → multiply by current generation
U_n → save as currency
81s current CSII tail → mark true MAX
CSIII Auto → inherit manual ×9
View → buy / mutate state / invent eligibility
Tree drawer → steal fixed bottom controls
Hydra Rule → know Command Spell names
```

**Weird game, sane architecture.**