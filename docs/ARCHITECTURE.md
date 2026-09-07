# Hydra Clicker — Architecture v0.10

> v0.10 對齊 Hydra II 99-kill loop 與 Hydra III shell。核心原則仍是：規則可以怪，積木邊界不要怪。

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

`js/data/progression.js` 現在定義 generation scale：

```text
Hydra I   starting 9 · max 9   = 9¹ · 99 kills to next
Hydra II  starting 9 · max 81  = 9² · 99 kills to next
Hydra III starting 9 · max 729 = 9³ · next rule undecided
```

99-kill progression 與 head cap 是不同概念。

## 3. Rule selection by generation

Core / Application 擁有 rule composition：

```text
generation 1 → Hydra I Rule
generation 2 → Hydra II Rule
generation 3 → Hydra III shell rule
```

Combat 不寫 generation-specific `if` math；只呼叫注入的 `getRule(snapshot)`。

### Hydra I

```text
cut 1
→ -1 now
→ delayed same-head regrowth unless head growth is suppressed
→ reaching 0 = true kill
```

### Hydra II

```text
normal cut 1
→ remove 1
→ immediate structural spawn up to 2
→ clamp final head count to max 81
```

因此：

```text
9  → 10
80 → 81
81 → 81
```

NP / generic growth suppression：

```text
headsSpawned = 0
→ cut becomes net -1
→ reaching 0 = true kill
```

### Hydra III shell

目前只有安全 placeholder rule：

```text
generation = 3
starting heads = 9
max heads = 729
resolveCut → rejected / no mutation
```

Auto Slash 在 generation >= 3 暫停，避免未實作規則被高速呼叫。

## 4. Hydra Model owns immediate spawn application

`applyCutResolution()` 統一套用：

```text
logicalHeadCount
- headsRemoved
+ headsSpawned
```

Hydra II 的 max 81 由 Rule 在輸出 `headsSpawned` 前處理，不由 View clamp logical state。

## 5. Combat semantic output

Accepted cut 發：

```js
{
  type: 'head:cut',
  payload: {
    source,
    amount: headsRemoved,
    spawned: headsSpawned,
    killed,
    ...
  }
}
```

因此 Hydra II 在 81 cap 時可以合法發：

```text
CUT 1 · GROW +1 · Δ 0
```

NP active 則：

```text
CUT 1
```

## 6. Progression / generation transition

### I → II

```text
99 total Hydra I kills
→ generation 2
→ encounter 1
→ heads 9
```

保留第一次 Hydra II manual-cut intro guard。

### Hydra II loop

每隻 Hydra II 真 kill 後：

```text
encounter n defeated
→ respawn delay
→ encounter n+1
→ heads reset to generation startingHeads = 9
```

### II → III

Progression 用 generation-local encounter completion 判斷：

```text
Hydra II encounter 99 defeated
→ generation 3
→ encounter 1
→ heads 9
→ maxHeads metadata 729
```

不需要新增 generation-local kill counter field；`hydra.encounter` 已足以表示目前世代進度。

## 7. Hydra II first-cut Auto guard

Command Spell I capability 不被關閉。

只有 Hydra II 第一次登場且 milestone 尚未完成時：

```text
Auto Slash paused
→ first accepted manual cut
→ milestone hydra-ii-first-manual-cut
→ later tick Auto resumes
```

後續 Hydra II encounters 不重播 intro guard。

## 8. NP boundary

NP：

```text
66 heads = READY
3s timed modifier
hydra.headGrowth = disabled
```

Resolver：

```js
{
  headGrowthEnabled: false,
  regrowthEnabled: false
}
```

Hydra I：不排 delayed regrowth。  
Hydra II：`headsSpawned = 0`，因此可真正砍到 0。

Legacy `hydra.regrowth / disable` 仍是相容 alias。

## 9. Clock order

Fixed step 目前 100ms。

重要 listener order：

```text
Progression
→ Combat / Auto composition
→ Auto Slash
```

因此 due respawn / generation transition 都會先完成，再讓 Auto 判斷是否可攻擊。

## 10. View boundary

Head pool contract完全不變：

```text
logical 0–99 → same visible count
logical 100+ → visible 99
```

這代表：

```text
Hydra II max 81
→ 永遠低於 visual cap

Hydra III max 729
→ logical 可以 >99
→ View 仍最多 99 meshes
```

所以世代 scale 不要求重做 Hydra II visual implementation。

## 11. Persistence

State schema 仍為 1。

沒有新增必填 state field：

- generation 已存在。
- encounter 已存在。
- startingHeadCount 已存在。
- generation maxHeads 是 deterministic Data，不需存檔。
- Hydra III shell 只使用既有 generation / encounter / head fields。

所以 Save format 不需 migration。

## 12. Dependency direction

允許：

```text
data → none
math → plain data/context
systems → math + data + injected interfaces
core → systems + math + data
view → snapshot + semantic events + application projection
save → serializable logical state
```

禁止：

```text
math → Babylon / DOM
view → mutate logical head cap
NP → directly mutate Hydra heads
progression → directly call Auto Slash
combat → spawn next encounter
save → calculate generation progression
```

## 13. Current stage

```text
Hydra I 99-kill generation       ✅
Hydra II 81-head / 99-kill loop ✅
Hydra III 9-head / max729 shell ✅
Hydra III combat rule           ⛔ not yet
Analyzer                         ⛔ not yet
Command Spell II                 ⛔ not yet
```

最後檢查：

> **Am I adding a new block, or making an old block know too much?**
