# Hydra Clicker — Game Design v0.8

> Playtest 4：Hydra II 已有 81-head / 99-kill loop，這一版先補玩家端「章節感」：世代本地進度、短切幕、輕微場景色調身份。核心玩法數值不改。

## 1. 核心一句話

玩家一開始以為自己在操縱狂戰士討伐會復原的九頭蛇；學會靠狂點、NP 與 Auto Slash 跑贏 regeneration 後，Hydra II 把普通攻擊翻面成 **CUT 1 → GROW 2**。NP 則成為短時間「禁止 Hydra 生長」的解題工具。

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

## 3. NP — 66 head charge

```text
NP MAX = 66
1 accepted head cut = +1 NP
66 / 66 = READY
release = 0
window = 3000ms
```

NP 是 timed rule modifier：

```text
hydra.headGrowth = disabled
scope = timed
```

可跨 encounter。

效果：

```text
Hydra I + NP
→ delayed same-head regrowth is not scheduled

Hydra II + NP
→ immediate structural GROW is suppressed
→ CUT 1 becomes net -1
```

## 4. Command Spell I — Auto Slash progression

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
↓
CUT 1
→ GROW 0
→ net -1
```

最後一頭被砍掉：

```text
1 → 0
→ Hydra II true kill
```

下一隻 Hydra II 重新從 9 頭開始。

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

這輪不調整 Hydra II 數值，不 nerf NP，也不加入 Analyzer。先讓玩家明確感覺世代切換是一個「新章節」。

### 世代本地 KILLS

玩家 HUD 不再直接顯示 lifetime Hydra kills。

```text
Hydra I  encounter 1 alive  → 0/99
Hydra I  encounter 99 dead  → 99/99
Hydra II encounter 1 alive  → 0/99
Hydra II encounter 37 alive → 36/99
Hydra II encounter 37 dead  → 37/99
```

因此進 Hydra II 時玩家看到的是：

```text
HYDRA II · 0/99
```

Lifetime kills 仍保留在 Statistics，開發中的 TEST panel 顯示 `TOTAL KILLS`，但不佔主玩家 HUD。

這個進度由既有 `hydra.encounter + defeated` 投影，不新增 persistent generation-kill counter。

### 世代切幕

`hydra:generation-changed` 觸發短畫面切幕，例如：

```text
NEXT GENERATION
HYDRA II
START 9 · MAX 81 · KILL 99
```

切幕是純 presentation：

- CSS animation 約 1.25 秒。
- pointer-events none。
- 不暫停 GameClock。
- 不用 gameplay `setTimeout`。
- Hydra II 真正的 first-cut Auto guard 仍由原 progression policy 負責。

Hydra III shell 也可以使用同一個切幕，但顯示 `RULE PENDING`。

### 世代色調

不重畫已經合格的 Hydra II mesh；先用很輕的戰場色溫區分：

```text
Hydra I   → 原本中性黑灰
Hydra II  → 輕微病態黃綠
Hydra III → 冷紫 shell
```

NP 紅屏優先於世代色；NP 結束後回到目前世代 palette。

### Playtest 4 要回答的問題

1. I → II 是否明顯像「進入下一幕」，而不是同一隻怪數值變化。
2. 0/99 是否讓 Hydra II 的 99 隻有清楚推進感。
3. 81 頭爆滿 → NP → 清場是否本身就夠爽，先不要因理論上的效率問題 nerf。
4. 中段 10～50 隻是否開始感到過度重複；若有，再決定加入第二令咒、事件或其他 progression。
5. Hydra II #99 → Hydra III shell 的切幕是否足夠形成期待。

## 8. Analyzer / Tree View 候選下一步

Hydra II 已開始提供自然的分析需求：

```text
HEADS
CUTS / SEC
SPAWN / SEC
NET GROWTH
MAX HEADS
```

但 Playtest 4 先不加入。只有當玩家真的因 Hydra II / III 規則需要「看懂系統」時再登場。

## 9. Logical Heads ≠ Visible Heads

View contract 不變：

```text
logical 0–99 → same visible count
logical 100+ → visible 99
```

因此：

```text
Hydra II max = 81
→ 永遠不會碰 visible cap
→ 不需要為 Hydra II 重做目前視覺

Hydra III max = 729
→ 第一次可能 logical > 99
→ 畫面仍只顯示最多 99 顆
```

## 10. 目前刻意未決

- Hydra III 正式 cut / growth / termination rule。
- Hydra III 的 729 上限如何與真正 tree structure 對應。
- Command Spell II 功能。
- Analyzer 出場節點。
- Hydra II 99 隻中段是否需要新事件／升級節點。
- Prestige / Offline Progress。
- 真正 Kirby–Paris 規則在哪一代完整出現。

原則：**先讓玩家感覺規則在變，再讓玩家需要理解規則。**
