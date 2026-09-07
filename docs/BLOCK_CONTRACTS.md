# Hydra Clicker — Block Contracts v0.22

> Playtest 5：Hydra III 成為正式 `CUT 1 → GROW +2` / cap729 世代；logical heads 第一次到 100 時由 Progression 解鎖 observation-only Tree View；Command Spell III 以 Hydra III 第一次 NP release 取得 eligibility，將 Command Spell I Auto Slash 以 1/9 → 1/3 → FULL 比例帶入 NP。正式 CS III 價格仍 TBD。State schema 維持1。

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

`strikeCount` 是正整數；Combat 必須逐 strike resolve，不得先乘成 bulk damage。

Current application projection：

```text
ordinary manual tap          → strikeCount 1
NP + CS II STRIKE I          → manual strikeCount 3
NP + CS II STRIKE II         → manual strikeCount 6
NP + CS II STRIKE III        → manual strikeCount 9
Auto Slash inside/outside NP → Auto System 自己產生 strikeCount；不繼承 CS II manual multiplier
```

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

Hydra Model applies：

```text
logicalHeads - headsRemoved + headsSpawned
→ schedule any delayed regrowth
```

View / animation never decides this result。

## 3. Generation scale Data

```text
Gen I   starting9 · max9   · 99 kills to next
Gen II  starting9 · max81  · 99 kills to next
Gen III starting9 · max729 · next generation pending
```

`maxHeads` 是 logical Data，不是 View mesh cap。

## 4. Hydra I Rule

```text
normal non-terminal cut
→ remove head
→ schedule same-head regrowth

head growth disabled
→ remove head
→ no new regrowth

remaining = 0
→ killed = true
```

## 5. Hydra II Rule

```text
normal:
CUT 1
→ GROW 2 immediately
→ clamp to maxHeads81

9  → 10
80 → 81
81 → 81
```

NP / generic head-growth suppression：

```text
headsSpawned = 0
→ net -1
→ 1 → 0 = true kill
```

## 6. Hydra III Rule

Hydra III 沿用同一種 structural law，但使用 generation-specific cap729：

```text
normal:
CUT 1
→ GROW 2 immediately
→ clamp to maxHeads729

9   → 10
728 → 729
729 → 729
```

NP / generic head-growth suppression：

```text
headsSpawned = 0
→ net -1
→ 1 → 0 = true kill
```

Hydra III true kill：

```text
→ +99 Humanity Evil
→ no Hydra IV transition yet
→ next encounter remains Hydra III, fresh9
```

`createHydraShellRule()` 只保留給未來尚未實作世代，不再代表 Hydra III。

## 7. Humanity Evil reward

Humanity Evil System consumes only `hydra:killed`。

```text
reward = 11 × 3^(generation - 1)
Gen I   11
Gen II  33
Gen III 99
Gen IV 297
```

Forbidden reward inputs：

```text
head:cut
headsSpawned
cap stall
visible mesh count
```

## 8. Rule Context / NP modifier

NP release creates generic rule modifier：

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

Resolver projects：

```js
{
  headGrowthEnabled: false,
  regrowthEnabled: false
}
```

Affected：

```text
Hydra I delayed same-head regrowth
Hydra II immediate structural GROW
Hydra III immediate structural GROW
```

Cut itself remains legal。

Legacy `target:'hydra.regrowth'` remains compatibility alias。

## 9. NP dynamic configuration

NP System accepts：

```js
getConfig(snapshot) -> {
  maxPoints,
  pointsPerHead,
  durationMs
}
```

Core composition：

```text
CS II status → maxPoints / durationMs
base Data    → pointsPerHead
```

`getStatus()`：

```js
{
  points,
  maxPoints,
  ready,
  normalized
}
```

## 10. NP lifecycle / active-window seal

NP exposes：

```js
isActive(snapshot)
getWindowStatus(snapshot) -> {
  active,
  startsAt,
  endsAt,
  remainingMs
}
```

Semantic lifecycle：

```js
np:released { atMs, endsAt, durationMs, maxPoints, modifier }
np:ended    { atMs, endedAtMs }
```

Invariant：

```text
NP inactive + accepted head:cut → charge normally
NP active   + accepted head:cut → zero NP charge
NP active   + release()          → rejected: np-already-active
```

At most one ordinary active NP release window。Expiry is GameClock-derived, never animation-derived。

## 11. NP gauge preservation on CS II purchase

Save stores normalized `berserker.np`，but max-point upgrades preserve absolute charge：

```text
oldPoints = round(oldNormalized × oldMax)
newPoints = min(oldPoints, newMax)
newNormalized = newPoints / newMax
```

Example：

```text
33/66 → buy Lv1 max132 → 33/132
```

## 12. Auto Slash / NP policy

Auto Slash System only receives generic injected functions：

```js
isEnabled(snapshot)
getAttacksPerSecond(snapshot)
```

Base requirements：

```text
autoSlash capability
AND Hydra attackable
AND heads > 0
AND generation playable
AND Hydra II intro guard satisfied
```

Core composition：

```text
NP inactive
→ enabled normally
→ effective APS = Command Spell I base APS

NP active + CS III fraction 0
→ Auto disabled
→ accumulator reset while disabled

NP active + CS III fraction > 0
→ Auto enabled
→ effective APS = CS I base APS × CS III fraction
```

Auto Slash System itself must not import/name NP or Command Spell III。

## 13. Encounter / Generation Progression

```text
Hydra I kill #99
→ Hydra II encounter1 · heads9

Hydra II encounter99 kill
→ Hydra III encounter1 · heads9

Hydra III kill
→ Hydra III next encounter · heads9
```

Hydra II first accepted manual cut writes：

```text
hydra-ii-first-manual-cut
```

and emits `hydra:intro-complete`。Same milestone is consumed by Auto intro guard and CS II first eligibility without direct System-to-System mutation。

## 14. Tree View unlock milestone

Hydra III first representation threshold：

```text
99 logical
→ accepted normal cut resolves
→ logical state becomes100
→ Progression sees gen3 + logicalHeads >=100
→ progression.treeViewUnlocked = true
→ emit tree-view:unlocked
```

Event：

```js
tree-view:unlocked {
  atMs,
  generation: 3,
  logicalHeads: 100n,
  threshold: 100n
}
```

Progression owns unlock. View must never infer the milestone from Babylon mesh count and write it back。

## 15. Generation Progress View

Projection：

```js
{
  generation,
  encounter,
  completedKills,
  targetKills,
  maxHeads
}
```

Hydra III `targetKills = null` because Hydra IV transition is not defined。

## 16. Head Pool / Tree View projection

Head Pool contract：

```text
logical 0–99 → same visible count
logical100+  → visible99
```

Tree View v0 consumes snapshot only：

```js
projectTreeView(snapshot, { visibleHeadCap:99n, maxHeads }) -> {
  unlocked,
  generation,
  logicalHeads,
  visibleHeads,
  overflowHeads,
  visibleHeadCap,
  maxHeads
}
```

Examples：

```text
logical100 → visible99 · overflow1
logical729 → visible99 · overflow630
```

Tree View v0 is observation-only：

```text
NO node targeting
NO attack request
NO state.update
NO Math/System/Core import
```

## 17. Command Spell I

Current Data：

| Lv | Cost | APS |
|---:|---:|---:|
| 1 | 99 | 1 |
| 2 | 33 | 3 |
| 3 | 66 | 9 |
| 4 | 99 | 27 |
| 5 | 1782 | 81 |
| 6 | 2178 | 243 |
| 7 | **TBD** | 729 |

Lv1–6：sequential prerequisite + affordability only。Lv7 has `cost:null / purchasePending:true` and formal purchase rejects `price-pending`。

## 18. Command Spell II

Player-facing title：

```text
「快點……再快點……！」
```

Base：`manual×1 · NP66 · 3s`

| Lv | Eligibility | Cost | NP max | Manual NP | Duration |
|---:|---|---:|---:|---:|---:|
| 1 | Hydra II first reversal · 0 kills | 297 | 132 | ×3 | 3s |
| 2 | 9 kills | 198 | 66 | ×3 | 3s |
| 3 | 18 kills | 396 | 198 | ×3 | 9s |
| 4 | 27 kills | 396 | 396 | ×6 | 9s |
| 5 | 39 kills | 330 | 198 | ×6 | 9s |
| 6 | 54 kills | 495 | 594 | ×6 | 27s |
| 7 | 66 kills | 594 | 792 | ×9 | 27s |
| 8 | 81 kills | 495 | 396 | ×9 | 27s |
| 9 | 99 kills | 693 | 1188 | ×9 | 81s |

CS II multistrike modifies **manual input only**。Auto requests never inherit ×3/×6/×9。

## 19. Command Spell III

Player-facing title：

```text
「這裡怎麼沒有 SKIP???」
```

First gameplay eligibility：

```text
first np:released while current Hydra generation === 3
→ add hydra-iii-first-np-release milestone
→ emit command-spell:eligible { id:'command-spell-3', ... }
```

No Hydra III kill, CS II MAX, or specific CS I APS is required。

Status contract：

```js
{
  id: 'command-spell-3',
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

Mechanic ladder：

```text
base → 0
Lv1  → CS I APS × 1/9 inside NP
Lv2  → CS I APS × 1/3 inside NP
Lv3  → CS I APS × 1 inside NP
```

All current formal costs are：

```text
cost = null
purchasePending = true
```

Therefore normal purchase is rejected `price-pending`。TEST may set Lv1/Lv2/Lv3 using existing milestones without changing Humanity Evil, kills or CS I APS。

## 20. Command Spell panel / modal

Fixed slots：

```text
[ I ] [ II ] [ III ]
```

Projection states：

```text
dormant    = not revealed / not first-available
available  = real purchasable NEW
owned-dim  = information available, but next purchase unavailable / unaffordable / price pending
affordable = owned + next level purchasable
max        = completed
```

CS III special pending state：

```text
before Hydra III first NP → dormant / disabled
after first NP + formal price still TBD
→ NEW · PRICE TBD
→ owned-dim visual treatment
→ clickable for detail
→ purchase button disabled
```

This prevents a pending prototype from visually claiming affordability。

Purchase routing belongs to Application：

```text
runtime.buyCommandSpellI()
runtime.buyCommandSpellII()
runtime.buyCommandSpellIII()
```

View never spends currency or writes milestones。

Modal mobile dismissal：successful purchase closes; close target >=44×44; backdrop closes; inside-card tap does not。

## 21. NP Phase / Timer View

Timer consumes simulation-time derived `npWindowStatus()` + CS II manual strike count。It displays manual technique even if CS III Auto is running; CS III Auto rate is surfaced separately in HUD/CSIII detail。

No View timer controls lifecycle。

## 22. TEST Tools

Session-only / non-persistent paths include：

```text
CS I TEST · 1 → 3 → 6 → MAX
人類惡 +999
COMMAND SPELL II · ×3 NP
CS III TEST · 1 → 2 → MAX
START HYDRA #98
HYDRA II · 81 HEADS
HYDRA III · 99 HEADS
NP READY
RESET SAVE
```

`HYDRA III · 99 HEADS` exists specifically to test one-cut `99→100` Tree reveal。

TEST presets must not invent corresponding normal economy rewards and must not overwrite the player's persisted normal save。

## 23. Save

State schema remains **1**。

Reused persistent fields：

```text
progression.milestones
progression.treeViewUnlocked
berserker.np
modifiers.active
master.humanityEvil
berserker.baseAttacksPerSecond
```

No new persistent field. No Offline Progress。

## 24. Required tests

```text
Hydra III:
9→10
728→729
729→729
NP suppressed 1→0 true kill
true kill → +99 HE
next encounter remains gen3 fresh9

Tree View:
99→100 unlock exactly via logical state
logical100 → visible99 / overflow1
logical729 → visible99 / overflow630
View imports no Systems/Core and never state.update

CS III:
first gen3 NP release → eligibility milestone/event
before CSIII + NP → Auto0
CS I 9 APS + Lv1 → 1 APS in NP
CS I 9 APS + Lv2 → 3 APS in NP
CS I 9 APS + MAX → 9 APS in NP
Auto does not inherit CSII manual×3
formal costs null → purchase reason price-pending
TEST progression changes no HE / kills / base CS I APS

NP:
active cuts do not recharge
nested release rejected
head growth suppressed in Hydra I/II/III

UI:
CS III pre-eligibility dormant
eligible + price pending → NEW / PRICE TBD / dim / clickable detail / no purchase
Tree View unlock button and observational overlay exist
```

核心原則：**怪遊戲，正常架構；數字可以逃出畫面，邏輯不能逃出邊界。**
