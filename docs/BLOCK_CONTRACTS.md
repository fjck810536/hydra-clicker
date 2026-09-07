# Hydra Clicker — Block Contracts v0.16

> v0.16 對齊 Playtest 4.1：NP Hydra rule modifier 不變，但 active NP window 現在會透過 Core-injected policy 暫停 Auto Slash；Manual Input 保留。NP expiry 新增 `np:ended` semantic event，View 用它演時間恢復。

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

## 7. Rule Context / NP modifier

Modifier resolver：

```js
{
  headGrowthEnabled: true | false,
  regrowthEnabled: true | false
}
```

NP release：

```text
66/66 READY
→ 3s hydra.headGrowth disable
Hydra I  → no delayed regrowth
Hydra II → no structural spawn
```

Current modifier remains：

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

## 8. NP active lifecycle

NP System exposes：

```js
isActive(snapshot) -> boolean
```

Definition：

```text
there exists source:'np' modifier
AND startsAt <= simulationTime < endsAt
```

NP expiry is processed on `clock:tick`.

When the final active NP window expires：

```js
{
  type: 'np:ended',
  payload: {
    atMs,
    endedAtMs
  }
}
```

If future NP windows overlap, removing one expired window does not emit `np:ended` while another NP window remains active。

## 9. Auto Slash — Playtest 4.1 time-stop policy

Base requirements：

```text
autoSlash capability
AND Hydra attackable
AND heads > 0
```

Injected policies：

```text
Hydra II first manual-cut milestone missing → Auto paused
NP window active                           → Auto paused
Hydra III shell                            → Auto paused
```

While NP active：

```text
Auto Slash produces no attack requests
Auto accumulator resets while disabled
purchased capability / APS remain unchanged
Manual Input remains accepted
```

When NP ends, Auto Slash resumes accumulating on later Game Clock ticks。

Auto Slash System itself does not import or name NP；Core composition supplies the policy。

## 10. Encounter / Generation Progression

```text
Hydra I kill #99
→ Hydra II encounter 1 · heads 9

Hydra II true kill n
→ next Hydra II encounter · heads 9

Hydra II encounter 99 defeated
→ Hydra III encounter 1 · heads 9
```

Generation-local progress uses existing `hydra.encounter` + `hydra.defeated`; no persistent local kill counter。

## 11. Generation Progress View Projection

Input：logical snapshot + generation config。

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

Player HUD consumes this projection；lifetime kills remain Statistics / TEST data。

## 12. Generation Transition View

Trigger：`hydra:generation-changed`。

Contract：CSS animation only、pointer-events none、`animationend` closes overlay、no gameplay setTimeout、no GameClock pause。

## 13. Generation Stage Appearance

```text
I   neutral dark
II  subtle yellow-green
III cool violet
```

NP active red tint has priority；NP ends → restore current generation palette。

## 14. NP Phase View

Triggers：

```text
np:released
→ 寶具解放
→ ナインライブズ
→ 射殺す百頭

np:ended
→ TIME RESUMES
→ 時は動き出す
```

Contract：

```text
View-only
CSS animation
pointer-events none
animationend hides card
no setTimeout controls NP lifecycle
```

## 15. head:cut semantic event

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

## 16. Command Spell I

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

Playtest 4.1 does not remove or respec this capability；it only pauses Auto while NP is active。

## 17. View / Head Pool

Contract unchanged：

```text
logical 0–99 → same visible count
logical 100+ → visible 99
```

```text
Hydra II max81   → visible ≤81
Hydra III max729 → visible ≤99
```

## 18. TEST Tools

```text
MAX COMMAND SPELL
START HYDRA #98
NP READY
RESET SAVE
TOTAL KILLS readout
```

Presets 是 session-only，不覆蓋正常 save。

## 19. Save

State schema仍為1。

NP time-stop 不新增 persistent field：active state由既有 timed modifier + simulation timeline 決定；`np:ended` 是 runtime semantic event，不存檔。

## 20. Required tests

```text
NP time stop:
active NP + Auto unlocked + advance clock → zero auto cuts
active NP + manual attack → accepted
Hydra II active NP: 9 → 8, spawned=0
heads cut during NP remain cut after expiry
expiry → np:ended exactly once
next ordinary Hydra II cut after expiry → GROW +2 resumes
Auto resumes after expiry
NP phase overlay is pointer-events none / CSS-only

Hydra II:
9 normal cut → 10
81 normal cut → 81
1 + headGrowth disabled → 0 + killed
encounter99 kill → Hydra III at9

View:
Hydra II encounter1 alive → 0/99
Hydra II encounter37 dead → 37/99
Hydra III targetKills=null
logical81 → visible81
logical729 → visible99
```

核心原則：**怪遊戲，正常架構。**
