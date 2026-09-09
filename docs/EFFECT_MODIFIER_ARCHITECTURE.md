# Hydra Clicker — Effect / Modifier Architecture v0.9

> v0.9：對齊 long-term Command Spell economy。`U_n`、fixed price、`pricePending` 都是 **Data / Economy concerns**，不是新的 Effect Type。NP 對 Hydra 仍只有 generic `hydra.headGrowth` timed rule modifier；Command Spell III 仍只提供 Auto-in-NP policy projection。CS III Lv1 現在有 891 HE 正式價格，但這不改 effect architecture。

## 1. 目標

未來可能加入：

- 英靈支援／應援團被動 Buff；
- 迦勒底科技；
- 建設／設施；
- 研究樹；
- 禮裝式被動能力；
- Analyzer / Tree Tool 升級。

共同方向：

```text
CONTENT SOURCE
Support / Facility / Research / Command Spell / Temporary Buff
                ↓
          EFFECT DEFINITIONS
                ↓
        MODIFIER / CAPABILITY / POLICY
                ↓
 ┌──────────┬──────────┬───────────┬──────────┐
 ↓          ↓          ↓           ↓
Combat     NP       Farming     Analyzer / Rules
```

Source 回答「從哪來」；Effect 回答「改變什麼」。Source 專名不能滲進核心算法。

## 2. Economy is not an Effect Type

Long-term design notation：

```text
U_n = 11 × 3^(n-1)
```

和：

```js
getHumanityEvilCostForGenerationUnits(generation, units)
```

只負責把 relative price 轉成 raw Humanity Evil。

它們不應被建成：

```text
stat modifier
rule modifier
capability
policy
conversion
```

Likewise：

```text
cost
pricePending
canAfford
available
extensionPending
```

是 Content Data / System Status，不是 runtime Effect。

原因：價格決定「能不能取得能力」，而 Effect 決定「取得之後能力如何作用」。兩者必須分開。

## 3. Effect Type A — Stat Modifier

用途：修改連續數值／倍率。

長期例：

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

目前尚未建立通用 stat-modifier aggregator。

Command Spell I 現在直接投影 owned APS 到 logical state；未來若來源變多，再抽成 aggregator。

## 4. Effect Type B — Rule Modifier

用途：合法改變 Hydra Rule 的參數或開關。

Current NP：

```js
{
  type: 'rule-modifier',
  target: 'hydra.headGrowth',
  effect: 'disable',
  startsAt,
  endsAt,
  source: 'np',
  scope: 'timed'
}
```

Resolver：

```js
{
  headGrowthEnabled: false,
  regrowthEnabled: false
}
```

語義：是否允許 Hydra 因**自身規則**生成新頭。

因此：

```text
Hydra I delayed same-head regrowth → affected
Hydra II immediate GROW+2         → affected
Hydra III immediate GROW+2        → affected
Cut itself                         → unaffected
```

Hydra Rule 不知道 source 是 NP。

### Legacy alias

舊 save：

```text
target: hydra.regrowth
```

仍由 resolver 視為 `hydra.headGrowth` compatibility alias，直到原 modifier `endsAt`。

## 5. Effect Type C — Capability

用途：解鎖以前不能做的事情。

目前：

```text
Command Spell I
→ combat.autoSlash capability
```

NP 時停不移除 capability；只改 execution policy。

Command Spell III 也不重新授予 Auto capability。沒有 Command Spell I 的 Auto，就沒有東西可帶進 NP。

## 6. Effect Type D — Policy

用途：改變自動系統「何時／如何執行」。

目前尚未建立 persistent/general Policy Effect aggregator；使用最小 Core composition。

### NP base policy

```text
NP active
→ Auto Slash execution paused
```

### Command Spell III bridge

CS III System status：

```text
0
1/9
1/3
1
```

Core composition：

```text
NP inactive
→ Auto allowed at Command Spell I base APS

NP active + fraction0
→ Auto disabled

NP active + fraction>0
→ Auto enabled
→ effective APS = base APS × fraction
```

這是 runtime injected policy，不寫入 `state.modifiers.active`。

重要：

```text
Command Spell III → Auto execution policy
Command Spell II  → manual NP technique / NP config
```

兩者互不相乘：CS III auto request 不繼承 CS II manual `strikeCount=3/6/9`。

## 7. Effect Type E — Conversion

用途：事件／資源轉另一種資源。

尚未正式落地通用 conversion aggregator。

Humanity Evil true-kill reward 目前是 Economy System consume `hydra:killed` 的專責流程；在需要多來源 conversion 時才升級成通用架構。

## 8. NP modifier lifecycle

`scope: timed`：

```text
active iff startsAt <= simulationTime < endsAt
encounter transition does not remove it
save/restore keeps modifier + simulation timeline
expiry by GameClock
```

Semantic events：

```text
np:released
np:ended
```

View cards only project these events；animation completion never controls modifier expiry。

### Single-window invariant

```text
NP inactive
→ accepted cut may charge
→ full gauge may create one timed modifier

NP active
→ accepted cut still affects Hydra
→ contributes zero NP charge
→ release() rejected: np-already-active
→ no second NP modifier appended

expiry
→ np:ended
→ ordinary charging resumes
```

This prevents long-duration CS II time upgrades from self-sustaining permanent time stop。

## 9. Command Spell II is config/effect projection, not Hydra modifier ownership

CS II changes player technique：

```text
manual strikeCount
NP maxPoints
future NP duration
```

It does **not**：

```text
append hydra.headGrowth modifiers
modify existing modifier endsAt mid-window
mutate Hydra directly
control Auto-in-NP
```

Price state (`297 / 198 / 891`, later `PRICE TBD`) remains Economy/Data concern and does not alter these boundaries。

`futureExtensionPending` likewise only says current content rows do not represent the conceptual end of the time axis；it is not an Effect。

## 10. Command Spell III price versus effect

Current formal first purchase：

```text
9 U3 = 891 Humanity Evil
→ acquire Auto-in-NP 1/9 policy
```

Later：

```text
1/3 price range → pricePending
FULL price range → pricePending
```

The difference between 891 and TBD changes **acquisition availability only**。

Once an effect is owned/test-injected：

```text
1/9 behaves as 1/9
1/3 behaves as 1/3
FULL behaves as 1
```

regardless of how it was acquired。

## 11. Future Modifier Aggregator

Long-term conceptual API：

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

Current minimum：

```text
state.modifiers.active
        ↓
getActiveModifiers()
        ↓
resolveRuleContext()
        ↓
Hydra Rule
```

Do not build general aggregation infrastructure until two or more real sources need the same composition problem。

## 12. Stacking order — future guidance

For multiple stat sources：

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

Current `hydra.headGrowth / disable` has no complex stacking requirement。

NP source lifecycle is stronger than generic stacking：normal gameplay forbids a second simultaneous active NP window。

## 13. Conditions

If future effect applies only to generations / encounters / tree states, condition evaluation should be centralized rather than scattered source-specific `if` statements。

Current examples stay at composition boundaries：

```text
Hydra II intro guard → Core Auto policy
NP active → Core Auto policy
CS III fraction → Core Auto policy
```

## 14. Forbidden coupling

```text
NP System → AutoSlash.stop()
Auto Slash System → if (commandSpellIII)
Hydra Rule → if (source === 'np')
CS III System → mutate AutoSlash accumulator
CS II System → append Hydra modifier directly
View → choose effect expiry
pricePending → modifier
U_n → stat modifier
Humanity Evil price → Hydra Rule
range price → choose endpoint in Effect layer
```

## 15. Current implementation status

已落地：

```text
Capability
→ CS I unlocks Auto Slash

Rule Modifier
→ NP disables hydra.headGrowth

Timed lifecycle
→ NP GameClock window + np:ended

Injected policy
→ NP pauses Auto
→ CS III can restore 1/9 / 1/3 / FULL Auto APS inside NP

Technique projection
→ CS II controls manual multistrike / NP gauge / future release duration

Economy separation
→ U_n helpers and PRICE TBD never become gameplay modifiers
```

尚未落地：

```text
general stat-modifier aggregator
general persistent policy aggregator
general conversion aggregator
full capability aggregator
support / facility source collector
```

原則：**價格決定你何時拿到能力；Effect architecture 決定能力拿到後怎麼作用。不要把兩件事揉成一個 mega system。**
