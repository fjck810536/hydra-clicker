# Hydra Clicker — Game Design v0.4

> Playtest 2.4：保留 active clicker 的學習摩擦，把 NP 改成 66-point gauge，並把第一令咒攻速峰值修成 66 kills / 64 APS MAX。

## 1. 核心一句話

玩家一開始以為自己在操縱狂戰士討伐會復原的九頭蛇；中期發現增殖與自動化可以被利用成 farming；後期逐步解鎖 Analyzer / Tree View，發現自己操作的是一套可分析的 Hydra 規則系統，而不是普通 HP bar。

目標同時是：

1. 不懂數學也能爽玩的 clicker。
2. Active tapping 與 idle automation 都有存在理由。
3. 後期逐步把手遊惡搞外觀轉成數學／證明介面。

## 2. Hydra I — Regeneration Tutorial

### Current rule

```text
starting heads = 9
accepted cut = -1 head
non-terminal cut → same head regrows after delay
head count reaches 0 → true kill
terminal kill → cancel pending regrowth
```

Hydra I 的 regen delay 會隨累積 kills 加速：

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

0→9 變快得明顯；9→99 還會繼續加速，但逐隻增幅趨緩。

## 3. Active opening hypothesis

目前實機觀察：正常雙拇指快速點擊，不需要全力輸出，大約在第 6 隻附近開始無法單靠手速穩定壓過 regeneration。

這不是要硬限制玩家 taps/sec，而是希望形成自然學習：

```text
前幾隻
→ 狂點有效

Hydra 逐漸加速
→ 玩家更用力點

約第 6 隻附近
→ 純手速開始撞牆
→ 玩家真正注意到 regen
→ NP 變成可理解的解題工具
```

三指／四指極端 tapping 目前不當作設計基準；若玩家真的自行發明 exploit，之後再觀察。

## 4. NP — 66 head charge

Playtest 2.4：

```text
NP MAX = 66
1 accepted head cut = +1 NP
66 / 66 = READY
```

Manual 與 Auto Slash 都用同一條 charge 規則；目前不拆分效率。

這個數值的設計意圖不是單純「把 NP nerf」：

> 前期玩家若主動狂點，需要實際砍過約 66 顆頭才拿到第一發 NP，這段時間本身就是理解 regeneration 的學習／思考時間。

NP release：

```text
3.0s regeneration suppression
scope = timed
可跨 Hydra encounter
背景／地面暗紅提示
```

NP 不是唯一勝利資格；普通狀態只要能跑贏 regen，把 9 頭砍到 0 就能殺。

## 5. Encounter pacing

普通 kill：

```text
respawn = 300ms
```

regrowth-disabled burst：

```text
respawn = 100ms
```

這讓 NP 維持高速 farming burst，但普通 Auto 仍有可讀的 encounter 節奏。

## 6. 人類惡

目前：

```text
Hydra kill → +11 人類惡
```

這是 prototype currency tuning。

## 7. Command Spell I — Auto Slash progression

第一令咒不是只買一次；它本身可以升級。

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

### 為什麼拿掉 52→64 / 66→128

實機 Playtest 2.3 顯示：

- 30 kills / 16 APS 已經明顯改善中期乏味。
- 64 APS 已經非常「滿」。
- 64 APS 普通 Auto 甚至可一路推到約 95 kills 才自然停住。
- 128 APS 反而會把末段 Hydra 重新追上玩家的戲劇性直接抹掉。

因此 Playtest 2.4 改成：

```text
40 kills → 32 APS
↓ deliberately long plateau
66 kills → 64 APS MAX
```

## 8. Late Hydra I hypothesis

目前想測的是：

```text
66 kills
→ 64 APS MAX
→ 玩家進入「Hydra 屠宰機」高原

約 95 kills
→ regen floor 重新追上 Auto
→ 系統自然卡住

玩家按一次 NP
→ 3 秒關掉 regen
→ 完成 95 → 99
```

這比「66 kills 直接 128 APS 一路無腦碾到 99」更有起伏。

因此 Playtest 2.4 不再要求第 66 隻必須 >6 Hydra/sec；真正想要的是：

> 50～70 kills 進入很滿的 automation 爽感，末段再把主動權短暫交回玩家。

## 9. Active vs Idle 分工

目前不急著讓 Manual Cut 和 Auto Cut 有不同 NP charge efficiency。

先測這個更簡單的模型：

```text
Manual
→ 能提早突破 regen
→ 能更快累積實際 head cuts

Auto
→ 穩定持續輸出
→ 同樣逐頭累積 NP

NP
→ 稀有一些的主動 burst
```

如果 66-point gauge 仍讓中期 NP 長期保持免費常亮，再考慮來源差異、cooldown 或其他 NP economy；目前不提前補機制。

## 10. Hydra II — 1 Cut → 2 Heads

Hydra II 仍保留第一次規則背叛：

```text
CUT 1
GROW 2
ΔH = +1
```

目的不是單純加血量，而是讓玩家發現：

> 頭數不是 HP；攻擊可能讓問題變大。

Playtest 2.4 完成前不進 Hydra II。

## 11. Command Spell II

目前仍預留給後續測試，Auto NP 只是候選，不是已確定功能。

不要因為第一令咒已經有多級升級，就自動把下一個功能塞進第二令咒。

## 12. Hydra III / Farm Reveal

中期之後的核心認知反轉仍是：

> Hydra 的增殖可以從威脅變成產能。

若 head cut 轉成素材：

```text
more regrowth
→ more available heads
→ more cuts
→ more materials
```

早期的敵人規則會變成後期經濟資源。

## 13. Analyzer / Tree View

逐層解鎖：

```text
Heads
Cuts/sec
Regrowth/sec
Net Growth
↓
CUT / SPAWN rule summary
↓
Tree View
↓
Tree Targeting
↓
compressed structural / ordinal-like analysis
```

不在遊戲前期直接丟完整 Kirby–Paris 數學。

## 14. Logical Heads ≠ Visible Heads

```text
logical head count
可能非常巨大
↓ projection
visible head meshes ≤ 99
```

View 不得決定真正數量。

## 15. 目前刻意未決

- Hydra I 是否永久採 0 heads = kill。
- 99 是否最後真的成為 Hydra II 門檻。
- 66-point NP gauge 是否是最終值。
- 40→66 的 32 APS plateau 是否太長。
- 64 APS 是否永久 MAX。
- 95 附近自然卡牆是否值得正式保留。
- Command Spell II 最終功能。
- Prestige / Offline Progress。
- 真正 Kirby–Paris 規則在哪一代完整出現。

Playtest 優先於理論完整性；找到好玩的節奏後，再把它固定成正式規則。
