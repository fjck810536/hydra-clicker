# Hydra Clicker — Game Design v0.9

> Playtest 4.1：在 Hydra II 章節層上，NP 從單純 head-growth suppression 進一步具體化成「時停式手動爆發窗」：Hydra 生長停止、Auto Slash 暫停、Manual Cut 保留，結束時明確提示時間恢復。3 秒基準暫不調整。

## 1. 核心一句話

玩家一開始以為自己在操縱狂戰士討伐會復原的九頭蛇；學會靠狂點、NP 與 Auto Slash 跑贏 regeneration 後，Hydra II 把普通攻擊翻面成 **CUT 1 → GROW 2**。NP 則成為短時間「Hydra 法則與自動時間都暫停」的手動爆發窗。

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

## 3. NP — 66 head charge / Playtest 4.1 time stop

```text
NP MAX = 66
1 accepted head cut = +1 NP
66 / 66 = READY
release = 0
window = 3000ms
```

NP 對 Hydra rule 的效果仍由 timed modifier 表達：

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

Playtest 4.1 再加入玩家端「時停」行為：

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

目前 **3 秒不因這次改動而調整**。Auto 從 NP 中移除後，手感已經是另一套節奏；先實測強手是否可能一輪擊殺、一般玩家是否自然需要兩輪，再決定 duration。

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

這些動畫只負責 presentation；真正 3 秒生命週期仍由 Game Clock 決定。

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

Playtest 4.1 的 NP 時停會暫停這個既有 Auto capability，但不移除它。未來若玩家端令咒設計要求「讓 Auto 重新進入時停」，應新增／解鎖對應 policy 或 capability，而不是取消目前的時停基準。

## 5. Hydra II — 99-kill generation

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
manual CUT 1
→ GROW 0
→ net -1
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

## 6. Hydra III — shell only

目前只實作登場資料與安全停機：

```text
starting heads = 9
max heads = 729 = 9³
encounter = 1
Auto Slash = paused
combat rule = not implemented yet
```

玩家可以看到 Hydra III 登場，但目前不進一步結算其戰鬥。

## 7. Playtest 4 — Hydra II as a Chapter

這輪不調整 Hydra II 數值，不加入 Analyzer。先讓玩家明確感覺世代切換是一個「新章節」。

### 世代本地 KILLS

玩家 HUD 不再直接顯示 lifetime Hydra kills。

```text
Hydra I  encounter 1 alive  → 0/99
Hydra I  encounter 99 dead  → 99/99
Hydra II encounter 1 alive  → 0/99
Hydra II encounter 37 alive → 36/99
Hydra II encounter 37 dead  → 37/99
```

Lifetime kills 仍保留在 Statistics，TEST panel 顯示 `TOTAL KILLS`。

### 世代切幕

`hydra:generation-changed` 觸發短畫面切幕，例如：

```text
NEXT GENERATION
HYDRA II
START 9 · MAX 81 · KILL 99
```

切幕是純 presentation：CSS animation 約 1.25 秒、pointer-events none、不暫停 GameClock、不用 gameplay `setTimeout`。

### 世代色調

```text
Hydra I   → 中性黑灰
Hydra II  → 輕微病態黃綠
Hydra III → 冷紫 shell
```

NP 紅屏優先於世代色；NP 結束後回到目前世代 palette。

## 8. Playtest 4.1 要回答的問題

1. `寶具解放 → Auto 暫停 → 玩家手砍` 是否真的比「紅屏 + 64 APS 自動掃」更像特殊爆發時刻。
2. 3 秒 Manual-only window 是否太短、剛好或太長。
3. 強手是否可能一個 NP window 殺掉 Hydra II；一般玩家是否自然需要兩輪。
4. `81 → 81 → 81` 與 NP 中 `81 → 80 → 79...` 的對比是否夠爽。
5. `TIME RESUMES` 後第一個普通 CUT 又開始 GROW，是否有清楚的「法則回來了」感覺。
6. 若未來令咒讓 Auto 參與 NP，玩家是否會自然把它理解成第二次質變，而不是單純加速。

## 9. Analyzer / Tree View 候選下一步

Hydra II 已開始提供自然的分析需求：

```text
HEADS
CUTS / SEC
SPAWN / SEC
NET GROWTH
MAX HEADS
```

但 Playtest 4.1 仍先不加入。只有當玩家真的因 Hydra II / III 規則需要「看懂系統」時再登場。

## 10. Logical Heads ≠ Visible Heads

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

## 11. 目前刻意未決

- NP 基礎時間是否繼續維持 3 秒。
- Hydra II 81-cap 的最終 hit / replacement 演出。
- Hydra III 正式 cut / growth / termination rule。
- Hydra III 的 729 上限如何與真正 tree structure 對應。
- 玩家端令咒順序與既有核心 Command Spell I upgrade curve 最終如何對齊。
- Analyzer 出場節點。
- Hydra II 99 隻中段是否需要新事件／升級節點。
- Prestige / Offline Progress。
- 真正 Kirby–Paris 規則在哪一代完整出現。

原則：**先讓玩家感覺規則在變，再讓玩家需要理解規則。**
