# Hydra Clicker — Effect / Modifier Architecture v0.4

> 積木編程 2.1：讓英靈支援、迦勒底科技、建設、研究、令咒與 Buff 都能使用同一套可擴充效果語言。v0.4 對齊 Playtest 2：NP 改為跨 encounter 的 timed modifier。

## 1. 目標

未來可能加入：

- 不會移動的其他英靈支援。
- 應援團式被動 Buff。
- 迦勒底科技。
- 建設／設施。
- 研究樹。
- 禮裝式被動能力。
- 後期 Hydra Analyzer / Tree Tool 升級。

這些內容不能各自直接修改 Combat、Hydra、NP 或 Farming。

共同資料流：

```text
CONTENT SOURCE
Support / Facility / Research / Command Spell / Temporary Buff
                ↓
          EFFECT DEFINITIONS
                ↓
        MODIFIER / CAPABILITY RESOLUTION
                ↓
 ┌─────────┬─────────┬──────────┬──────────┐
 ↓         ↓         ↓          ↓
Combat     NP      Farming    Analyzer / Hydra Rules
```

---

## 2. Effect Source 與 Effect 分開

### Source

回答：「效果從哪裡來？」

```js
{
  id: 'support-example',
  type: 'support',
  enabled: true,
  effects: ['effect-attack-speed-01']
}
```

可能 source type：

```text
support
facility
research
upgrade
command-spell
temporary-buff
np
```

### Effect

回答：「它實際改變什麼？」

Source 名稱不能進核心算法。

---

## 3. Effect Type A — Stat Modifier

用途：修改連續數值或倍率。

```js
{
  id: 'effect-attack-speed-01',
  type: 'stat-modifier',
  target: 'combat.attacksPerSecond',
  operation: 'multiply',
  value: 1.25,
  stackingGroup: 'attack-speed'
}
```

候選 operation：

```text
add
multiply
set-min
set-max
```

離散 `headCount` 本身不能因為 stat modifier 變成浮點數。

---

## 4. Effect Type B — Rule Modifier

用途：合法修改 Hydra rule engine 的參數或行為開關。

一般概念：

```js
{
  id: 'effect-regrowth-delay',
  type: 'rule-modifier',
  target: 'hydra.regrowthDelay',
  operation: 'multiply',
  value: 1.5
}
```

目前第一個真正使用的 rule modifier 是 NP：

```js
{
  id: 'np-regeneration-window-0',
  type: 'rule-modifier',
  target: 'hydra.regrowth',
  effect: 'disable',
  startsAt: 10000,
  endsAt: 13000,
  source: 'np',
  scope: 'timed'
}
```

Hydra Rule 只收到解析後的：

```js
{
  regrowthEnabled: false
}
```

它不知道 source 是 NP。

Playtest 2 後，NP 不再使用 `scope: 'encounter'`。`scope: 'timed'` 的生命週期只由 Game Clock 與 `endsAt` 決定，因此一隻 Hydra 死亡／下一隻 Hydra 出生都不會取消同一個 NP window。

Rule modifier 不能直接改 mesh，也不能用角色名稱判斷。

後期可能用於：

- reproduction factor
- regrowth delay
- turn coefficient
- legal targeting constraint
- branch copy rule parameter

---

## 5. Effect Type C — Capability

用途：解鎖以前不能做的事情。

```js
{
  id: 'cap-auto-slash',
  type: 'capability',
  capability: 'combat.autoSlash'
}
```

例：

```text
Auto Slash
Auto NP
Analyzer v0.2
Next Cut Prediction
Tree View
Tree Targeting
Offline Farming
```

Capability 是 bool / level / feature flag，不等同 stat buff。

目前第一個正式 capability source：

```text
Command Spell I
↓ purchase / unlock
combat.autoSlash
↓
master.commandSpells.autoSlash = true
```

依賴方向：

```text
Command Spell system → 寫 capability state
Auto Slash system    → 讀 capability state
```

禁止 Command Spell system 直接呼叫 Auto Slash internals。

---

## 6. Effect Type D — Policy

用途：改變自動系統「怎麼選」，而不是直接改數值。

```js
{
  id: 'policy-high-growth-target',
  type: 'policy',
  target: 'combat.targeting',
  value: 'highest-growth'
}
```

候選：

```text
random
nearest-root
highest-growth
lowest-growth
highest-material-yield
predicted-safe-cut
```

等 Tree / Support targeting 真正需要時再實作。

---

## 7. Effect Type E — Conversion

用途：把一種事件／資源轉成另一種資源。

Hydra III Farm Reveal 候選：

```js
{
  id: 'conversion-head-to-material',
  type: 'conversion',
  trigger: 'head:cut',
  input: { resource: 'head-cut', amount: 1n },
  output: { resource: 'material-a', amount: 1n }
}
```

目前的人類惡獎勵仍是獨立 economy system 監聽 `hydra:killed`；不要為了形式統一提前把所有經濟塞進 Conversion framework。

---

## 8. Modifier Aggregator

長期概念 API：

```js
modifierAggregator.build({
  supports,
  facilities,
  research,
  upgrades,
  commandSpells,
  temporaryBuffs
})
```

輸出：

```js
{
  stats: { ... },
  ruleModifiers: { ... },
  capabilities: { ... },
  policies: { ... },
  conversions: [ ... ]
}
```

目前只實作必要最小接口：

```text
state.modifiers.active
        ↓
getActiveModifiers()
        ↓
resolveRuleContext()
        ↓
Hydra Rule
```

Capability 目前則仍使用 logical feature flag。等 Support / Facility 真正進場後，再補 source collection、stacking、condition evaluator 與 capability aggregation。

---

## 9. Stacking 規則

未來同 target 有多個 source 時，建議固定：

```text
BASE
↓
ADD modifiers
↓
MULTIPLY modifiers
↓
MIN / MAX clamps
↓
OVERRIDE（只有明確設計允許時）
```

不要讓 UI 購買順序改變計算順序。

目前單一 `hydra.regrowth / disable` 還沒有 stacking 問題；需要第二個同 target source 時再正式實作排序。

---

## 10. Support Unit

不會動的英靈支援可以完全只存在 data / UI。

```js
{
  id: 'support-example',
  displayName: 'Support Example',
  slotCost: 1,
  effects: [
    'effect-np-gain-01',
    'policy-high-growth-target'
  ]
}
```

完全不需要 Babylon character mesh。

---

## 11. Chaldea Facility

Facility 是長期建設型 source，例如：

```text
材料回收室 → conversion rate +20%
靈子演算室 → Analyzer Prediction capability
管制室     → Auto targeting policy slots +1
```

Facility System 不得直接知道 Hydra 內部結構。

---

## 12. Research / Technology

Research 比 Facility 更適合做「理解能力」進程，例如：

```text
Hydra Observation I  → 顯示 Regrowth/sec
Hydra Observation II → 顯示 ΔH
Topological Analysis → Tree View
Predictive Computation → 預測下一刀結果
```

三條 progression 仍可維持：

```text
BERSERKER → 戰鬥效率
MASTER    → 控制／自動化
CHALDEA   → 觀測／研究／經濟基建
```

---

## 13. Temporary Buff / Modifier Lifecycle

短時間 Buff 與永久科技可以使用相同 Effect 格式，但多時間與 lifecycle 資訊。

目前 NP：

```js
{
  type: 'rule-modifier',
  target: 'hydra.regrowth',
  effect: 'disable',
  startsAt: 10000,
  endsAt: 13000,
  scope: 'timed'
}
```

### `scope: timed`

```text
生效條件：startsAt <= now < endsAt
結束條件：Game Clock 到達 endsAt
encounter change：不影響
Save / Restore：保存 modifier + simulation timeline，剩餘窗口繼續
```

### `scope: encounter`

架構仍允許 encounter-scoped modifier：

```text
新 Hydra encounter 時由 Progression 清除
```

但 **目前 NP 不屬於這一類**。未來真的出現「只影響這一隻 Hydra」的 Buff 再使用即可。

不要因此提前發明完整 lifecycle taxonomy；`timed` 與 `encounter` 已足夠目前需求。

不能由 View 動畫結束事件決定 Buff 是否過期。

---

## 14. Effect Conditions

部分效果只應作用於特定情境。

```js
{
  type: 'stat-modifier',
  target: 'combat.attacksPerSecond',
  value: 2,
  operation: 'multiply',
  conditions: [
    { type: 'hydra-generation-min', value: 2 }
  ]
}
```

Condition evaluator 應集中處理，不能散落大量角色／狀態專用 `if`。

---

## 15. 第三令咒也可以只是 Capability Source

若未來確定：

```text
COMMAND SPELL III → Tree Targeting
```

程式上不需要特殊架構，只需要 capability source。

---

## 16. 為什麼這樣做

目標不是「把所有東西抽象化」，而是避免：

```text
30 英靈 × 20 設施 × 40 科技 × Hydra I–VIII
```

最後核心充滿角色專用 `if`。

健康狀態應是：

```text
新增普通英靈 ≈ 新增 data / effect definition
新增普通科技 ≈ 新增 effect definition
新增 Facility ≈ 新增 source + effect definitions
```

只有真的出現新的遊戲概念，才增加 System / Effect Type。

---

## 17. 目前實作狀態

已因實際需求落地：

```text
capability
→ Command Spell I → Auto Slash

rule-modifier
→ NP regeneration window

timed lifecycle
→ Playtest 2 NP 可跨多個 Hydra encounter，直到 endsAt

encounter lifecycle
→ Progression 仍支援清除真正的 encounter-only modifier
```

尚未因實際需求落地：

```text
stat-modifier
policy
conversion aggregator
full capability aggregator
full support/facility source collector
```

**先保留共同接口，需要一種效果時才實作那一種；不提前建一座沒人用的框架。**
