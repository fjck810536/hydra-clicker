# Hydra Clicker — Game Design v0.7

> Playtest 3：Hydra II 從單次 Intro 擴成完整 99-kill generation loop。Hydra 世代開始使用 `9^n` 邏輯頭數上限；Hydra III 目前只做登場 shell，不實作戰鬥規則。

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

但 Hydra II 有邏輯上限：

```text
max heads = 81 = 9²
```

因此接近上限時 growth 會被 cap：

```text
80 → cut 1 / grow 2 → 81
81 → cut 1 / grow 1 → 81
```

它不會長到 82。

### NP kill window

NP active：

```text
head growth disabled
↓
CUT 1
→ GROW 0
→ net -1
```

當最後一頭被砍掉：

```text
1 → 0
→ Hydra II true kill
```

之後生成下一隻 Hydra II，仍從 9 頭開始。

### 世代完成

```text
Hydra II encounter 1 ... 99
↓
kill encounter 99
↓
HYDRA III
```

也就是 Hydra II 本身要殺 99 隻。

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

這不是 Hydra III 正式規則，只是確保 generation progression 可以走到下一個設計節點而不讓 runtime crash。

## 7. Analyzer / Tree View 候選下一步

Hydra II 已開始提供自然的分析需求：

```text
HEADS
CUTS / SEC
SPAWN / SEC
NET GROWTH
MAX HEADS
```

Hydra III 之後才真正開始需要超過 99 顆頭的 logical / compressed representation。

## 8. Logical Heads ≠ Visible Heads

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

View 不得以 visible 99 反推 logical head cap。

## 9. 目前刻意未決

- Hydra III 正式 cut / growth / termination rule。
- Hydra III 的 729 上限如何與真正 tree structure 對應。
- Command Spell II 功能。
- Analyzer 出場節點。
- Prestige / Offline Progress。
- 真正 Kirby–Paris 規則在哪一代完整出現。

原則：**世代數學可以長大，畫面不必暴力建立每一顆頭。**
