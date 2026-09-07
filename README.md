# hydra-clicker

拔—灑卡，幹死那頭海德拉！

瀏覽器上的低模 Hydra clicker / incremental game 原型。iOS Safari portrait-first，Babylon.js 只負責 View；Hydra 規則、進程與 Save 都可 headless 測試。

## Current Arc

```text
Hydra I
會復原；學會跑贏 regen
↓
Command Spell I
Auto Slash 1 → 64 APS
↓
99 kills
↓
Hydra II Intro
第一刀：CUT 1 → GROW 2
9 → 10
↓
Auto Slash 恢復
看玩家剛建立的屠宰機開始把 Hydra 越砍越大
↓
Analyzer / Tree View（尚未實裝）
```

## Playtest Status

```text
Hydra I Playtest 2 seal candidate ✅
NP 66-point gauge               ✅
Command Spell I 64 APS MAX      ✅
iOS zoom issue                  ✅ resolved
Playtest 3 Hydra II Intro       ✅ implemented
Core CI                         ✅
iPhone Playtest 3               ← NEXT
Analyzer                        ⛔ not yet
Command Spell II                ⛔ not yet
```

## Hydra I Seal Candidate

實機基準：

```text
約 Hydra 6
→ 一般雙拇指快速點擊開始撞上 regen

66 accepted head cuts
→ NP READY

9 / 12 / 16 / 22 / 30 / 40 / 66 kills
→ 1 / 2 / 4 / 8 / 16 / 32 / 64 APS

約 95 kills
→ 64 APS 開始撞上 100ms regen floor

95 → 99
→ 一次 NP 可收尾
```

完整紀錄：[`docs/PLAYTEST_2.md`](docs/PLAYTEST_2.md)

### NP

```text
0/66
1 accepted head cut = +1
66/66 = READY
release = 0
3.0s hydra.regrowth suppression
```

NP 可跨 encounter；READY 時即使場上暫時沒有 Hydra 也能 release。

### Command Spell I

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

40→66 故意留 32 APS plateau；舊 128 APS 實驗已撤回。

## Playtest 3 — Hydra II Intro

目前實驗入口：

```text
99 Hydra I kills
→ HYDRA II
→ 9 heads
```

Hydra II 最小規則：

```text
CUT 1
→ remove 1
→ spawn 2 immediately
→ ΔH = +1
```

第一刀前，已購買的 Auto Slash **不會被移除**，但 attack request 暫停一次：

```text
HYDRA II · 9 heads
AUTO PAUSED · TAP
↓
manual cut
↓
9 → 10
CUT 1 · GROW +2 · Δ +1
↓
intro milestone
↓
Auto Slash resumes next Game Clock tick
```

現行 NP 只關閉 Hydra I 類型的 delayed `hydra.regrowth`；Hydra II 的 immediate `headsSpawned` 不受影響。這是 Playtest 3 刻意要測的「舊解法失效」。

Hydra II 暫時沒有正式 kill condition、第二令咒、新經濟或 Analyzer；先只測規則反轉是否有趣。

## Engineering Principles

1. Hydra Math 不依賴 Babylon / DOM。
2. Logical heads != visible heads；畫面最多 99 heads。
3. Heads / kills / currencies 使用 BigInt。
4. Cut Resolution 明確區分 `headsRemoved`、`headsSpawned`、delayed `regrowth`。
5. Game Clock 與 render FPS 分離。
6. NP 是 generic timed rule modifier，不直接改 Hydra heads。
7. Progression 決定 generation / encounter；Combat 不決定主線。
8. Auto Slash intro guard 由 Core 注入 policy；Auto Slash System 不硬寫 Hydra II。
9. Save 只保存 logical state；offline progress 仍 OFF。
10. Fate 梗是可替換 presentation/data，不進核心規則。

## Docs

- [`docs/GAME_DESIGN.md`](docs/GAME_DESIGN.md) — 目前玩法與 Hydra II Intro。
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — generation rule selection / progression / first-cut guard。
- [`docs/BLOCK_CONTRACTS.md`](docs/BLOCK_CONTRACTS.md) — Cut Resolution、NP、Auto、Hydra II contracts。
- [`docs/PLAYTEST_2.md`](docs/PLAYTEST_2.md) — Hydra I 實機 seal candidate。
- [`docs/EFFECT_MODIFIER_ARCHITECTURE.md`](docs/EFFECT_MODIFIER_ARCHITECTURE.md) — 共用 Effect / Modifier。
- [`docs/PLATFORM_CONTRACT.md`](docs/PLATFORM_CONTRACT.md) — iOS portrait / gesture boundary。
- [`docs/SAVE_CONTRACT.md`](docs/SAVE_CONTRACT.md) — Persistence / BigInt / Clock restore。
- [`AGENTS.md`](AGENTS.md) — contributor / coding-agent 施工守則。

## Current Runtime

```text
js/core/       Clock / State / Runtime / Save
js/math/       Hydra I + II Rules / Cut Resolution / logical model
js/input/      Manual Attack
js/systems/    Combat / Auto Slash / NP / Progression / Economy
js/data/       tuning + progression definitions
js/view/       Babylon stage / Hydra projection / HUD
```

### Playtest 3 現在只需要看

1. 第 99 隻後切到 Hydra II 是否夠清楚。
2. Auto 暫停後，你是否自然會點第一刀，而不是覺得壞掉。
3. 第一刀 `9 → 10` 是否真的形成「等等，怎麼變多了？」的瞬間。
4. 64 APS 恢復後，頭數膨脹到 99 visible cap 的速度是否太快／剛好。
5. 按 NP 後 Hydra II 照樣長頭，會讓你覺得有趣還是像 bug。
6. 你是否自然開始想知道 cuts/sec / spawn/sec / net growth；如果會，下一步就是 Analyzer v0.1。
