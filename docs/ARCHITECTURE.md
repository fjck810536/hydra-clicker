# Hydra Clicker — Architecture v0.2

> 目標：每一塊都可以單獨測試、替換、重寫，不讓「數學規則」「遊戲經濟」「Babylon.js 畫面」互相糾纏。

## 1. 頂層資料流

```text
INPUT / AUTO SYSTEMS
        ↓
COMBAT INTENT
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

View 永遠只讀取結果，不決定數學。

## 2. 目標目錄

```text
hydra-clicker/
├── index.html
├── css/
│   └── style.css
├── docs/
│   ├── GAME_DESIGN.md
│   ├── ARCHITECTURE.md
│   └── BLOCK_CONTRACTS.md
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
│   ├── systems/
│   │   ├── combat.js
│   │   ├── auto-slash.js
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

目前舊的 `js/game.js`, `js/hydra.js`, `js/heracles.js` 可以保留到第三階段再遷移，不急著為了目錄漂亮而重寫。

## 3. 積木 A — Core

### `game.js`

唯一負責把積木接起來。

它可以：

- 初始化 state。
- 啟動 clock。
- 註冊 systems。
- 將 snapshot 推送給 view。

它不可以：

- 自己計算 Hydra 增殖。
- 自己算 NP。
- 直接生成 3D mesh。

### `clock.js`

提供穩定的遊戲時間：

- simulation tick
- animation frame
- offline progress（未來）

遊戲邏輯不能依賴實際 FPS。

### `event-bus.js`

讓積木用事件溝通，例如：

```text
attack:requested
head:cut
head:regrow
hydra:killed
np:ready
np:released
command-spell:unlocked
hydra-generation:changed
```

## 4. 積木 B — Math / Hydra

這是最需要保持純淨的區域。

### `hydra-model.js`

只保存 Hydra 的邏輯狀態，例如：

```text
generation
headCount
root/tree structure
pendingRegrowth
turn
```

### `hydra-rules.js`

不同 Hydra 世代只換 rule set。

概念：

```js
HydraRules.I
HydraRules.II
HydraRules.III
HydraRules.KIRBY_PARIS
```

同一個 combat system 不應該知道現在是哪種增殖公式。

### `cut-resolver.js`

輸入：

```text
current hydra state
attack specification
target
```

輸出：

```text
removed heads
scheduled regrowth
spawned branches
materials produced
next hydra state
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

## 5. 積木 C — Systems

Systems 只負責「遊戲規則」，不畫畫面。

### Combat

把玩家點擊或 Auto Slash 轉成 attack intent。

### Auto Slash

只問：

```text
現在是否解鎖？
每秒幾次？
```

它不能直接呼叫 Babylon animation。

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

Master meta currency。

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

## 6. 積木 D — View / Babylon.js

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

## 7. 積木 E — Data

所有容易被調整或換皮的內容都放 data：

- Hydra I 再生時間曲線
- milestone 3 / 9 / 99
- 升級成本
- Humanity Evil 名稱
- Master / Servant 顯示名稱
- Command Spell 台詞
- Fate 梗文字

規則層不要寫：

```js
if (master === 'Gudako')
```

而應寫：

```js
if (state.commandSpells.autoSlashUnlocked)
```

這樣未來要從 fan game 換成原創作品，不需要拆整個程式。

## 8. 依賴方向

允許：

```text
data → 無依賴
math → data
systems → math + data
core → systems + math
view → core snapshot + data
```

禁止：

```text
math → Babylon.js
math → DOM
systems → Babylon.js mesh
view → 修改 Hydra rule
```

## 9. Snapshot 原則

每次 view 更新只拿一份可序列化 snapshot：

```js
{
  time,
  hydra: {
    generation,
    headCount,
    visibleHeadCount,
    regenRate,
    netGrowth
  },
  berserker: {
    attacksPerSecond,
    headsPerStrike,
    rage,
    np
  },
  master: {
    humanityEvil,
    commandSpells
  },
  progression: {
    kills,
    analyzerLevel,
    treeViewUnlocked
  }
}
```

View 不拿可修改的原始 state reference。

## 10. 第三階段實作順序

```text
Block 1  Core clock + state
↓
Block 2  Hydra I pure logic
↓
Block 3  Combat / Auto Slash
↓
Block 4  Babylon battle stage
↓
Block 5  9-head Hydra visual pool
↓
Block 6  Placeholder Berserker animation
↓
Block 7  NP / regen stop window
↓
Block 8  Humanity Evil + Command Spell I
↓
Block 9  Save
```

Hydra II 暫時不准進場，直到 Block 1–9 可以完整玩一輪 Hydra I。
