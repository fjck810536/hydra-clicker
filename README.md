# hydra-clicker

拔—灑卡，幹死那頭海德拉！

一個瀏覽器上直接玩的低模 Hydra clicker / incremental game 原型。

目前方向：固定側視角低模狂戰士持續斬擊 Hydra；前期是 Hydra 周回 clicker，中期把增殖轉化為素材農場，後期逐步解鎖 Tree View 與數學分析儀。

## Current Design

```text
Hydra I
會復原，但砍到 0 就能討伐
↓
Command Spell I
解鎖 Auto Slash
↓
Command Spell I upgrades
逐步把 Auto Slash 從 1 APS 推到 64 APS
↓
Hydra II
CUT 1 → GROW 2
↓
Command Spell II
保留給之後測試（Auto NP 尚未實裝）
↓
Hydra III / Analyzer / Tree View
```

Hydra I → II → III 暫時不是傳統 prestige/reset；已購買的自動化與主要能力保留，只是 Hydra 規則逐代變化。

## Playtest Status

```text
Phase 3 Blocks 1–9      ✅
iPhone Playtest 1       ✅
Hydra I Tuning A–E      ✅
Playtest 2.1 Tools      ✅
Playtest 2.2 Tuning     ✅
Playtest 2.3 APS Curve  ✅
Playtest 2.4 NP / APS   ✅
Core CI                  ✅
iPhone Playtest 2.4     ← NEXT
Hydra II                 ⛔ not yet
```

目前 Playtest 2.4 tuning：

- **iOS zoom lock**：battle shell capture phase 阻止 touchend、multi-touch、dblclick 與 iOS gesture defaults；實機回報目前已正常。
- **Hydra I**：`0 heads → killed`，terminal cut 清除 pending regrowth。
- **NP gauge**：玩家看到 `0/66 → 66/66`；每砍 1 顆 head 固定 `+1 NP`，66 READY。存檔仍保存舊有 `0..1` normalized ratio，因此舊存檔可直接相容，例如舊 50% 會投影成 `33/66`。
- **NP burst**：3.0 秒 `hydra.regrowth = disabled`，可跨 encounter；active 時背景／地面暗紅。
- **Respawn**：普通 `300ms`；NP / regrowth-disabled burst `100ms`。
- **Regen Curve**：`0→1500ms / 9→350ms / 99→100ms floor`；第 9 隻後逐隻繼續惡化但增幅遞減。
- **Command Spell I**：第一令咒本身 Lv.1 → Lv.MAX；刻意保留 40→66 的 32 APS 高原，66 kills 才升到 64 APS MAX。
- **TEST panel**：顯示 `REGEN xxx ms`、`AUTO xxx APS`，並提供 `RESET SAVE`。
- **Hydra View**：只留小 root base；九頭越高越向左右外擴。
- **Berserker**：正式 B叔 art pass 暫緩到玩法節奏穩定後。

### Command Spell I Playtest Curve

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

Lv.1 後總升級成本 `385 人類惡`；第 9→66 隻以目前 `11 人類惡/kill` 會新增 `627`，因此理論上可沿途買滿並留下 `242`。

### Current regen reference points

```text
0 kills   → 1500 ms
1 kill    → 1276 ms
3 kills   → 923 ms
6 kills   → 569 ms
9 kills   → 350 ms
30 kills  → 247 ms
50 kills  → 174 ms
66 kills  → 134 ms
99 kills  → 100 ms floor
```

### Current active / idle hypothesis

Playtest 2.4 目前想保留這個自然節奏：

```text
前期 active tapping
→ 大約 60 多顆 head 後拿到第一發 NP
→ 玩家有時間理解 regen / NP 關係

中期 Command Spell I
→ Auto Slash 越來越強
→ NP 仍然靠實際砍頭累積，不再 8 顆頭就免費 READY

66 kills
→ 64 APS MAX
→ Auto 可以一路壓到末段
→ 約 95 附近自然撞牆
→ 一次 NP 可完成 95→99
```

這是 playtest hypothesis，不是永久平衡。

## Docs / 積木編程規格

- [`docs/GAME_DESIGN.md`](docs/GAME_DESIGN.md) — 遊戲進程與 Hydra I 規則。
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — Core / Math / Systems / Input / View / Persistence 分層。
- [`docs/BLOCK_CONTRACTS.md`](docs/BLOCK_CONTRACTS.md) — Attack、Cut、Regrowth、NP、Auto Slash、令咒升級、Save、Test Tools 等插頭。
- [`docs/EFFECT_MODIFIER_ARCHITECTURE.md`](docs/EFFECT_MODIFIER_ARCHITECTURE.md) — 支援、科技、設施、Buff 的共用 Effect / Modifier 架構。
- [`docs/PLATFORM_CONTRACT.md`](docs/PLATFORM_CONTRACT.md) — iOS Safari portrait、battle-shell gesture lock 與 render boundary。
- [`docs/SAVE_CONTRACT.md`](docs/SAVE_CONTRACT.md) — BigInt-safe persistence、Clock restore、offline progress boundary。
- [`docs/PLAYTEST_1.md`](docs/PLAYTEST_1.md) — 第一次 iPhone 實機試玩原始觀察。
- [`docs/PATCH_PLAN_HYDRA_I_TUNING.md`](docs/PATCH_PLAN_HYDRA_I_TUNING.md) — 第一次 tuning patch。
- [`AGENTS.md`](AGENTS.md) — 給 ChatGPT、Codex、Claude Code 與未來 contributor 的施工守則。

## Engineering Principles

1. **Hydra Math 不依賴 Babylon.js / DOM。**
2. **Logical head count != rendered head count。** 畫面最多 99 heads。
3. **離散數量維持整數。** heads / kills / currencies 等使用 `BigInt`。
4. **View 只演出。** Mesh / animation / particle 不決定遊戲規則。
5. **Gameplay Time 服從 GameClock。** 不依賴 FPS，不散落 gameplay `setTimeout()`。
6. **Fate 梗與角色名是可替換 presentation/data。** 核心規則不依賴角色名稱。
7. **Effect / Modifier 是支援、科技、設施與 Buff 的共同插頭。**
8. **iOS portrait first。** Battle shell 禁 browser page zoom / scroll gesture；未來 Drawer 另定 interaction surface。
9. **NP 是 generic Rule Modifier。** timed 3s `hydra.regrowth = disabled`，跨 encounter 存續到 `endsAt`。
10. **NP gauge 與 persistence representation 分離。** 玩家看到 66-point gauge；Save 仍保存 normalized ratio。
11. **Progression 不藏進 Combat。** kill、經濟、respawn、capability 分層處理。
12. **再生曲線是 Data / rule context。** Combat 不知道第幾殺。
13. **第一令咒升級是 progression milestone。** System 不直接命令 Auto Slash，只更新 capability/stat/milestone。
14. **Save 只保存 logical state。** BigInt 精確 round trip；offline progress 明確為 OFF。
15. **`depleted` 與 `killed` 概念仍分離。** Playtest 2 的 Hydra I 暫時令 0 heads 同時成立。

## Current Runtime

- `index.html` — Babylon portrait stage + TEST panel
- `css/style.css` — 100dvh / safe-area / battle-shell touch-action policy
- `js/app.js` — runtime ↔ View / input / browser save lifecycle / gesture guard / Test Tools
- `js/core/` — Clock / State / EventBus / Runtime / Save
- `js/math/` — Hydra Rule / Cut Resolution / logical model
- `js/input/` — 玩家意圖 → Attack Request
- `js/systems/` — Combat / Auto Slash / Regrowth / Modifiers / NP / 人類惡 / Command Spell / Progression
- `js/data/progression.js` — economy / respawn / regen / NP / Command Spell I level curve
- `js/view/` — Battle Stage / NP tint / Hydra Head Pool / Berserker placeholder / HUD
- `tests/*.node.test.js` — Node 核心與架構 contract tests
- `.github/workflows/test.yml` — 每次 push 自動執行 `npm test`

舊的 `js/game.js`, `js/hydra.js`, `js/heracles.js` 暫時保留供回溯；正式頁面已使用新 runtime。

## Phase 3 — Complete

```text
1 Core Clock + State
2 Hydra I pure logic
3 Combat / Auto Slash
4 Babylon portrait stage
5 Hydra visual head pool
6 Berserker placeholder animation
7 NP / Rule Modifier
8 人類惡 / Command Spell I / encounter loop
9 Save / Restore
```

Playtest 2.4 現在主要回答：

1. 前期雙拇指狂點是否大約在第 6 隻附近自然撞牆，並在此前後累積到接近第一發 66 NP。
2. `66 heads = NP READY` 是否讓前期有足夠學習／思考時間，又不至於拖。
3. 30 kills / 16 APS 的改善是否仍成立。
4. 40→66 的 32 APS 高原會不會太長，還是剛好讓 Hydra 重新追上。
5. 66 kills / 64 APS MAX 是否已經夠滿；末段卡牆後一次 NP 收 95→99 是否自然。
