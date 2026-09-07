# Hydra Clicker — Block Contracts v0.11

> v0.11 對齊 Playtest 3 Hydra II Intro，並補上 session-only TEST preset contract。這是積木之間的資料插頭，不是最終 API。

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

Input / Auto 只描述「想砍」。

## 2. Cut Resolution

共同格式：

```js
{
  accepted: true,
  ruleId,
  turnBefore,
  turnAfter,
  headsRemoved: 1n,
  headsSpawned: 0n,
  materialsProduced: 0n,
  regrowth: [],
  cancelPendingRegrowth: false,
  depleted: false,
  killed: false,
  effects: []
}
```

`headsRemoved` / `headsSpawned` 都是 exact BigInt。

Hydra Model 套用順序：

```text
heads
- headsRemoved
+ headsSpawned
→ pending regrowth scheduling
```

## 3. Hydra I Rule

```text
remaining > 0 + regen enabled
→ remove head
→ schedule same-head regrowth

remaining > 0 + regen disabled
→ remove head
→ no new regrowth

remaining = 0
→ depleted = true
→ killed = true
→ cancel pending regrowth
```

Hydra I：`headsSpawned = 0`。

## 4. Hydra II Intro Rule

Playtest 3：

```text
CUT 1
→ headsRemoved = 1
→ headsSpawned = 2 immediately
→ no delayed regrowth
→ net head delta = +1
→ killed = false
```

所以第一刀：

```text
9 → 10
```

`headsSpawned` 是 structural immediate output，不是 Hydra I `regrowth` queue。

現行 NP 的 `hydra.regrowth = disabled` **不會**取消 Hydra II `headsSpawned`。

## 5. Rule selection

Combat 接收 Core 注入：

```js
getRule(snapshot)
```

目前：

```text
generation 1 → Hydra I Rule
generation 2 → Hydra II Rule
```

Combat 本身不硬寫 generation-specific rule math。

## 6. Rule Context

Hydra I example：

```js
{
  regrowthDelayMs: 247,
  regrowthEnabled: false
}
```

來源：

```text
Data curve        → regrowthDelayMs
Modifier resolver → regrowthEnabled
```

Hydra II Intro 不需要 Hydra I regen delay。

## 7. head:cut semantic event

```js
{
  type: 'head:cut',
  payload: {
    atMs,
    source,
    amount: headsRemoved,
    spawned: headsSpawned,
    turn,
    depleted,
    killed
  }
}
```

View 可以顯示：

```text
CUT 1 · GROW +2 · Δ +1
```

但不能從 UI 反寫 head count。

## 8. NP Gauge

Player-facing：

```text
0 / 66
1 accepted head cut = +1
66 / 66 = READY
release = 0
```

Manual / Auto Slash 目前同規則。

Persistent：

```text
state.berserker.np = normalized 0..1
points = round(normalized × 66)
```

舊 `0.5` save → `33/66`。

## 9. NP Timed Modifier

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

Duration = 3000ms；可跨 encounters。

NP READY 時，即使 Hydra defeated / respawn gap 也允許 release。

## 10. Auto Slash

Auto Slash 只透過 Game Clock 產生 Attack Request。

普通 enable requirements：

```text
autoSlash capability
AND Hydra attackable
AND heads > 0
```

Playtest 3 另外由 Core 注入 Intro policy：

```text
Hydra II
AND first manual cut milestone missing
→ Auto Slash temporarily disabled
```

Auto Slash System 本身不知道 Hydra II 名稱。

## 11. Hydra II first-cut milestone

Progression 監聽 accepted `head:cut`：

```text
generation = 2
source = manual
first cut milestone absent
↓
progression.milestones += hydra-ii-first-manual-cut
↓
hydra:intro-complete
```

下一個 Game Clock tick Auto Slash 可恢復。

## 12. Encounter / Generation Progression

Hydra I true kill：

```text
defeated = true
respawnAtMs = kill time + delay
```

Delay：

```text
regrowth enabled  → 300ms
regrowth disabled → 100ms
```

Playtest 3 threshold：

```text
totalHydrasKilled >= 99
AND generation = 1
→ next encounter = Hydra II
```

Transition：

```text
hydra.generation = 2
progression.hydraGeneration = 2
encounter = 1
heads = 9
turn = 0
pendingRegrowth = []
defeated = false
```

並 emit：

```text
hydra:generation-changed
```

舊 save 若已經 `99 kills + live Hydra I`，下一個 simulation tick 直接 transition。

## 13. Command Spell I — Playtest 2 Seal Curve

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

Capability / APS 跨 Hydra generation 保留。

## 14. Hydra I Regen Curve

```text
0 kills  → 1500ms
9 kills  → 350ms
30 kills → 247ms
50 kills → 174ms
66 kills → 134ms
99 kills → 100ms floor
```

Curve Data-owned；Combat 不知道 kill count。

## 15. View / Head Pool / TEST Tools

```text
logical 0–99 → same visible count
logical 100+ → 99 visible heads
```

Hydra II logical growth 不受 visible cap 限制。

HUD Playtest 3 projection：

```text
HYDRA II
AUTO PAUSED · TAP    // first-cut intro only
CUT 1 · GROW +2 · Δ +1
```

TEST regen readout在 Hydra II 可顯示 `STRUCTURAL`。

### Session-only TEST presets

TEST 面板目前額外提供：

```text
MAX COMMAND SPELL
→ Command Spell I Lv.MAX
→ Auto Slash capability ON
→ 64 APS
→ 不免費補 kills / 人類惡

START HYDRA #98
→ Hydra I generation
→ encounter = 98
→ completed kills = 97
→ heads = 9
→ clean pending regrowth / NP modifier state
```

兩個 preset 可以任意順序疊用，例如：

```text
MAX COMMAND SPELL
↓
START HYDRA #98
↓
64 APS remains active at Hydra I #98
```

重要邊界：

```text
TEST UI
→ calls js/dev/test-presets.js
→ dedicated dev state mutation
→ browser session sets suppressPersistence = true
→ existing normal save is not overwritten
```

TEST preset 不是正式 progression、不是 cheat capability、也不加入 persistent schema。重新整理頁面後，會重新載入最後一次正常保存的狀態。

## 16. Save

State schema 仍為 1。

Playtest 3 不新增必填 field：

```text
hydra.generation               existing
progression.hydraGeneration    existing
intro completion               milestones[]
NP                             normalized existing field
```

No offline progress。

## 17. Required tests

```text
Hydra I:
9 → cut → 8 → regen → 9
terminal cut → killed

NP:
65 cuts → not ready
66 cuts → ready
release → timed modifier

Command Spell I:
1,2,4,8,16,32,64 APS
64 MAX at 66 kills

Hydra II pure rule:
9 + one cut → 10
headsRemoved=1
headsSpawned=2
no delayed regrowth
NP suppression does not cancel spawn

Hydra II intro:
99th Hydra I kill → generation 2
Auto remains paused before first manual cut
first manual cut → 9→10 + milestone
next tick → Auto resumes and logical heads increase

TEST presets:
MAX COMMAND SPELL → Lv.MAX / 64 APS without changing kills or currency
START HYDRA #98 → 97 completed kills + fresh encounter 98
presets compose without resetting each other's targeted state
browser TEST session suppresses persistence

Legacy:
99-kill live Hydra I save → next tick enters Hydra II
```

核心原則：**怪遊戲，正常架構。**
