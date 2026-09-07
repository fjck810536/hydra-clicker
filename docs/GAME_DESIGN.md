# Hydra Clicker — Game Design v0.11

> Playtest 4.3：把 `02_player_facing` 已確認的 Command Spell I / II 曲線正式同步到遊戲。人類惡採世代 ×3 掉落；Command Spell I 改為 powers-of-nine APS；Command Spell II 從 TEST prototype 升為正式 9-beat NP progression。N2–N6 本輪不動。

## 1. 核心一句話

玩家一開始以為自己在操縱狂戰士討伐會復原的九頭蛇；學會靠狂點、NP 與 Auto Slash 跑贏 regeneration 後，Hydra II 把普通攻擊翻面成 **CUT 1 → GROW 2**。NP 則成為短時間「Hydra 法則與自動時間都暫停」的手動爆發窗，Command Spell II 再逐步擴張這個特殊技法狀態。

世代規模目前定義為：

```text
Hydra I   starting 9 · max 9   = 9¹
Hydra II  starting 9 · max 81  = 9²
Hydra III starting 9 · max 729 = 9³
```

每一個已實作世代都以 **99 kills** 作為下一代門檻；99 是「要殺幾隻」，不是 head cap。

目標：

1. 不懂數學也能爽玩的 clicker。
2. Active tapping 與 idle automation 都有存在理由。
3. 規則反轉本身要先好玩，再逐步揭露數學。
4. 世代擴張與 View mesh cap 分離。
5. 玩家先感覺「進入下一幕」，再去理解背後數學。
6. Humanity Evil 第一次在 Hydra II 形成令咒 I / II 的資源分配壓力。

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
1 accepted head cut = +1 NP
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

可跨 encounter。

規則效果：

```text
Hydra I + NP
→ delayed same-head regrowth is not scheduled

Hydra II + NP
→ immediate structural GROW is suppressed
→ each resolved cut becomes net -1
```

玩家端「時停」行為：

```text
NP active
→ Auto Slash 暫停
→ 已購 Auto capability / APS 不消失
→ Manual Cut 仍可使用
→ Command Spell II STRIKE 決定每次 tap 解析幾刀

NP ends
→ emit time-resume semantic cue
→ Auto Slash 重新開始運作
→ 後續普通切割恢復 Hydra 正常生長規則
```

NP 期間砍掉的頭不是延後債務；window 結束時不會補回。

### 可見倒數

NP active 時顯示 compact timer，例如：

```text
TIME STOP
3.0 s
MANUAL ×1
```

升級後可顯示 `MANUAL ×3 / ×6 / ×9`，倒數由 GameClock / modifier deadline 投影，不由 CSS 控制 lifecycle。

N5 本輪未選，因此顯示精度維持既有 **0.1 s**。

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

## 4. Command Spell I — cross-generation APS progression

玩家端曲線正式改為：

```text
1 → 3 → 9 → 27 → 81 → 243 → 729 APS
```

價格：

```text
99 / 198 / 396 / 891 / 2673 / 8019 / 24057 人類惡
```

N2 本輪未選，因此**舊 reveal gates 暫時保留**：

```text
9 / 12 / 16 / 22 / 30 / 40 / 66 lifetime Hydra kills
```

這些只決定何時可見／可買；真正跨世代節奏主要由新價格造成。

第一令咒能力與升級跨 Hydra generation 保留。

NP 時停會暫停 Auto capability，但不移除它。普通時間的高 APS 在 Hydra II 仍是雙面刃：它同時增加切割、NP 充能與 Hydra 的切割誘發增殖壓力。

舊版已升級存檔採保守遷移：不按照舊 level number 免費灌成新 729 APS，而映射到不高於舊實際 APS 的新節點。

## 5. Command Spell II — formal NP progression

基礎：

```text
1 cut / tap · 3 s · 66 NP
```

正式 canonical 9-beat：

| Lv | Beat | Cost | NP requirement | NP manual | Duration |
|---:|---|---:|---:|---:|---:|
| 1 | STRIKE | 297 | 132 | ×3 | 3 s |
| 2 | EFFICIENCY I | 198 | 66 | ×3 | 3 s |
| 3 | TIME | 396 | 198 | ×3 | 9 s |
| 4 | STRIKE | 396 | 396 | ×6 | 9 s |
| 5 | EFFICIENCY II | 330 | 198 | ×6 | 9 s |
| 6 | TIME | 495 | 594 | ×6 | 27 s |
| 7 | STRIKE | 594 | 792 | ×9 | 27 s |
| 8 | EFFICIENCY III | 495 | 396 | ×9 | 27 s |
| 9 | TIME · MAX | 693 | 1188 | ×9 | 81 s |

Hydra II reveal cadence：

```text
3 / 9 / 18 / 27 / 39 / 54 / 66 / 81 / 99 Hydra II kills
```

Canonical NP requirement rhythm：

```text
66 → 132 → 66 → 198 → 396 → 198 → 594 → 792 → 396 → 1188
```

Multistrike 仍只在 NP / time stop 中生效：

```text
ordinary time → 1 tap = 1 cut
NP             → 1 tap = 3 / 6 / 9 separate cut resolutions
```

每刀都會產生自己的 semantic cut；中途 true kill 時 batch 在 killing strike 停止。

TIME upgrade 只影響**下一次**寶解。已經 active 的 NP modifier 有 release 當下固定的 `endsAt`，不會買升級後在半途中突然延長。

NP max 改變時保留**實際已充點數**，而不是保留百分比。例如：

```text
33 / 66
buy STRIKE I
→ 33 / 132
```

目前 runtime 依 canonical 9-beat 線性購買。玩家端另有三 branch 自由購買構想，但尚未定義跨 branch 任意購買順序時的 NP requirement composition；實作不自行發明公式。

## 6. Humanity Evil — true-kill economy

Humanity Evil 只由 true Hydra kill 取得，不由 head cut / spawn / cap farming 取得。

正式世代曲線：

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

NP 是 encounter 內的切頭循環資源；Humanity Evil 是跨 encounter / 跨世代長期資源。

## 7. Hydra II — 99-kill generation

### 登場

```text
99 Hydra I kills
→ HYDRA II encounter 1
→ starting heads = 9
```

第一次登場仍保留 first-cut reveal：Auto Slash 暫停，等玩家手動第一刀。

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
Auto Slash paused
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

下一隻 Hydra II 重新從 9 頭開始；同一 NP window 若仍有效，可以跨 encounter 繼續禁止生長。

### 世代完成

```text
Hydra II encounter 1 ... 99
↓
kill encounter 99
↓
HYDRA III
```

## 8. Hydra III — shell only

目前只實作登場資料與安全停機：

```text
starting heads = 9
max heads = 729 = 9³
encounter = 1
Auto Slash = paused
combat rule = not implemented yet
```

玩家可以看到 Hydra III 登場，但目前不進一步結算其戰鬥。

## 9. Playtest 4 chapter presentation

Hydra II 已有玩家端章節層：

- 世代 local progress：`HYDRA II · 0/99`。
- lifetime kills 只留 Statistics / TEST。
- `hydra:generation-changed` 觸發約 1.25 秒 CSS-only 切幕。
- Gen I 中性黑灰；Gen II 輕微病態黃綠；Gen III 冷紫 shell。
- NP 紅屏優先於世代 palette。

切幕與 palette 都不改 logical state，也不暫停 GameClock。

## 10. Playtest 4.3 要回答的問題

1. Hydra I 在新 1 / 3 / 9 APS 前段是否比舊 doubling tree 更自然。
2. 新價格是否自然讓 27 / 81 APS 成為跨世代目標，而不是 Hydra I 內清空的 tutorial tree。
3. Hydra II +33 人類惡是否讓每次 true kill 都有明顯經濟價值。
4. 玩家是否真的感到「買普通時間 APS」與「買 NP power」之間的資源拉扯。
5. 132→66→198… 的 NP requirement sawtooth 是否讀成壓力／舒緩，而不是莫名其妙改條。
6. 9s / 27s / 81s 時停在 manual-only policy 下是否仍然好玩。
7. ×6 / ×9 在 iPhone 上是否仍能讀成多刀，而不是視覺噪音。

詳細契約見 `docs/PLAYTEST_4_3.md`。

## 11. Analyzer / Tree View 候選後續

Hydra II 已開始提供自然的分析需求：

```text
HEADS
CUTS / SEC
SPAWN / SEC
NET GROWTH
MAX HEADS
```

但此輪仍不加入。只有當玩家真的因 Hydra II / III 規則需要「看懂系統」時再登場。

## 12. Logical Heads ≠ Visible Heads

View contract 不變：

```text
logical 0–99 → same visible count
logical 100+ → visible 99
```

因此：

```text
Hydra II max = 81
→ 永遠不會碰 visible cap

Hydra III max = 729
→ 第一次可能 logical > 99
→ 畫面仍只顯示最多 99 顆
```

## 13. 目前刻意未決

本輪 user 未選、所以不改：

- N2：Command Spell I 新 reveal / availability thresholds。
- N3：Hydra II 81 以下的增生 presentation delay。
- N4：Hydra II 81-cap replacement timing。
- N5：NP countdown display precision（暫留 0.1s）。
- N6：Tree View 第一個正式 reveal point。

其他仍未決：

- Hydra II 81-cap 最終 hit / replacement 演出。
- Command Spell II 三 branch 若允許自由購買時的 NP requirement composition rule。
- Hydra III 正式 cut / growth / termination rule。
- Hydra III 的 729 上限如何與真正 tree structure 對應。
- Analyzer 出場節點。
- Prestige / Offline Progress。
- 真正 Kirby–Paris 規則在哪一代完整出現。

原則：**先讓新的經濟曲線真的跑起來，再由實機決定下一個數字。**
