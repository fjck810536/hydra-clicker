# Hydra Clicker — Effect / Modifier Architecture v0.1

> 積木編程 2.1：讓英靈支援、迦勒底科技、建設、研究與 Buff 都能使用同一套可擴充效果介面。

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
Support / Facility / Research / Command Spell
                ↓
          EFFECT DEFINITIONS
                ↓
        MODIFIER AGGREGATOR
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

例：

```text
攻速 +20%
NP Gain ×1.5
素材掉落 +3
再生延遲最低不低於 0.2s
```

離散 headCount 本身不能因為 stat modifier 變成浮點數。

---

## 4. Effect Type B — Rule Modifier

用途：合法修改 Hydra rule engine 的參數或行為開關。

```js
{
  id: 'effect-regrowth-delay',
  type: 'rule-modifier',
  target: 'hydra.regrowthDelay',
  operation: 'multiply',
  value: 1.5
}
```

或：

```js
{
  id: 'effect-disable-regrowth',
  type: 'rule-modifier',
  target: 'hydra.regrowthEnabled',
  operation: 'override',
  value: false,
  durationMs: 5000
}
```

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

例：

```text
random
nearest-root
highest-growth
lowest-growth
highest-material-yield
predicted-safe-cut
```

這是未來支援英靈最有趣的類型之一。

同樣攻速的 B 叔，因為不同支援英靈，可能完全採用不同 Hydra farming 策略。

---

## 7. Effect Type E — Conversion

用途：把一種事件／資源轉成另一種資源。

例：Hydra III Farm Reveal 後：

```js
{
  id: 'conversion-head-to-material',
  type: 'conversion',
  trigger: 'head:cut',
  input: {
    resource: 'head-cut',
    amount: 1n
  },
  output: {
    resource: 'material-a',
    amount: 1n
  }
}
```

科技升級可以增加 conversion rate，而不是讓 Combat 自己開始產素材。

未來可用於：

```text
head cut → material
NP release → 人類惡
excess growth → research data
tree complexity → analyzer points
```

---

## 8. Modifier Aggregator

所有有效 effects 先集中整理，再提供給各 system。

概念 API：

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

各 system 只問 aggregator 結果，不自己遍歷所有角色／科技。

---

## 9. Stacking 規則

需要避免效果順序不同造成不同答案。

建議第一版固定：

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

例如：

```text
base attack speed = 4
+1
×1.2
= 6 attacks/sec
```

不要讓 UI 購買順序改變計算順序。

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

View 可以把它畫成：

```text
[Portrait]
Name
Lv.
Buff summary
```

完全不需要 Babylon character mesh。

---

## 11. Chaldea Facility

Facility 是長期建設型 source。

例：

```text
材料回收室
→ conversion rate +20%

靈子演算室
→ Analyzer Prediction capability

管制室
→ Auto targeting policy slots +1
```

Facility 可以有：

```text
level
build cost
upgrade cost
requirements
effects per level
```

但 Facility System 不得直接知道 Hydra 內部結構。

---

## 12. Research / Technology

Research 比 Facility 更適合做「理解能力」進程。

例如：

```text
Hydra Observation I
→ 顯示 Regrowth/sec

Hydra Observation II
→ 顯示 ΔH

Topological Analysis
→ Tree View

Predictive Computation
→ 預測下一刀結果
```

這樣「迦勒底科技」可以成為遊戲的第三條 progression：

```text
BERSERKER
戰鬥效率

MASTER
控制／自動化

CHALDEA
觀測／研究／經濟基建
```

---

## 13. Temporary Buff

短時間 Buff 與永久科技使用同一個 Effect 格式，只多時間資訊。

```js
{
  sourceId: 'temporary-buff-example',
  effectId: 'effect-attack-speed-01',
  startsAt: 10000,
  endsAt: 20000
}
```

到期由 Game Clock / scheduler 移除。

不能由 View 的動畫結束事件決定 Buff 是否過期。

---

## 14. Effect Scope

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

Condition evaluator 應集中處理，不能散落大量：

```js
if (...) if (...) if (...)
```

---

## 15. 第三令咒也可以只是 Capability Source

如果未來確定：

```text
COMMAND SPELL III
→ Tree Targeting
```

程式上不需要特殊架構。

它只是：

```js
{
  source: 'command-spell-3',
  effect: {
    type: 'capability',
    capability: 'tree.targeting'
  }
}
```

因此令咒、英靈、科技、設施可以共享同一個效果語言。

---

## 16. 為什麼這樣做

目標不是「把所有東西抽象化」。

目標是避免未來內容增加時形成：

```text
30 英靈
× 20 設施
× 40 科技
× Hydra I–VIII
```

然後核心程式充滿角色專用 `if`。

健康狀態應該是：

```text
新增英靈
≈ 新增 data definition

新增普通科技
≈ 新增 effect definition

新增 Facility
≈ 新增 source + effect definitions
```

只有真正出現新的遊戲概念時，才增加新的 System / Effect Type。

---

## 17. Phase 3 暫時實作多少？

不要因為有這份架構就把完整 Support 系統一次做完。

Phase 3 只需要實作最小 Modifier 基礎：

```text
stat-modifier
capability
```

足夠支援：

- Attack Speed 升級。
- Auto Slash 解鎖。
- NP Gain 升級。

`rule-modifier`, `policy`, `conversion` 等到 Hydra II / III 需要時再正式落地。

**先保留共同接口，不提前建一座沒人用的框架。**
