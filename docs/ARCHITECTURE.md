# Hydra Clicker — Architecture v0.7

> 目標：數學規則、戰鬥、經濟、玩家輸入、Babylon View、Persistence 可獨立測試與替換。v0.7 對齊 Playtest 2.4 的 66-point NP gauge 與 64 APS Command Spell I MAX。

## 1. Top-level flow

```text
INPUT / AUTO
    ↓
ATTACK REQUEST
    ↓
COMBAT
    ↓
HYDRA RULE
    ↓
CUT RESULT / SEMANTIC EVENTS
    ↓
LOGICAL STATE
 ┌───┼────────┬─────────┬────────────┐
 ↓   ↓        ↓         ↓            ↓
NP  ECONOMY  PROGRESSION UI/VIEW   PERSISTENCE
```

View 永遠只讀結果；Input 只描述玩家意圖；Persistence 只保存 logical state。

## 2. Layer ownership

### Core / Application

`js/core/game.js`：

- 組裝 State / Clock / Systems / Rules。
- 決定 clock-listener composition order。
- 注入 progression / NP / regen tuning data。
- 暴露 headless runtime API。

目前主要 API：

```text
snapshot()
manualAttack()
releaseNp()
npStatus()
currentRegenDelayMs()
commandSpellIStatus()
buyCommandSpellI()
```

Core 不自己算 Hydra 增殖，不直接操作 Babylon。

### Math / Rules

`js/math/`：

- Hydra logical transition。
- Cut Resolution。
- pending regrowth queue。
- terminal kill 判定。

Hydra I current experimental rule：

```text
non-terminal cut + regen enabled → same-head regrowth scheduled
non-terminal cut + regen disabled → no new regrowth
head count reaches 0 → killed + pending regrowth cancelled
```

Math 不知道 NP、Command Spell、Fate 角色名或 UI。

### Input

`js/input/manual-attack.js`：玩家操作 → Attack Request。

不直接改 head count。

### Systems

`js/systems/`：

- `combat.js` — Request → Rule → State / semantic events。
- `auto-slash.js` — capability + APS + Game Clock → Attack Request。
- `hydra-regrowth.js` — Game Clock 處理 pending regrowth。
- `modifiers.js` — resolve active rule modifiers。
- `np.js` — NP charge / release / timed modifier lifecycle。
- `humanity-evil.js` — kill → currency。
- `command-spells.js` — capability / APS milestone upgrade。
- `progression.js` — defeated / respawn / encounter lifecycle。

### Data

`js/data/progression.js`：

```text
regen curve
NP max / gain / duration
Humanity Evil reward
respawn delays
Command Spell I kill/cost/APS table
```

數值變動不應要求改 Combat / Hydra Rule。

### View

`js/view/` 只讀 snapshot / runtime projection / semantic events。

- Babylon battle stage。
- Hydra head pool。
- Berserker placeholder animation。
- NP red tint。
- HUD。

`logical head count != visible head count`，畫面 cap 99。

### Persistence

`js/core/save.js`：

- logical state only。
- BigInt tagged JSON round-trip。
- simulation time / tick restore。
- localStorage adapter。
- no offline progress。

## 3. Game Clock

Fixed step currently 100ms。

```text
Babylon render FPS
≠
logical Game Clock
```

Gameplay time-based behavior：

```text
regrowth
Auto Slash
NP duration
respawn
future facilities / offline simulation
```

都不能依賴 render FPS。

## 4. NP architecture — Playtest 2.4

### Logical storage

`state.berserker.np` 保持 normalized `0..1`。

原因：

- 不改 state schema。
- 舊存檔自然相容。
- Save contract 不需要 migration。

### Player-facing projection

NP System 擁有：

```text
maxPoints = 66
pointsPerHead = 1
```

每次 accepted `head:cut`：

```text
current normalized state
→ round(normalized × 66)
→ +1 per head
→ cap 66
→ write points / 66 back to normalized state
```

Runtime `npStatus()`：

```js
{
  points,
  maxPoints: 66,
  ready,
  normalized
}
```

HUD 不自行硬算 66。

### Release

66/66 READY → release：

```text
NP gauge = 0
+ timed rule modifier
hydra.regrowth = disabled
3.0s
```

NP modifier 可跨多個 encounters。

## 5. Respawn architecture

Progression 不直接知道 NP source 名稱。

Core 注入 generic condition：

```text
regrowth enabled  → 300ms respawn
regrowth disabled → 100ms burst respawn
```

Clock listener order 必須：

```text
Progression respawn
→ Auto Slash
```

讓 100ms burst 中的新 Hydra 同 tick 可受到 Auto Slash。

## 6. Command Spell I architecture

Command Spell I 同時是：

```text
Lv.1 capability unlock
+
Lv.2–MAX progression stat milestones
```

Data table：

```text
9  → 1 APS
12 → 2
16 → 4
22 → 8
30 → 16
40 → 32
66 → 64 APS MAX
```

System 只做：

```text
validate requirement / currency
→ spend
→ set autoSlash capability if Lv.1
→ set baseAttacksPerSecond
→ append milestone for Lv.2+
→ emit semantic event
```

System 不直接呼叫 Auto Slash internals。

舊存檔：`autoSlash=true` 且沒有 level milestone → 視為 Lv.1。

## 7. Hydra I regen curve

Data-owned：

```text
0 kills  → 1500ms
9 kills  → 350ms
99 kills → 100ms floor
```

0→9 急遽加速；9→99 增幅逐隻趨緩。

Combat 只收到當刀的 `regrowthDelayMs`。

## 8. Current playtest pacing hypothesis

```text
Active opening
→ human tapping eventually loses to regen
→ about 66 head cuts earns first NP

9 kills
→ Auto Slash unlock

30 kills
→ 16 APS noticeably improves pacing

40 kills
→ 32 APS
→ deliberate plateau until kill 66

66 kills
→ 64 APS MAX
→ automation can dominate most of late Hydra I

late ~95
→ regen floor catches up
→ one NP burst can finish toward 99
```

這是 tuning hypothesis，不是 architecture invariant。

## 9. Dependency direction

允許：

```text
data → none
math → plain data/context
systems → math + data + injected core interfaces
core → systems + math + data
view → snapshot + semantic events + application projection
save → serializable logical state
```

禁止：

```text
math → Babylon / DOM
view → mutate rule/state
command spell → call Auto Slash internals
NP → spawn Hydra
progression → check source === 'np'
combat → award currency / respawn
save → offline battle calculation
```

## 10. State / Save boundary

Persistent logical state includes：

```text
heads / encounter / pending regrowth
normalized NP ratio
active timed modifiers
Humanity Evil
Command Spell capability
base APS
progression milestones
statistics
simulation time / tick
```

不保存：

```text
mesh
particle
DOM
animation state object
visible-head cache
NP display points cache
```

## 11. Current stage

```text
Phase 3 Blocks 1–9      ✅
iPhone Playtests        ongoing
Playtest 2.4            current
Hydra II                not yet
```

最後檢查仍是：

> 我是在增加一塊新積木，還是在讓舊積木知道太多？
