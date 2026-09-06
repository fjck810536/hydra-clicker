# Hydra Clicker — Architecture v0.6

> 目標：每一塊都可以單獨測試、替換、重寫，不讓「數學規則」「遊戲經濟」「玩家輸入」「Babylon.js 畫面」互相糾纏。v0.6 對齊第一次 iPhone Playtest 後的 Hydra I tuning。

## 1. 頂層資料流

```text
INPUT / AUTO SYSTEMS
        ↓
   ATTACK REQUEST
        ↓
      COMBAT
        ↓
HYDRA RULE ENGINE
        ↓
CUT RESULT / REGROWTH EVENTS
        ↓
GAME STATE
   ┌────┼────────────┬───────────┬─────────────┐
   ↓    ↓            ↓           ↓             ↓
ECONOMY PROGRESSION  UI          VIEW       PERSISTENCE
   ↓        ↓                     ↓             ↓
CAPABILITY / UNLOCK            Babylon.js   versioned save
```

View 永遠只讀取結果，不決定數學；Input 只描述玩家意圖，不直接修改遊戲狀態。Economy / Progression 只監聽語義事件，不得把周回與獎勵寫進 Combat。Persistence 只保存 logical state，不保存 Babylon / DOM presentation objects。

## 2. 目前目錄

```text
hydra-clicker/
├── index.html
├── css/style.css
├── docs/
│   ├── GAME_DESIGN.md
│   ├── ARCHITECTURE.md
│   ├── BLOCK_CONTRACTS.md
│   ├── EFFECT_MODIFIER_ARCHITECTURE.md
│   ├── PLATFORM_CONTRACT.md
│   ├── SAVE_CONTRACT.md
│   ├── PLAYTEST_1.md
│   └── PATCH_PLAN_HYDRA_I_TUNING.md
├── js/
│   ├── core/
│   │   ├── game.js
│   │   ├── clock.js
│   │   ├── event-bus.js
│   │   ├── state.js
│   │   └── save.js
│   ├── math/
│   │   ├── hydra-model.js
│   │   ├── hydra-rules.js
│   │   └── cut-resolver.js
│   ├── input/manual-attack.js
│   ├── systems/
│   │   ├── combat.js
│   │   ├── auto-slash.js
│   │   ├── hydra-regrowth.js
│   │   ├── modifiers.js
│   │   ├── np.js
│   │   ├── humanity-evil.js
│   │   ├── command-spells.js
│   │   └── progression.js
│   ├── view/
│   │   ├── battle-scene.js
│   │   ├── berserker-view.js
│   │   ├── hydra-view.js
│   │   ├── head-pool.js
│   │   └── hud-view.js
│   └── data/progression.js
└── assets/
```

舊的 `js/game.js`, `js/hydra.js`, `js/heracles.js` 仍保留供回溯；正式入口已是 `index.html` + `js/app.js`。

## 3. Core

### `game.js`

唯一負責把積木接起來。

可以：
- 初始化／恢復 state。
- 啟動／恢復 clock。
- 註冊 systems。
- 注入 Hydra rule 與 progression data。
- 暴露 headless runtime API。

不可以：
- 自己計算 Hydra 增殖。
- 自己算 NP。
- 自己發人類惡。
- 自己決定令咒資格。
- 直接生成 3D mesh。

目前 runtime 對外：

```text
snapshot()
manualAttack()
releaseNp()
commandSpellIStatus()
buyCommandSpellI()
```

### `clock.js`

GameClock 提供固定 simulation timeline：

```text
fixed step
animation frame 分離
save restore time/tick
future offline progress boundary
```

遊戲邏輯不能依賴實際 FPS。Save 後重開會從 saved `simulationTimeMs / tick` 繼續；目前不使用 wall-clock 補算 offline progress。

### `event-bus.js`

語義事件包括：

```text
clock:tick
attack:requested
attack:resolved
head:cut
head:regrow
hydra:killed
hydra:respawned
np:charge
np:released
currency:gain
currency:spend
command-spell:available
command-spell:unlocked
```

listener 統一收到：

```js
{ type, payload }
```

### `save.js`

只負責 logical state serialization / storage adapter：

```text
serializeGameSave()
deserializeGameSave()
createSaveStore()
```

BigInt 精確 round trip；Browser application 目前用 `localStorage`；Babylon / DOM / View objects 永不進 Save。

## 4. Math / Hydra

### `hydra-model.js`

只處理 logical transition：

```text
apply cut result
pending regrowth queue
cancel regrowth
process due regrowth
logical statistics
```

### `hydra-rules.js`

不同世代只換 rule，不讓 Combat 寫 generation 專用 `if`。

### Hydra I — Playtest 2 current rule

普通 non-terminal cut：

```text
remove heads
if regrowth enabled → schedule same-head regrowth
if regrowth disabled → no new regrowth
```

terminal cut：

```text
remaining heads = 0
→ depleted = true
→ killed = true
→ cancelPendingRegrowth = true
```

這是 Hydra I 的 **Playtest 2 experimental rule**。`depleted` 與 `killed` 仍是不同概念，之後世代可以再次分離。

### `cut-resolver.js`

輸入：

```text
hydra state
attack specification
target
turn / time
resolved rule context
```

輸出：

```text
accepted
removed heads
regrowth
spawned branches
materials
depleted / killed
cancelPendingRegrowth
next turn
```

## 5. Input

`manual-attack.js` 只把玩家操作變成 Attack Request。

Input 不可以：
- 直接改 headCount。
- 直接呼叫 Hydra Rule。
- 播放 animation。
- 決定素材掉落。

## 6. Systems

### Combat

```text
Attack Request
↓
逐 strike 交給 active Hydra Rule
↓
套用 Cut Result
↓
attack:resolved / head:cut / hydra:killed
```

Combat 不知道人類惡、respawn、令咒、動畫。

高攻速 batch 若某一 strike 已 terminal kill，立刻停止該 batch；不對死亡 Hydra 繼續製造多餘 resolution。

### Auto Slash

只讀 capability、有效攻速、可攻擊狀態，產生 Attack Request。

小數攻速使用 accumulator + epsilon；Hydra defeated / 0 heads 時暫停。

### Hydra Regrowth

由 Game Clock 處理 pending regrowth；不使用 gameplay `setTimeout()`。

若 rule modifier 暫時關閉 regrowth，既有 event 保留但暫停；terminal kill 則由 Cut Result 清空 queue。

### Modifiers

目前只需要最小 timed rule-modifier resolver。

```text
state.modifiers.active
↓
resolveRuleContext(now)
↓
Hydra Rule
```

### NP — Playtest 2

目前 prototype：

```text
+0.125 NP / head
8 heads → 100%
release → 3.0s hydra.regrowth disable
scope = timed
```

重要變化：NP **不是 encounter-scoped**。

```text
release NP
↓
Hydra A killed
↓ 300ms
Hydra B respawn
↓
if now < endsAt
NP modifier still active
```

因此同一次寶解可以跨 encounter 連殺多隻。NP 不直接修改 heads，也不負責 spawn Hydra。

### Humanity Evil

```text
hydra:killed → +11 人類惡
```

11 來自 Data，不是 system 常數。

### Command Spell I

```text
requires 9 kills
cost 99 人類惡
unlock combat.autoSlash
```

Command Spell system 只寫 capability state；不直接呼叫 Auto Slash。

### Progression / Encounter Loop — Playtest 2

```text
hydra:killed
↓
defeated = true
↓
300ms Game Clock delay
↓
new Hydra I encounter
```

重生：
- heads = startingHeadCount
- turn = 0
- pending regrowth = []
- defeated = false
- encounter +1
- 清除真正 `scope: encounter` modifier
- **不清除 `scope: timed` NP modifier**

目前刻意只用單一 300ms respawn。尚未加入「NP active 時 100ms」特例，避免 Progression 直接知道 NP；若實機仍嫌慢，再用正式 progression/encounter modifier 解決。

## 7. View / Babylon.js

### Stage

- iOS portrait-first 100dvh
- orthographic side-view
- BERSERKER left anchor
- HYDRA right anchor

### Berserker View

目前仍是 placeholder animation machine；本輪不做正式 B叔 art pass。

### Hydra View — Playtest 2

仍只吃 logical snapshot。

Playtest 1 後的視覺修改：
- 移除 bulky torso / haunch / tail。
- 只保留 tiny root base。
- 初始 9 heads 由窄根部向上、向左右逐層擴散。
- 保留少量 depth / height variation。
- Head Pool contract 不變。

### Head Pool

```text
logical 0–99 → visible same count
logical 100+ → visible 99
```

初始只建 9 slots，需要時按需擴到最多 99。

View 永遠不得把 mesh count 寫回 logical state。

### HUD / Fixed Controls

HUD 只讀 snapshot / application projection。

Playtest 1 發現 iOS NP button 偶發 smart zoom，因此 NP / Command Spell 等 fixed controls 採 scoped gesture lock：

```text
touch-action: none
pointerup → command
pointer-generated click default suppressed
dblclick / iOS gesture default suppressed
keyboard click preserved
```

這個規則不應全域套到未來 Drawer / Panel；長面板仍可局部 scroll。

## 8. Data

`data/progression.js` 目前 tuning：

```text
humanityEvilPerKill = 11n
respawnDelayMs = 300
requiredHydraKills = 9n
Command Spell I cost = 99n
```

`9 × 11 = 99` 只是 prototype tuning，不是架構常數。

## 9. Dependency Direction

允許：

```text
data → none
math → data / plain context
input → injected snapshot + event interface
systems → math + data + injected core interfaces
core/application → composition
view/audio → snapshot + semantic events + data
save → serializable logical state + storage adapter
```

禁止：

```text
math → Babylon / DOM
input → mutate Hydra state
systems → mesh
view → mutate rules
command spell → call Auto Slash internals
combat → award currency / respawn
NP → spawn Hydra
progression → inspect NP source name
save → Babylon / DOM / offline battle calculation
```

## 10. Snapshot / Persistence

View 拿 read-only logical snapshot；Save 保存同一邏輯世界，包括：

```text
Hydra logical state
pending regrowth
NP / active timed modifiers
currencies
command-spell capabilities
progression
statistics
simulation time / tick
```

UI formatting BigInt 與 persistence serialization 是不同責任。

Playtest 2 沒有改 state schema，所以 Playtest 1 的既有存檔仍可直接載入。

## 11. Current Stage

```text
Phase 3 Blocks 1–9        ✅
Playtest 1 on iPhone       ✅
Hydra I Tuning A–E         ✅ implemented
Playtest 2 on iPhone       ← NEXT
Hydra II                   ⛔ not yet
```

Playtest 2 只需要驗證：

1. fixed controls 還會不會 double-tap zoom。
2. 普通砍到 0 就 kill 是否比較有趣。
3. NP timed window 能不能自然連殺多隻。
4. 300ms respawn 是否太快／剛好／仍太慢。
5. Hydra outward fan silhouette 是否比胖 body 清楚。

B叔美術暫緩；Playtest 2 / Grill 後再決定 Hydra II。
