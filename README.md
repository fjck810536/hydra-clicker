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
Core CI                  ✅
iPhone Playtest 2       ← NEXT
Hydra II                 ⛔ not yet
```

第一次實機試玩後的 Playtest 2 tuning：

- **iOS fixed controls**：NP / Command Spell 改用 scoped gesture lock，針對 Safari double-tap smart zoom。
- **Hydra I**：目前實驗規則為 `0 heads → killed`，terminal cut 清除 pending regrowth。
- **NP**：3.0 秒 regeneration suppression 改成 `scope: timed`，可跨多個 Hydra encounter 連續收割。
- **Respawn**：`1200ms → 300ms`；暫時不加 NP 專用 100ms 特例。
- **Hydra View**：移除胖 torso / haunch / tail，只留小 root base；九頭改成越高越向左右外擴的 fan。
- **Berserker**：正式 B叔 art pass 暫緩到玩法節奏穩定後。

## Docs / 積木編程規格

- [`docs/GAME_DESIGN.md`](docs/GAME_DESIGN.md) — 遊戲進程與 Playtest 2 Hydra I 規則。
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — Core / Math / Systems / Input / View / Persistence 分層。
- [`docs/BLOCK_CONTRACTS.md`](docs/BLOCK_CONTRACTS.md) — Attack、Cut、Regrowth、NP、Auto Slash、Progression、Save 等插頭。
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
11. **Save 只保存 logical state。** BigInt 精確 round trip；目前 offline progress 明確為 OFF。
12. **`depleted` 與 `killed` 概念仍分離。** 只是 Playtest 2 的 Hydra I 暫時令 0 heads 同時成立。

## Current Runtime

- `index.html` — Babylon portrait stage 入口
- `css/style.css` — 100dvh / safe-area / fixed-control gesture policy
- `js/app.js` — runtime ↔ View / input / browser save lifecycle
- `js/core/` — Clock / State / EventBus / Runtime / Save
- `js/math/` — Hydra Rule / Cut Resolution / logical model
- `js/input/` — 玩家意圖 → Attack Request
- `js/systems/` — Combat / Auto Slash / Regrowth / Modifiers / NP / 人類惡 / Command Spell / Progression
- `js/data/progression.js` — prototype tuning data
- `js/view/` — Battle Stage / Hydra Head Pool / Berserker placeholder / HUD
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

Playtest 1 後，Hydra I 已進入第二版 tuning。下一步不是繼續蓋 Hydra II，而是用 iPhone Playtest 2 回答：

1. NP / Command Spell 快速連點是否還會觸發 double-tap zoom？
2. 普通砍到 0 就 kill，是否明顯比較不無聊？
3. 同一次 NP 能跨多隻 Hydra 後，是否形成值得期待的爆發期？
4. 300ms respawn 是太快、剛好，還是仍太慢？
5. 拿掉胖 body、九頭向上外擴後，Hydra silhouette 是否更清楚？

這五題大致成立後，再 Grill Hydra I 正式節奏與 Hydra II 入口。
