# Hydra Clicker — Game Design v0.5

> Playtest 3：Hydra I 進入 seal candidate；99 kills 後首次實裝 Hydra II Intro，測試「玩家剛學會的解法突然反過來害他」是否成立。

## 1. 核心一句話

玩家一開始以為自己在操縱狂戰士討伐會復原的九頭蛇；學會靠狂點、NP 與 Auto Slash 跑贏 regeneration 後，Hydra II 立刻把這套直覺翻面：**CUT 1 → GROW 2**。再往後才逐步引入 Analyzer / Tree View，讓玩家發現自己操作的是一套可分析規則，而不是普通 HP bar。

目標：

1. 不懂數學也能爽玩的 clicker。
2. Active tapping 與 idle automation 都有存在理由。
3. 規則反轉本身要先好玩，再逐步揭露數學。

## 2. Hydra I — Seal Candidate

目前實機基準記錄於 `docs/PLAYTEST_2.md`。

核心規則：

```text
starting heads = 9
accepted cut = -1 head
non-terminal cut → same head regrows after delay
head count reaches 0 → true kill
terminal kill → cancel pending regrowth
```

Regen curve：

```text
0 kills  → 1500ms
3 kills  → 923ms
6 kills  → 569ms
9 kills  → 350ms
30 kills → 247ms
50 kills → 174ms
66 kills → 134ms
99 kills → 100ms floor
```

實機節奏：

```text
約 Hydra 6
→ 一般雙拇指狂點開始撞牆

66 accepted head cuts
→ NP READY

9 kills
→ Auto Slash 1 APS

30 kills
→ 16 APS 已明顯改善中段

40 kills
→ 32 APS plateau

66 kills
→ 64 APS MAX

約 95 kills
→ 100ms regen wall 重新追上 Auto

95→99
→ 一次 NP 可收尾
```

## 3. NP — 66 head charge

```text
NP MAX = 66
1 accepted head cut = +1 NP
66 / 66 = READY
release = 0
window = 3000ms
```

Manual / Auto Slash 暫時同樣充能。

NP 是 timed rule modifier：

```text
hydra.regrowth = disabled
scope = timed
```

可跨 encounter；即使敵人剛死、場上暫時空白，只要 READY 仍可 release。

重要：**Hydra II 的 immediate GROW 2 不屬於 Hydra I delayed regrowth。** Playtest 3 故意讓既有 NP 不會自動關閉這個新規則，測試舊解法失效是否有趣。

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

第一令咒能力與升級跨 Hydra generation 保留，不做 prestige reset。

## 5. Hydra II Intro — Playtest 3

### 入口

目前實驗門檻：

```text
99 Hydra I kills
→ encounter gap
→ HYDRA II
→ starting heads = 9
```

99 是 Playtest 3 的入口，不代表永久主線門檻已定案。

### 第一刀 reveal

Hydra II 的最小規則：

```text
CUT 1
GROW 2 immediately
9 → 10
ΔH = +1
```

`GROW 2` 是同一個 Cut Resolution 裡的 immediate spawn，不排進 delayed regrowth queue。

### Auto Slash intro guard

玩家進 Hydra II 時已經可能有 64 APS。若直接讓 Auto 開著，第一秒就可能把 reveal 洗掉。

因此只在 Hydra II 的第一刀做一次 intro guard：

```text
Command Spell I capability remains unlocked
Auto Slash requests temporarily paused
↓
player manually cuts once
↓
9 → 10 is visible
↓
intro milestone recorded
↓
Auto Slash resumes on later Game Clock tick
```

這不是永久教學鎖，也不是把已購能力關掉。

### Playtest 3 要回答的問題

1. 玩家看到第一刀 `9 → 10` 時，是否立刻理解「攻擊正在餵大問題」。
2. 第一刀後 64 APS 恢復，頭數高速膨脹是否有喜劇／恐怖／失控感。
3. NP 對 Hydra II structural growth 無效是否令人覺得是合理的規則背叛，而不是 bug。
4. Visible 99 cap 出現前，玩家是否有足夠時間理解頭數正在增加。
5. 玩家何時自然產生「我需要數據」的需求；這將決定 Analyzer v0.1 何時登場。

## 6. Hydra II 暫時不做的事

Playtest 3 Intro 先不加入：

- 第二令咒。
- Auto NP。
- 新素材／新貨幣。
- Hydra II kill condition。
- 完整 Tree structure。
- Analyzer。
- Prestige/reset。

先只驗證規則反轉。

## 7. Analyzer / Tree View 候選下一步

若 Hydra II reveal 成立，Analyzer v0.1 可第一次顯示：

```text
HEADS
CUTS / SEC
SPAWN / SEC
NET GROWTH
```

再進一步顯示：

```text
CUT 1
SPAWN 2
ΔH = +1
```

Analyzer 應在玩家真的需要理解失控時出現，不在開場硬塞數學 UI。

## 8. Logical Heads ≠ Visible Heads

```text
logical head count
可能非常巨大
↓ projection
visible head meshes ≤ 99
```

Hydra II 正是第一個會快速碰到這條工程邊界的 generation。View 不得以 99 mesh cap 截斷真正 logical heads。

## 9. 目前刻意未決

- Hydra I 0 heads = kill 是否永久化。
- Hydra II 99-kill 入口是否永久化。
- Hydra II 最終 kill / termination rule。
- NP 之後是否能透過新能力作用於 structural spawn。
- Command Spell II 功能。
- Analyzer 出場節點。
- Prestige / Offline Progress。
- 真正 Kirby–Paris 規則在哪一代完整出現。

原則：**先讓規則反轉好玩，再讓數學變深。**
