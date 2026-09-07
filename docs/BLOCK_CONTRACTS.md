# Hydra Clicker — Block Contracts v0.21

> v0.21 對齊 Playtest 4.5.1：Command Spell II Lv.1 以 Hydra II first-reversal milestone + affordability 取得資格，0 Hydra II kills；NP active cuts 不充能且 nested release 被拒絕；Command Spell modal 增加 successful-purchase auto-close、44px close target 與 backdrop dismiss。State schema 仍為1。

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

Active-window seal：

```text
head:cut while NP inactive → charge according to current config
head:cut while NP active   → zero NP charge
release while NP active    → { accepted:false, reason:'np-already-active' }
```

Normal gameplay must not stack a second NP modifier on top of an active NP window。

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
NP charge remains paused
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

Hydra II first accepted manual cut writes：

```text
progression.milestones += hydra-ii-first-manual-cut
```

and emits：

```js
hydra:intro-complete {
  atMs,
  generation: 2,
  milestone: 'hydra-ii-first-manual-cut'
}
```

The same milestone may be consumed by multiple downstream Systems (Auto intro guard completion, CS II first eligibility) without direct System-to-System mutation。

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

NP charge consumer must inspect active NP lifecycle before crediting this event。

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

Player-facing title：

```text
「快點……再快點……！」
```

Formal canonical levels：

| Lv | Branch | Eligibility / Hydra II kills | Cost | NP max | Manual NP | Duration |
|---:|---|---|---:|---:|---:|---:|
| 1 | STRIKE | `hydra-ii-first-manual-cut` · **0 kills** | 297 | 132 | ×3 | 3s |
| 2 | EFF I | 9 kills | 198 | 66 | ×3 | 3s |
| 3 | TIME | 18 kills | 396 | 198 | ×3 | 9s |
| 4 | STRIKE | 27 kills | 396 | 396 | ×6 | 9s |
| 5 | EFF II | 39 kills | 330 | 198 | ×6 | 9s |
| 6 | TIME | 54 kills | 495 | 594 | ×6 | 27s |
| 7 | STRIKE | 66 kills | 594 | 792 | ×9 | 27s |
| 8 | EFF III | 81 kills | 495 | 396 | ×9 | 27s |
| 9 | TIME · MAX | 99 kills | 693 | 1188 | ×9 | 81s |

First purchase availability：

```text
Hydra generation >= II
AND hydra-ii-first-manual-cut milestone exists
AND Humanity Evil >= 297
→ available
```

It must be possible before killing Hydra II encounter1。

Status contract includes：

```js
{
  level,
  generationKills,
  eligibilityMet,
  killsMet,
  canAfford,
  available,
  npManualStrikeCount,
  npMaxPoints,
  npDurationMs,
  nextNpManualStrikeCount,
  nextNpMaxPoints,
  nextNpDurationMs,
  ...
}
```

Purchase rejection priority for Lv.1：

```text
missing first-cut milestone → eligibility-required
then kill requirement       → kills-required
then currency               → insufficient-humanity-evil
```

Formal System owns availability / purchase / current NP configuration projection。

State milestones：

```text
hydra-ii-first-manual-cut
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

## 21. Player Controls / Command Spell panel / TEST Tools

Formal player controls：

```text
令咒
[ I ] [ II ] [ III ]

寶具解放
```

Command Spell slot projection states：

```text
dormant    = gameplay eligibility and/or first affordability not met
available  = first purchase is currently eligible + affordable; display NEW
owned-dim  = already owned but next upgrade unavailable / unaffordable / price pending
affordable = owned and next upgrade can be purchased; display LV UP
max        = completed owned state
```

For Command Spell II specifically：

```text
before Hydra II first reversal cut → dormant even if rich
after first reversal cut + balance >=297 → NEW
```

Slot I / II remain clickable after ownership even when dim so the detail modal can still explain current / next / cost。Before first availability they remain dormant and non-clickable。

Command Spell III is currently：

```text
dormant
non-clickable
no System
no gameplay effect
```

Detail modal contract：

```text
name / quote
current level
CURRENT
NEXT
COST
concise description
PURCHASE / LV UP / MAX / PRICE TBD
close
```

CS II CURRENT / NEXT each show the complete technique tuple：

```text
×N · NP M · Ns
```

so a TIME / STRIKE upgrade cannot hide its NP requirement increase。

Purchase path：

```text
slot tap → View opens modal
modal purchase → Application resolves open spell id
→ runtime.buyCommandSpellI() / runtime.buyCommandSpellII()
→ System validates and spends
→ accepted purchase → modal closes automatically
```

Dismissal：

```text
close × target >= 44×44 px → close
backdrop root tap          → close
inside-card tap            → no backdrop close
```

Forbidden：

```text
View → draft.master.humanityEvil -= cost
View → set milestones / APS / NP config
slot tap → immediate purchase without modal action
inside-card tap → accidental dismiss by bubbling
```

CS I 243 → 729 pending state remains visible as `PRICE TBD` with disabled modal action。TEST / already-owned 729 may read MAX。

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

No UI/modal state is persistent。No Offline Progress added。

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
Lv1 requiredGenerationKills = 0
Lv1 before first Hydra II manual cut → eligibilityMet false / unavailable
Lv1 first Hydra II cut 9→10 with 0 Hydra II kills → eligibilityMet true
first cut + balance297 → Lv1 purchasable while encounter1 alive
Lv2+ reveal Hydra II kills → 9 / 18 / 27 / 39 / 54 / 66 / 81 / 99
NP max → 132 / 66 / 198 / 396 / 198 / 594 / 792 / 396 / 1188
manual NP strike → 3 / 3 / 3 / 6 / 6 / 6 / 9 / 9 / 9
duration → 3 / 3 / 9 / 9 / 9 / 27 / 27 / 27 / 81 s
33/66 charged + Lv1 purchase → 33/132
Lv9 full gauge release → 81s fixed window
outside NP → manual tap remains strikeCount1
inside NP → current CSII strike count

Command Spell panel:
exactly three fixed slots
I / II first-eligible+affordable → available NEW
owned but poor → owned-dim and still clickable
owned + affordable → LV UP state
MAX distinct from dormant / dim
243 APS next729 → PRICE TBD and no purchase
III → dormant / disabled
CSII title → 「快點……再快點……！」
CSII NEXT exposes strike / NP requirement / duration
successful purchase → modal closes
close target >=44px
backdrop tap closes; card tap does not
View imports no Systems / Math / Core
View never spends Humanity Evil
Application modal action routes to runtime purchase APIs

NP time stop:
active NP + Auto unlocked → zero auto cuts
Hydra II + active NP → structural growth suppressed
active NP cuts → zero NP charge
active NP second release → np-already-active / no extra modifier
expiry → normal Hydra law / Auto / NP charge resume

View:
NP timer is simulation-time driven / pointer-events none
logical81 → visible81
logical729 → visible99
```

核心原則：**怪遊戲，正常架構。**
