# Hydra Clicker — Block Contracts v0.8

> 這份文件是積木之間的插頭規格，不是最終 API。函式名稱可以變，但資料責任不要混掉。v0.8 對齊 Playtest 2.3：第一令咒多級攻速、NP burst respawn、66 kills 爽感峰值實驗。

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
- 不自己移除 head。
- 不播放 animation。

## 2. Cut Resolution

Hydra Math 接收 Attack Request 後產生：

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

- 離散數量使用 `BigInt`。
- `effects` 是語義，不是 Babylon object。
- `depleted` = 當下 heads 為 0。
- `killed` = active rule 判定 terminal death。
- 兩者概念仍分離；Playtest 2 的 Hydra I 暫時令 reaching 0 heads 同時成立。
- Hydra I terminal cut 要 `cancelPendingRegrowth: true`。

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

目前 `ruleContext`：

```js
{
  regrowthDelayMs: 247,
  regrowthEnabled: false
}
```

來源責任：

```text
Data / progression curve
→ Core composition
→ regrowthDelayMs

active rule modifiers
→ Modifier resolver
→ regrowthEnabled
```

Combat 只合併 context 後交給 Rule；不計算曲線。Hydra Rule 不知道目前第幾殺，也不知道 disable 來自 NP、英靈、科技或設施。

### Hydra I

```text
remaining heads > 0 + regrowth enabled
→ cut
→ same-head regrowth at now + regrowthDelayMs

remaining heads > 0 + regrowth disabled
→ cut
→ no new regrowth

remaining heads = 0
→ killed
→ no new regrowth
→ cancel pending regrowth
```

## 4. Regrowth Event

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

Gameplay delay 服從 Game Clock，不散成 `setTimeout()`。

## 5. NP / Timed Rule Modifier

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

NP window：

```text
existing pending regrowth → 暫停
new cut → 不建立 regrowth
Hydra A killed → NP 不消失
Hydra B / C / ... → 同一窗口繼續收割
endsAt → modifier expires
```

Playtest 2.1 起，NP active 時 View 以暗紅背景提示；View 不修改 modifier。

## 6. Auto Slash Contract

Auto Slash 只由 capability + Game Clock 產生 Attack Request。

```js
{
  enabled: true,
  attacksPerSecond: 128,
  accumulator: 0.8
}
```

它不可以：

- 改 headCount。
- 播 Berserker animation。
- 決定 Hydra regrowth / respawn。
- 被 Command Spell system 直接命令出刀。

Capability source：

```text
master.commandSpells.autoSlash
```

攻速 source：

```text
berserker.baseAttacksPerSecond
```

高攻速可以在一個 tick 產生 batch strikes；Combat 一旦某 strike terminal kill 就停止該 batch，不把多餘 strikes 算到死去的 Hydra。

## 7. Economy Event

目前每 kill：

```js
{
  type: 'currency:gain',
  currency: 'humanity-evil',
  amount: 11n,
  reason: 'hydra-kill',
  balance
}
```

購買令咒／升級：

```js
{
  type: 'currency:spend',
  currency: 'humanity-evil',
  amount,
  reason,
  balance
}
```

數值只來自 Data，不寫死在 Economy system。

## 8. Hydra Encounter / Respawn Contract

普通 encounter：

```text
true kill
→ defeated = true
→ logicalHeadCount = 0
→ respawnAtMs = kill time + 300ms
→ Game Clock
→ new encounter
```

NP / regrowth-disabled burst：

```text
true kill while regrowth is disabled
→ respawnAtMs = kill time + 100ms
```

Progression 接受 application composition 注入的 `getRespawnDelayMs(snapshot, payload)`；Progression 本身不知道「這是 NP」。目前 Core composition 用 generic rule condition：

```text
regrowthEnabled = true  → 300ms
regrowthEnabled = false → 100ms
```

新 encounter：

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

### Clock listener order

Playtest 2.3 有明確吞吐要求：Progression 必須在 Auto Slash 前處理 `clock:tick`。

```text
100ms tick
→ Progression：若 respawn due，先生新 Hydra
→ Auto Slash：同一 tick 可立刻 attack
```

否則 100ms respawn 會被事件順序實際拖成約 200ms，將上限卡在約 5 Hydra/sec。

Combat / Hydra Math 不負責生下一隻。

## 9. Command Spell I — Capability + Upgrade Curve

Playtest 2.3 不新增第二令咒；**第一令咒本身從 Lv.1 升到 Lv.MAX。**

Data：

```text
kills  level    cost   Auto Slash
9      Lv.1      99      1 APS
12     Lv.2      22      2 APS
16     Lv.3      33      4 APS
22     Lv.4      44      8 APS
30     Lv.5      66     16 APS
40     Lv.6      88     32 APS
52     Lv.7     110     64 APS
66     Lv.MAX   132    128 APS
```

Lv.1：

```text
spend 99 人類惡
→ master.commandSpells.autoSlash = true
→ berserker.baseAttacksPerSecond = 1
→ command-spell:unlocked
```

Lv.2–Lv.MAX：

```text
spend cost
→ progression.milestones += command-spell-1-lvN
→ berserker.baseAttacksPerSecond = level APS
→ command-spell:upgraded
```

為了舊存檔相容，不新增 State schema field：

```text
autoSlash = true + no upgrade milestone
→ 視為 Command Spell I Lv.1
```

這讓 Playtest 2.2 已買過第一令咒的存檔可以直接繼續。

狀態投影至少包含：

```js
{
  level,
  maxLevel,
  maxed,
  attacksPerSecond,
  nextLevel,
  nextAttacksPerSecond,
  killsMet,
  canAfford,
  available,
  requiredHydraKills,
  cost,
  balance,
  kills
}
```

Command Spell system 只改 capability / stat / milestone / currency；不直接呼叫 Auto Slash。

## 10. Command Spell I Economy Shape

Lv.1 後的總升級成本：

```text
22 + 33 + 44 + 66 + 88 + 110 + 132 = 495 人類惡
```

第 9 → 66 隻新增收入：

```text
57 kills × 11 = 627 人類惡
```

因此若玩家大致沿 milestone 購買，到 Lv.MAX 理論上仍留下：

```text
627 - 495 = 132 人類惡
```

這是 Playtest 配置，不是永久經濟定案。

## 11. Hydra I Regen Curve

Playtest 2.2 起：

```text
0 kills  → 1500ms
9 kills  → 350ms
99 kills → 100ms floor
```

0→9 急遽加速；9→99 繼續變快，但每隻造成的增幅逐漸下降。

代表值約：

```text
0   → 1500ms
1   → 1276ms
3   → 923ms
6   → 569ms
9   → 350ms
30  → 247ms
50  → 174ms
66  → 134ms
99  → 100ms
```

Curve 在 `js/data/progression.js`；Combat 不知道第幾殺。

## 12. Playtest 2.3 Peak Throughput Target

設計目標：第 66 隻附近形成爽感峰值，NP 期間至少 **>6 Hydra/sec**。

目前邏輯組合：

```text
Command Spell I Lv.MAX = 128 APS
Game Clock = 100ms fixed step
Hydra = 9 heads
NP → regrowth disabled
NP burst respawn = 100ms
Progression tick before Auto Slash tick
```

因此每 100ms：

```text
128 APS × 0.1s = 12.8 strike budget
→ 足以在該 tick 砍完 9 heads
→ terminal kill
→ 下一 tick respawn + immediate Auto Slash
```

Headless contract test 目前得到：

```text
10 Hydra kills / 1 simulated second
```

這是邏輯上限測試，不保證手機視覺能逐隻清楚演完；View 可以抽象化演出，但不能改 logical kill count。

## 13. Ordinary Upgrade Definition

未來普通升級仍使用通用 data/effect，例如：

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

第一令咒的 Playtest curve 是 progression milestone，不代表所有未來 stat upgrade 都必須採 doubling。

## 14. Logical Snapshot vs Render Projection

Core 保存 logical state；View 派生 presentation。

```text
logical head count
→ computeVisibleHeadCount
→ max 99 visible heads
→ Babylon pool
```

禁止：

- mesh count 寫回 state。
- visual cap 截斷真實數量。
- 巨大 BigInt 先無條件轉 Number。
- View 決定 attack / regrowth / kill / respawn。

## 15. Save Contract

Save 保存：

```text
currencies
command-spell capability
berserker base APS
progression milestones
Hydra logical encounter state
pending regrowth
active timed modifiers
statistics
simulation time
```

不保存：

```text
Babylon scene
mesh / particle
DOM
animation object
visible-head cache
```

目前 offline progress 明確為 OFF。

## 16. Playtest Test Tools

TEST panel 目前顯示：

```text
REGEN xxx ms
AUTO xxx APS / LOCKED
RESET SAVE
```

- Readout 只讀 runtime/state projection。
- RESET SAVE 只清 persistence adapter，不直接改 gameplay fields。
- reset 前暫停 autosave/pagehide persistence，避免舊 snapshot 被寫回。
- Test Tools 不保存進 state，也不得成為 progression requirement。

## 17. Platform Boundary

Battle shell：

```text
portrait / fixed
no page scroll
no Safari page zoom / pinch / smart double-tap zoom
```

未來 Drawer / Shop 可以局部 `overflow:auto`，不要因 battle shell gesture policy 永久封死所有 UI scrolling。

## 18. 最重要的自動測試

### Hydra I

```text
9 → cut → 8 → regen deadline → 9
1 head + terminal cut → 0 → killed → pending queue cleared
```

### Regen Curve

```text
0 kills → 1500ms
9 kills → 350ms
99 kills → 100ms floor
post-9 improvement diminishes per kill
```

### Command Spell I

```text
old save: autoSlash=true + no upgrade milestone → Lv.1
Lv.1→MAX APS: 1,2,4,8,16,32,64,128
kill 66 post-unlock income 627
post-unlock upgrade cost 495
remaining 132
```

### Peak Burst

```text
Lv.MAX + NP
→ burst respawn 100ms
→ progression before auto on tick
→ >6 Hydra/sec
current headless result = 10 Hydra/sec
```

### Save

```text
BigInt round-trip
milestones round-trip
base APS round-trip
no offline wall-clock catchup
```

### View / Platform

```text
logical huge heads → visible max 99
NP active → red stage tint
battle shell → Safari zoom defaults suppressed
```

只要 Math / Systems / Economy / Progression / View / Platform 能分別自動驗證，就維持「怪遊戲，正常架構」。
