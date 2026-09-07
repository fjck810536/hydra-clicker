# Hydra Clicker — Block Contracts v0.9

> 這份文件是積木之間的插頭規格。v0.9 對齊 Playtest 2.4：66-point NP gauge、第一令咒 64 APS MAX、95→99 NP 收尾假說。

## 1. Attack Request

```js
{
  source: 'manual' | 'auto' | 'np' | 'tree-command',
  timestamp,
  strikeCount: 1,
  headsPerStrike: 1n,
  target: null
}
```

Input / Auto 只描述「想砍」；不直接改 headCount、不播動畫。

## 2. Cut Resolution / Hydra I

```js
{
  accepted: true,
  headsRemoved: 1n,
  headsSpawned: 0n,
  materialsProduced: 0n,
  depleted: false,
  killed: false,
  cancelPendingRegrowth: false,
  regrowth: [],
  effects: ['slash-hit']
}
```

Hydra I current rule：

```text
remaining heads > 0 + regrowth enabled
→ cut
→ schedule same-head regrowth at now + regrowthDelayMs

remaining heads > 0 + regrowth disabled
→ cut
→ no new regrowth

remaining heads = 0
→ depleted = true
→ killed = true
→ cancel all pending regrowth
```

`depleted` 與 `killed` 仍是不同概念；只是 Playtest 2 的 Hydra I 暫時同時成立。

## 3. Rule Context

Combat 將 application / modifier context 合併後交給 Hydra Rule：

```js
{
  regrowthDelayMs: 247,
  regrowthEnabled: false
}
```

責任：

```text
Data / progression curve → regrowthDelayMs
Modifier resolver         → regrowthEnabled
Combat                    → 傳遞
Hydra Rule                → 解算
```

Hydra Rule 不知道目前第幾殺，也不知道 disable 來自 NP、支援、科技或設施。

## 4. Regrowth Event

```js
{
  id,
  executeAt,
  type: 'hydra-regrow',
  amount: 1n,
  payload: { branchId: null, ruleId: 'regen-same-head' }
}
```

Gameplay delay 一律服從 Game Clock，不散成 `setTimeout()`。

## 5. NP Gauge — Playtest 2.4

### Player-facing gauge

```text
0 / 66
1 head cut = +1 NP
66 / 66 = READY
release = gauge returns to 0
```

Manual 與 Auto Slash 的 accepted `head:cut` 都使用同一條規則；目前不做來源差別。

### Persistent representation

`state.berserker.np` **仍保存 0..1 normalized ratio**，不是直接把 state schema 改成 0..66。

```text
player-facing points = round(normalized × 66)
normalized = points / 66
```

因此舊存檔自然相容：

```text
old np = 0.5
→ Playtest 2.4 projection = 33 / 66
```

不需要 state schema migration。

### NP status projection

Runtime 對 UI 暴露：

```js
{
  points: 33,
  maxPoints: 66,
  ready: false,
  normalized: 0.5
}
```

View 不自行知道 NP 上限。

## 6. NP Timed Rule Modifier

Release 後：

```js
{
  type: 'rule-modifier',
  target: 'hydra.regrowth',
  effect: 'disable',
  startsAt,
  endsAt,
  source: 'np',
  scope: 'timed'
}
```

目前 duration = 3000ms。

```text
existing pending regrowth → window 內暫停
new cut                   → 不建立 regrowth
Hydra A killed            → NP 不消失
Hydra B / C / ...         → 同一 window 繼續
endsAt                     → modifier expires
```

NP active 時 View 只做暗紅背景提示，不影響邏輯時間。

## 7. Auto Slash

Auto Slash 只讀：

```text
master.commandSpells.autoSlash
berserker.baseAttacksPerSecond
hydra attackable state
Game Clock
```

並產生 Attack Request。

高攻速可在一個 tick batch 多刀；Combat 一旦 terminal kill 就停止該 batch，不把剩餘 strikes 套到死去的 Hydra。

## 8. Encounter / Respawn

普通 true kill：

```text
kill
→ defeated = true
→ respawnAtMs = kill time + 300ms
```

regrowth-disabled burst：

```text
kill while regrowthEnabled = false
→ respawnAtMs = kill time + 100ms
```

Progression 接受注入的 `getRespawnDelayMs(snapshot, payload)`，本身不判斷「是不是 NP」。

Clock listener order：

```text
clock tick
→ Progression：處理 due respawn
→ Auto Slash：同一 tick 可打新 Hydra
```

Combat / Hydra Math 不負責 spawn 下一隻。

## 9. Command Spell I — Playtest 2.4 Upgrade Curve

不新增第二令咒；第一令咒本身升級。

```text
kills  level    cost   Auto Slash
9      Lv.1      99      1 APS
12     Lv.2      22      2 APS
16     Lv.3      33      4 APS
22     Lv.4      44      8 APS
30     Lv.5      66     16 APS
40     Lv.6      88     32 APS
66     Lv.MAX   132     64 APS
```

Playtest 2.3 的：

```text
52 → 64 APS
66 → 128 APS
```

已刪除。

現在刻意保留：

```text
40 → 66 kills = 32 APS plateau
66 kills       = 64 APS MAX
```

Lv.1：

```text
spend 99
→ autoSlash = true
→ baseAttacksPerSecond = 1
→ command-spell:unlocked
```

Lv.2–MAX：

```text
spend cost
→ progression.milestones += command-spell-1-lvN
→ baseAttacksPerSecond = level APS
→ command-spell:upgraded
```

舊存檔：

```text
autoSlash = true + no upgrade milestone
→ 視為 Lv.1
```

## 10. Economy Shape

Lv.1 後總升級成本：

```text
22 + 33 + 44 + 66 + 88 + 132 = 385 人類惡
```

第 9 → 66 隻收入：

```text
57 × 11 = 627 人類惡
```

若沿 milestone 購買，到 MAX 理論剩：

```text
627 - 385 = 242 人類惡
```

這只是 Playtest tuning。

## 11. Hydra I Regen Curve

```text
0 kills  → 1500ms
9 kills  → 350ms
30 kills → 247ms
50 kills → 174ms
66 kills → 134ms
99 kills → 100ms floor
```

0→9 快速惡化；9→99 繼續變快，但每隻造成的增幅遞減。

Curve 只在 Data；Combat 不知道 kill count。

## 12. Current Endgame Hypothesis

Playtest 2.4 不再要求 `66 kills >6 Hydra/sec`。

實機目前較有價值的假說是：

```text
66 kills
→ 64 APS MAX
→ 普通 Auto 一路推進到約末段
→ 約 95 左右自然卡住
→ 玩家主動按一次 NP
→ 3s burst 足以完成 95 → 99
```

Headless test 只驗證：

```text
64 APS + one NP at kill 95
→ within 3 simulated seconds reaches at least kill 99
```

不再保留 128 APS / 10 Hydra-per-second 作為正式 contract。

## 13. Save

Save 保存 logical state：

```text
currencies
command-spell capability
berserker base APS
progression milestones
normalized NP ratio
Hydra logical encounter state
pending regrowth
active timed modifiers
statistics
simulation time / tick
```

不保存 Babylon / DOM / animation / visible-head cache。

Offline progress 仍 OFF。

## 14. View / Test Tools

HUD：

```text
NP 0/66 ... READY
AUTO 16 APS
COMMAND SPELL I Lv.N
```

TEST panel：

```text
REGEN xxx ms
AUTO xxx APS / LOCKED
RESET SAVE
```

View / Test Tools 只讀 runtime projection，不直接 mutate gameplay state。

## 15. 最重要的自動測試

```text
Hydra I:
9 → cut → 8 → regen deadline → 9
terminal cut → 0 → killed → pending queue cleared

NP:
65 accepted head cuts → 65/66, not ready
66th accepted head cut → 66/66, ready
old normalized 0.5 save → 33/66
release → 0/66 + 3s timed modifier

Command Spell I:
APS = 1,2,4,8,16,32,64
kill requirements = 9,12,16,22,30,40,66
64 APS MAX at kill 66

End stretch:
kill 95 + 64 APS + one NP
→ reaches at least 99 inside 3s

Save:
BigInt exact round-trip
normalized NP round-trip
milestones / APS round-trip
no wall-clock offline catchup
```

核心原則不變：**怪遊戲，正常架構。**
