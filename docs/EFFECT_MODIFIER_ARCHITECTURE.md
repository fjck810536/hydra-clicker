# Hydra Clicker — Effect / Modifier Architecture v0.5

> v0.5 對齊 Playtest 3：NP 從只關閉 Hydra I delayed regrowth，升級為 generic Hydra head-growth suppression，因此可同時作用於 Hydra I regrowth 與 Hydra II immediate structural spawn。

## 1. 目標

未來可能加入：

- 不會移動的其他英靈支援。
- 應援團式被動 Buff。
- 迦勒底科技。
- 建設／設施。
- 研究樹。
- 禮裝式被動能力。
- 後期 Hydra Analyzer / Tree Tool 升級。

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

## 2. Effect Source 與 Effect 分開

Source 回答「效果從哪裡來？」；Effect 回答「它改變什麼？」。Source 名稱不能進核心算法。

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

目前 NP：

```js
{
  id: 'np-head-growth-window-0',
  type: 'rule-modifier',
  target: 'hydra.headGrowth',
  effect: 'disable',
  startsAt: 10000,
  endsAt: 13000,
  source: 'np',
  scope: 'timed'
}
```

Modifier resolver 輸出：

```js
{
  headGrowthEnabled: false,
  regrowthEnabled: false
}
```

Hydra Rules 不知道 source 是 NP。

`hydra.headGrowth` 的語義是：**是否允許 Hydra 因自身規則生成新頭**。

因此目前：

```text
Hydra I delayed same-head regrowth → 受影響
Hydra II immediate GROW +2        → 受影響
```

Cut 本身不受影響。

### Legacy target compatibility

Playtest 2/3 舊 save 可能仍保存：

```text
target: hydra.regrowth
```

Resolver 暫時把它視為 `hydra.headGrowth` 的 compatibility alias，讓已經啟動中的舊 NP window 繼續正確作用到 `endsAt`。新 release 一律使用 `hydra.headGrowth`。

Rule modifier 不能直接改 mesh，也不能用角色名稱判斷。

後期可能用於：

- reproduction factor
- regrowth delay
- turn coefficient
- legal targeting constraint
- branch copy rule parameter

## 5. Effect Type C — Capability

用途：解鎖以前不能做的事情，例如 Auto Slash、Auto NP、Analyzer、Tree View。

目前：

```text
Command Spell I
→ combat.autoSlash capability
```

## 6. Effect Type D — Policy

用途：改變自動系統「怎麼選」，而不是直接改數值。

候選：random、nearest-root、highest-growth、predicted-safe-cut 等。

## 7. Effect Type E — Conversion

用途：把事件／資源轉成另一種資源。尚未正式落地。

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

## 9. Stacking 規則

未來同 target 多 source 時建議：

```text
BASE
↓
ADD
↓
MULTIPLY
↓
MIN / MAX clamps
↓
OVERRIDE
```

目前 `hydra.headGrowth / disable` 尚無 stacking 複雜度。

## 10. Support / Facility / Research

這些未來內容只應提供標準 Effect / Modifier，不得直接改 Hydra state 或呼叫 Combat internals。

## 11. Temporary Buff / Modifier Lifecycle

目前 NP：

```js
{
  type: 'rule-modifier',
  target: 'hydra.headGrowth',
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
Save / Restore：保存 modifier + simulation timeline
```

不能由 View 動畫結束事件決定 Buff 是否過期。

## 12. Effect Conditions

未來若效果只作用於某些 generation，condition evaluator 應集中處理，不散落角色專用 if。

## 13. 為什麼這樣做

健康狀態應是：

```text
新增普通英靈 ≈ 新增 data / effect definition
新增普通科技 ≈ 新增 effect definition
新增 Facility ≈ 新增 source + effect definitions
```

只有真的出現新的遊戲概念，才增加 System / Effect Type。

## 14. 目前實作狀態

已落地：

```text
capability
→ Command Spell I → Auto Slash

rule-modifier
→ NP head-growth suppression
→ Hydra I delayed regrowth + Hydra II structural spawn

timed lifecycle
→ NP 可跨 encounter，直到 endsAt

legacy alias
→ hydra.regrowth disable maps to hydra.headGrowth disable
```

尚未落地：

```text
stat-modifier aggregator
policy
conversion aggregator
full capability aggregator
full support/facility source collector
```

**先保留共同接口，需要一種效果時才實作那一種；不提前建一座沒人用的框架。**
