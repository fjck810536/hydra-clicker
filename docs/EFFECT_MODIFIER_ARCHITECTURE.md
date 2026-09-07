# Hydra Clicker — Effect / Modifier Architecture v0.7

> v0.7 對齊 Playtest 4.5.1：NP 的 Hydra effect 仍然只是 generic `hydra.headGrowth` rule modifier；新增 lifecycle invariant：active NP window 不接受 nested release，也不從 active-window cuts 充下一條 NP。這不是新的 Effect Type，而是 NP System 對 timed modifier lifecycle 的擁有權。

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
Cut 本身                           → 不受影響
```

### Legacy target compatibility

舊 save 的：

```text
target: hydra.regrowth
```

仍被 resolver 視為 `hydra.headGrowth` compatibility alias，直到原本 `endsAt`。

## 5. Effect Type C — Capability

用途：解鎖以前不能做的事情。

目前：

```text
Command Spell I
→ combat.autoSlash capability
```

NP 時停**不移除 capability**；它只讓 Auto execution policy 在 window 內判定 disabled。

## 6. Effect Type D — Policy

長期用途：改變自動系統「怎麼選／何時允許執行」，例如 random、nearest-root、highest-growth、predicted-safe-cut。

目前尚未建立通用的 persistent Policy Effect aggregator。

### Auto pause 不是新 Effect Type 落地

目前實作是最小 application composition：

```text
NP System exposes isActive(snapshot)
↓
Core composes Auto Slash isEnabled(snapshot)
↓
active NP → Auto request generation paused
```

這只是現階段的 injected runtime policy，沒有寫進 `state.modifiers.active`，也不宣告通用 Policy Effect framework 已完成。

未來若令咒／科技要允許 Auto 在 NP window 中重新運作，可以把這個條件升級成正式 capability/policy resolution，而不需要改 Hydra Rule。

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

NP active-window detection 可以讀同一批 timed modifier，但 Auto pause 不會把額外資料寫回 modifier array。

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

對 NP 自身則有更強的 source lifecycle invariant：正常 gameplay **不允許同時建立第二個 active NP modifier**。這不是一般 modifier stacking 規則，而是 NP release 的資源／狀態規則。

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

最後一個 active NP window 到期時 emit：

```text
np:ended
```

這是 semantic lifecycle event，不是另一個 modifier。

### NP single-window invariant

NP System owns release / charge lifecycle around the modifier：

```text
NP inactive
→ accepted head:cut may charge gauge
→ READY may release one timed modifier

NP active
→ accepted head:cut still affects Combat/Hydra
→ but contributes 0 NP charge
→ release() rejected with np-already-active
→ no second NP modifier is appended

NP expires
→ np:ended
→ ordinary cut charging resumes
```

這避免長時間 Command Spell II TIME upgrade 在自己的 81 秒 window 中養出下一發 NP 並無限續時停。

不能由 View 動畫結束事件決定 Buff 是否過期；`寶具解放` / `TIME RESUMES` cards 只投影 `np:released` / `np:ended`。

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

特別避免：

```text
NP System → 直接呼叫 AutoSlash.stop()
Auto Slash → if (np)
Hydra Rule → if (source === 'np')
View → 決定 NP endsAt
active NP release → 默默 append 第二個相同 source modifier
```

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
→ final expiry emits np:ended
→ active window cuts do not recharge NP
→ active window rejects nested release

application composition policy
→ active NP temporarily prevents Auto Slash requests
→ Manual Input unaffected

legacy alias
→ hydra.regrowth disable maps to hydra.headGrowth disable
```

尚未落地：

```text
stat-modifier aggregator
persistent/general policy aggregator
conversion aggregator
full capability aggregator
full support/facility source collector
```

**先保留共同接口，需要一種效果時才實作那一種；不提前建一座沒人用的框架。**
