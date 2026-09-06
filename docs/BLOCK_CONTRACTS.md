# Hydra Clicker — Block Contracts v0.7

> 這份文件不是最終 API，而是積木之間的插頭規格。函式名稱可以變，但資料責任不要混掉。v0.7 加入 Playtest 2.1 的再生曲線、NP 視覺提示與測試工具。

## 1. Attack Request

來源：玩家點擊、Auto Slash、特殊技能、未來 Tree Targeting。

```js
{
  source: 'manual' | 'auto' | 'np' | 'tree-command',
  timestamp,
  strikeCount: 1,
  headsPerStrike: 1n,
  target: null
}
```

- Attack Request 只描述「想砍」。
- 不能自己移除 head。
- 不能播放 animation。

## 2. Cut Resolution

Hydra Math 接收 attack request 後產生：

```js
{
  accepted: true,
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

- 頭數等離散值使用 `BigInt`。
- `effects` 是語義，不是 Babylon object。
- `depleted` = 當下 heads 為 0。
- `killed` = 目前 active rule 判斷為 terminal death。
- `depleted` 與 `killed` 仍是不同概念；後續 Hydra 世代可能再次分離。
- **Playtest 2 的 Hydra I 暫時規定：reaching 0 heads → `depleted: true, killed: true`。**
- Hydra I terminal cut 要求 `cancelPendingRegrowth: true`，所以先前排隊的同頭再生全部失效。

## 3. Hydra Rule Interface

```js
rule.resolveCut({
  hydraState,
  attack,
  turn,
  nowMs,
  ruleContext
})
```

Playtest 2.1 的 `ruleContext` 可以同時包含 Core/Data 注入的 base rule context 與 Modifier resolver 產生的 temporary context：

```js
{
  regrowthDelayMs: 750,
  regrowthEnabled: false
}
```

來源責任：

```text
Data / progression curve
→ Core composition
→ getRuleContext(snapshot)
→ regrowthDelayMs

active rule modifiers
→ Modifier resolver
→ regrowthEnabled
```

Combat 只把兩者合併後交給 Rule；它不計算曲線。

Hydra Rule 只知道「這一刀的有效再生延遲是多少」和「再生目前能不能發生」，不知道：

- 目前是第幾殺。
- 曲線公式長什麼樣。
- `regrowthEnabled = false` 是 NP、英靈、科技還是設施造成。

### Hydra I — Playtest 2.1

```text
remaining heads > 0
+ regrowthEnabled = true
→ remove head(s)
→ schedule same-head regrowth at now + regrowthDelayMs

remaining heads > 0
+ regrowthEnabled = false
→ remove head(s)
→ no new regrowth

remaining heads = 0
→ killed = true
→ no new regrowth
→ cancel all pending regrowth
```

NP 因此不負責「賦予斬殺資格」；它只讓玩家更容易在時間窗口內跑贏再生。

Hydra II / 後期結構型 Hydra 仍由其他 rule set 實作；Combat 不得寫 generation 專用分支。

## 4. Regrowth Event

再生是 Game Clock 排程：

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

不可把重要 gameplay delay 散成 `setTimeout()`。

Hydra I terminal kill 會透過 Cut Resolution 取消 pending regrowth；不是 NP system 直接清 queue。

## 5. NP Activation / Rule Modifier

Playtest 2 的 NP modifier：

```js
{
  id: 'np-regeneration-window-0',
  type: 'rule-modifier',
  target: 'hydra.regrowth',
  effect: 'disable',
  startsAt,
  endsAt,
  source: 'np',
  scope: 'timed'
}
```

Modifier resolver 輸出：

```js
{
  regrowthEnabled: false
}
```

NP window：

```text
既有 pending regrowth → window 內暫停
新 cut → 不建立 regrowth
Hydra A killed → encounter 可 respawn
if now < endsAt → NP effect 仍有效
Hydra B / C / ... → 同一 window 可繼續收割
```

`scope: 'timed'` 表示生命週期只由 `startsAt / endsAt` + Game Clock 決定；Progression 不因 encounter change 清除它，也不延長它。

Playtest 2.1 的紅色背景只是 View projection：

```text
logical active NP modifier
→ App projection
→ stage.setNpActive(true)
→ Babylon backdrop / ground / clear color 暗紅
```

View 不得因此修改 modifier 或延長 NP。

## 6. Auto Slash Contract

Auto Slash 只由 capability + clock 產生 Attack Request。

```js
{
  enabled: true,
  attacksPerSecond: 4.5,
  accumulator: 0.37
}
```

它不可以：

- 改 headCount。
- 播 Berserker animation。
- 決定 Hydra regrowth。
- 被 Command Spell system 直接呼叫。

目前 capability source：

```text
master.commandSpells.autoSlash
```

Hydra defeated / 0 heads 時 Auto Slash 暫停並清 accumulator。

高攻速 batch 中，一旦某 strike 產生 `killed: true`，Combat 立刻停止該 batch；不為已死亡 Hydra 製造多餘 rejected cuts。

浮點 accumulator 使用極小 epsilon 防止：

```text
0.1 × 10 = 0.999999999...
```

造成 1 attack/sec 在完整 1 秒不出刀。

## 7. Economy Event

貨幣以語義事件記錄。

目前：

```js
{
  type: 'currency:gain',
  currency: 'humanity-evil',
  amount: 11n,
  reason: 'hydra-kill',
  balance
}
```

花費：

```js
{
  type: 'currency:spend',
  currency: 'humanity-evil',
  amount: 99n,
  reason: 'command-spell-1',
  balance
}
```

注意：`11` / `99` 來自 Data tuning，不是 economy system 常數。

## 8. Hydra Encounter / Respawn Contract

`hydra:killed` 是討伐事件，不等於同一顆頭的 regrowth。

Playtest 2 的 Hydra I encounter lifecycle：

```text
active
↓ true kill
defeated = true
logicalHeadCount = 0
respawnAtMs = kill time + 300
↓ Game Clock
new encounter
```

新 encounter state：

```js
{
  logicalHeadCount: startingHeadCount,
  turn: 0n,
  pendingRegrowth: [],
  defeated: false,
  respawnAtMs: null,
  encounter: previousEncounter + 1n
}
```

Progression system 仍會清除 `scope: 'encounter'` 的 modifier；**它不清 `scope: 'timed'` NP window**。

Progression system 發：

```text
hydra:respawned
```

Combat / Hydra Math 不負責生下一隻敵人。

目前只用單一 `respawnDelayMs = 300`，尚未建立「NP active 時特別 100ms」的 progression modifier。

## 9. Command Spell Definition / Capability

目前 data definition：

```js
{
  id: 'command-spell-1',
  requiredHydraKills: 9n,
  cost: {
    currency: 'humanity-evil',
    amount: 99n
  },
  unlocks: ['combat.autoSlash']
}
```

狀態投影：

```js
{
  purchased,
  killsMet,
  canAfford,
  available,
  requiredHydraKills,
  cost,
  balance,
  kills
}
```

購買成功：

```text
人類惡 -99
↓
master.commandSpells.autoSlash = true
↓
currency:spend
command-spell:unlocked
```

令咒 system 只寫 capability state；它不直接觸發 Auto Slash request。

第二／第三令咒仍只是設計候選。

## 10. Upgrade Definition

普通升級仍放 data：

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

倍率可用 Number；真正 head/material/currency 數量仍是整數層。

## 11. Progression Data Contract

Playtest 2.1 prototype tuning 集中於 `js/data/progression.js`：

```text
humanityEvilPerKill = 11n
respawnDelayMs = 300
requiredHydraKills = 9n
commandSpellICost = 99n

regenCurve.baseDelayMs = 1500
regenCurve.killsScale = 30
regenCurve.minDelayMs = 350
```

再生曲線：

```text
delay(kills)
= max(minDelayMs,
      round(baseDelayMs / (1 + kills / killsScale)))
```

目前代表值：

```text
0 kills   → 1500 ms
9 kills   → 1154 ms
30 kills  → 750 ms
99 kills  → 350 ms floor
```

這是測試手感用的平滑加速曲線，不是最終平衡。

目前仍故意形成：

```text
9 kills × 11 = 99 人類惡
```

Hydra I → II、99 kills 是否主線、Farm Reveal 等仍未定案。

## 12. Logical Snapshot vs Render Projection

Core snapshot 保存 logical state；View 再派生 `visibleHeadCount`。

```js
{
  hydra: {
    generation: 1,
    encounter: 4n,
    logicalHeadCount: 9n,
    startingHeadCount: 9n,
    pendingRegrowth: [],
    turn: 0n,
    defeated: false,
    respawnAtMs: null
  },
  berserker: {
    baseAttacksPerSecond: 1,
    headsPerStrike: 1n,
    rage: 0,
    np: 0.25
  },
  master: {
    humanityEvil: 33n,
    commandSpells: {
      autoSlash: false,
      autoNp: false
    }
  },
  statistics: {
    totalHydrasKilled: 3n
  },
  modifiers: {
    active: []
  }
}
```

BigInt UI formatting 與 Save serialization 是不同責任。

## 13. Visible Head Projection / Head Pool

```text
logical 0–99  → visible 同數量
logical 100+  → visible 99
```

```text
logical snapshot
      ↓
computeVisibleHeadCount()
      ↓
Hydra Head Pool
      ↓
Babylon meshes
```

目前：

```text
initial pool size = 9
hard visible cap  = 99
```

Playtest 2 只改 View silhouette：大型 torso / haunch / tail 移除，保留小 root base；九個初始 head slot 越高越向左右展開。

禁止：

- mesh count 寫回 logical state。
- 真實頭數因 visual cap 被截成 99。
- 巨大 BigInt 無條件先轉 Number。
- View 決定攻擊、再生、討伐或周回。

## 14. Analyzer Contract

Analyzer 只讀：

```js
analyzer.inspect(snapshot, activeRule)
```

未來輸出例如：

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

## 15. Save Contract

Save 只保存 logical state / persistence metadata。

需要保存：

```text
currencies
command spell capability unlocks
hydra generation / encounter logical state
pending timed regrowth
defeated / respawnAtMs
active timed modifiers
progression milestones
statistics
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

`scope: timed` NP modifier 必須和其他 active modifier 一樣保存；載入後依同一條 simulation timeline 繼續，不使用 wall-clock 補算 offline progress。

## 16. Playtest Test Tools Contract

Playtest 2.1 開始保留一個小型 `TEST` panel。

目前只提供：

```text
current REGEN delay readout
RESET SAVE
```

規則：

- Regen readout 只呼叫 application-facing `currentRegenDelayMs()`。
- `RESET SAVE` 只清 persistence adapter，不直接把 state 欄位歸零。
- reset reload 前必須暫停 autosave / pagehide persistence，避免舊 snapshot 又被寫回 storage。
- Test Tools 不保存進遊戲 state。
- Test Tools 不得成為正式 progression requirement。

之後若加入「NP READY」「跳到第 N 隻」等 cheat，也應透過明確的 debug/test API，不讓 UI 直接改 logical fields。

## 17. 最重要的測試邊界

### Hydra I Math

```text
9 → non-terminal cut → 8 → regen deadline → 9

1 head + terminal cut
→ 0
→ killed true
→ pending regrowth cleared
```

### Regen Curve

```text
0 kills  → 1500ms
9 kills  → 1154ms
30 kills → 750ms
99 kills → 350ms floor

Core injects delay
→ Combat passes ruleContext
→ Rule schedules executeAt
```

### Auto Slash

```text
locked → 0 auto requests
unlocked → rate-accurate requests
1 attack/sec × 1 sec → 1 attack
high-speed batch → stops at terminal kill
```

### NP

```text
release → timed regrowth disable
Hydra A killed
→ 300ms respawn
→ modifier still active
Hydra B killed
→ same window can continue
endsAt reached
→ modifier expires regardless of encounter count
```

### Progression

```text
ordinary true kill
→ +11 人類惡
→ defeated
→ 300ms
→ clean next Hydra I

repeat ×9
→ kills = 9
→ 人類惡 = 99
→ Command Spell I available
```

### Render / NP Tint

```text
logical active NP window
→ red-tinted backdrop / ground
window ends
→ normal stage colors
```

### Test Tools

```text
RESET SAVE
→ suppress persistence
→ clear save key
→ reload fresh
→ pagehide must not recreate old save
```

### Render Limit

```text
logical = 1000000000000 heads
visible = 99
```

### Platform

```text
fixed battle control
→ pointerup command
→ browser click/dblclick/gesture default suppressed
→ iOS page zoom must not change
```

只要 Math / Systems / Economy / Progression / View / Platform contracts 能分別自動驗證，積木分離就算成功。
