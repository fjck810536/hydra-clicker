# Hydra Clicker — Architecture v0.19

> v0.19 對齊 `02_player_facing/LONG_TERM_COMMAND_SPELL_ECONOMY.md`。新增 generation-normalized 計價 projection `U_n`，但 Humanity Evil 仍是唯一 persistent currency；Command Spell II / III Systems 正式支援「效果已知、價格仍為 range」的 `pricePending`，CS II 另支援 `futureExtensionPending`，避免把目前資料尾端 81s 誤判為長期 MAX。Save schema 維持1。

## 1. Top-level flow

```text
INPUT / AUTO
    ↓
ATTACK REQUEST
    ↓
COMBAT
    ↓
ACTIVE HYDRA RULE
    ↓
CUT RESOLUTION
    ↓
LOGICAL STATE + SEMANTIC EVENTS
 ┌──────┼─────────┬────────────┬──────────┬─────────────┐
 ↓      ↓         ↓            ↓          ↓
NP   ECONOMY   PROGRESSION   COMMANDS   UI / VIEW
                                         ↓
                                     PERSISTENCE
```

Math / Rules 不知道 Fate 名稱、價格、UI 或 Babylon；View 不決定 gameplay；Persistence 只存 logical state。

## 2. Data owns scale, economy and content prices

`js/data/progression.js` 擁有：

```text
Hydra generation start / max / kills-to-next
Humanity Evil income law
Command Spell level effects
fixed prices
price-pending markers
intended generation hints
```

### Generation scale

```text
Gen I   start9 · max9   · 99 kills
Gen II  start9 · max81  · 99 kills
Gen III start9 · max729 · next undefined
```

### Humanity Evil income

```text
HUMANITY_EVIL_ECONOMY = {
  basePerKill: 11n,
  generationMultiplier: 3n
}
```

Pure Data helpers：

```js
getHumanityEvilRewardForGeneration(generation)
getHumanityEvilCostForGenerationUnits(generation, units)
```

Design notation：

```text
U_n = one true Hydra kill reward in generation n
U_n = 11 × 3^(n-1)
```

`U_n` **不是第二種 currency，也不存進 Save**；它只是把 relative design price 轉成 raw Humanity Evil 的 Data-level helper。

Old prices never rescale when the player reaches later generations. Natural purchasing-power inflation is the intended catch-up mechanism。

## 3. Hydra Rule selection

```text
generation1 → Hydra I regeneration rule
generation2 → Hydra II structural grow rule
generation3 → Hydra III structural grow rule with larger cap
```

Combat 只問 `getRule(snapshot)`，不硬寫 generation-specific math。

### Hydra I

```text
cut removes head
non-terminal + growth enabled → schedule same-head regrowth
0 heads → true kill
```

### Hydra II / III

Shared structural rule shape：

```text
remaining = heads - removed
desired spawn = removed × 2
spawn = clamp to generation max
```

Caps：II=81；III=729。

NP 只透過 Rule Context `headGrowthEnabled:false` 讓 spawn 變0；Rule 不知道 source 是 NP。

## 4. Progression / generation transition

```text
Hydra I kill99
→ Hydra II encounter1 · 9 heads

Hydra II encounter99 defeated
→ Hydra III encounter1 · 9 heads
```

Generation-local completion 仍從：

```text
hydra.encounter + hydra.defeated
```

推導，不新增 persistent local kill counter。

Hydra II first manual reversal cut：

```text
progression.milestones += hydra-ii-first-manual-cut
emit hydra:intro-complete
```

Hydra III logical heads 第一次達到 100：

```text
progression.treeViewUnlocked = true
emit tree-view:unlocked
```

## 5. Humanity Evil System boundary

`createHumanityEvilSystem()` 只 consume：

```text
hydra:killed
```

Core 注入 generation-aware reward resolver：

```text
payload.generation
→ getHumanityEvilRewardForGeneration()
→ currency:gain
```

禁止：

```text
head:cut → HE
headsSpawned → HE
cap stall → HE
View → HE
```

因此 structural growth / visible cap 不能產生長期貨幣套利。

## 6. Command Spell I System — infinite APS axis

`createCommandSpellSystem()` 擁有：

```text
current owned level
sequential prerequisite
fixed-price affordability
optional explicit kill gate
pricePending rejection
Auto Slash capability
baseAttacksPerSecond projection
legacy save reconciliation
```

Current Data：

```text
APS:  1 / 3 / 9 / 27 / 81 / 243 / 729
HE:  99 /33 /66 /99 /1188/1782/ TBD
```

Equivalent design units：

```text
Hydra I: 9U1 / 3U1 / 6U1 / 9U1
Hydra II: 36U2 / 54U2
Hydra III 729: range 36–54U3 → no formal price yet
```

For a pending level：

```text
cost = null
purchasePending = true
→ status.pricePending = true
→ status.available = false
→ purchase() => price-pending
```

The current finite Data array does **not** conceptually make CS I finite; future APS steps extend the same axis。

## 7. Command Spell II System — finite manual technique + extensible time axis

`createCommandSpellIISystem()` owns：

```text
current owned level from milestones
first-reversal eligibility
known generation-local kill gates
fixed-price affordability
absolute NP-point preservation when max changes
current manual strike count
current NP max
a current NP duration projection
pricePending for unresolved range-priced steps
futureExtensionPending when current Data ends before design axis ends
```

### Formal current teaching trio

```text
Lv1  first reversal · 0 kills · 297 HE = 9U2  → ×3 / NP132 / 3s
Lv2  9 kills                 · 198 HE = 6U2  → ×3 / NP66  / 3s
Lv3 18 kills                 · 891 HE = 27U2 → ×3 / NP198 / 9s
```

Later already-tested effect rows remain in Data for old saves / TEST, but unresolved long-term prices use：

```text
cost = null
purchasePending = true
requiredGenerationKills = null
intendedGeneration = 3 or 4
```

System must not invent a reveal threshold or choose one endpoint from a player-facing price range。

### Extension semantics

Data currently retains effect rows through manual ×9 / 81s for compatibility. `definition.futureExtensionPending = true` means：

```text
currentLevel == last defined row
AND futureExtensionPending
→ maxed = false
→ extensionPending = true
→ pricePending = true
→ nextLevel = null
```

So 81s can exist as an owned/test effect without being advertised as the conceptual end of Command Spell II。

### NP absolute-charge preservation

When maxPoints changes：

```text
oldPoints = round(oldNormalized × oldMax)
newPoints = min(oldPoints, newMax)
newNormalized = newPoints / newMax
```

No free percentage refill。

## 8. Command Spell III System — finite Auto-in-NP bridge

`createCommandSpellIIISystem()` owns：

```text
Hydra III first-NP eligibility milestone
current bridge level
fixed-price affordability where known
pricePending where range unresolved
Auto-in-NP fraction projection
semantic eligible / available / unlocked / upgraded events
```

Effect ladder：

```text
0 → 1/9 → 1/3 → 1
```

Current price state：

```text
Lv1 1/9 → 891 HE = 9U3 · formal
Lv2 1/3 → range 9–18U3 · pricePending
Lv3 FULL → range 18–36U3 · pricePending
```

First NP release in Hydra III：

```text
write hydra-iii-first-np-release
emit command-spell:eligible
↓
if fixed price exists + balance enough
emit command-spell:available
```

Eligibility and affordability are intentionally separate。A revealed-but-poor slot can be inspected without pretending it is purchasable。

CS III FULL is a real finite MAX；unlike CS I / CS II time axis, no future fraction above1 exists。

## 9. Core composition — Auto policy

Auto Slash System remains generic：

```text
isEnabled(snapshot)
getAttacksPerSecond(snapshot)
```

Core composes context：

```text
ordinary time
→ base Command Spell I APS

Hydra II first-cut intro pending
→ Auto disabled

NP active + CS III fraction 0
→ Auto disabled

NP active + CS III fraction >0
→ Auto enabled
→ effective APS = base APS × CSIII fraction
```

Auto requests always use ordinary `strikeCount=1`。They do **not** inherit CS II manual multistrike。

This is currently injected application policy, not a generalized persistent policy aggregator。

## 10. NP System boundary

NP System accepts injected current config：

```js
getConfig(snapshot) -> {
  maxPoints,
  pointsPerHead,
  durationMs
}
```

Core projects current CS II effects into NP config。

NP owns：

```text
normalized gauge storage
charge outside active window
READY / release validation
timed hydra.headGrowth modifier
np:released / np:ended lifecycle
window status
no-self-charge / no-nested-release invariant
```

CS II never edits Hydra modifiers directly。CS III never edits NP duration or manual strike count。

## 11. Combat / multistrike boundary

Attack Request：

```js
{
  source,
  timestamp,
  strikeCount,
  headsPerStrike,
  target
}
```

Combat resolves each strike separately：

```text
for each strike
→ current Rule
→ Cut Resolution
→ apply
→ attack:resolved
→ head:cut
→ stop at true kill
```

Manual CS II multistrike is expressed as request `strikeCount=3/6/9`。View animation only projects this semantic batch and never schedules logical attacks。

## 12. View boundary

### Head representation

```text
logical 0–99 → same visible
logical >=100 → 99 visible
```

Hydra III first exposes the mismatch。

### Tree View

Consumes only snapshot/data projection：

```text
logical heads
visible proxy
beyond-image overflow
current generation cap
```

No System / Core imports, no state mutation。

### Command Spell panel

Consumes I / II / III status objects and renders：

```text
dormant
available
owned-dim
affordable
max
```

`pricePending` / `extensionPending` are presentation inputs, not View decisions。

Application routes modal purchase to：

```text
runtime.buyCommandSpellI()
runtime.buyCommandSpellII()
runtime.buyCommandSpellIII()
```

## 13. Persistence

State schema remains **1**。

Reuse：

```text
CS I ownership  → existing milestones + autoSlash capability + stored APS
CS II ownership → command-spell-2-lvN milestones
CS III ownership → command-spell-3-lvN milestones
CS II first eligibility → hydra-ii-first-manual-cut
CS III eligibility → hydra-iii-first-np-release
Tree View → progression.treeViewUnlocked
NP active window → modifiers.active + simulation timeline
```

Not persisted：

```text
U_n design notation
pricePending / extensionPending status
current affordability
visible mesh count
```

Old/test-owned later CS II effects remain valid even though normal purchase prices are withdrawn pending long-term exact values。

## 14. Dependency direction

允許：

```text
data → none
math → data/context only
systems → math/data + injected state/events
core → systems + math + data
view → snapshot/status/events/data projection
save → serializable logical state
```

禁止：

```text
View → spend currency / set milestone / mutate Hydra
Hydra Rule → know NP / Command Spell names
Auto Slash → know Fate names or CSIII internals
CS II → mutate Hydra directly
CS III → multiply manual strikeCount
Economy System → price content itself
System → choose an endpoint from a TBD range
pricePending → silently treat null as zero
81s current data tail → claim conceptual MAX
U_n → become hidden second persistent currency
```

## 15. Current implementation status

```text
Hydra I 99-kill loop                           ✅
Hydra II 81-head / 99-kill loop                ✅
Hydra III CUT1→GROW2 / cap729                   ✅
NP head-growth time stop                       ✅
Tree View v0 at logical100                      ✅
Humanity Evil ×3 generation income              ✅
U_n normalized price helper                     ✅
CS I through 243 fixed-price progression        ✅
CS I 729 exact price                            ⛔ range / pending
CS II Hydra-II teaching trio fixed prices       ✅
CS II later effect compatibility                ✅
CS II later exact prices / long-term extension  ⛔ range / pending
CS III Lv1 9U3 purchase                         ✅
CS III Lv2/MAX exact prices                     ⛔ range / pending
Save schema migration                           not needed
```

最後檢查：

> **Am I adding a new block, or making an old block know too much?**
