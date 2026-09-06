# Hydra Clicker — Architecture v0.4

> 目標：每一塊都可以單獨測試、替換、重寫，不讓「數學規則」「遊戲經濟」「玩家輸入」「Babylon.js 畫面」互相糾纏。

## 1. 頂層資料流

```text
INPUT / AUTO SYSTEMS
        ↓
   ATTACK REQUEST
        ↓
      COMBAT
        ↓
HYDRA RULE ENGINE
        ↓
CUT RESULT / REGROWTH EVENTS
        ↓
GAME STATE
   ┌────┼────────────┬───────────┐
   ↓    ↓            ↓           ↓
ECONOMY PROGRESSION  UI          VIEW
   ↓        ↓                     ↓
CAPABILITY / UNLOCK            Babylon.js
```

View 永遠只讀取結果，不決定數學；Input 只描述玩家意圖，不直接修改遊戲狀態。Economy / Progression 只監聽語義事件，不得把周回與獎勵寫進 Combat。

## 2. 目標目錄

```text
hydra-clicker/
├── index.html
├── css/
│   └── style.css
├── docs/
│   ├── GAME_DESIGN.md
│   ├── ARCHITECTURE.md
│   ├── BLOCK_CONTRACTS.md
│   ├── EFFECT_MODIFIER_ARCHITECTURE.md
│   └── PLATFORM_CONTRACT.md
├── js/
│   ├── core/
│   │   ├── game.js
│   │   ├── clock.js
│   │   ├── event-bus.js
│   │   ├── state.js
│   │   └── save.js
│   │
│   ├── math/
│   │   ├── hydra-model.js
│   │   ├── hydra-rules.js
│   │   ├── cut-resolver.js
│   │   ├── big-count.js
│   │   └── compressed-tree.js
│   │
│   ├── input/
│   │   └── manual-attack.js
│   │
│   ├── systems/
│   │   ├── combat.js
│   │   ├── auto-slash.js
│   │   ├── hydra-regrowth.js
│   │   ├── modifiers.js
│   │   ├── np.js
│   │   ├── humanity-evil.js
│   │   ├── command-spells.js
│   │   ├── progression.js
│   │   ├── upgrades.js
│   │   └── farming.js
│   │
│   ├── view/
│   │   ├── battle-scene.js
│   │   ├── berserker-view.js
│   │   ├── hydra-view.js
│   │   ├── head-pool.js
│   │   ├── effects.js
│   │   ├── hud-view.js
│   │   ├── analyzer-view.js
│   │   └── tree-view.js
│   │
│   └── data/
│       ├── hydra-generations.js
│       ├── upgrades.js
│       ├── progression.js
│       └── text.js
│
└── assets/
    ├── models/
    ├── images/
    ├── audio/
    └── fonts/
```

目前舊的 `js/game.js`, `js/hydra.js`, `js/heracles.js` 仍保留供回溯；新的 Phase 3 runtime 已經由 `index.html` / `js/app.js` 使用。

## 3. 積木 A — Core

### `game.js`

唯一負責把積木接起來。

它可以：

- 初始化 state。
- 啟動 clock。
- 註冊 systems。
- 注入目前 Hydra rule。
- 注入 progression tuning data。
- 暴露 headless gameplay runtime 給 View 使用。
- 將 snapshot / runtime commands 提供給 application layer。

它不可以：

- 自己計算 Hydra 增殖。
- 自己算 NP。
- 自己發人類惡。
- 自己決定令咒資格。
- 直接生成 3D mesh。

目前已有：

```text
createCoreRuntime()
createHydraIGameRuntime()
```

Hydra I runtime 對外提供：

```text
snapshot()
manualAttack()
releaseNp()
commandSpellIStatus()
buyCommandSpellI()
```

UI 只呼叫這些 application-facing API，不拿 state reference 直接修改。

### `clock.js`

提供穩定的遊戲時間：

- simulation tick
- animation frame 分離
- offline progress（Block 9 之後再處理）

遊戲邏輯不能依賴實際 FPS。

單次實際 frame delta 有上限，避免頁籤背景化後突然一次補算過長的 frame；真正 offline progress 未來另外處理。

### `event-bus.js`

讓積木用語義事件溝通，例如：

```text
clock:tick
attack:requested
attack:resolved
head:cut
head:regrow
hydra:killed
hydra:respawned
np:charge
np:released
currency:gain
currency:spend
command-spell:available
command-spell:unlocked
hydra-generation:changed
```

事件 listener 收到統一 envelope：

```js
{
  type,
  payload
}
```

## 4. 積木 B — Math / Hydra

這是最需要保持純淨的區域。

### `hydra-model.js`

只處理 Hydra 邏輯 state transition helpers，例如：

```text
套用 cut result
加入 pending regrowth
取消 pending regrowth
處理到期 regrowth
累積純邏輯統計
```

它不知道 Combat、玩家輸入、周回獎勵或 Babylon.js。

### `hydra-rules.js`

不同 Hydra 世代只換 rule set。

概念：

```js
HydraRules.I
HydraRules.II
HydraRules.III
HydraRules.KIRBY_PARIS
```

同一個 Combat system 不應該用 generation `if` 判斷增殖公式，而是由 Core 注入 active rule。

Hydra I 已接受 generic rule context，例如：

```text
regrowthEnabled = false
```

這是 NP 等 Rule Modifier 的插頭，不包含 Fate 專名。

### `cut-resolver.js`

輸入：

```text
current hydra state
attack specification
target
turn / time
resolved rule context
```

輸出：

```text
accepted
removed heads
scheduled regrowth
spawned branches
materials produced
depleted / killed
cancelPendingRegrowth
next turn
```

### `big-count.js`

統一管理巨大離散數量表示。

第一版主要使用 `BigInt`。

所有其他積木都不應該自行把頭數無條件轉成 `Number`。

### `compressed-tree.js`

後期才實作。

把大量重複 branch 表示成：

```text
pattern A × N
```

而不是實際存 N 個節點。

## 5. 積木 C — Input

Input 回答：「玩家做了什麼？」而不是「結果應該是什麼？」

### `manual-attack.js`

目前手動點擊只產生標準 Attack Request：

```js
{
  source: 'manual',
  timestamp,
  strikeCount: 1,
  headsPerStrike,
  target
}
```

Input 不可以：

- `headCount -= 1`
- 直接呼叫 Hydra Rule
- 播放攻擊動畫
- 決定素材掉落

未來 UI、touch、keyboard、Tree Targeting 都應先轉成標準 request / command，再交給 Systems。

## 6. 積木 D — Systems

Systems 只負責「遊戲如何隨時間與事件運作」，不畫畫面。

### Combat

Combat 接收 `attack:requested`，逐次把 strike 交給目前注入的 Hydra Rule，再套用 Cut Result。

它發出：

```text
attack:resolved
head:cut
hydra:killed
```

但不知道：

```text
人類惡獎勵
下一隻 Hydra 何時出生
令咒是否解鎖
動畫怎麼播
```

### Auto Slash

只問：

```text
Auto Slash capability 是否存在？
Hydra encounter 是否可攻擊？
有效攻速是多少？
每刀幾顆？
```

它把時間累積轉成 Attack Request。

小數攻速使用 accumulator；已加入極小 epsilon 修正浮點邊界，因此：

```text
1 attack/sec × 1 simulated second
→ exactly 1 attack
```

高攻速時可以把同一 tick 的多刀包成一個 `strikeCount > 1` request；Combat 仍逐刀解算。

### Hydra Regrowth

監聽 `clock:tick`，處理已到期的 logical regrowth queue。

重要再生不使用散落的 gameplay `setTimeout()`。

若目前 Rule Modifier 關閉 regrowth，既有 pending events 暫停，不消失；真正 terminal kill 時由 Cut Result 決定清空。

### Modifiers

目前是最小 resolver，只解析 active timed rule modifiers。

Block 7 第一個正式實例：

```text
NP
→ rule-modifier
→ hydra.regrowth disabled
```

完整 Support / Facility / Research aggregator 仍延後到內容真的需要時再擴充。

### NP

- `head:cut` 充能。
- release 建立 encounter-scoped timed rule modifier。
- modifier duration 服從 Game Clock。
- NP 不直接修改 Hydra heads。

目前 prototype：

```text
+0.125 NP / head
8 heads → READY
window = 3.0 sec
```

### Humanity Evil

Master meta currency；玩家顯示文本為「人類惡」。

目前只監聽：

```text
hydra:killed
→ currency:gain
```

prototype reward 由 `data/progression.js` 提供：

```text
+11 人類惡 / Hydra I kill
```

System 不知道為什麼數值是 11，也不判斷令咒資格。

### Command Spells

每道令咒是功能權限，而不只是一次性 consumable。

目前 Command Spell I：

```text
requirements: 9 Hydra kills
cost: 99 人類惡
unlock: combat.autoSlash
```

System 只：

- 檢查 logical requirements / currency。
- 扣款。
- 寫入 capability state。
- 發出 `currency:spend` / `command-spell:unlocked`。

它不直接呼叫 Auto Slash。

### Progression / Encounter Loop

Block 8 目前只負責 Hydra I 周回：

```text
hydra:killed
↓
defeated = true
↓
1.2 s Game Clock delay
↓
clean Hydra I encounter respawn
```

重生時：

- heads 回到 `startingHeadCount`。
- turn 歸零。
- pending regrowth 清空。
- encounter counter +1。
- encounter-scoped modifiers 清除。

這不是 Hydra Math 的「再生」，而是新的敵方 encounter。

Hydra I → II、Farm Reveal、Analyzer / Tree milestones 仍屬未來 progression，不在 Block 8 偷做。

### Farming

在 Hydra III 前可以不存在或隱藏。

當 reveal 發生後，才把「斬首產物」正式作為經濟資源呈現給玩家。

## 7. 積木 E — View / Babylon.js

View 只有投影責任。

### `battle-scene.js`

- Babylon engine / scene
- camera
- lights
- background
- stage anchors

### `berserker-view.js`

輸入：

```text
idle
attack
np（未來演出）
attackSpeed
```

輸出只有動畫。

### `hydra-view.js`

輸入 logical snapshot，投影到最多 99 顆可見 heads。

它不能用「畫面上有幾顆 mesh」反推真正 headCount。

### `head-pool.js`

固定建立少量 head meshes，重複使用，避免增殖時一直 new / dispose。

目標硬上限：

```text
MAX_VISIBLE_HEADS = 99
```

### `hud-view.js`

只顯示 application 提供的 projection：

```text
HEADS
CUTS
NP
AUTO
KILLS
人類惡
Command Spell I status
```

HUD 不計算令咒 requirement；它吃 `commandSpellIStatus()` 的結果。

### `analyzer-view.js`

只顯示 analyzer model 給它的數據。

### `tree-view.js`

後期加入；初期可完全不存在。

## 8. 積木 F — Data

所有容易被調整或換皮的內容都放 data。

`data/progression.js` 目前包含 Hydra I prototype tuning：

```text
humanityEvilPerKill = 11
respawnDelayMs = 1200
Command Spell I requiredHydraKills = 9
Command Spell I cost = 99 人類惡
Command Spell I unlock = combat.autoSlash
```

`11 × 9 = 99` 是目前方便測完整周回的 prototype tuning，不是架構常數。

未來也應放 Data：

- Hydra I 再生時間曲線
- milestone 3 / 9 / 99
- 升級成本
- 人類惡顯示名稱
- Master / Servant 顯示名稱
- Command Spell 台詞
- Fate 梗文字

規則層不要寫：

```js
if (master === 'Gudako')
```

而應寫能力／狀態：

```js
if (state.master.commandSpells.autoSlash)
```

之後 Modifier layer 成熟後，再把這類能力解析集中到 capability aggregator。

## 9. 依賴方向

允許：

```text
data → 無依賴
math → data / plain logical context
input → injected state snapshot + event interface
systems → math + data + injected core interfaces
core/application → systems + math + input + data composition
view/audio → snapshot + semantic events + application projections + data
save → serializable logical state
```

禁止：

```text
math → Babylon.js
math → DOM
input → 直接改 Hydra state
systems → Babylon.js mesh
view → 修改 Hydra rule
command spell → 直接呼叫 Auto Slash internals
combat → 發人類惡 / respawn Hydra
```

Input / Systems 不需要直接 import Core 實作；由 `game.js` composition 時注入 `state` / `events` 等 interface，降低循環依賴。

## 10. Snapshot 原則

每次 view 更新只拿一份不可從外部改壞 store 的 snapshot：

```js
{
  time,
  hydra: {
    generation,
    encounter,
    logicalHeadCount,
    startingHeadCount,
    pendingRegrowth,
    turn,
    defeated,
    respawnAtMs
  },
  berserker: {
    baseAttacksPerSecond,
    headsPerStrike,
    rage,
    np
  },
  master: {
    humanityEvil,
    commandSpells
  },
  progression,
  statistics,
  modifiers
}
```

View 不拿可修改的原始 state reference。

UI formatter 要處理 BigInt 顯示；Block 9 Save 會另外處理 BigInt serialization。

## 11. 第三階段實作順序

```text
Block 1  Core clock + state                              ✅
↓
Block 2  Hydra I pure logic                              ✅
↓
Block 3  Combat / Auto Slash                             ✅
↓
Block 4  Babylon battle stage                            ✅
↓
Block 5  9-head Hydra visual pool                        ✅
↓
Block 6  Placeholder Berserker animation                 ✅
↓
Block 7  NP / regen stop window                          ✅
↓
Block 8  Humanity Evil / 人類惡 + Command Spell I       ✅
↓
Block 9  Save                                            ← NEXT
```

Hydra II 暫時不准進場。Block 9 完成後先做第一次完整人工試玩 / Grill，再決定 Hydra I 的節奏、數值與下一個 generation。
