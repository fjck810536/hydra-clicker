# Hydra Clicker — Block Contracts v0.2

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
  headsPerStrike: 1,
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
  killed: false,
  regrowth: [
    {
      delayMs: 1500,
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

## 3. Hydra Rule Interface

所有 Hydra 世代共用概念介面：

```js
rule.resolveCut({
  hydraState,
  attack,
  turn,
  now
})
```

Hydra I：

```text
remove 1
schedule regrow 1
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
- NP 可以統一修改／取消再生事件。

## 5. NP Activation

NP system 不直接改 Hydra model。

它產生 buff / rule modifier：

```js
{
  id: 'np-regeneration-window',
  startsAt,
  endsAt,
  modifiers: {
    regrowthEnabled: false
  }
}
```

之後若要把 NP 改成「root priority」等更數學化效果，只換 modifier：

```js
{
  targetingMode: 'root-priority'
}
```

不用改動畫或 UI。

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

## 11. Render Snapshot

Renderer 每幀只讀 snapshot：

```js
{
  hydra: {
    logicalHeadCount: 18472n,
    visibleHeadCount: 99,
    generation: 3,
    regenPerSecond: 812.4,
    cutsPerSecond: 950.0
  },
  berserker: {
    state: 'attack',
    attackSpeed: 8.0,
    rage: 0.4,
    np: 0.82
  },
  master: {
    humanityEvil: 666n,
    autoSlash: true,
    autoNp: false
  }
}
```

注意：snapshot 若直接送 UI，需要一層 formatter 處理 BigInt，避免 JSON serialization 問題。

## 12. Visible Head Projection

View 用一個純函式決定要畫幾顆：

```js
visibleHeads = projectVisibleHeads(logicalHeadCount)
```

基本規則：

```text
0–99  → 同數量
100+  → 99
```

未來可以讓 99 顆 mesh 的姿勢、密度、尺度表現更大的 headCount，但永遠不能反過來把 mesh count 當遊戲真實資料。

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
NP modifier active
cut head
regrowth event 不產生或被正確修改
```

### Render Limit Test

```text
logical = 1000000000000 heads
visible = 99
browser 不生成一兆 mesh
```

只要這些測試能在沒有 Babylon.js 的環境下成立，積木分離就算成功。
