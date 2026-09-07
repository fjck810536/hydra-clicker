# Hydra Clicker — Architecture v0.18

> v0.18 對齊 Playtest 5：Hydra III 由 shell 升級成正式 `CUT 1 → GROW +2` / cap729 rule；logical heads 第一次到 100 時由 Progression 解鎖觀測型 Tree View。新增 Command Spell III System，僅投影 NP 中 Auto Slash 的 0 / 1⁄9 / 1⁄3 / 1 倍 bridge；正式價格仍 `pricePending`，TEST 可先切級。Save schema 維持1。

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

## 2. Generation Data owns scale and economy coefficients

`js/data/progression.js`：

```text
Hydra I   starting 9 · max 9   = 9¹ · 99 kills to next
Hydra II  starting 9 · max 81  = 9² · 99 kills to next
Hydra III starting 9 · max 729 = 9³ · next generation undecided
```

Humanity Evil true-kill reward：

```text
11 × 3^(generation - 1)
I=11 · II=33 · III=99 · IV=297
```

99-kill progression、head cap、currency reward 是三個不同 Data concerns。

## 3. Rule selection by generation

```text
generation 1 → Hydra I delayed-regrowth rule
generation 2 → Hydra II cut-one-grow-two rule · cap81
generation 3 → Hydra III cut-one-grow-two rule · cap729
```

Hydra II / III 共用純 Math helper `createCutOneGrowTwoRule()`，但各自仍有 generation-specific rule id / maxHeadCount。Combat 只要求 active rule，**不硬編 generation math**。

Normal II / III：

```text
heads - removed
→ desiredSpawn = removed × 2
→ clamp against generation maxHeads
```

NP / generic `headGrowthEnabled:false`：

```text
headsSpawned = 0
1 → 0 = terminal kill
```

`createHydraShellRule()` 保留給未來尚未實作的 generation，不再用於 Hydra III。

## 4. Progression / generation transition

```text
99 Hydra I kills
→ Hydra II encounter 1 · heads9

Hydra II true kill
→ next Hydra II encounter · heads9

Hydra II encounter99 defeated
→ Hydra III encounter1 · heads9

Hydra III true kill
→ next Hydra III encounter · heads9
```

Hydra III → Hydra IV 的 transition 尚未定義，因此 gen3 kill 不自行創造下一世代。

Generation-local completion 仍由 `hydra.encounter + defeated` 表示，不新增 kill counter field。

## 5. Generation progress projection

```text
snapshot.hydra.encounter
snapshot.hydra.defeated
+ generation Data
↓
projectGenerationProgress()
```

```text
alive    → completed = encounter - 1
defeated → completed = encounter
```

Hydra III `killsToNextGeneration:null`，所以 View 不應假造 `/99` 的下一代門檻。

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
Gen III cool violet
```

NP red tint 優先；palette 不參與 gameplay。

## 7. Hydra II first-cut semantic milestone

Command Spell I capability 跨世代保留；Hydra II 第一次登場且 `hydra-ii-first-manual-cut` 缺失時 Auto pause，accepted manual cut 後恢復。

同一 accepted manual cut：

```text
9 → 10
→ milestone hydra-ii-first-manual-cut
→ hydra:intro-complete
→ CS II Lv.1 gameplay eligibility
```

因此 CS II 第一級需要 **0 Hydra II kills**；System 只再檢查 affordability。

## 8. Command Spell I boundary

`createCommandSpellSystem()` 擁有：

```text
current level
sequential prerequisite
Humanity Evil affordability
optional kill gate when Data explicitly defines one
purchase / spend
pending-price rejection
Auto Slash capability
baseAttacksPerSecond projection
legacy curve reconciliation
```

Current Data：

```text
APS   1 / 3 / 9 / 27 / 81 / 243 / 729
cost 99 / 33 / 66 / 99 / 1782 / 2178 / TBD
```

Lv.1–6 只靠 sequential prerequisite + affordability。Lv.7 / 729 仍 `cost:null / purchasePending:true`。

System 不直接攻擊 Hydra；它只改 capability / base APS state。

## 9. Humanity Evil boundary

`createHumanityEvilSystem()` 只 consume：

```text
hydra:killed
```

Core 注入 generation-aware reward resolver：

```text
hydra:killed.payload.generation
→ getHumanityEvilRewardForGeneration()
→ currency:gain
```

禁止以 `head:cut / headsSpawned / cap stall` 產生 Humanity Evil。

## 10. Command Spell II System

`createCommandSpellIISystem()` 擁有：

```text
canonical level0..9
first-reversal eligibility
Hydra II generation-local reveal kills for Lv2+
Humanity Evil affordability
purchase / spend
current NP manual strike count
current NP max points
current NP duration
```

State storage沿用 milestones：

```text
hydra-ii-first-manual-cut
command-spell-2-lv1 ... command-spell-2-lv9
```

Canonical：

```text
Lv1 eligibility = first Hydra II reversal + 0 kills
Lv2+ kills      = 9 / 18 / 27 / 39 / 54 / 66 / 81 / 99
manual strikes  = 3 / 3 / 3 / 6 / 6 / 6 / 9 / 9 / 9
NP max          = 132 / 66 / 198 / 396 / 198 / 594 / 792 / 396 / 1188
duration        = 3 / 3 / 9 / 9 / 9 / 27 / 27 / 27 / 81 s
```

Command Spell II **只改 manual NP technique config**；不直接呼叫 Combat 或 Hydra。

## 11. Dynamic NP configuration boundary

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
base progression → pointsPerHead
```

NP System owns：

```text
normalized gauge
head:cut charge outside active NP
READY / release guard
hydra.headGrowth timed modifier
np:ended cleanup
window status
```

Active-window invariant：

```text
NP inactive + accepted head:cut → charge
NP active   + accepted head:cut → no charge
NP active   + release()          → np-already-active
```

## 12. NP gauge preservation across CS II upgrades

Persistent `berserker.np` remains normalized 0..1 for save compatibility。

```text
oldPoints = round(oldNormalized × oldMax)
newPoints = min(oldPoints, newMax)
newNormalized = newPoints / newMax
```

Example：`33/66 → buy Lv1 max132 → 33/132`。

## 13. NP time-stop / Command Spell III policy boundary

NP still creates only the generic timed rule modifier：

```text
hydra.headGrowth = disabled
scope = timed
```

Hydra I：no new delayed regrowth。  
Hydra II / III：`headsSpawned = 0`。

Auto execution policy is composed separately in Core：

```text
NP inactive
→ effective Auto APS = Command Spell I base APS

NP active + CS III fraction 0
→ Auto disabled

NP active + CS III fraction >0
→ Auto enabled
→ effective APS = CS I base APS × CS III fraction
```

Auto Slash System itself只接收：

```js
isEnabled(snapshot)
getAttacksPerSecond(snapshot)
```

它不知道 NP、Command Spell III 或 Fate 專名。

Manual Input仍由 Core 在 NP active 時讀 CS II status 決定 `strikeCount`。Auto requests 只使用 AutoSlash 自己算出的 strikeCount，**不繼承 CS II manual ×3/×6/×9**。

## 14. Command Spell III System

新增 `createCommandSpellIIISystem()`，擁有：

```text
Hydra III first-NP-release eligibility
level projection from milestones
0 / 1⁄9 / 1⁄3 / 1 Auto-in-NP fraction
future price / affordability / purchase boundary
semantic eligibility event
```

Data：

```text
base → 0
Lv1  → 1/9
Lv2  → 1/3
Lv3  → 1 / FULL
```

Persistent storage reuse：

```text
hydra-iii-first-np-release
command-spell-3-lv1
command-spell-3-lv2
command-spell-3-lv3
```

First eligibility：

```text
np:released while snapshot.hydra.generation === 3
→ add hydra-iii-first-np-release
→ emit command-spell:eligible { id:'command-spell-3', ... }
```

目前三級全部：

```text
cost = null
purchasePending = true
formal purchase → price-pending
```

TEST preset 可直接寫既有 milestones 驗證倍率，但不得改 Humanity Evil、kills 或 CS I APS。

Command Spell III System **不直接修改 AutoSlash、NP modifier、Hydra state**。

## 15. Combat / multistrike boundary

Manual Attack Request 可以包含任意正整數 `strikeCount`。Combat逐 strike：

```text
resolve active Hydra Rule
→ apply resolution
→ emit attack:resolved / head:cut
→ terminal kill stops batch
```

禁止讓 View animation 排程 logical cuts；禁止讓 Hydra Rule 知道 Command Spell 名稱。

## 16. Tree View unlock / representation boundary

Head pool contract不變：

```text
logical 0–99 → same visible count
logical 100+ → visible99
```

Hydra III第一次跨過 visual cap：

```text
99 logical
→ accepted cut / growth resolves
→ state becomes 100
→ Progression sees generation3 + logicalHeads >=100
→ progression.treeViewUnlocked = true
→ emit tree-view:unlocked
```

這是 Progression milestone，不是 View 判斷 mesh 數量後反寫 state。

`js/view/tree-view.js` 是純 View projection：

```text
snapshot logical heads
+ constant visible cap99
+ generation maxHeads
↓
logicalHeads
visibleHeads
beyond-image overflow
current cap
```

Tree View v0 observation-only：

```text
no node targeting
no Combat request
no state.update
no Hydra math import
```

## 17. Command Spell / Tree UI boundary

固定三槽：

```text
令咒
[ I ] [ II ] [ III ]
```

`command-spell-panel.js` 只消費 I / II / III status projection。Application routing 才能：

```text
slot tap → modal
purchase action → runtime.buyCommandSpellI/II/III()
```

CS III 在 first eligibility 前 dormant；eligibility 後可 reveal/detail，但因 price pending，purchase disabled。TEST-owned Lv1/Lv2/MAX 可正常投影 current fraction。

CS III modal quote：

> `「這裡怎麼沒有 SKIP???」`

Tree View UI：

```text
unlocked → TREE VIEW toggle visible
open → observational overlay
44×44 close / backdrop dismiss
```

View never spends currency or mutates logical progression。

## 18. Persistence

State schema仍為 **1**。

Reuse existing fields：

```text
progression.milestones
progression.treeViewUnlocked
berserker.np
modifiers.active
master.humanityEvil
berserker.baseAttacksPerSecond
```

沒有新增 persistent field，也沒有 Offline Progress。

## 19. Dependency direction / forbidden shortcuts

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
View → mutate Hydra / progression
Tree View → determine logical head count from mesh count
Tree View → direct node damage
Command Spell panel → spend Humanity Evil directly
NP animation/timer → determine modifier expiry
Auto Slash System → hardcode NP / Command Spell III
Command Spell III System → call AutoSlash directly
Command Spell III Auto → inherit CS II manual multistrike
Command Spell II → direct Hydra mutation
active NP → charge next NP
active NP → nested release
Humanity Evil → head-cut farming
System → invent pending CS I / CS III price
```

## 20. Current stage

```text
Hydra I 99-kill generation                         ✅
Hydra II 81-head / 99-kill loop                   ✅
Hydra III CUT1→GROW2 / cap729 combat              ✅
Hydra III true kill / +99 HE / gen3 respawn       ✅
NP time stop / countdown / manual multistrike      ✅
NP no-self-charge / no-nested-release seal         ✅
Command Spell II first-cut anti-softlock           ✅
Command Spell II formal 9-beat economy             ✅
Command Spell I through 243 formal economy         ✅
Command Spell I 729 price                          ⛔ TBD
Tree View unlock at logical100                     ✅
Tree View observational v0                         ✅
Command Spell III first-NP eligibility             ✅
Command Spell III 1/9→1/3→FULL mechanic            ✅ via TEST
Command Spell III formal Humanity Evil prices      ⛔ TBD
Command Spell III formal purchase                  ⛔ blocked by pricePending
Combat HUD three-icon Command Spell group          ⛔ later
Hydra II cap hit final presentation                ⛔ later
Tree node targeting / compressed structure         ⛔ later
Analyzer                                            ⛔ later
```

最後檢查：

> **Am I adding a new block, or making an old block know too much?**
