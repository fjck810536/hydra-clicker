# Hydra Clicker — Architecture v0.11

> v0.11 在既有 Hydra II / III progression 上加入 Playtest 4 玩家端章節投影：generation-local progress、semantic transition overlay、generation stage palettes。核心規則與 Save schema 不變。

## 1. Top-level flow

```text
INPUT / AUTO
    ↓
ATTACK REQUEST
    ↓
COMBAT
    ↓
ACTIVE HYDRA RULE
    ↓
CUT RESOLUTION
    ↓
LOGICAL STATE + SEMANTIC EVENTS
 ┌───┼────────┬───────────┬───────────┐
 ↓   ↓        ↓           ↓           ↓
NP  ECONOMY  PROGRESSION  UI/VIEW   PERSISTENCE
```

View 只讀結果；Input 只描述玩家意圖；Persistence 只保存 logical state。

## 2. Generation data owns scale

`js/data/progression.js`：

```text
Hydra I   starting 9 · max 9   = 9¹ · 99 kills to next
Hydra II  starting 9 · max 81  = 9² · 99 kills to next
Hydra III starting 9 · max 729 = 9³ · next rule undecided
```

99-kill progression 與 head cap 是不同概念。

## 3. Rule selection by generation

```text
generation 1 → Hydra I Rule
generation 2 → Hydra II Rule
generation 3 → Hydra III shell rule
```

Combat 不寫 generation-specific `if` math。

Hydra I、II、III shell 規則與 v0.10 相同：Hydra II cap 81；NP suppress growth；Hydra III shell reject cut。

## 4. Progression / generation transition

### I → II

```text
99 Hydra I kills
→ generation 2
→ encounter 1
→ heads 9
```

### Hydra II loop

每隻真 kill：

```text
encounter n defeated
→ respawn delay
→ encounter n+1
→ heads 9
```

### II → III

```text
Hydra II encounter 99 defeated
→ generation 3
→ encounter 1
→ heads 9
```

Generation-local completion 仍由 `hydra.encounter + defeated` 表示，不新增 kill counter field。

## 5. Playtest 4 generation progress projection

新增 View projection：

```text
snapshot.hydra.encounter
snapshot.hydra.defeated
+ deterministic generation data
↓
projectGenerationProgress()
↓
completedKills / targetKills / maxHeads
```

規則：

```text
alive    → completed = encounter - 1
defeated → completed = encounter
```

因此 lifetime statistics 不再直接餵玩家主 HUD。

`statistics.totalHydrasKilled` 仍完整保留，TEST panel 可顯示 `TOTAL KILLS`。

這是 presentation projection，不進 Save。

## 6. Semantic generation transition view

Progression 仍只 emit：

```text
hydra:generation-changed
```

Application / View 消費事件：

```text
hydra:generation-changed
→ generation-transition-view.show()
→ CSS animation
```

Important boundary：

```text
transition animation != gameplay delay
```

- 不暫停 GameClock。
- 不使用 gameplay `setTimeout`。
- View 用 `animationend` 收幕。
- Hydra II first-cut Auto guard 仍是原本 progression policy。

## 7. Generation stage palette

`battle-scene.js` 擁有 presentation-only stage palette：

```text
Gen I   neutral dark
Gen II  subtle sickly yellow-green
Gen III cool violet shell
```

Application 每次 render 只傳：

```text
snapshot.hydra.generation
→ stage.setGenerationAppearance(generation)
```

NP tint 是更高優先的 temporary visual state：

```text
NP active
→ red battle tint

NP ends
→ restore current generation palette
```

Palette 不參與 Hydra rule、combat、head cap 或 Save。

## 8. Hydra II first-cut Auto guard

不變：Command Spell I capability 保留；Hydra II 第一次登場且 milestone 缺失時 Auto pause，accepted manual cut 後恢復。

## 9. NP boundary

不變：

```text
66 heads = READY
3s timed modifier
hydra.headGrowth = disabled
```

Hydra I：不排 delayed regrowth。  
Hydra II：`headsSpawned = 0`，因此可砍到 0。

## 10. View boundary

Head pool contract不變：

```text
logical 0–99 → same visible count
logical 100+ → visible 99
```

Hydra II max81 不碰 visual cap；Hydra III max729 可以 >99，但 View 仍最多 99 meshes。

Generation chapter overlay / HUD progress / palette 都不能改 logical heads。

## 11. Persistence

State schema 仍為 1。

Playtest 4 新增的都是 derived / presentation state：

```text
generation progress projection  → not saved
transition animation state       → not saved
stage palette                    → not saved
```

沒有 migration。

## 12. Dependency direction

允許：

```text
data → none
math → plain data/context
systems → math + data + injected interfaces
core → systems + math + data
view → snapshot + semantic events + data projection
save → serializable logical state
```

禁止：

```text
View → mutate encounter / kill counters
transition overlay → pause GameClock
stage palette → change Hydra rule context
lifetime statistics → masquerade as generation-local HUD progress
```

## 13. Current stage

```text
Hydra I 99-kill generation        ✅
Hydra II 81-head / 99-kill loop  ✅
Hydra III 9-head / max729 shell  ✅
Playtest 4 chapter presentation   ✅
Hydra III combat rule            ⛔ not yet
Analyzer                          ⛔ not yet
Command Spell II                  ⛔ not yet
```

最後檢查：

> **Am I adding a new block, or making an old block know too much?**
