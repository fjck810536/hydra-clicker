# Hydra Clicker — Architecture v0.3

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
   ┌────┼────┐
   ↓    ↓    ↓
ECONOMY UI  VIEW
             ↓
         Babylon.js
```

View 永遠只讀取結果，不決定數學；Input 只描述玩家意圖，不直接修改遊戲狀態。

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
│   └── EFFECT_MODIFIER_ARCHITECTURE.md
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
│   │   ├── rage.js
│   │   ├── np.js
│   │   ├── command-spells.js
│   │   ├── humanity-evil.js
│   │   ├── upgrades.js
│   │   ├── progression.js
│   │   └── farming.js
│   │
│   ├── view/
│   │   ├── battle-scene.js
│   │   ├── berserker-view.js
│   │   ├── hydra-view.js
│   │   ├── head-pool.js
│   │   ├── effects.js
│   │   ├── ui-view.js
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

目前舊的 `js/game.js`, `js/hydra.js`, `js/heracles.js` 繼續與新架構並行；對應積木有測試後再逐步替換，不為了目錄漂亮先重寫。

## 3. 積木 A — Core

### `game.js`

唯一負責把積木接起來。

它可以：

- 初始化 state。
- 啟動 clock。
- 註冊 systems。
- 注入目前 Hydra rule。
- 暴露 headless gameplay runtime 給 View 使用。
- 將 snapshot 推送給 view。

它不可以：

- 自己計算 Hydra 增殖。
- 自己算 NP。
- 直接生成 3D mesh。

目前已有：

```text
createCoreRuntime()
createHydraIGameRuntime()
```

第二個是 Hydra I 的 headless 組合插座；Babylon.js 之後只接它的 snapshot / semantic events / input API。

### `clock.js`

提供穩定的遊戲時間：

- simulation tick
- animation frame
- offline progress（未來）

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
np:ready
np:released
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
處理到期 regrowth
```

它不知道 Combat、玩家輸入或 Babylon.js。

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

### `cut-resolver.js`

輸入：

```text
current hydra state
attack specification
target
turn / time
```

輸出：

```text
accepted
removed heads
scheduled regrowth
spawned branches
materials produced
depleted / killed
next turn
```

### `big-count.js`

統一管理頭數表示。

第一版可以使用 `BigInt`。

所有其他積木都不應該自行把頭數轉成 `Number`。

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

未來 UI、touch、keyboard、Tree Targeting 都應該先轉成標準 request / command，再交給 Systems。

## 6. 積木 D — Systems

Systems 只負責「遊戲如何隨時間與事件運作」，不畫畫面。

### Combat

Combat 接收 `attack:requested`，逐次把 strike 交給目前注入的 Hydra Rule，再套用 Cut Result。

它發出語義事件：

```text
attack:resolved
head:cut
```

但不播放動畫。

### Auto Slash

只問：

```text
現在是否解鎖？
有效攻速是多少？
每刀幾顆？
```

它把時間累積轉成 Attack Request。

小數攻速使用 accumulator，例如：

```text
2.5 attacks/sec
→ 長時間仍精確產生平均 2.5 attacks/sec
```

高攻速時可以把同一 tick 的多刀包成一個 `strikeCount > 1` request；Combat 仍逐刀解算，避免不同 Hydra 規則被粗暴合併。

### Hydra Regrowth

監聽 `clock:tick`，處理已到期的 logical regrowth queue。

重要再生不使用散落的 gameplay `setTimeout()`。

### Rage / NP

兩者分離：

- Rage：戰鬥效率／攻擊狀態。
- NP：可解放的特殊能力資源。

### Command Spells

每道令咒是功能權限，而不只是一次性 consumable：

```text
I   unlock Auto Slash
II  unlock Auto NP
III reserve Tree Targeting
```

### Humanity Evil

Master meta currency；玩家顯示文本為「人類惡」。

只處理：

- gain source
- current amount
- spending
- unlock requirement

### Progression

決定何時：

- Hydra I → II
- 第二令咒可購買
- Farm Reveal
- Analyzer 升級
- Tree View 解鎖

不要把 milestone 寫死在 UI。

### Farming

在 Hydra III 前可以存在但不顯示。

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
np
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

### `analyzer-view.js`

只顯示 analyzer model 給它的數據。

### `tree-view.js`

後期加入；初期可完全不存在。

## 8. 積木 F — Data

所有容易被調整或換皮的內容都放 data：

- Hydra I 再生時間曲線
- milestone 3 / 9 / 99
- 升級成本
- Humanity Evil / 人類惡顯示名稱
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
math → data
input → injected state snapshot + event interface
systems → math + data + injected core interfaces
core/application → systems + math + input
view/audio → snapshot + semantic events + data
```

禁止：

```text
math → Babylon.js
math → DOM
input → 直接改 Hydra state
systems → Babylon.js mesh
view → 修改 Hydra rule
```

Input / Systems 不需要直接 import Core 實作；由 `game.js` composition 時注入 `state` / `events` 等 interface，降低循環依賴。

## 10. Snapshot 原則

每次 view 更新只拿一份不可從外部改壞 store 的 snapshot：

```js
{
  time,
  hydra: {
    generation,
    logicalHeadCount,
    pendingRegrowth,
    turn
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

真正 UI formatter 之後要處理 BigInt 顯示與 JSON serialization。

## 11. 第三階段實作順序

```text
Block 1  Core clock + state                 ✅
↓
Block 2  Hydra I pure logic                 ✅
↓
Block 3  Combat / Auto Slash                ✅
↓
Block 4  Babylon battle stage
↓
Block 5  9-head Hydra visual pool
↓
Block 6  Placeholder Berserker animation
↓
Block 7  NP / regen stop window
↓
Block 8  Humanity Evil / 人類惡 + Command Spell I
↓
Block 9  Save
```

Hydra II 暫時不准進場，直到 Block 1–9 可以完整玩一輪 Hydra I。
