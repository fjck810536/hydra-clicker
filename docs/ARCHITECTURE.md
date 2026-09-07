# Hydra Clicker — Architecture v0.13

> v0.13 對齊 Playtest 4.2：保留 Playtest 4.1 的 NP time-stop policy，新增 NP simulation-time countdown projection，以及 Command Spell II Lv.1 prototype 的 NP-only manual multistrike。Combat 仍逐 strike resolve；View 只把同一 request 投影成可見三連斬。Save schema 不變。

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

Combat 不寫 generation-specific `if` math。Hydra II cap81；NP suppress growth；Hydra III shell reject cut。

## 4. Progression / generation transition

```text
99 Hydra I kills
→ Hydra II encounter 1 · heads 9

Hydra II true kill
→ next Hydra II encounter · heads 9

Hydra II encounter 99 defeated
→ Hydra III encounter 1 · heads 9
```

Generation-local completion 由 `hydra.encounter + defeated` 表示，不新增 kill counter field。

## 5. Playtest 4 generation progress projection

```text
snapshot.hydra.encounter
snapshot.hydra.defeated
+ generation data
↓
projectGenerationProgress()
↓
completedKills / targetKills / maxHeads
```

```text
alive    → completed = encounter - 1
defeated → completed = encounter
```

Lifetime `statistics.totalHydrasKilled` 保留給 Statistics / TEST，不直接當本世代 HUD 進度。

## 6. Semantic generation transition view

```text
hydra:generation-changed
→ generation-transition-view.show()
→ CSS animation
```

Transition animation 不是 gameplay delay：不暫停 GameClock、不用 gameplay `setTimeout`，View 用 `animationend` 收幕。

## 7. Generation stage palette

```text
Gen I   neutral dark
Gen II  subtle sickly yellow-green
Gen III cool violet shell
```

NP red tint 優先；NP 結束後恢復當前 generation palette。Palette 不參與 gameplay。

## 8. Hydra II first-cut Auto guard

Command Spell I capability 保留；Hydra II 第一次登場且 milestone 缺失時 Auto pause，accepted manual cut 後恢復。

這個 policy 與 NP time-stop policy 是兩個不同理由，均由 Core composition 注入 Auto Slash；Auto Slash System 本身不知道 Hydra II 或 NP 專名。

## 9. NP rule boundary

NP 的 Hydra rule modifier沒有因時停／令咒 II 改型：

```text
66 heads = READY
3s timed modifier
hydra.headGrowth = disabled
```

Hydra I：不排 delayed regrowth。  
Hydra II：`headsSpawned = 0`，因此 Manual Cut 可真正把頭數砍低／砍到0。

NP 期間砍掉的頭不會在 expiry 後補回。

## 10. NP time-stop application policy

`NP System` 提供：

```js
np.isActive(snapshot)
np.getWindowStatus(snapshot)
```

`getWindowStatus` 回傳：

```js
{
  active,
  startsAt,
  endsAt,
  remainingMs
}
```

這些都從 simulation-time timed modifiers 導出；`remainingMs` 不是額外 persistent state。

Core 注入 Auto Slash policy：

```text
playable generation
AND autoSlash capability
AND Hydra attackable
AND intro guard allows
AND NP window NOT active
→ Auto Slash enabled
```

因此：

```text
NP active
→ Auto accumulator reset / no auto requests
→ Manual Input remains available

NP ends
→ Auto can accumulate again on later Game Clock ticks
```

未來若某能力允許 Auto 在 NP 中工作，只需修改／擴充這個注入 policy，不必改 Hydra rule 或 Auto Slash internals。

## 11. NP lifecycle semantic events

```text
np:released { atMs, endsAt, modifier }
np:ended    { atMs, endedAtMs }
```

`np:ended` 由 NP System 在 `clock:tick` 清除最後一個已到期 NP window 後 emit。

View consumption：

```text
np:released → 寶具解放 / ナインライブズ / 射殺す百頭 card
active      → small GameClock-derived countdown
np:ended    → TIME RESUMES / 時は動き出す cue
```

Presentation 不決定 NP 開始／結束時間。

## 12. Playtest 4.2 Command Spell II prototype boundary

玩家端第一段技法暫定為：

```text
NP inactive
→ manual tap → strikeCount 1

NP active + milestone command-spell-2-lv1
→ manual tap → strikeCount 3
```

Ownership 分工：

```text
Data
→ prototype effect magnitude = 3

Progression State
→ existing milestone container records prototype unlock

Core / Application
→ reads NP active + milestone
→ chooses default Manual Attack strikeCount

Manual Input
→ emits the requested positive strikeCount

Combat
→ loops through strikes one by one
→ each strike gets its own rule resolution / semantic events
→ terminal kill stops the batch

Berserker View
→ reads semantic request metadata
→ shows one rapid visible multi-strike combo
```

禁止：

```text
Command Spell II → heads -= 3
View animation → schedule three gameplay cuts
Hydra Rule → know Command Spell II name
Manual Input → know NP or command-spell milestone
```

正式 unlock kills / Humanity Evil cost 尚未決，因此 prototype 只透過 TEST session milestone 開啟。TEST suppression prevents it from entering the player's normal save.

## 13. View boundary

Head pool contract不變：

```text
logical 0–99 → same visible count
logical 100+ → visible 99
```

Hydra II max81 不碰 visual cap；Hydra III max729 可以 >99，但 View 仍最多99 meshes。

NP phase overlay 與 timer 都 `pointer-events:none`，不能阻擋 Manual Cut。

Berserker multi-strike animation consumes semantic outcomes/request metadata only；它不決定 damage 或 strike timing in logic。

## 14. Persistence

State schema 仍為1，沒有 migration。

NP active state仍由既有 timed modifier + simulation timeline 保存；`remainingMs` 是 derived projection，`np:ended` 是 runtime semantic event。

Command Spell II prototype 使用既有 `progression.milestones` 容器，不新增 field；目前只由 non-persistent TEST session 開啟。

Playtest4 chapter overlay、NP card、timer、resume cue、palette、multi-strike animation 都不進 Save。

## 15. Dependency direction

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
View → mutate encounter / head state
NP animation / timer → determine modifier expiry
Auto Slash System → hardcode NP/Fate names
NP System → directly disable Auto Slash internals
Manual Input → inspect command-spell progression
Command Spell II → direct Hydra mutation
transition overlay → pause GameClock
```

## 16. Current stage

```text
Hydra I 99-kill generation                 ✅
Hydra II 81-head / 99-kill loop           ✅
Hydra III 9-head / max729 shell           ✅
Playtest 4 chapter presentation            ✅
Playtest 4.1 NP time stop                  ✅
Playtest 4.2 NP countdown                  ✅
Command Spell II Lv.1 ×3 TEST prototype    ✅
Command Spell II formal economy            ⛔ undecided
Hydra II cap hit presentation              ⛔ candidate
Hydra III combat rule                      ⛔ not yet
Analyzer                                   ⛔ not yet
```

最後檢查：

> **Am I adding a new block, or making an old block know too much?**
