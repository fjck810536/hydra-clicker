# Hydra Clicker — Architecture v0.12

> v0.12 在 Playtest 4 chapter presentation 上加入 Playtest 4.1 NP time-stop application policy：NP 的 Hydra rule modifier 不變，但 active NP window 會暫停 Auto Slash；Manual Input 保留。NP expiry 由 Game Clock emit `np:ended`，View 只負責演出時間恢復。

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

NP 的 Hydra rule modifier **沒有因時停改型**：

```text
66 heads = READY
3s timed modifier
hydra.headGrowth = disabled
```

Hydra I：不排 delayed regrowth。  
Hydra II：`headsSpawned = 0`，因此 Manual Cut 可真正把頭數砍低／砍到 0。

NP 期間砍掉的頭不會在 expiry 後補回。

## 10. Playtest 4.1 NP time-stop application policy

`NP System` 現在提供：

```js
np.isActive(snapshot)
```

它只判斷 simulation-time 上是否存在 active `source: 'np'` timed modifier。

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
→ Manual Input remains untouched

NP ends
→ Auto can accumulate again on later Game Clock ticks
```

這不是 Hydra rule modifier 的新 target，也不是 Auto Slash System 裡寫 `if (np)`；它是 Application composition policy。

未來若某個能力允許 Auto 在 NP 中工作，只需修改／擴充這個注入 policy，不必改 Hydra rule 或 Auto Slash internals。

## 11. NP lifecycle semantic events

Release 已有：

```text
np:released { atMs, endsAt, modifier }
```

Playtest 4.1 新增：

```text
np:ended { atMs, endedAtMs }
```

`np:ended` 由 NP System 在 `clock:tick` 清除最後一個已到期 NP window 後 emit。

若未來存在重疊 NP windows：只有最後一個 active NP window 消失時才 emit time-resume semantic event。

View consumption：

```text
np:released → 寶具解放 / ナインライブズ / 射殺す百頭 card
np:ended    → TIME RESUMES / 時は動き出す cue
```

Presentation animation 不決定 NP 開始／結束時間。

## 12. View boundary

Head pool contract不變：

```text
logical 0–99 → same visible count
logical 100+ → visible 99
```

Hydra II max81 不碰 visual cap；Hydra III max729 可以 >99，但 View 仍最多99 meshes。

NP phase overlay `pointer-events:none`，不能阻擋 Manual Cut。

## 13. Persistence

State schema 仍為1，沒有 migration。

NP active state仍由既有 timed modifier + simulation timeline 保存；`np:ended` 是 runtime semantic event，不是需要保存的新 state。

Playtest4/4.1 的 chapter overlay、NP card、resume cue、palette 都不進 Save。

## 14. Dependency direction

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
NP animation → determine modifier expiry
Auto Slash System → hardcode NP/Fate names
NP System → directly disable Auto Slash internals
transition overlay → pause GameClock
```

## 15. Current stage

```text
Hydra I 99-kill generation        ✅
Hydra II 81-head / 99-kill loop  ✅
Hydra III 9-head / max729 shell  ✅
Playtest 4 chapter presentation   ✅
Playtest 4.1 NP time stop         ✅
Hydra II cap hit presentation    ⛔ next candidate
Hydra III combat rule            ⛔ not yet
Analyzer                          ⛔ not yet
```

最後檢查：

> **Am I adding a new block, or making an old block know too much?**
