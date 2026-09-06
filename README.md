# hydra-clicker

拔—灑卡，幹死那頭海德拉！

一個瀏覽器上直接玩的低模 Hydra clicker / incremental game 原型。

目前方向：固定側視角低模狂戰士持續斬擊 Hydra；遊戲前期像普通周回 clicker，中期把 Hydra 增殖轉化為素材農場，後期逐步解鎖 Tree View 與數學分析儀。

## Current Design

```text
Hydra I
頭會復原，復原速度逐步加快
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
發現 Hydra 其實可以被當成「生頭農場」
↓
Analyzer / Tree View
逐步看見真正的結構與公式
```

這裡的 Hydra I → II → III 暫時不是傳統 prestige/reset；玩家已購買的自動化與主要升級會保留，只是 Hydra 的規則逐代變化。

## Phase 2 — 積木編程規格

- [`docs/GAME_DESIGN.md`](docs/GAME_DESIGN.md) — 遊戲層級、Hydra 世代、令咒、人類惡、Hydra Farm、Analyzer。
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — Core / Math / Systems / Input / View / Data 的工程分層。
- [`docs/BLOCK_CONTRACTS.md`](docs/BLOCK_CONTRACTS.md) — Attack、Cut、Regrowth、NP、Auto Slash、Upgrade、Snapshot 等積木插頭規格。
- [`docs/EFFECT_MODIFIER_ARCHITECTURE.md`](docs/EFFECT_MODIFIER_ARCHITECTURE.md) — 英靈支援、迦勒底科技、設施、研究、Buff 共用的 Effect / Modifier 架構。
- [`docs/PLATFORM_CONTRACT.md`](docs/PLATFORM_CONTRACT.md) — iOS Safari 直立舞台、viewport、手勢鎖定、局部 scroll 與 Babylon render boundary。
- [`AGENTS.md`](AGENTS.md) — 給 ChatGPT、Codex、Claude Code 與未來開發者看的積木施工守則。

## Engineering Principles

1. **Hydra Math 不依賴 Babylon.js。**
2. **邏輯頭數不等於畫面頭數。** 真實頭數可以很大；3D 畫面最多約 99 heads。
3. **離散數量保持整數。** 頭數／素材數預計以 `BigInt` 或可替換的大整數層保存。
4. **View 只負責演出。** Mesh、animation、particle 不得反過來決定遊戲規則。
5. **Fate 梗與角色名隔離在 data/text 層。** 規則本身可以日後換成原創皮。
6. **支援、科技、設施與研究優先輸出標準 Effect / Modifier。** 不直接跨層修改核心系統。
7. **iOS portrait first。** Battle Stage 鎖頁面 scroll / zoom gesture；未來長面板只開自己的局部 scroll。

## Current Repository

- `index.html` — Phase 3 Babylon portrait stage 入口
- `css/style.css` — iOS `100dvh` / safe-area / gesture-lock / HUD layout
- `js/app.js` — 把 headless Hydra I runtime 接到 View
- `js/core/` — Clock / State / EventBus / Runtime
- `js/math/` — Hydra 純邏輯 Rule / Cut Resolution / logical model helpers
- `js/input/manual-attack.js` — 手動輸入轉成標準 Attack Request
- `js/systems/combat.js` — Attack Request → Hydra Rule → Cut Result
- `js/systems/auto-slash.js` — Game Clock 驅動的自動斬擊 request generator
- `js/systems/hydra-regrowth.js` — Game Clock 驅動的 Hydra 再生處理
- `js/view/battle-scene.js` — Babylon engine / orthographic camera / lights / stage anchors
- `js/view/hud-view.js` — read-only logical HUD projection
- `tests/*.node.test.js` — Node 原生核心與架構 contract 自動測試
- `.github/workflows/test.yml` — 每次 push 自動跑 `npm test`
- `docs/` — 設計、架構、平台與效果規格
- `AGENTS.md` — AI / contributor 架構守則
- `assets/` — 未來模型、圖片、音效、字型

舊的 `js/game.js`, `js/hydra.js`, `js/heracles.js` 暫時保留供回溯；新的 `index.html` 已改接 Phase 3 runtime / View。

## Phase 3 — Implementation Status

- [x] **Block 1 — Core Clock + State**
  - fixed-step `GameClock`
  - logical `GameStateStore`
  - semantic `EventBus`
  - thin `createCoreRuntime()` orchestrator
  - Node CI regression tests
- [x] **Block 2 — Hydra I pure logic**
  - Hydra I rule: cut → delayed same-head regrowth
  - pure Cut Resolution
  - logical regrowth queue
  - `depleted` 與真正 `killed` 分離
  - Game Clock 驅動再生，不使用 gameplay `setTimeout`
  - Node tests + GitHub Actions CI
- [x] **Block 3 — Combat / Auto Slash**
  - manual input 與 Auto Slash 共用標準 Attack Request
  - Combat 注入 active Hydra Rule，不用 generation `if`
  - fractional attack-rate accumulator
  - high-speed multi-strike batch request / sequential resolution
  - `createHydraIGameRuntime()` headless gameplay composition
  - Node tests + GitHub Actions CI
- [x] **Block 4 — Babylon battle stage**
  - iOS Safari portrait-first `100dvh` shell
  - page scroll / double-tap / battle gesture lock
  - safe-area aware HUD
  - orthographic fixed-side camera
  - backdrop / ground / lighting
  - Berserker left anchor / Hydra right anchor
  - landscape rotate guard for small screens
  - headless Hydra I runtime connected to Babylon View
  - stage contract tests + GitHub Actions CI
- [ ] **Block 5 — 9-head Hydra visual pool**
- [ ] **Block 6 — Placeholder Berserker animation**
- [ ] **Block 7 — NP / regen stop window**
- [ ] **Block 8 — 人類惡 + Command Spell I**
- [ ] **Block 9 — Save**

## Phase 3 Goal

下一個可玩里程碑只做 Hydra I：

- Babylon.js 固定側視舞台。
- placeholder 低模 Berserker 循環攻擊。
- 9-head Hydra 可被斬首並延遲長回。
- 邏輯頭數與可見 heads 分離。
- NP 可產生短暫有效斬殺窗口。
- Command Spell I 解鎖 Auto Slash。

Hydra II 在這一輪穩定以前不進場。
