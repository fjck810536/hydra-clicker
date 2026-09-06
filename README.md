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
Hydra II
CUT 1 → GROW 2
↓
Command Spell II
解鎖 Auto NP
↓
Hydra III
Hydra 反轉成「生頭農場」
↓
Analyzer / Tree View
逐步看見真正結構與公式
```

Hydra I → II → III 暫時不是傳統 prestige/reset；已購買的自動化與主要能力保留，只是 Hydra 規則逐代變化。

## Playtest Status

```text
Phase 3 Blocks 1–9      ✅
iPhone Playtest 1       ✅
Hydra I Tuning A–E      ✅
Playtest 2.1 Tools      ✅
Core CI                  ✅
iPhone Playtest 2.1     ← NEXT
Hydra II                 ⛔ not yet
```

目前 Playtest 2.1 tuning：

- **iOS fixed controls**：NP / Command Spell / TEST controls 使用 scoped gesture lock，針對 Safari double-tap smart zoom。
- **Hydra I**：目前實驗規則為 `0 heads → killed`，terminal cut 清除 pending regrowth。
- **NP**：3.0 秒 regeneration suppression 為 `scope: timed`，可跨多個 Hydra encounter；active 時 Babylon 背景與地面轉成暗紅提示。
- **Respawn**：`300ms`；暫時不加 NP 專用 100ms 特例。
- **Regen Curve**：依累積 Hydra kills 平滑加速，約 `0→1500ms / 9→1154ms / 30→750ms / 99→350ms floor`。
- **TEST panel**：顯示目前 `REGEN xxx ms`，並提供 `RESET SAVE`；reset 會先停用 autosave/pagehide persistence 再清 storage，避免舊存檔被寫回。
- **Hydra View**：移除胖 torso / haunch / tail，只留小 root base；九頭越高越向左右外擴。
- **Berserker**：正式 B叔 art pass 暫緩到玩法節奏穩定後。

## Docs / 積木編程規格

- [`docs/GAME_DESIGN.md`](docs/GAME_DESIGN.md) — 遊戲進程與 Playtest 2 Hydra I 規則。
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — Core / Math / Systems / Input / View / Persistence 分層。
- [`docs/BLOCK_CONTRACTS.md`](docs/BLOCK_CONTRACTS.md) — Attack、Cut、Regrowth、NP、Auto Slash、Progression、Save、Test Tools 等插頭。
- [`docs/EFFECT_MODIFIER_ARCHITECTURE.md`](docs/EFFECT_MODIFIER_ARCHITECTURE.md) — 支援、科技、設施、Buff 的共用 Effect / Modifier 架構。
- [`docs/PLATFORM_CONTRACT.md`](docs/PLATFORM_CONTRACT.md) — iOS Safari portrait、gesture lock、局部 scroll 與 render boundary。
- [`docs/SAVE_CONTRACT.md`](docs/SAVE_CONTRACT.md) — BigInt-safe persistence、Clock restore、offline progress boundary。
- [`docs/PLAYTEST_1.md`](docs/PLAYTEST_1.md) — 第一次 iPhone 實機試玩原始觀察。
- [`docs/PATCH_PLAN_HYDRA_I_TUNING.md`](docs/PATCH_PLAN_HYDRA_I_TUNING.md) — A–E tuning patch，目前已全部實作。
- [`AGENTS.md`](AGENTS.md) — 給 ChatGPT、Codex、Claude Code 與未來 contributor 的施工守則。

## Engineering Principles

1. **Hydra Math 不依賴 Babylon.js / DOM。**
2. **Logical head count != rendered head count。** 畫面最多 99 heads。
3. **離散數量維持整數。** heads / kills / currencies 等使用 `BigInt`。
4. **View 只演出。** Mesh / animation / particle 不決定遊戲規則。
5. **Gameplay Time 服從 GameClock。** 不依賴 FPS，不散落 gameplay `setTimeout()`。
6. **Fate 梗與角色名是可替換 presentation/data。** 核心規則不依賴角色名稱。
7. **Effect / Modifier 是支援、科技、設施與 Buff 的共同插頭。**
8. **iOS portrait first。** Battle stage 不捲頁；fixed controls 防 Safari zoom；未來 Drawer 可局部 scroll。
9. **NP 是 generic Rule Modifier。** Playtest 2 使用 timed 3s `hydra.regrowth = disabled`，跨 encounter 存續到 `endsAt`。
10. **Progression 不藏進 Combat。** kill、經濟、respawn、capability 分層處理。
11. **再生曲線是 Data / rule context。** Combat 不知道第幾殺；Hydra Rule 只收到當刀的 `regrowthDelayMs`。
12. **Save 只保存 logical state。** BigInt 精確 round trip；目前 offline progress 明確為 OFF。
13. **`depleted` 與 `killed` 概念仍分離。** 只是 Playtest 2 的 Hydra I 暫時令 0 heads 同時成立。

## Current Runtime

- `index.html` — Babylon portrait stage + Playtest TEST panel
- `css/style.css` — 100dvh / safe-area / fixed-control gesture policy
- `js/app.js` — runtime ↔ View / input / browser save lifecycle / Test Tools wiring
- `js/core/` — Clock / State / EventBus / Runtime / Save
- `js/math/` — Hydra Rule / Cut Resolution / logical model
- `js/input/` — 玩家意圖 → Attack Request
- `js/systems/` — Combat / Auto Slash / Regrowth / Modifiers / NP / 人類惡 / Command Spell / Progression
- `js/data/progression.js` — prototype economy / respawn / regen curve tuning data
- `js/view/` — Battle Stage / NP tint / Hydra Head Pool / Berserker placeholder / HUD
- `tests/*.node.test.js` — Node 核心與架構 contract tests
- `.github/workflows/test.yml` — 每次 push 自動執行 `npm test`

舊的 `js/game.js`, `js/hydra.js`, `js/heracles.js` 暫時保留供回溯；正式頁面已使用新 runtime。

## Phase 3 — Complete

已完成：

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

Playtest 2.1 目前只需要看：

1. TEST → RESET SAVE 能不能乾淨回到新檔。
2. NP 一開，暗紅背景是否足以讓爆發窗口一眼可辨。
3. `REGEN xxx ms` 隨 kills 下降時，壓力曲線是否有感但不突兀。
4. 普通 kill / 300ms respawn / NP multi-kill 的整體節奏是否仍然順。
5. 如果你原本已 99 kills，350ms 再生下限是否太狠、剛好、或還不夠狠。

這輪確認後再決定再生曲線與 Hydra II 入口。
