# Hydra Clicker — Architecture v0.17

> v0.17 對齊 Playtest 4.5.1：Command Spell II 第一級改為 Hydra II first-reversal milestone + affordability，不再要求先殺 Hydra II；NP active window 禁止自充與重複 release；Command Spell modal 成功購買後自動關閉，並支援 backdrop dismiss。Save schema 維持1。

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
 ┌───┼────────┬───────────┬───────────┐
 ↓   ↓        ↓           ↓           ↓
NP  ECONOMY  PROGRESSION  UI/VIEW   PERSISTENCE
```

View 只讀結果；Input 只描述玩家意圖；Persistence 只保存 logical state。

## 2. Generation data owns scale and economy coefficients

`js/data/progression.js`：

```text
Hydra I   starting 9 · max 9   = 9¹ · 99 kills to next
Hydra II  starting 9 · max 81  = 9² · 99 kills to next
Hydra III starting 9 · max 729 = 9³ · next rule undecided
```

Humanity Evil true-kill reward：

```text
11 × 3^(generation - 1)
I=11 · II=33 · III=99 · IV=297
```

99-kill progression、head cap、currency reward 是三個不同 Data concerns。

## 3. Rule selection by generation

```text
generation 1 → Hydra I Rule
generation 2 → Hydra II Rule
generation 3 → Hydra III shell rule
```

Combat 不寫 generation-specific math。Hydra II cap81；NP suppress growth；Hydra III shell reject cut。

## 4. Progression / generation transition

```text
99 Hydra I kills
→ Hydra II encounter 1 · heads 9

Hydra II true kill
→ next Hydra II encounter · heads 9

Hydra II encounter 99 defeated
→ Hydra III encounter 1 · heads 9
```

Generation-local completion 由 `hydra.encounter + defeated` 表示，不新增 kill counter field。

## 5. Generation progress projection

```text
snapshot.hydra.encounter
snapshot.hydra.defeated
+ generation data
↓
projectGenerationProgress()
↓
completedKills / targetKills / maxHeads
```

```text
alive    → completed = encounter - 1
defeated → completed = encounter
```

Lifetime `statistics.totalHydrasKilled` 保留給 Statistics / cross-generation progression。

## 6. Semantic generation transition / palette

```text
hydra:generation-changed
→ generation-transition-view.show()
→ CSS animation
```

不暫停 GameClock、不用 gameplay `setTimeout`。

```text
Gen I   neutral dark
Gen II  subtle sickly yellow-green
Gen III cool violet shell
```

NP red tint 優先；palette 不參與 gameplay。

## 7. Hydra II first-cut semantic milestone

Command Spell I capability 跨世代保留；Hydra II 第一次登場且 `hydra-ii-first-manual-cut` milestone 缺失時 Auto pause，accepted manual cut 後恢復。

同一個 accepted manual cut 由 Progression emit：

```text
hydra:intro-complete {
  generation: 2,
  milestone: 'hydra-ii-first-manual-cut'
}
```

這個 semantic milestone 現在同時是 Command Spell II Lv.1 的 gameplay eligibility trigger：

```text
Hydra II encounter1 · 9 heads
→ first manual cut resolves 9→10
→ milestone written + hydra:intro-complete emitted
→ CS II System observes milestone
→ if Humanity Evil >= 297, Lv.1 becomes available immediately
```

因此 CS II 第一級需要 **0 Hydra II kills**，避免「必須先殺第一隻蛇二才拿得到解法」的軟鎖。

Auto guard 與 NP time-stop policy 均由 Core composition 注入；Auto Slash System 不知道 Hydra II 或 NP 專名。

## 8. Command Spell I boundary

`createCommandSpellSystem()` 擁有：

```text
current level
sequential prerequisite
Humanity Evil affordability
optional legacy/content kill gate when a level explicitly defines one
purchase / spend
pending-price rejection
Auto Slash capability
baseAttacksPerSecond projection
legacy curve reconciliation
```

Current Data curve：

```text
APS   1 / 3 / 9 / 27 / 81 / 243 / 729
cost 99 / 33 / 66 / 99 / 1782 / 2178 / TBD
```

Lv.1–6 的 `requiredHydraKills` 為 `null`，因此沒有額外 kill gate：

```text
previous level owned
AND balance >= cost
→ available
```

自然節奏來自 economy 本身：

```text
Hydra I ~9 / 12 / 18 / 27 kills → 1 / 3 / 9 / 27 APS
Hydra II automation-only ~30 kills → 81 APS
Hydra II automation-only ~96 kills → 243 APS
```

這些不是 System 硬編碼的 kill thresholds。

729 APS level 仍存在於 Data，因為：

- TEST 需要它；
- 已擁有的 729 save 必須可表示；
- Hydra III 最終會使用這個 APS landmark。

但目前：

```text
level 7 cost = null
purchasePending = true
→ getStatus().pricePending = true
→ available = false
→ purchase() returns reason: price-pending
```

System 不自己替 Hydra III 發明價格。

Legacy tuning migration 只在真正存在舊 Command Spell I upgrade milestones 時觸發，並映射到 `new APS <= stored old APS` 的最高節點，避免舊 level number 直接變成免費高 APS。若 save 本來就是一致的 729 APS owned state，則保留。

System 不直接攻擊 Hydra；它只改 capability / APS state。

## 9. Humanity Evil boundary

`createHumanityEvilSystem()` 仍只 consume：

```text
hydra:killed
```

Core 注入 generation-aware reward resolver：

```text
hydra:killed.payload.generation
→ getHumanityEvilRewardForGeneration()
→ currency:gain
```

禁止：

```text
head:cut → Humanity Evil
head:spawn → Humanity Evil
cap stall → Humanity Evil
```

因此 Hydra II 81-cap 不能成為長期貨幣無限農場。

## 10. Command Spell II formal System

`createCommandSpellIISystem()` 擁有：

```text
canonical level 0..9
first-reversal gameplay eligibility
Hydra II generation-local reveal kills for Lv.2+
Humanity Evil affordability
purchase / spend
current NP manual strike count
current NP max points
current NP duration
```

State storage 沿用：

```text
progression.milestones
hydra-ii-first-manual-cut
command-spell-2-lv1 ... command-spell-2-lv9
```

沒有新增 persistent field。

Canonical Data：

```text
Lv1 eligibility = hydra-ii-first-manual-cut milestone + 0 Hydra II kills
Lv2+ reveal kills = 9 / 18 / 27 / 39 / 54 / 66 / 81 / 99
strikes 3 / 3 / 3 / 6 / 6 / 6 / 9 / 9 / 9
NP max 132 / 66 / 198 / 396 / 198 / 594 / 792 / 396 / 1188
duration 3 / 3 / 9 / 9 / 9 / 27 / 27 / 27 / 81 s
```

Status separates：

```text
eligibilityMet   ← first Hydra II reversal milestone / existing ownership
killsMet         ← current level's generation-local kill gate
canAfford        ← Humanity Evil balance
available        ← all required conditions
```

Before the first reversal cut, even a rich player sees slot II as dormant. After the cut, if balance >=297, it becomes NEW immediately while Hydra II encounter1 is still alive。

Current runtime follows the canonical nine-beat order linearly. Independent three-branch purchasing is not implemented until an order-independent NP requirement composition rule exists in player-facing spec。

## 11. Dynamic NP configuration boundary

NP System accepts an injected config projection：

```js
getConfig(snapshot) -> {
  maxPoints,
  pointsPerHead,
  durationMs
}
```

Core composes：

```text
Command Spell II status
→ maxPoints
→ durationMs

base progression
→ pointsPerHead
```

Explicit runtime test overrides (`npMaxPoints`, `npPointsPerHead`, `npDurationMs`) retain priority。

NP System owns：

```text
normalized gauge storage
head:cut charge outside active NP
READY decision
release guard
hydra.headGrowth timed modifier
np:ended cleanup
window status
```

Active-window invariant：

```text
NP inactive + accepted head:cut → charge normally
NP active   + accepted head:cut → no NP charge
NP active   + release()          → rejected: np-already-active
```

This guarantees at most one active NP release window from ordinary gameplay and prevents CS II long-duration upgrades from self-sustaining permanent time stop。

Command Spell II does **not** create or edit Hydra modifiers directly。

## 12. NP gauge preservation across upgrades

Persistent `berserker.np` remains normalized 0..1 for save compatibility。

When a Command Spell II purchase changes `maxPoints`, the purchase System preserves absolute charged points：

```text
old points = round(old normalized × old max)
new points = min(old points, new max)
new normalized = new points / new max
```

Example：

```text
33 / 66
buy Lv.1 (max132)
→ 33 / 132
```

This prevents a larger gauge from granting free charge proportional to the old percentage。

## 13. NP time-stop rule boundary

NP still creates generic timed rule modifier：

```text
hydra.headGrowth = disabled
scope = timed
```

Hydra I：no new delayed regrowth。  
Hydra II：`headsSpawned = 0`。

NP active：

```text
Auto Slash paused by Core policy
Manual Input remains available
Core asks Command Spell II status for default NP strikeCount
NP charge is paused
second release is rejected
```

Ordinary time always defaults manual `strikeCount=1`。

A TIME upgrade affects future releases. An already-active NP window keeps the release-time `endsAt` and is never extended by a later purchase or nested release。

## 14. Combat / multistrike boundary

Manual Attack Request can contain：

```js
strikeCount: 1 | 3 | 6 | 9 | ...
```

Combat：

```text
for each strike
→ resolve active Hydra Rule separately
→ apply resolution
→ emit attack:resolved / head:cut
→ stop batch at terminal kill
```

禁止：

```text
Command Spell II → heads -= N
View animation → schedule N gameplay cuts
Hydra Rule → know Command Spell II name
Manual Input → know NP / Command Spell progression
```

Berserker View only projects an already-resolved multi-strike request into a visible combo。

## 15. NP lifecycle / View projection

```text
np:released { atMs, endsAt, durationMs, maxPoints, modifier }
np:ended    { atMs, endedAtMs }
```

`np.getWindowStatus()` returns derived：

```js
{ active, startsAt, endsAt, remainingMs }
```

View：

```text
np:released → 寶具解放 card
active      → compact GameClock-derived countdown + MANUAL ×N
np:ended    → TIME RESUMES cue
```

No View timer owns gameplay timing。

## 16. View / Command Spell panel boundary

Head pool contract：

```text
logical 0–99 → same visible count
logical 100+ → visible 99
```

Hydra II max81 不碰 visual cap；Hydra III max729 可以 >99，但 View 最多99 meshes。

Command Spell 玩家端使用固定三槽：

```text
令咒
[ I ] [ II ] [ III ]
```

`js/view/command-spell-panel.js` 只消費 Command Spell I / II status projection，輸出：

```text
dormant
available / NEW
owned-dim
affordable / LV UP
MAX
```

Slot I / II 點擊只開 detail modal。真正消費 Humanity Evil 的動作仍由 Application routing：

```text
slot tap
→ commandSpellPanel.open(I / II)
→ modal
→ PURCHASE / LV UP
→ app.js calls runtime.buyCommandSpellI() / buyCommandSpellII()
→ Systems validate eligibility / kill gates / affordability and spend
→ accepted purchase closes modal
```

Modal interaction contract：

```text
successful purchase → close
44×44 px close target → close
pointerup on backdrop root itself → close
pointerup inside modal card → keep open
```

CS II modal title is `「快點……再快點……！」`。Its CURRENT / NEXT each expose the complete technique tuple (`×N · NP M · Ns`) so sawtooth requirement changes are not hidden taxes。

View 不直接改 currency、milestone、APS 或 NP config。

Command Spell III 目前只有永久 dormant slot；沒有 click handler、沒有 System，也不因此宣告第三令咒機制已決定。

CS I 243 APS 的下一級仍顯示 `729 APS · PRICE TBD`，但 modal purchase disabled；TEST / already-owned 729 則可投影成 MAX。

Combat HUD 上額外的三個小令咒 icon group 尚未落地；本 milestone 只完成主三槽 panel + detail modal。

## 17. Persistence

State schema 仍為1，沒有 schema migration。

Persistence reuse：

```text
Command Spell I levels → existing milestones
Command Spell II levels → existing milestones
CS II first eligibility → existing hydra-ii-first-manual-cut milestone
NP gauge              → existing normalized berserker.np
NP active window       → existing modifiers.active
```

Only Command Spell I old tuning may need runtime reconciliation; no new Save fields are introduced。

## 18. Dependency direction

允許：

```text
data → none
math → plain data/context
systems → math + data + injected interfaces
core → systems + math + data
view → snapshot + semantic events + data projection
save → serializable logical state
```

禁止：

```text
View → mutate encounter / head state
Command Spell panel → spend Humanity Evil directly
Command Spell panel → import Systems / Math / Core
NP animation / timer → determine modifier expiry
Auto Slash System → hardcode NP/Fate names
NP System → directly disable Auto Slash internals
Manual Input → inspect Command Spell progression
Command Spell II → direct Hydra mutation
Command Spell II Lv1 → require a Hydra II kill
active NP → charge next NP
active NP → stack another release window
Humanity Evil → head-cut farming
Command Spell I System → invent pending Hydra III price
transition overlay → pause GameClock
```

## 19. Current stage

```text
Hydra I 99-kill generation                         ✅
Hydra II 81-head / 99-kill loop                   ✅
Hydra III 9-head / max729 shell                   ✅
Playtest 4 chapter presentation                    ✅
NP time stop / countdown / multistrike             ✅
NP no-self-charge / no-nested-release seal         ✅
Generation Humanity Evil ×3 scaling                ✅
Command Spell II first-cut anti-softlock unlock    ✅
Command Spell II formal 9-beat economy             ✅
CS I Hydra I fast 1/3/9/27 economy                 ✅
CS I Hydra II 81/243 allocation economy            ✅
CS I 729 formal price                              ⛔ pending Hydra III
Fixed three-slot Command Spell panel               ✅
Command Spell detail modal / mobile dismissal UX   ✅
Command Spell III gameplay                         ⛔ dormant slot only
Combat HUD three-icon Command Spell group          ⛔ later
Hydra II cap hit final presentation                ⛔ later
Hydra III combat rule                              ⛔ not yet
Analyzer / Tree View                               ⛔ not yet
```

最後檢查：

> **Am I adding a new block, or making an old block know too much?**
