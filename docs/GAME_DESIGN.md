# Hydra Clicker — Game Design v0.14

> Playtest 5：依 `02_player_facing/HYDRA_III_COMMAND_III_PROPOSAL.md` 把 Hydra III 從 shell 提升成可玩世代。Hydra III 沿用 `CUT 1 → GROW +2`，但 logical cap 擴成 729；第一次超過 99 顆、到達 100 logical heads 時解鎖觀測型 Tree View。Command Spell III 的機制先落地為「把令咒 I 的 Auto Slash 帶進 NP」，倍率依序 1/9 → 1/3 → FULL；正式 Humanity Evil 價格仍維持 TBD，只透過 TEST 驗證。

## 1. 核心一句話

玩家一開始以為自己在操縱狂戰士討伐會復原的九頭蛇；Hydra II 把普通攻擊翻面成 **CUT 1 → GROW 2**，迫使玩家利用 NP 的 head-growth suppression 與 Command Spell II 手動連斬。Hydra III 不再換一條新算式，而是把同一條規則擴到 **729 logical heads**，讓「畫面上的怪物」第一次無法直接代表真正數量，並用 Tree View 開始把玩家從動作遊戲帶向結構觀測。

世代規模目前定義為：

```text
Hydra I   starting 9 · max 9   = 9¹
Hydra II  starting 9 · max 81  = 9²
Hydra III starting 9 · max 729 = 9³
```

Hydra I / II 以 **99 kills** 作為下一代門檻；99 是「要殺幾隻」，不是 head cap。Hydra III 的下一世代條件仍未決。

目標：

1. 不懂數學也能爽玩的 clicker。
2. Active tapping 與 idle automation 都有存在理由。
3. 規則反轉本身要先好玩，再逐步揭露數學。
4. 世代擴張與 View mesh cap 分離。
5. 玩家先感覺「數字逃出畫面」，再去理解背後結構。
6. Hydra I 快速建立 automation fantasy；Hydra II 開始資源選擇；Hydra III 開始 representation / structure 問題。

## 2. Hydra I — Seal Candidate

核心規則：

```text
starting heads = 9
max heads = 9
accepted cut = -1 head
non-terminal cut → same head regrows after delay
head count reaches 0 → true kill
99 Hydra I kills → Hydra II
```

Regen curve：

```text
0 kills  → 1500ms
9 kills  → 350ms
30 kills → 247ms
50 kills → 174ms
66 kills → 134ms
99 kills → 100ms floor
```

實機節奏仍以 `docs/PLAYTEST_2.md` 為基準。

## 3. NP — dynamic gauge / time-stop window

基礎狀態：

```text
NP MAX = 66
1 accepted head cut outside NP = +1 NP
66 / 66 = READY
release = 0
window = 3000ms
```

Command Spell II 會改變未來 NP 的 `maxPoints`、`durationMs` 與 NP-only manual strike count；NP System 本身仍負責 charge / release / active window lifecycle。

NP 對 Hydra rule 的效果由 timed modifier 表達：

```text
hydra.headGrowth = disabled
scope = timed
```

可跨 encounter / generation transition，直到 `endsAt`。

規則效果：

```text
Hydra I + NP
→ delayed same-head regrowth is not scheduled

Hydra II / III + NP
→ immediate structural GROW is suppressed
→ each resolved cut becomes net -1
```

玩家端「時停」行為：

```text
NP active
→ head growth disabled
→ Manual Cut 仍可使用
→ Command Spell II STRIKE 決定每次 manual tap 解析幾刀
→ active window 內的 cuts 不充下一條 NP
→ active window 內再次寶解會被拒絕
→ Auto Slash 預設暫停
→ 若已擁有 Command Spell III，Auto 可按 III 的比例進入 NP

NP ends
→ emit time-resume semantic cue
→ Auto Slash 回到令咒 I 的完整 APS
→ NP charge 重新開始
→ Hydra 正常生長規則恢復
```

Command Spell III 只改 Auto execution policy / effective APS；它**不修改** NP head-growth modifier，也不把令咒 II 的手動 ×3 / ×6 / ×9 套到 Auto 上。

NP 期間砍掉的頭不是延後債務；window 結束時不會補回。NP window 是「花掉已蓄能量的特殊技法狀態」，不是在同一個時停內養出下一發寶具的循環。

### 可見倒數

NP active 時顯示 compact timer，例如：

```text
TIME STOP
3.0 s
MANUAL ×1
```

升級後可顯示 `MANUAL ×3 / ×6 / ×9`。倒數由 GameClock / modifier deadline 投影，不由 CSS 控制 lifecycle。

寶解 presentation：

```text
寶具解放
ナインライブズ
射殺す百頭
```

NP 結束：

```text
TIME RESUMES
時は動き出す
```

所有動畫只負責 presentation。

## 4. Command Spell I — affordability-driven cross-generation progression

APS 身分保持 powers-of-three ladder：

```text
1 → 3 → 9 → 27 → 81 → 243 → 729 APS
```

目前正式價格與章節分工：

| Chapter role | APS after purchase | Humanity Evil cost |
|---|---:|---:|
| Hydra I | 1 | 99 |
| Hydra I | 3 | 33 |
| Hydra I | 9 | 66 |
| Hydra I | 27 | 99 |
| Hydra II | 81 | 1782 |
| Hydra II | 243 | 2178 |
| Hydra III | 729 | **TBD** |

### Availability rule

Lv.1～Lv.6 **沒有額外 kill gate**。

```text
前一級已購買
AND Humanity Evil >= 當前價格
→ 可購買 / 玩家端 sigil 應亮起
```

自然遊戲下：

```text
kill 9  → 累積 99 → 買 1 APS
kill 12 → 再累積 33 → 買 3 APS
kill 18 → 再累積 66 → 買 9 APS
kill 27 → 再累積 99 → 買 27 APS
```

Hydra I 全買至 27 APS：

```text
99 + 33 + 66 + 99 = 297 人類惡
```

Hydra I 99 kills 總收入：

```text
99 × 11 = 1089
```

因此正常全買後進 Hydra II 約帶：

```text
1089 - 297 = 792 人類惡
```

Hydra II：

```text
792 + (30 × 33) = 1782
→ 純令咒一流約 Hydra II #30 可買 81 APS

再 66 × 33 = 2178
→ 純令咒一流約 Hydra II #96 可買 243 APS
```

任何 Command Spell II 消費都會把 81 / 243 往後推，形成 Hydra II build choice。

### 729 APS boundary

729 APS 仍是有效等級、TEST 與既有已擁有狀態也必須能表示；但正式 Humanity Evil 價格尚未決定。

```text
正常玩家到 243 APS
→ 下一級顯示 729 APS / PRICE TBD
→ 正式 purchase rejected
```

不得使用舊 `24057`，也不得從 1782 / 2178 機械外推新價格。

令咒 I capability 與已購升級跨 Hydra generation 保留。NP 時停對 Auto 的預設暫停可由 Command Spell III bridge 部分解除，但不移除或重寫令咒 I 本身。

## 5. Command Spell II — formal NP progression

玩家端文字身份：

> **「快點……再快點……！」**

`射殺す百頭` 留給 Noble Phantasm presentation，不作為第二令咒名稱。

基礎：

```text
1 cut / tap · 3 s · 66 NP
```

正式 canonical 9-beat：

| Lv | Beat | Eligibility / reveal | Cost | NP requirement | NP manual | Duration |
|---:|---|---|---:|---:|---:|---:|
| 1 | STRIKE | Hydra II first manual reversal cut · **0 kills** | 297 | 132 | ×3 | 3 s |
| 2 | EFFICIENCY I | Hydra II 9 kills | 198 | 66 | ×3 | 3 s |
| 3 | TIME | Hydra II 18 kills | 396 | 198 | ×3 | 9 s |
| 4 | STRIKE | Hydra II 27 kills | 396 | 396 | ×6 | 9 s |
| 5 | EFFICIENCY II | Hydra II 39 kills | 330 | 198 | ×6 | 9 s |
| 6 | TIME | Hydra II 54 kills | 495 | 594 | ×6 | 27 s |
| 7 | STRIKE | Hydra II 66 kills | 594 | 792 | ×9 | 27 s |
| 8 | EFFICIENCY III | Hydra II 81 kills | 495 | 396 | ×9 | 27 s |
| 9 | TIME · MAX | Hydra II 99 kills | 693 | 1188 | ×9 | 81 s |

### First-level anti-softlock invariant

第一級**不得要求先殺死任何 Hydra II**。

```text
Hydra II encounter 1 · 9 heads
→ Auto 暫停，玩家手動第一刀
→ 9 → 10 / CUT 1 → GROW +2
→ first-reversal milestone 成立
→ 同一隻 Hydra II 仍活著
→ 若 Humanity Evil >= 297，令咒 II 立即亮起可買
```

正常 Hydra I 路徑買完 27 APS 後預期約帶 792 人類惡進 Hydra II，因此 297 的首級價格應可安全負擔；未來若 Hydra I 新增其他花費，必須重新檢查這個 anti-softlock 保證。

後續 reveal cadence：

```text
9 / 18 / 27 / 39 / 54 / 66 / 81 / 99 Hydra II kills
```

Canonical NP requirement rhythm：

```text
66 → 132 → 66 → 198 → 396 → 198 → 594 → 792 → 396 → 1188
```

Multistrike 只作用於 NP / time stop 中的**手動輸入**：

```text
ordinary manual → 1 tap = 1 cut
NP manual       → 1 tap = 3 / 6 / 9 separate cut resolutions
NP auto         → 不繼承此倍率
```

每刀都產生自己的 semantic cut；中途 true kill 時 batch 在 killing strike 停止。

TIME upgrade 只影響**下一次**寶解。已經 active 的 NP modifier 有 release 當下固定的 `endsAt`，不會買升級後在半途中突然延長。

NP max 改變時保留**實際已充點數**，而不是保留百分比：

```text
33 / 66
buy STRIKE I
→ 33 / 132
```

升級 modal 的 `NEXT` 揭露完整結果：

```text
CURRENT  ×3 · NP 66  · 3s
NEXT     ×3 · NP 198 · 9s
```

目前 runtime 依 canonical 9-beat 線性購買。三 branch 自由購買仍等玩家端定義 order-independent NP requirement composition。

## 6. Humanity Evil — true-kill economy

Humanity Evil 只由 true Hydra kill 取得，不由 head cut / spawn / cap farming 取得。

```text
Humanity Evil / kill = 11 × 3^(generation - 1)
```

因此：

```text
Hydra I   11
Hydra II  33
Hydra III 99
Hydra IV 297
```

NP 是 encounter 內切頭循環資源；Humanity Evil 是跨 encounter / 跨世代長期資源。

## 7. Hydra II — 99-kill generation

### 登場

```text
99 Hydra I kills
→ HYDRA II encounter 1
→ starting heads = 9
```

第一次登場保留 first-cut reveal：Auto Slash 暫停，等玩家手動第一刀。該第一刀同時是 Command Spell II Lv.1 的 gameplay eligibility milestone。

### 正常規則

```text
CUT 1
→ GROW 2 immediately
→ net +1
```

Hydra II 邏輯上限：

```text
max heads = 81 = 9²
```

接近上限：

```text
80 → cut 1 / grow 2 → 81
81 → cut 1 / grow 1 → 81
```

### NP kill window

```text
head growth disabled
Auto Slash 預設 paused
NP charge paused
↓
manual CUT / multistrike
→ GROW 0
→ net -1 per resolved strike
```

最後一頭：

```text
1 → 0
→ Hydra II true kill
→ +33 人類惡
```

下一隻 Hydra II 重新從 9 頭開始；同一 NP window 若仍有效，可以跨 encounter 繼續禁止生長，但不能在該 window 中重新蓄滿或再次 release NP。

### 世代完成

```text
Hydra II encounter 1 ... 99
↓
kill encounter 99
↓
HYDRA III
```

## 8. Hydra III — playable scale / representation chapter

Hydra III 的正常砍擊**刻意不升成 GROW +3**。它沿用 Hydra II 的結構規則：

```text
starting heads = 9
max heads = 729 = 9³

normal:
CUT 1
→ GROW 2 immediately
→ net +1
```

接近上限：

```text
728 → cut 1 / grow 2 → 729
729 → cut 1 / grow 1 → 729
```

NP / head-growth suppression：

```text
CUT 1
→ GROW 0
→ net -1
1 → 0 = true kill
→ +99 人類惡
```

Hydra III true kill 後，在目前尚未定義 Hydra IV transition 的情況下，下一 encounter 仍是 Hydra III、重新從 9 頭開始。

### 第一次 100 頭：數字逃出怪物

View 的既有 hard cap 保持：

```text
logical 0–99 → same visible count
logical 100+ → visible 99
```

因此 Hydra III 第一個重要 representation milestone 是：

```text
99 logical heads
→ ordinary cut
→ 100 logical heads
→ visual Hydra 仍只有 99-head proxy
→ progression.treeViewUnlocked = true
→ emit tree-view:unlocked
```

這不是新的 Hydra Math；它只是第一次讓玩家明確看到：

> **LOGICAL HEAD COUNT ≠ VISIBLE HEAD COUNT**

### Tree View v0 — observation only

目前 Tree View 只讀 snapshot，顯示：

```text
LOGICAL HEADS
VISIBLE PROXY / 99
BEYOND IMAGE
CURRENT CAP / 729
9¹ → 9² → 9³ 的簡化結構提示
```

它**不提供 node targeting，不決定 damage，不修改 Hydra state**。真正結構樹與 targeting 留到後續。

## 9. Command Spell III — Auto-in-NP bridge prototype

玩家端文字身份：

> **「這裡怎麼沒有 SKIP???」**

機制身份：

> **讓既有 Command Spell I Auto Slash 穿進 NP / time stop。**

在沒有 Command Spell III 時：

```text
NP active
→ Auto = 0
```

Playtest 5 固定倍率梯：

| Lv | Auto inside NP | 正式價格 |
|---:|---:|---:|
| 1 | current CS I APS × 1/9 | **TBD** |
| 2 | current CS I APS × 1/3 | **TBD** |
| MAX | current CS I APS × 1 | **TBD** |

例如令咒 I = 9 APS：

```text
Lv.1 → 1 APS inside NP
Lv.2 → 3 APS inside NP
MAX  → 9 APS inside NP
```

令咒 I = 243 APS：

```text
Lv.1 → 27 APS
Lv.2 → 81 APS
MAX  → 243 APS
```

這些 Auto attacks 是普通 automatic strikes；**不繼承 Command Spell II manual ×3 / ×6 / ×9**。

### First eligibility

正式 gameplay eligibility trigger：

```text
第一次在 Hydra III 戰鬥中 release NP
→ milestone hydra-iii-first-np-release
→ Command Spell III slot 被 reveal
```

它不要求：

- 先殺一隻 Hydra III；
- Command Spell II MAX；
- 特定 Command Spell I APS。

這保留「先看到 Hydra III 的問題 → 再看到新工具入口」的節奏，也避免第一隻蛇三被新系統本身鎖死。

### Price boundary

`02_player_facing` 中的 99 / 297 / 891 目前仍只是 candidate，不視為 confirmed。工程端因此：

```text
CS III levels 存在
Auto-in-NP fraction 可測
formal cost = null
purchasePending = true
normal purchase rejected as price-pending
TEST can set Lv.1 / Lv.2 / MAX
```

在價格被玩家端正式確認前，不自行把 candidate 寫死成 economy。

## 10. Chapter / modal presentation

章節 palette：

- Gen I 中性黑灰。
- Gen II 輕微病態黃綠。
- Gen III 冷紫；不再標記為 shell。
- NP 紅屏優先於世代 palette。

`hydra:generation-changed` 切幕仍是 CSS-only presentation，不暫停 GameClock。

三槽令咒 detail modal：

- 成功 PURCHASE / LV UP 後自動關閉。
- `×` 至少 44×44 px。
- 點 card 外 backdrop 關閉。
- 查看資訊不花費 Humanity Evil。
- CS III 在正式價格仍 TBD 時可 reveal / 查看，但 purchase action disabled。

Tree View 也遵守同一手機退出語法：44×44 close + backdrop close。

## 11. Playtest 5 要回答的問題

1. Hydra III 仍使用 `CUT 1 → GROW +2` 是否會讓玩家感到「規則沒變，但規模突然失控」，而不是內容重複。
2. **99 → 100** 時 Tree View 出現，是否真的讀成「數字逃出怪物」的認知轉場。
3. 初版 Tree View 只顯示 logical / visible / overflow / cap，是否已足夠，還是太像 debug panel。
4. 第一次 Hydra III 寶解後露出第三令咒，節奏是否自然。
5. 在同一個令咒 I APS 下，NP Auto 的 **0 → 1/9 → 1/3 → FULL** 是否能明顯感到三段差異。
6. Auto-in-NP 不吃令咒 II manual multistrike，是否容易從體感理解。
7. 第三令咒的 candidate 價格要不要採 99 / 297 / 891，或需要由實機效率重新定價。

## 12. Logical Heads / Tree future

目前 Tree View 已從「候選」變成最小觀測工具，但真正 Analyzer / compressed tree 尚未落地。

後續可能逐步加入：

```text
HEADS
CUTS / SEC
SPAWN / SEC
NET GROWTH
MAX HEADS
branch / subtree representation
compressed tree
node targeting
```

順序原則：先讓玩家因 100+ logical heads 需要 representation，再讓工具逐步變成玩法。

## 13. 目前刻意未決

已確認、不再是待填：

- Command Spell II Lv.1 reveal = Hydra II 第一刀 reversal milestone。
- Hydra III normal rule = `CUT 1 → GROW +2`。
- Hydra III logical cap = 729。
- Tree View first reveal = logical 100。
- Command Spell III first eligibility = Hydra III first NP release。
- Command Spell III mechanic ladder = Auto in NP 1/9 → 1/3 → FULL。

仍未決：

- N3：Hydra II 81 以下的增生 presentation delay。
- N4：Hydra II 81-cap replacement timing。
- N5：NP countdown display precision（暫留 0.1s）。
- Hydra II 81-cap 最終 hit / replacement 演出。
- Command Spell II 三 branch 自由購買時的 NP requirement composition rule。
- multistrike logical resolution 已正確，但 Hydra 頭數逐刀可見 presentation queue 尚可再 polish。
- Command Spell I 729 APS 正式 Humanity Evil 價格。
- **Command Spell III 三級正式 Humanity Evil 價格。**
- Tree View 何時從 observation 升級為真正 node targeting。
- Hydra III 後續 encounter / Hydra IV transition 條件。
- Hydra III 的 729 如何逐步轉成真正 recursive/compressed tree structure。
- Analyzer 出場節點。
- Prestige / Offline Progress。
- 真正 Kirby–Paris 規則在哪一代完整出現。

原則：**Hydra I 建 automation，Hydra II 教規則反轉，Hydra III 讓數字脫離畫面。**
