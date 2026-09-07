# Hydra Clicker — Block Contracts v0.19

> v0.19 對齊 Playtest 4.4：Command Spell I Lv.1–6 改成順序 prerequisite + Humanity Evil affordability；不再使用額外 kill reveal gate。729 APS 保留為有效等級，但 formal price 未定，所以正常購買回 `price-pending`。State schema 仍為1。

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
NP + CS II STRIKE I          → strikeCount 3
NP + CS II STRIKE II         → strikeCount 6
NP + CS II STRIKE III        → strikeCount 9
```

## 2. Cut Resolution

```js
{
  accepted: true,
  ruleId,
  turnBefore,
  turnAfter,
  headsRemoved: 1n,
  headsSpawned: 0n,
  materialsProduced: 0n,
  regrowth: [],
  cancelPendingRegrowth: false,
  depleted: false,
  killed: false,
  effects: []
}
```

Hydra Model：

```text
heads - headsRemoved + headsSpawned
→ pending regrowth scheduling
```

## 3. Generation scale Data

```text
Gen I   starting 9 · max 9   · 99 kills to next
Gen II  starting 9 · max 81  · 99 kills to next
Gen III starting 9 · max 729 · next rule pending
```

`maxHeads` 是 logical Data，不是 View mesh cap。

## 4. Hydra I Rule

```text
remaining > 0 + head growth enabled
→ remove head
→ schedule same-head regrowth

head growth disabled
→ remove head
→ no new regrowth

remaining = 0
→ killed = true
```

## 5. Hydra II Rule

Normal：

```text
CUT 1
→ remove 1
→ desire GROW +2
→ clamp against maxHeads 81
```

Examples：

```text
9  → 10
80 → 81
81 → 81
```

NP / head growth suppressed：

```text
CUT 1
→ headsSpawned = 0
→ net -1
→ 1 → 0 = true kill
```

## 6. Hydra III shell rule

```text
generation = 3
startingHeads = 9
maxHeadCount = 729
resolveCut → accepted false
state unchanged
```

## 7. Humanity Evil reward

Humanity Evil System consumes only `hydra:killed`。

Core-injected reward：

```text
11 × 3^(generation - 1)
```

```text
Gen I   11
Gen II  33
Gen III 99
Gen IV 297
```

`currency:gain` payload includes `generation`。

Forbidden reward inputs：

```text
head:cut
headsSpawned
cap stall time
```

## 8. Rule Context / NP modifier

Modifier resolver：

```js
{
  headGrowthEnabled: true | false,
  regrowthEnabled: true | false
}
```

NP release creates：

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

Hydra I → no new delayed regrowth。  
Hydra II → no structural spawn。

## 9. NP dynamic configuration

NP System accepts：

```js
getConfig(snapshot) -> {
  maxPoints,
  pointsPerHead,
  durationMs
}
```

Current Core composition：

```text
Command Spell II status → maxPoints / durationMs
base NP Data             → pointsPerHead
```

Explicit runtime test overrides retain priority。

`getStatus()` contract remains：

```js
{
  points,
  maxPoints,
  ready,
  normalized
}
```

## 10. NP active lifecycle / countdown

NP System exposes：

```js
isActive(snapshot)
getWindowStatus(snapshot) -> {
  active,
  startsAt,
  endsAt,
  remainingMs
}
```

Release semantic event：

```js
np:released {
  atMs,
  endsAt,
  durationMs,
  maxPoints,
  modifier
}
```

Expiry：

```js
np:ended {
  atMs,
  endedAtMs
}
```

`remainingMs` 是 simulation-time derived projection，不是 persistent field。

TIME upgrade affects future release configuration only；active modifier keeps its fixed `endsAt`。

## 11. NP gauge preservation on CS II purchase

Because Save stores `berserker.np` normalized 0..1, a gauge-max change must preserve absolute charged points：

```text
oldPoints = round(oldNormalized × oldMax)
newPoints = min(oldPoints, newMax)
newNormalized = newPoints / newMax
```

Example：

```text
33/66 → buy Lv.1 → 33/132
```

Do not preserve percentage and thereby grant free NP。

## 12. Auto Slash — time-stop policy

Base requirements：

```text
autoSlash capability
AND Hydra attackable
AND heads > 0
```

Injected policies：

```text
Hydra II first manual-cut milestone missing → Auto paused
NP window active                           → Auto paused
Hydra III shell                            → Auto paused
```

While NP active：

```text
Auto Slash produces no attack requests
Auto accumulator resets while disabled
purchased capability / APS remain unchanged
Manual Input remains accepted
```

Auto Slash System itself does not import or name NP；Core supplies policy。

## 13. Encounter / Generation Progression

```text
Hydra I kill #99
→ Hydra II encounter 1 · heads 9

Hydra II true kill n
→ next Hydra II encounter · heads 9

Hydra II encounter 99 defeated
→ Hydra III encounter 1 · heads 9
```

Generation-local player progress uses `hydra.encounter + defeated`；no new persistent local kill counter。

## 14. Generation Progress View Projection

```js
{
  generation,
  encounter,
  completedKills,
  targetKills,
  maxHeads
}
```

```text
alive    → completedKills = encounter - 1
defeated → completedKills = encounter
```

## 15. Generation Transition / Appearance

`hydra:generation-changed` → CSS-only transition, pointer-events none, no GameClock pause。

```text
I   neutral dark
II  subtle yellow-green
III cool violet
```

NP red tint has priority。

## 16. NP Phase / Timer View

```text
np:released
→ 寶具解放
→ ナインライブズ
→ 射殺す百頭

np:ended
→ TIME RESUMES
→ 時は動き出す
```

Timer consumes：

```text
runtime.npWindowStatus()
runtime.commandSpellIIStatus().npManualStrikeCount
```

Example：

```text
TIME STOP
8.4 s
MANUAL ×6
```

View-only；no View timer controls lifecycle。

## 17. head:cut semantic event

```js
{
  atMs,
  source,
  amount: headsRemoved,
  spawned: headsSpawned,
  turn,
  depleted,
  killed
}
```

A multi-strike manual request emits separate `attack:resolved` / `head:cut` events per accepted strike。Terminal kill stops later strikes in the same request。

## 18. Command Spell I

Current Data：

| Lv | Chapter role | Cost | APS | requiredHydraKills |
|---:|---|---:|---:|---:|
| 1 | Hydra I | 99 | 1 | null |
| 2 | Hydra I | 33 | 3 | null |
| 3 | Hydra I | 66 | 9 | null |
| 4 | Hydra I | 99 | 27 | null |
| 5 | Hydra II | 1782 | 81 | null |
| 6 | Hydra II | 2178 | 243 | null |
| 7 | Hydra III | **TBD** | 729 | null |

Lv.1～6 availability：

```text
previous level owned
AND Humanity Evil >= cost
→ available
```

因此 `killsMet` 對這些等級固定為 true；自然購買點來自 currency economy，不是另一層 kill gate。

Status contract includes：

```js
{
  level,
  nextLevel,
  attacksPerSecond,
  nextAttacksPerSecond,
  killsMet,
  canAfford,
  pricePending,
  available,
  requiredHydraKills,
  cost,
  balance
}
```

Lv.7 current Data：

```js
{
  level: 7,
  attacksPerSecond: 729,
  cost: null,
  purchasePending: true,
  intendedGeneration: 3
}
```

因此 normal status：

```text
pricePending = true
available = false
cost = null
```

`purchase()` must return：

```js
{ accepted: false, reason: 'price-pending', status }
```

TEST / old owned saves may still place the player at Lv.7 / 729 APS；that state is valid and reads as MAX。

Purchase changes only：

```text
Humanity Evil balance
master.commandSpells.autoSlash capability
berserker.baseAttacksPerSecond
command-spell-1-lvN milestones
```

Legacy upgraded saves map conservatively by stored APS, not old level number。

## 19. Command Spell II

Base：

```text
manual ×1 · NP66 · 3s
```

Formal canonical levels：

| Lv | Branch | Hydra II kills | Cost | NP max | Manual NP | Duration |
|---:|---|---:|---:|---:|---:|---:|
| 1 | STRIKE | 3 | 297 | 132 | ×3 | 3s |
| 2 | EFF I | 9 | 198 | 66 | ×3 | 3s |
| 3 | TIME | 18 | 396 | 198 | ×3 | 9s |
| 4 | STRIKE | 27 | 396 | 396 | ×6 | 9s |
| 5 | EFF II | 39 | 330 | 198 | ×6 | 9s |
| 6 | TIME | 54 | 495 | 594 | ×6 | 27s |
| 7 | STRIKE | 66 | 594 | 792 | ×9 | 27s |
| 8 | EFF III | 81 | 495 | 396 | ×9 | 27s |
| 9 | TIME · MAX | 99 | 693 | 1188 | ×9 | 81s |

Formal System owns availability / purchase / current NP configuration projection。

State milestones：

```text
command-spell-2-lv1 ... command-spell-2-lv9
```

Current implementation follows canonical order linearly。Independent cross-branch purchase composition remains unimplemented until player-facing NP-requirement composition is specified。

## 20. View / Head Pool

```text
logical 0–99 → same visible count
logical 100+ → visible 99
```

```text
Hydra II max81   → visible ≤81
Hydra III max729 → visible ≤99
```

## 21. Player Controls / TEST Tools

Formal footer currently：

```text
COMMAND SPELL I purchase
COMMAND SPELL II purchase
寶具解放
```

Pending CS I 729 must be non-actionable and read `PRICE TBD` in this temporary UI。

TEST remains session-only：

```text
CS I TEST · 1 → 3 → 6 → MAX
COMMAND SPELL II · ×3 NP
人類惡 +999
START HYDRA #98
HYDRA II · 81 HEADS
NP READY
RESET SAVE
TOTAL KILLS
```

TEST presets do not invent normal-save kill progress and do not persist over the player's normal save。

## 22. Save

State schema remains **1**。

Reused persistent fields：

```text
progression.milestones
berserker.np normalized gauge
modifiers.active timed NP window
master.humanityEvil
berserker.baseAttacksPerSecond
```

No Offline Progress added。

## 23. Required tests

```text
Economy:
Humanity Evil generations 1..4 → 11 / 33 / 99 / 297
Hydra II true kill → +33
no head-cut Humanity Evil path

Command Spell I:
APS → 1 / 3 / 9 / 27 / 81 / 243 / 729
formal cost → 99 / 33 / 66 / 99 / 1782 / 2178 / TBD
Lv1–6 requiredHydraKills = null
affordability alone may unlock the next sequential purchase
formal purchases stop at 243
next 729 status → pricePending true / available false
purchase 729 → reason price-pending
legacy old-curve save cannot gain free 729 APS
TEST can still set 729 APS
owned 729 remains valid / MAX

Command Spell II:
reveal Hydra II kills → 3 / 9 / 18 / 27 / 39 / 54 / 66 / 81 / 99
NP max → 132 / 66 / 198 / 396 / 198 / 594 / 792 / 396 / 1188
manual NP strike → 3 / 3 / 3 / 6 / 6 / 6 / 9 / 9 / 9
duration → 3 / 3 / 9 / 9 / 9 / 27 / 27 / 27 / 81 s
33/66 charged + Lv1 purchase → 33/132
Lv9 full gauge release → 81s fixed window
outside NP → manual tap remains strikeCount1
inside NP → current CSII strike count

NP time stop:
active NP + Auto unlocked → zero auto cuts
Hydra II + active NP → structural growth suppressed
expiry → normal Hydra law / Auto resume

View:
NP timer is simulation-time driven / pointer-events none
logical81 → visible81
logical729 → visible99
```

核心原則：**怪遊戲，正常架構。**
