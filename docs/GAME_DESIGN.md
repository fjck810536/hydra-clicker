# Hydra Clicker — Game Design v0.10

> Playtest 4.2：保留 Playtest 4.1 的 3 秒 manual-only NP 時停，不因 Hydra II「砍不動」立刻拉長時間；先依玩家端設計加入可見倒數，以及 Command Spell II Lv.1 的 NP-only「1 tap → 3 discrete cuts」prototype。正式價格與解鎖節點仍未決。

## 1. 核心一句話

玩家一開始以為自己在操縱狂戰士討伐會復原的九頭蛇；學會靠狂點、NP 與 Auto Slash 跑贏 regeneration 後，Hydra II 把普通攻擊翻面成 **CUT 1 → GROW 2**。NP 則成為短時間「Hydra 法則與自動時間都暫停」的手動爆發窗，後續技法再讓玩家學會如何利用這三秒。

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

## 3. NP — 66 head charge / time-stop window

```text
NP MAX = 66
1 accepted head cut = +1 NP
66 / 66 = READY
release = 0
window = 3000ms
```

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
→ CUT 1 becomes net -1
```

玩家端「時停」行為：

```text
NP active
→ Auto Slash 暫停
→ 已購 Auto capability / APS 不消失
→ Manual Cut 仍可使用
→ 玩家親手利用 3 秒把頭數往下砍

NP ends
→ emit time-resume semantic cue
→ Auto Slash 重新開始運作
→ 後續普通切割恢復 Hydra 正常生長規則
```

NP 期間砍掉的頭不是延後債務；window 結束時不會補回。

Playtest 4.2 暫時繼續保留 **3 秒**。Hydra II 純手砍感到「砍不動」先視為可能的 progression pressure，而不是直接判定 duration 錯誤。

### 可見倒數

NP active 時額外顯示 compact timer：

```text
TIME STOP
3.0 s
MANUAL ×1
```

以 GameClock / modifier deadline 投影剩餘時間；不是 CSS 自己倒數。Command Spell II prototype 啟用時顯示 `MANUAL ×3`。

目前寶解 presentation 原型：

```text
寶具解放
ナインライブズ
射殺す百頭
```

NP 結束時短暫提示：

```text
TIME RESUMES
時は動き出す
```

所有動畫只負責 presentation；真正 3 秒生命週期仍由 Game Clock 決定。

## 4. Command Spell I — current core Auto Slash progression

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

第一令咒能力與升級跨 Hydra generation 保留。

NP 時停會暫停這個既有 Auto capability，但不移除它。未來若玩家端令咒設計要求「讓 Auto 重新進入時停」，應新增／解鎖對應 policy 或 capability，而不是取消目前的時停基準。

## 5. Command Spell II — Lv.1 prototype only

目前只把玩家端相對明確的第一段效果做成 TEST prototype：

```text
NP inactive
→ 1 tap = 1 manual cut

NP active + Command Spell II Lv.1 prototype
→ 1 tap = 3 manual strikes
→ Combat 逐刀 resolve
→ 3 個 separate head:cut events
```

Hydra II + NP：

```text
9
→ tap
→ 8
→ 7
→ 6
```

這不是 `heads -= 3` 的 bulk damage；每一刀仍服從 Hydra Rule，若中途 true kill，Combat 在 killing strike 停止 batch。

View 把同一個 3-strike manual request 投影成短促三連斬；動畫不決定傷害。

### 此輪不固定正式 progression

暫時只用既有 milestone 容器：

```text
command-spell-2-lv1
```

並由 TEST session 開啟。現在**不**決定：

- 正式解鎖於 Hydra II 第幾隻。
- Humanity Evil 價格。
- 是否有 ×6 / ×9。
- 是否延長 NP duration。
- 是否有後續令咒讓 Auto Slash 重新進入 TIME STOP。

先實測 ×3 是否讓三秒變得好玩，再用玩家自然產生需求的時間點決定經濟。

## 6. Hydra II — 99-kill generation

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

接近上限時 growth 被 cap：

```text
80 → cut 1 / grow 2 → 81
81 → cut 1 / grow 1 → 81
```

### NP kill window

NP active：

```text
head growth disabled
Auto Slash paused
↓
manual CUT
→ GROW 0
→ net -1 per resolved strike
```

最後一頭被砍掉：

```text
1 → 0
→ Hydra II true kill
```

下一隻 Hydra II 重新從 9 頭開始；同一 NP window 若仍有效，可跨 encounter 繼續禁止生長，但 Auto 仍保持暫停，直到 NP 真正結束。

### 世代完成

```text
Hydra II encounter 1 ... 99
↓
kill encounter 99
↓
HYDRA III
```

## 7. Hydra III — shell only

目前只實作登場資料與安全停機：

```text
starting heads = 9
max heads = 729 = 9³
encounter = 1
Auto Slash = paused
combat rule = not implemented yet
```

玩家可以看到 Hydra III 登場，但目前不進一步結算其戰鬥。

## 8. Playtest 4 chapter presentation

Hydra II 已有玩家端章節層：

- 世代 local progress：`HYDRA II · 0/99`。
- lifetime kills 只留 Statistics / TEST。
- `hydra:generation-changed` 觸發約 1.25 秒 CSS-only 切幕。
- Gen I 中性黑灰；Gen II 輕微病態黃綠；Gen III 冷紫 shell。
- NP 紅屏優先於世代 palette。

切幕與 palette 都不改 logical state，也不暫停 GameClock。

## 9. Playtest 4.2 要回答的問題

1. `×3` 是否把 Hydra II 從「完全砍不動」推成「差一點／有機會」的三秒窗。
2. 可見 `3.0 → 0.0` 是否讓寶解更緊張、更好笑，而不是干擾連點。
3. 手機上一點三刀是否真的讀成三次斬擊。
4. 81-cap 的 `81 → 81 → 81` 與 NP 中往下掉的對比是否更清楚。
5. 若 ×3 成立，玩家究竟在哪個 Hydra II 進度自然想要它；以此決定正式解鎖節點與價格。
6. 暫時是否仍應維持 3 秒，而不是先 buff duration。

## 10. Analyzer / Tree View 候選後續

Hydra II 已開始提供自然的分析需求：

```text
HEADS
CUTS / SEC
SPAWN / SEC
NET GROWTH
MAX HEADS
```

但 Playtest 4.2 仍先不加入。只有當玩家真的因 Hydra II / III 規則需要「看懂系統」時再登場。

## 11. Logical Heads ≠ Visible Heads

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

## 12. 目前刻意未決

- NP 基礎時間是否繼續維持 3 秒。
- Command Spell II 的正式 unlock / cost / 完整 level curve。
- Hydra II 81-cap 的最終 hit / replacement 演出。
- Hydra III 正式 cut / growth / termination rule。
- Hydra III 的 729 上限如何與真正 tree structure 對應。
- Analyzer 出場節點。
- Hydra II 99 隻中段是否需要新事件／升級節點。
- Prestige / Offline Progress。
- 真正 Kirby–Paris 規則在哪一代完整出現。

原則：**先確認技法讓三秒變得好玩，再決定技法要賣多少錢。**
