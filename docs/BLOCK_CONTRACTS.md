# Hydra Clicker — Block Contracts v0.15

> v0.15 對齊 Playtest 4：Hydra II 81-head / 99-kill loop 不變，新增 generation-local HUD projection、semantic chapter transition 與 generation stage palette。

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

Hydra Model：

```text
heads - headsRemoved + headsSpawned
→ pending regrowth scheduling
```

## 3. Generation scale Data

```text
Gen I   starting 9 · max 9   · 99 kills to next
Gen II  starting 9 · max 81  · 99 kills to next
Gen III starting 9 · max 729 · next rule pending
```

`maxHeads` 是 logical Data，不是 View mesh cap。

## 4. Hydra I Rule

```text
remaining > 0 + head growth enabled
→ remove head
→ schedule same-head regrowth

head growth disabled
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
→ clamp against maxHeads 81
```

Examples：

```text
9  → 10
80 → 81
81 → 81
```

NP / head growth suppressed：

```text
CUT 1
→ headsSpawned = 0
→ net -1
→ 1 → 0 = true kill
```

## 6. Hydra III shell rule

```text
generation = 3
startingHeads = 9
maxHeadCount = 729
resolveCut → accepted false
state unchanged
```

## 7. Rule Context / NP

Modifier resolver：

```js
{
  headGrowthEnabled: true | false,
  regrowthEnabled: true | false
}
```

NP：

```text
66/66 READY
release → 3s hydra.headGrowth disable
Hydra I  → no delayed regrowth
Hydra II → no structural spawn
```

## 8. Auto Slash

```text
autoSlash capability
AND Hydra attackable
AND heads > 0
```

Additional policies：

```text
Hydra II first manual-cut milestone missing → Auto paused
Hydra III shell                            → Auto paused
```

## 9. Encounter / Generation Progression

```text
Hydra I kill #99
→ Hydra II encounter 1 · heads 9

Hydra II true kill n
→ next Hydra II encounter · heads 9

Hydra II encounter 99 defeated
→ Hydra III encounter 1 · heads 9
```

Generation-local progress uses existing `hydra.encounter` + `hydra.defeated`; no persistent local kill counter。

## 10. Generation Progress View Projection

Input：

```text
logical snapshot
+ generation config
```

Output：

```js
{
  generation,
  encounter,
  completedKills,
  targetKills,
  maxHeads
}
```

Projection：

```text
alive    → completedKills = encounter - 1
defeated → completedKills = encounter
```

Examples：

```text
Hydra II encounter 1 alive   → 0/99
Hydra II encounter 37 alive  → 36/99
Hydra II encounter 37 dead   → 37/99
Hydra III shell              → targetKills = null
```

Player HUD consumes this projection；`statistics.totalHydrasKilled` 不直接當本世代進度。

TEST panel 可以顯示 lifetime `TOTAL KILLS`。

## 11. Generation Transition View

Trigger：

```text
hydra:generation-changed
```

View output example：

```text
NEXT GENERATION
HYDRA II
START 9 · MAX 81 · KILL 99
```

Contract：

```text
CSS animation only
pointer-events none
animationend closes overlay
no gameplay setTimeout
no GameClock pause
```

Hydra III shell：

```text
START 9 · MAX 729 · RULE PENDING
```

## 12. Generation Stage Appearance

Input：

```text
snapshot.hydra.generation
```

View-only palette：

```text
I   neutral dark
II  subtle yellow-green
III cool violet
```

NP active red tint has priority；NP ends → restore current generation palette。

No rule/state mutation。

## 13. head:cut semantic event

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

Presentation examples：

```text
Hydra II normal    → CUT 1 · GROW +2 · Δ +1
Hydra II cap 81    → CUT 1 · GROW +1 · Δ 0
Hydra II + NP      → CUT 1
terminal NP cut    → CUT 1 · HYDRA DOWN
```

## 14. Command Spell I

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

## 15. View / Head Pool

Contract unchanged：

```text
logical 0–99 → same visible count
logical 100+ → visible 99
```

```text
Hydra II max81  → visible ≤81
Hydra III max729 → visible ≤99
```

Chapter HUD / transition / palette 不得修改 logical head state。

## 16. TEST Tools

目前：

```text
MAX COMMAND SPELL
START HYDRA #98
NP READY
RESET SAVE
TOTAL KILLS readout
```

Presets 是 session-only，不覆蓋正常 save。

## 17. Save

State schema 仍為 1。

Playtest 4 新增內容全部是 derived presentation：

```text
generation progress projection  not saved
transition active state          not saved
stage palette                    not saved
```

## 18. Required tests

```text
Hydra II:
9 normal cut → 10
81 normal cut → 81
1 + headGrowth disabled → 0 + killed
encounter 99 kill → Hydra III at 9

View:
Hydra II encounter1 alive → 0/99
Hydra II encounter37 dead → 37/99
Hydra III targetKills=null
lifetime kills live only in statistics / TEST
transition uses semantic event + CSS animation
transition does not schedule gameplay timeout
stage has generation palette with NP override
logical81 → visible81
logical729 → visible99
```

核心原則：**怪遊戲，正常架構。**
