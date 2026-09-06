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
- [`docs/BLOCK_CONTRACTS.md`](docs/BLOCK_CONTRACTS.md) — Attack、Cut、Regrowth、NP、Auto Slash、Upgrade、Snapshot、Save 等積木插頭規格。
- [`docs/EFFECT_MODIFIER_ARCHITECTURE.md`](docs/EFFECT_MODIFIER_ARCHITECTURE.md) — 英靈支援、迦勒底科技、設施、研究、Buff 共用的 Effect / Modifier 架構。
- [`docs/PLATFORM_CONTRACT.md`](docs/PLATFORM_CONTRACT.md) — iOS Safari 直立舞台、viewport、手勢鎖定、局部 scroll 與 Babylon render boundary。
- [`AGENTS.md`](AGENTS.md) — 給 ChatGPT、Codex、Claude Code 與未來開發者看的積木施工守則。

## Playtest / Tuning

- [`docs/PLAYTEST_1.md`](docs/PLAYTEST_1.md) — 第一次 iPhone 實機試玩原始觀察：iOS 雙擊放大、NP 單 encounter、Hydra I 擊殺節奏、Hydra 輪廓、Berserker placeholder。
- [`docs/PATCH_PLAN_HYDRA_I_TUNING.md`](docs/PATCH_PLAN_HYDRA_I_TUNING.md) — Playtest 1 對應施工計畫；在 Hydra II 前先完成 Hydra I tuning patch，再做 Playtest 2。

## Engineering Principles

1. **Hydra Math 不依賴 Babylon.js。**
2. **邏輯頭數不等於畫面頭數。** 真實頭數可以很大；3D 畫面最多約 99 heads。
3. **離散數量保持整數。** 頭數／素材數預計以 `BigInt` 或可替換的大整數層保存。
4. **View 只負責演出。** Mesh、animation、particle 不得反過來決定遊戲規則。
5. **Fate 梗與角色名隔離在 data/text 層。** 規則本身可以日後換成原創皮。
6. **支援、科技、設施與研究優先輸出標準 Effect / Modifier。** 不直接跨層修改核心系統。
7. **iOS portrait first。** Battle Stage 鎖頁面 scroll / zoom gesture；未來長面板只開自己的局部 scroll。
8. **Head Pool 是投影。** Hydra I 初始只建 9 個 head slots；未來按需擴張，但可見 mesh 硬上限 99，永遠不能反推 logical head count。
9. **Animation 也是投影。** Combat 先完成 logical resolution，再用 semantic events 驅動 Berserker 動畫；動畫完成與否不能決定砍頭結果。
10. **NP 以 Rule Modifier 實作。** NP 不直接改 Hydra；它只暫時關閉 `hydra.regrowth`，既有再生事件在窗口內暫停，新斬首不建立再生，真正歸零時由 Hydra Rule 宣告 kill。
11. **Progression 不藏進 Combat。** `hydra:killed` 之後由 economy / progression systems 分別處理人類惡、周回重生與令咒資格；Command Spell I 只解鎖 capability，Auto Slash 自己讀 capability。
12. **Save 只保存 logical state。** BigInt 以版本化格式序列化；Clock 從保存的 simulation time / tick 恢復。Block 9 不做 offline progress，關閉期間的現實時間不直接推進遊戲。

## Current Repository

- `index.html` — Phase 3 Babylon portrait stage 入口
- `css/style.css` — iOS `100dvh` / safe-area / gesture-lock / HUD layout
- `js/app.js` — 把 headless Hydra I runtime 接到 View，並處理 browser save lifecycle
- `js/core/` — Clock / State / EventBus / Runtime / versioned Save
- `js/core/save.js` — BigInt-safe save envelope、Storage adapter、格式版本
- `js/math/` — Hydra 純邏輯 Rule / Cut Resolution / logical model helpers
- `js/input/manual-attack.js` — 手動輸入轉成標準 Attack Request
- `js/data/progression.js` — Hydra I 周回、人類惡、Command Spell I 的可調 prototype 數值
- `js/systems/combat.js` — Attack Request → Hydra Rule → Cut Result
- `js/systems/auto-slash.js` — Game Clock 驅動的自動斬擊 request generator
- `js/systems/hydra-regrowth.js` — Game Clock 驅動的 Hydra 再生處理
- `js/systems/modifiers.js` — 最小 timed rule-modifier resolver
- `js/systems/np.js` — NP charge / release / regeneration-stop window
- `js/systems/humanity-evil.js` — `hydra:killed` → 人類惡 economy event
- `js/systems/command-spells.js` — Command Spell I 資格、消費與 Auto Slash capability unlock
- `js/systems/progression.js` — defeated encounter → 下一隻 Hydra I 周回重生
- `js/view/battle-scene.js` — Babylon engine / orthographic camera / lights / stage anchors
- `js/view/hud-view.js` — read-only logical HUD projection
- `js/view/hydra-view.js` — 低模 Hydra 身體與 logical snapshot → visual projection
- `js/view/head-pool.js` — 初始 9-slot、按需擴張、99 visible heads 硬上限
- `js/view/berserker-view.js` — 低模 Berserker placeholder、idle bob、event-driven strike animation
- `tests/*.node.test.js` — Node 原生核心、存檔與架構 contract 自動測試
- `.github/workflows/test.yml` — 每次 push 自動跑 `npm test`
- `docs/` — 設計、架構、平台、效果、Playtest 與 tuning 規格
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
- [x] **Block 5 — 9-head Hydra visual pool**
  - low-poly placeholder Hydra body / tail / nine heads
  - initial 9-slot pooled head meshes
  - cut/regrowth projected from logical snapshot
  - slots disable / re-enable instead of new/dispose on every cut
  - pool can expand on demand but never beyond 99 visible heads
  - astronomical BigInt head counts safely saturate at 99 visible heads
  - View never writes mesh count back into logical state
  - projection contract tests + GitHub Actions CI
- [x] **Block 6 — Placeholder Berserker animation**
  - low-poly primitive Berserker body / weapon
  - lightweight idle bob
  - `attack:resolved` → View-only `playAttack()`
  - rejected attacks do not animate as successful strikes
  - animation never triggers or gates logical head removal
  - later GLB replacement can keep the same View-facing interface
  - view-boundary contract tests + GitHub Actions CI
- [x] **Block 7 — NP / regen stop window**
  - accepted head cuts charge NP
  - prototype gauge fills after 8 heads (`0.125` per head)
  - NP release creates a 3.0 s timed `rule-modifier`
  - pending regrowth pauses during the active window
  - new cuts during NP do not schedule regrowth
  - reaching zero during NP clears pending regrowth and becomes true `hydra:killed`
  - NP HUD / release button remains a runtime request, never direct Hydra mutation
  - headless NP tests + View boundary tests + GitHub Actions CI
- [x] **Block 8 — 人類惡 + Command Spell I**
  - true `hydra:killed` awards prototype `+11` 人類惡
  - defeated Hydra waits 1.2 s, then a clean Hydra I encounter respawns
  - encounter-scoped NP modifiers do not leak into the next round
  - prototype tuning: `9 kills × 11 = 99 人類惡`
  - Command Spell I requires 9 kills and costs 99 人類惡
  - purchase emits semantic spend / unlock events and sets Auto Slash capability
  - Auto Slash begins operating from capability state; Command Spell system never calls it directly
  - fractional accumulator boundary fixed so 1 attack/sec produces one attack in exactly one simulated second
  - portrait HUD displays KILLS / 人類惡 / Command Spell I without owning the rules
  - headless 9-round tests + UI/data boundary tests + GitHub Actions CI
- [x] **Block 9 — Save**
  - versioned save envelope stored in browser `localStorage`
  - nested BigInt values round-trip without precision loss
  - logical Hydra state、pending regrowth、temporary modifiers、economy、statistics、capabilities persist
  - GameClock resumes saved `simulationTimeMs` / tick instead of restarting at zero
  - 5 s simulation autosave + progression events + `visibilitychange` / `pagehide`
  - corrupted / unsupported save data is rejected and the game can fall back to a fresh session
  - no Babylon mesh / scene / animation / visible head cache enters save data
  - Block 9 intentionally pauses while closed; offline progress is a future system
  - persistence / clock restore / app boundary tests + GitHub Actions CI

## Phase 3 Goal — Complete

Hydra I vertical slice 現在已具備：

- Babylon.js 固定側視舞台。
- placeholder 低模 Berserker attack animation。
- 9-head Hydra 斬首、再生與真正討伐。
- 邏輯頭數與渲染頭數分離。
- NP 有效斬殺窗口。
- 人類惡周回資源。
- Command Spell I → Auto Slash。
- Browser local save / restore。

**Block 1–9 已完成。第一次 iPhone Playtest 也已完成；現在先做 Hydra I tuning patch，不直接進 Hydra II。**

下一輪依 `docs/PATCH_PLAN_HYDRA_I_TUNING.md` 依序處理 iOS double-tap zoom、Hydra I zero-head kill、NP multi-encounter window、respawn pacing 與 Hydra silhouette，再做 Playtest 2 / Grill。
