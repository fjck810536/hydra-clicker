# Hydra Clicker — Architecture v0.9

> v0.9 對齊 Playtest 3 Hydra II Intro，並將 NP 規則從 delayed-regrowth suppression 升級為 generic head-growth suppression。核心原則仍是：規則可以怪，積木邊界不要怪。

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

## 2. Rule selection by generation

Core / Application 擁有 rule composition：

```text
hydra.generation = 1 → Hydra I Rule
hydra.generation = 2 → Hydra II Rule
```

Combat 不寫 generation-specific `if`；只呼叫注入的 `getRule(snapshot)`。

### Hydra I

```text
cut 1
→ -1 now
→ delayed same-head regrowth unless head growth is suppressed
→ reaching 0 = Playtest 2 terminal kill
```

### Hydra II Intro

```text
cut 1
→ headsRemoved = 1
→ headsSpawned = 2 immediately when head growth is enabled
→ headsSpawned = 0 when head growth is suppressed
→ no delayed regrowth event
→ no terminal kill in current intro rule
```

Hydra II `headsSpawned` 是 Cut Resolution 的 immediate structural output，不是 pending regrowth，但仍屬於 generic Hydra head growth。

## 3. Hydra Model owns immediate spawn application

`applyCutResolution()` 統一套用：

```text
logicalHeadCount
- headsRemoved
+ headsSpawned
```

之後才處理 pending regrowth queue。

因此 Math 可以表達：

```text
Hydra I: headsSpawned = 0
Hydra II normal: headsSpawned = 2 per removed head
Hydra II under growth suppression: headsSpawned = 0
future rules: other exact BigInt spawn counts
```

View 不參與計算。

## 4. Combat semantic output

Accepted cut 會發：

```js
{
  type: 'head:cut',
  payload: {
    source,
    amount: headsRemoved,
    spawned: headsSpawned,
    ...
  }
}
```

UI 可以因此顯示：

```text
normal Hydra II: CUT 1 · GROW +2 · Δ +1
NP active:       CUT 1
```

但 presentation 不改 rule state。

## 5. Progression / generation transition

Playtest 3 data：

```text
99 Hydra I kills
→ next encounter becomes Hydra II
```

Progression System：

- 監聽 `hydra:killed` 設定 defeated / respawn deadline。
- clock due 時建立下一 encounter。
- 若已達 Hydra II intro threshold，將：

```text
hydra.generation = 2
progression.hydraGeneration = 2
encounter = 1
heads = startingHeadCount
turn = 0
pendingRegrowth = []
```

並發：

```text
hydra:generation-changed
```

Playtest 2 舊存檔若已經 `99 kills + live Hydra I`，下一個 simulation tick 直接進 Hydra II。

## 6. Hydra II first-cut Auto guard

Command Spell I capability 不被關閉。

Core 注入 Auto Slash `isEnabled(snapshot)` policy：

```text
normal requirements
AND
NOT (
  Hydra II
  AND first-manual-cut milestone missing
)
```

第一個 accepted manual `head:cut` 由 Progression 記錄：

```text
hydra-ii-first-manual-cut
```

之後 Auto Slash 在後續 Game Clock tick 自然恢復。

這個 guard 是 Intro progression policy，不是 Auto Slash System 裡硬編 Hydra II 名稱。

## 7. NP boundary

NP 現在是：

```text
66 heads = READY
3s timed modifier
hydra.headGrowth = disabled
```

Modifier resolver 將它投影成：

```js
{
  headGrowthEnabled: false,
  regrowthEnabled: false
}
```

Hydra Rule 不知道 source 是 NP，只讀 ruleContext。

### Hydra I

```text
headGrowthEnabled = false
→ cut works
→ no new delayed regrowth event
```

### Hydra II

```text
headGrowthEnabled = false
→ cut works
→ headsSpawned = 0
→ CUT 1 becomes net -1
```

為相容已保存的舊 timed NP modifier，`hydra.regrowth = disabled` 仍被 resolver 當作 `hydra.headGrowth = disabled` 的 legacy alias，直到舊 modifier 自己的 `endsAt` 到期。

## 8. Clock order

Fixed step 目前 100ms。

重要 listener order：

```text
Progression
→ Combat / Auto composition
→ Auto Slash
```

因此：

- due respawn 可以同 tick 被 Auto 攻擊。
- Hydra II generation transition 會在 Auto 判斷前完成。
- intro guard 能阻止 64 APS 在 reveal 前先出刀。

## 9. Data ownership

`js/data/progression.js` 擁有：

```text
Hydra I regen curve
NP 66 / +1 / 3s
respawn 300 / burst 100ms
Command Spell I levels
Hydra II intro threshold / milestone id
```

數值變更不應要求修改 Combat。

## 10. View boundary

HUD / Babylon View 只投影：

```text
hydra.generation
logicalHeadCount
head:cut spawned amount
intro pending state
```

Hydra head pool contract不變：

```text
logical 0–99 → same visible count
logical 100+ → 99 visible heads
```

Hydra II 可以很快超過 99；這只代表 View 進入 cap，不代表 logical growth 停止。

## 11. Persistence

State schema 仍為 1。

Playtest 3 沒新增必填 state field：

- generation 已存在。
- progression.hydraGeneration 已存在。
- intro completion 使用既有 `progression.milestones`。
- NP 仍保存 normalized 0..1。
- active modifier target 是 string data；新 release 使用 `hydra.headGrowth`，舊 `hydra.regrowth` 由 resolver 相容。

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
view → mutate rule/state
Hydra Rule → character/Fate names
Auto Slash → hardcode Hydra II intro
NP → directly mutate Hydra heads
progression → directly call Auto Slash
combat → award currency / spawn next encounter
save → offline battle calculation
```

## 13. Current stage

```text
Hydra I Playtest 2 seal candidate ✅
Playtest 3 Hydra II Intro          ← CURRENT
NP suppresses Hydra I + II growth  ✅
Analyzer                           ⛔ not yet
Command Spell II                   ⛔ not yet
Hydra II final kill rule           ⛔ not yet
```

最後檢查：

> **Am I adding a new block, or making an old block know too much?**
