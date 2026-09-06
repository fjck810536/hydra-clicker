# Hydra Clicker — Block Contracts v0.4

> 這份文件不是最終 API，而是積木之間的插頭規格。第三階段寫程式時，函式名稱可以變，但資料責任不要混掉。

## 1. Attack Request

來源：

- 玩家點擊
- Auto Slash
- 特殊技能
- Tree Targeting（未來）

建議形狀：

```js
{
  source: 'manual' | 'auto' | 'np' | 'tree-command',
  timestamp,
  strikeCount: 1,
  headsPerStrike: 1n,
  target: null
}
```

規則：

- Attack Request 只描述「想砍」。
- 它不能自己移除 head。
- 它不能播放 animation。

## 2. Cut Resolution

由 Hydra Math 接收 attack request 後產生。

```js
{
  accepted: true,
  cutsAttempted: 1,
  headsRemoved: 1n,
  headsSpawned: 0n,
  materialsProduced: 0n,
  depleted: false,
  killed: false,
  cancelPendingRegrowth: false,
  regrowth: [
    {
      executeAt: 1500,
      amount: 1n,
      ruleId: 'regen-same-head'
    }
  ],
  effects: ['slash-hit']
}
```

注意：

- 頭數用整數型別；範例使用 `BigInt`。
- `effects` 只是語義事件，不是 Babylon particle object。
- `depleted` 表示「這一刀之後當下頭數為 0」。
- `killed` 只表示「已確認真正討伐完成，不會再由既有規則／排程復原」。
- Hydra I 若頭數暫時歸零但仍有 regrowth，應為 `depleted: true, killed: false`。
- `cancelPendingRegrowth` 只有 Rule 確認既有再生排程已失效時才可要求；NP system 本身不能直接清 Hydra queue。

## 3. Hydra Rule Interface

所有 Hydra 世代共用概念介面：

```js
rule.resolveCut({
  hydraState,
  attack,
  turn,
  nowMs,
  ruleContext
})
```

`ruleContext` 是已經由 Modifier resolver 整理過的規則上下文，例如：

```js
{
  regrowthEnabled: false
}
```

Hydra Rule 不需要知道這個效果來自 NP、英靈、科技或其他 source。

Hydra I：

```text
regrowthEnabled = true
→ remove 1
→ schedule regrow 1

regrowthEnabled = false
→ remove 1
→ no new regrowth
→ reaching 0 can become a true kill
```

Hydra II：

```text
remove 1
spawn 2
```

未來結構型 Hydra：

```text
remove leaf
inspect depth / parent / turn
copy branch or subtree
```

Combat 不得用 `if generation === 2` 自己判斷增殖。

## 4. Regrowth Event

再生必須是事件／排程，而不是 setTimeout 散落各處。

```js
{
  id,
  executeAt,
  type: 'hydra-regrow',
  amount: 1n,
  payload: {
    branchId: null,
    ruleId: 'regen-same-head'
  }
}
```

Core clock 統一處理到期事件。

好處：

- 可以暫停。
- 可以存檔。
- 可以做 offline progress。
- Rule Modifier 可以暫時阻止 queue 被執行。

## 5. NP Activation / Rule Modifier

NP system 不直接改 Hydra model，也不自己刪除 pending regrowth。

Block 7 的最小實作：

```js
{
  id: 'np-regeneration-window-0',
  type: 'rule-modifier',
  target: 'hydra.regrowth',
  effect: 'disable',
  startsAt,
  endsAt,
  source: 'np'
}
```

Modifier resolver 把它整理成 Hydra Rule 看得懂的 context：

```js
{
  regrowthEnabled: false
}
```

Hydra I 在 NP window 中的規則：

```text
既有 pending regrowth
→ window 內暫停處理

window 內的新 cut
→ 不建立 regrowth event

window 內 heads → 0
→ killed = true
→ Cut Resolution 要求 cancelPendingRegrowth
```

因此 NP 改的是「規則條件」，不是直接 `headCount = 0` 或 `pendingRegrowth = []`。

之後若要把 NP 改成「root priority」等更數學化效果，只換 rule modifier／policy，不用改動畫或 UI。

## 6. Auto Slash Contract

Auto Slash 每個 simulation tick 只計算應產生多少 attack request。

```js
{
  enabled: true,
  attacksPerSecond: 4.5,
  accumulator: 0.37
}
```

它不可以：

- 直接 `hydra.headCount -= 1`
- 直接播放 Berserker animation
- 自己決定 Hydra 是否再生

## 7. Economy Event

任何素材／人類惡的獲得都由語義事件記錄：

```js
{
  type: 'currency:gain',
  currency: 'humanity-evil',
  amount: 3n,
  reason: 'hydra-kill'
}
```

或：

```js
{
  type: 'currency:gain',
  currency: 'humanity-evil',
  amount: 1n,
  reason: 'np-release'
}
```

這樣之後改梗名不影響系統。

## 8. Upgrade Definition

升級放 data，不散落在 button handler：

```js
{
  id: 'attack-speed-01',
  category: 'berserker',
  cost: {
    currency: 'material-a',
    amount: 10n
  },
  effect: {
    stat: 'attacksPerSecond',
    operation: 'multiply',
    value: 1.25
  },
  requirements: []
}
```

真正「頭數」仍不能因為 multiplier 使用浮點數。

攻速、時間、倍率可以使用 Number；離散數量用整數層。

## 9. Command Spell Definition

令咒不是寫死的一次性按鈕，而是 unlock：

```js
{
  id: 'command-spell-1',
  cost: {
    currency: 'humanity-evil',
    amount: 99n
  },
  unlocks: ['auto-slash'],
  requirements: [
    { type: 'hydra-kills', value: 9 }
  ]
}
```

第二令咒：

```js
{
  id: 'command-spell-2',
  unlocks: ['auto-np'],
  requirements: [
    { type: 'hydra-generation', value: 2 }
  ]
}
```

第三令咒先保留：

```text
TREE TARGETING ?
```

## 10. Progression Event

Hydra 世代切換由 progression system 發出：

```js
{
  type: 'hydra-generation:unlock',
  from: 1,
  to: 2,
  reason: 'milestone'
}
```

切換後：

- 自動化保留。
- 已購 upgrade 保留，除非未來明確加入真正 prestige。
- Hydra state 依新 generation 初始化。

## 11. Logical Snapshot vs Render Projection

Core snapshot 保存的是邏輯資料，不必保存 Babylon 專用的可見 mesh 數量：

```js
{
  hydra: {
    logicalHeadCount: 18472n,
    generation: 3,
    pendingRegrowth: [],
    turn: 950n
  },
  berserker: {
    baseAttacksPerSecond: 8.0,
    headsPerStrike: 1n,
    rage: 0.4,
    np: 0.82
  },
  master: {
    humanityEvil: 666n,
    commandSpells: {
      autoSlash: true,
      autoNp: false
    }
  },
  modifiers: {
    active: []
  }
}
```

View 再從 snapshot 派生自己的 projection：

```js
{
  logicalHeadCount: 18472n,
  visibleHeadCount: 99
}
```

注意：snapshot 若直接送 UI，需要一層 formatter 處理 BigInt，避免 JSON serialization 問題。

## 12. Visible Head Projection / Head Pool

目前正式規則：

```text
logical 0–99  → visible 同數量
logical 100+  → visible 99
```

實作責任：

```text
logical snapshot
      ↓
computeVisibleHeadCount()
      ↓
Hydra Head Pool
      ↓
Babylon meshes
```

Block 5 的池規則：

```text
initial pool size = 9
hard visible cap  = 99
```

Hydra I 初始只建立 9 個 head slots，斬首時停用 slot，再生時重新啟用 slot；不應每一刀都 new/dispose mesh。

未來 logical count 超過既有 pool size 時，View 可以按需擴張 slots，但最多到 99。

重要禁止：

- 不可以把 `mesh count` 寫回 logical state。
- 不可以因為只有 99 個 mesh 就把真實頭數截成 99。
- 不可以把巨大 `BigInt` 先無條件轉成 `Number` 再比較；應先用 BigInt 與 99n 比較。
- View 不決定哪一刀是否有效，也不決定 Hydra 是否再生。

未來可以讓 99 顆 mesh 的姿勢、密度、尺度、shader 或 aggregate effects 表現更大的 logical count，但那只是視覺語言。

## 13. Analyzer Contract

Analyzer 不修改遊戲，只讀取 state / rule metadata：

```js
analyzer.inspect(snapshot, activeRule)
```

輸出：

```js
{
  level: 1,
  metrics: [
    ['Heads', '18472'],
    ['Cuts/sec', '950'],
    ['Regrowth/sec', '812.4'],
    ['Net Growth', '-137.6/sec']
  ],
  ruleSummary: 'CUT 1 → SPAWN 2'
}
```

高階 Tree / ordinal 分析可以另外換 analyzer backend。

## 14. Save Contract

Save 只保存邏輯狀態：

```text
currencies
upgrades
command spell unlocks
hydra generation
logical Hydra state
pending timed events
active timed modifiers
progression milestones
lastSavedAt
```

不保存：

```text
mesh
particle
DOM element
animation object
Babylon scene
visibleHeadCount cache
head pool slots
```

## 15. 最重要的測試邊界

第三階段每做完一塊，至少能回答：

### Hydra I Math Test

```text
9 heads
cut 1
immediately = 8
regen deadline reached = 9
```

### Auto Slash Test

```text
Auto Slash ON
simulation 跑 10 秒
attack request 數量符合攻速
```

### NP Test

```text
8 accepted head cuts
→ NP = 100%

release NP
→ timed hydra.regrowth disable modifier

existing pending regrowth
→ paused during window

cut final head during window
→ no new regrowth
→ pending queue cleared by Cut Resolution
→ killed = true
```

### Render Limit Test

```text
logical = 1000000000000 heads
visible = 99
browser 不生成一兆 mesh
```

只要 Math / Systems 的核心規則與 View projection 可以在沒有 Babylon runtime 的 Node 測試中分別驗證，積木分離就算成功。
