# Hydra Clicker — Block Contracts v0.5

> 這份文件不是最終 API，而是積木之間的插頭規格。函式名稱可以變，但資料責任不要混掉。

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

規則：

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
- `killed` = 確認不會由目前規則／既有排程復原。
- Hydra I 普通狀態歸零但仍有 regrowth 時：`depleted: true, killed: false`。
- `cancelPendingRegrowth` 只有 Rule 確認排程失效時才可要求；NP system 不直接清 queue。

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

`ruleContext` 是 Modifier resolver 已整理過的通用規則條件：

```js
{
  regrowthEnabled: false
}
```

Hydra Rule 不知道這來自 NP、英靈、科技或設施。

Hydra I：

```text
regrowthEnabled = true
→ remove 1
→ schedule regrow 1

regrowthEnabled = false
→ remove 1
→ no new regrowth
→ reaching 0 may become true killed
```

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

## 5. NP Activation / Rule Modifier

Block 7 正式實作：

```js
{
  id: 'np-regeneration-window-0',
  type: 'rule-modifier',
  target: 'hydra.regrowth',
  effect: 'disable',
  startsAt,
  endsAt,
  source: 'np',
  scope: 'encounter'
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
既有 pending regrowth → 暫停
新 cut → 不建立 regrowth
heads → 0 → killed = true
terminal Cut Result → cancelPendingRegrowth
```

`scope: 'encounter'` 表示下一隻 Hydra encounter 重生時清除，不把上一場 NP window 帶到下一場。

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

浮點 accumulator 使用極小 epsilon 防止：

```text
0.1 × 10 = 0.999999999...
```

造成 1 attack/sec 在完整 1 秒不出刀。

## 7. Economy Event

貨幣以語義事件記錄。

Block 8 目前：

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

Block 8 的 Hydra I encounter lifecycle：

```text
active
↓ true kill
defeated = true
logicalHeadCount = 0
respawnAtMs = kill time + 1200
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

並清除 `scope: 'encounter'` 的 temporary modifiers。

Progression system 發：

```text
hydra:respawned
```

Combat / Hydra Math 不負責生下一隻敵人。

## 9. Command Spell Definition / Capability

Block 8 data definition：

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

第二／第三令咒仍只是設計候選，不在 Block 8 實作。

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

Block 8 prototype tuning 集中於 `js/data/progression.js`：

```text
humanityEvilPerKill = 11n
respawnDelayMs = 1200
requiredHydraKills = 9n
commandSpellICost = 99n
```

目前故意形成：

```text
9 kills × 11 = 99
```

讓第一個完整周回可以直接驗證。

這不是最終平衡；Grill 後可直接調 Data 而不改 system logic。

Hydra I → II、99 kills 是否主線、Farm Reveal 等仍未定案。

## 12. Logical Snapshot vs Render Projection

Core snapshot 保存 logical state：

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

View 再派生：

```js
{
  logicalHeadCount: 18472n,
  visibleHeadCount: 99
}
```

BigInt UI formatting 與 Block 9 Save serialization 是不同責任。

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

Block 5：

```text
initial pool size = 9
hard visible cap  = 99
```

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

Block 9 只保存 logical state / persistence metadata。

需要保存：

```text
currencies
command spell capability unlocks
hydra generation / encounter logical state
pending timed regrowth
defeated / respawnAtMs
active timed modifiers
progression milestones
statistics（若設計為 lifetime persistent）
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

## 16. 最重要的測試邊界

### Hydra I Math

```text
9 → cut → 8 → regen deadline → 9
```

### Auto Slash

```text
locked → 0 auto requests
unlocked → rate-accurate requests
1 attack/sec × 1 sec → 1 attack
```

### NP

```text
8 accepted heads → 100%
release → encounter-scoped regrowth disable
terminal cut → true kill
```

### Block 8 Progression

```text
true kill
→ +11 人類惡
→ defeated
→ 1.2 sec
→ clean next Hydra I

repeat ×9
→ kills = 9
→ 人類惡 = 99
→ Command Spell I available
→ purchase
→ 人類惡 = 0
→ autoSlash capability = true
→ Auto Slash starts next simulation ticks
```

### Render Limit

```text
logical = 1000000000000 heads
visible = 99
```

只要 Math / Systems / Economy / Progression 與 View projection 能在沒有 Babylon runtime 的 Node tests 中各自驗證，積木分離就算成功。
