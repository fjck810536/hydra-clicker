# Hydra Clicker — Block Contracts v0.14

> v0.14 對齊 Hydra II 81-head / 99-kill loop 與 Hydra III 729-head shell。這是積木之間的資料插頭，不是最終 API。

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

Hydra Model 套用：

```text
heads
- headsRemoved
+ headsSpawned
→ pending regrowth scheduling
```

## 3. Generation scale Data

```text
Gen I   starting 9 · max 9   · 99 kills to next
Gen II  starting 9 · max 81  · 99 kills to next
Gen III starting 9 · max 729 · next rule pending
```

`maxHeads` 是 deterministic Data，不是 View mesh cap。

## 4. Hydra I Rule

```text
remaining > 0 + head growth enabled
→ remove head
→ schedule same-head regrowth

remaining > 0 + head growth disabled
→ remove head
→ no new regrowth

remaining = 0
→ killed = true
```

## 5. Hydra II Rule

Normal：

```text
CUT 1
→ remove 1
→ desire GROW +2
→ clamp spawn against maxHeads = 81
```

Examples：

```text
9  → 10
80 → 81
81 → 81   // remove 1, spawn only 1 because cap
```

Head growth suppressed：

```text
CUT 1
→ headsSpawned = 0
→ net -1
```

Terminal：

```text
1 + headGrowthEnabled=false
→ CUT 1
→ 0
→ depleted = true
→ killed = true
```

因此 Hydra II 可以被 NP window 真正殺死。

## 6. Hydra III shell rule

目前只提供安全 placeholder：

```text
generation = 3
startingHeads = 9
maxHeadCount = 729
resolveCut → accepted false
state unchanged
```

這不是 Hydra III 正式戰鬥規則。

## 7. Rule selection

```text
generation 1 → Hydra I Rule
generation 2 → Hydra II Rule
generation 3 → Hydra III shell Rule
```

Combat 本身不硬寫 generation-specific math。

## 8. Rule Context

Modifier resolver：

```js
{
  headGrowthEnabled: true | false,
  regrowthEnabled: true | false
}
```

Hydra I 另有 `regrowthDelayMs`。

## 9. head:cut semantic event

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

可能 presentation：

```text
Hydra II normal      → CUT 1 · GROW +2 · Δ +1
Hydra II at cap 81   → CUT 1 · GROW +1 · Δ 0
Hydra II + NP        → CUT 1
terminal NP cut      → CUT 1 · HYDRA DOWN
```

## 10. NP Gauge / modifier

```text
0 / 66
1 accepted head cut = +1
66 / 66 = READY
release = 0
window = 3000ms
```

Current modifier：

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

Effects：

```text
Hydra I  → no delayed regrowth
Hydra II → no structural spawn
```

Legacy `hydra.regrowth / disable` 仍由 resolver 視為相容 alias。

## 11. Auto Slash

Normal enable requirements：

```text
autoSlash capability
AND Hydra attackable
AND heads > 0
```

Hydra II first reveal：

```text
first manual-cut milestone missing
→ Auto temporarily paused
```

Hydra III shell：

```text
generation >= 3
→ Auto paused until a real generation rule exists
```

## 12. Encounter / Generation Progression

### Hydra I

```text
kill #99
→ Hydra II encounter 1
→ heads = 9
```

### Hydra II

Every true kill：

```text
encounter n defeated
→ respawn delay
→ encounter n+1
→ heads = 9
```

Until：

```text
encounter 99 defeated
→ Hydra III encounter 1
→ heads = 9
→ maxHeads metadata = 729
```

Generation-local progress for Hydra II uses existing `hydra.encounter`; no new kill counter field。

## 13. Command Spell I

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

## 14. View / Head Pool

Contract **unchanged**：

```text
logical 0–99 → same visible count
logical 100+ → visible 99
```

Consequences：

```text
Hydra II max 81
→ never reaches visual cap
→ no Hydra II visual rebuild required

Hydra III max 729
→ can exceed visual cap later
→ still render at most 99 heads
```

View 不得把 visible 99 當 logical max。

## 15. TEST Tools

目前：

```text
MAX COMMAND SPELL
START HYDRA #98
NP READY
RESET SAVE
```

Presets 是 session-only，不覆蓋正常 save。

## 16. Save

State schema 仍為 1。

沒有新增必填 field：

```text
generation            existing
encounter             existing
startingHeadCount     existing
progression generation existing
```

Generation `maxHeads` 由 Data 決定，不需存入 save。

## 17. Required tests

```text
Hydra II:
9 normal cut → 10
81 normal cut → 81
1 + headGrowth disabled → 0 + killed
killed encounter 1 → respawn encounter 2 at 9 heads
killed encounter 99 → Hydra III encounter 1 at 9 heads

Hydra III shell:
maxHeadCount = 729
Auto does not attack
manual attack causes no logical mutation

View:
logical 81 → visible 81
logical 729 → visible 99
```

核心原則：**怪遊戲，正常架構。**
