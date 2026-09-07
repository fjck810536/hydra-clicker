# Hydra Clicker — Block Contracts v0.13

> v0.13 對齊 Playtest 3 Hydra II Intro，並將 NP modifier 從 delayed regrowth suppression 升級為 generic head-growth suppression。這是積木之間的資料插頭，不是最終 API。

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

Hydra Model 套用：

```text
heads
- headsRemoved
+ headsSpawned
→ pending regrowth scheduling
```

## 3. Hydra I Rule

```text
remaining > 0 + head growth enabled
→ remove head
→ schedule same-head regrowth

remaining > 0 + head growth disabled
→ remove head
→ no new regrowth

remaining = 0
→ depleted = true
→ killed = true
→ cancel pending regrowth
```

Hydra I：`headsSpawned = 0`。

## 4. Hydra II Intro Rule

Normal：

```text
CUT 1
→ headsRemoved = 1
→ headsSpawned = 2 immediately
→ no delayed regrowth
→ net head delta = +1
→ killed = false
```

所以正常第一刀：

```text
9 → 10
```

Head growth suppressed：

```text
CUT 1
→ headsRemoved = 1
→ headsSpawned = 0
→ net head delta = -1
→ killed = false
```

所以 NP active 第一刀：

```text
9 → 8
```

`headsSpawned` 仍是 structural immediate output，不進 Hydra I `regrowth` queue；只是 Hydra II Rule 會讀 generic `headGrowthEnabled` rule context。

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

Modifier resolver 的共同輸出：

```js
{
  headGrowthEnabled: true | false,
  regrowthEnabled: true | false
}
```

Hydra I 另外有：

```js
{
  regrowthDelayMs: 247
}
```

來源：

```text
Data curve        → regrowthDelayMs
Modifier resolver → headGrowthEnabled / regrowthEnabled
```

`regrowthEnabled` 保留給 Hydra I 舊接口與既有 caller；generic Hydra rule 優先讀 `headGrowthEnabled`。

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

View 可顯示：

```text
normal Hydra II → CUT 1 · GROW +2 · Δ +1
NP active       → CUT 1
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

Current release：

```js
{
  type: 'rule-modifier',
  target: 'hydra.headGrowth',
  effect: 'disable',
  startsAt,
  endsAt,
  source: 'np',
  scope: 'timed'
}
```

Duration = 3000ms；可跨 encounters。

NP READY 時，即使 Hydra defeated / respawn gap 也允許 release；Hydra II 也允許 release。

效果：

```text
Hydra I  → delayed regrowth suppressed
Hydra II → immediate structural GROW +2 suppressed
```

Legacy save compatibility：

```text
target: hydra.regrowth + effect: disable
```

仍由 modifier resolver 視為 `hydra.headGrowth = disabled`，直到該 timed modifier 自己到期。

## 10. Auto Slash

Auto Slash 只透過 Game Clock 產生 Attack Request。

普通 enable requirements：

```text
autoSlash capability
AND Hydra attackable
AND heads > 0
```

Playtest 3 Intro policy：

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

是否 NP active 不影響 intro completion；manual cut 被接受就完成 reveal guard。

## 12. Encounter / Generation Progression

Hydra I true kill：

```text
defeated = true
respawnAtMs = kill time + delay
```

Delay：

```text
head growth enabled  → 300ms
head growth disabled → 100ms
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

並 emit `hydra:generation-changed`。

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

TEST 面板目前：

```text
MAX COMMAND SPELL
START HYDRA #98
NP READY
RESET SAVE
```

Presets 是 session-only；一旦使用，browser session `suppressPersistence = true`，不覆蓋正常 save。

## 16. Save

State schema 仍為 1。

```text
hydra.generation               existing
progression.hydraGeneration    existing
intro completion               milestones[]
NP                             normalized existing field
active modifiers               existing array
```

新 NP release 會寫 `target: hydra.headGrowth`；舊 save 的 `hydra.regrowth` target 由 resolver 相容，不需 migration / schema bump。

No offline progress。

## 17. Required tests

```text
Hydra I:
9 → cut → 8 → regen → 9
terminal cut → killed

NP:
65 cuts → not ready
66 cuts → ready
release → hydra.headGrowth timed modifier

Hydra II pure rule:
normal: 9 + cut → 10
headGrowthEnabled=false: 9 + cut → 8

Hydra II integration:
NP active + cut → spawned = 0 → 9 → 8
legacy hydra.regrowth modifier + cut → 9 → 8

Hydra II intro:
99th Hydra I kill → generation 2
Auto paused before first manual cut
first manual cut completes intro
next tick → Auto resumes

TEST presets:
MAX COMMAND SPELL → Lv.MAX / 64 APS without changing kills or currency
START HYDRA #98 → 97 completed kills + fresh encounter 98
NP READY → 66/66 without changing combat progression
browser TEST session suppresses persistence
```

核心原則：**怪遊戲，正常架構。**
