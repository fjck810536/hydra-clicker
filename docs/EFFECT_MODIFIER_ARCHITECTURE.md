# Hydra Clicker — Effect / Modifier Architecture v0.8

> Playtest 5：NP 對 Hydra 的效果仍然只有 generic `hydra.headGrowth` timed rule modifier。Command Spell III 不新增 modifier / Effect Type；它只提供「NP 期間 Auto Slash 可運作到什麼比例」的 System status，由 Core 注入 Auto Slash 的 `isEnabled` / `getAttacksPerSecond` policy。Hydra Rule、NP modifier 與 Auto Slash System 都不需要知道第三令咒專名。

## 1. 目標

共同資料流：

```text
CONTENT SOURCE
Support / Facility / Research / Command Spell / Temporary Buff
                ↓
          EFFECT DEFINITIONS / STATUS
                ↓
      Modifier / Capability / Policy composition
                ↓
 ┌─────────┬─────────┬───────────┬──────────────┐
 ↓         ↓         ↓           ↓
Combat     NP      Auto Slash   Analyzer / Hydra Rules
```

Source 回答「從哪裡來」；Effect / Status 回答「改變什麼」。Source 名稱不得進 Math / Rule algorithm。

## 2. Effect Type A — Stat Modifier

用途：修改連續值 / multiplier，例如 attack speed、material multiplier。

```js
{
  type: 'stat-modifier',
  target: 'combat.attacksPerSecond',
  operation: 'multiply',
  value: 1.25
}
```

通用 aggregator 尚未正式落地。

## 3. Effect Type B — Rule Modifier

目前正式落地的是 NP 的 Hydra head-growth suppression：

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

`hydra.headGrowth` = 是否允許 Hydra 因自己的規則生成新頭。因此：

```text
Hydra I delayed same-head regrowth → suppressed
Hydra II GROW +2                 → suppressed
Hydra III GROW +2                → suppressed
Cut itself                       → unaffected
```

Hydra Rules 不知道 source 是 NP。

Legacy save 的 `target:'hydra.regrowth'` 仍映射為同一 compatibility alias，直到原本 `endsAt`。

## 4. Effect Type C — Capability

目前：

```text
Command Spell I
→ combat.autoSlash capability
```

NP 不移除 capability。它只影響 execution policy。

因此這兩句不同：

```text
玩家沒有 Auto Slash capability
vs.
玩家有 Auto Slash，但目前政策不允許它執行
```

Command Spell III 修改的是後者，不是重新解鎖一個第二份 Auto capability。

## 5. Effect Type D — Policy

長期用途：決定某個自動能力何時／如何執行，例如 targeting、priority、time-window eligibility。

目前仍**沒有** general persistent Policy Effect aggregator。Playtest 5 延續最小 Core composition。

### NP / CS III Auto policy

Inputs：

```text
NP active status
Command Spell I autoSlash capability + base APS
Command Spell III autoNpFraction
Hydra attackability / intro guards
```

Core projection：

```text
NP inactive
→ Auto enabled by normal requirements
→ effective APS = base CS I APS

NP active + CS III fraction 0
→ Auto disabled

NP active + CS III fraction 1/9
→ Auto enabled at base APS × 1/9

NP active + CS III fraction 1/3
→ Auto enabled at base APS × 1/3

NP active + CS III fraction 1
→ Auto enabled at full base APS
```

Auto Slash System only receives generic injected callbacks：

```js
isEnabled(snapshot)
getAttacksPerSecond(snapshot)
```

禁止：

```js
if (commandSpellIII) ... // inside AutoSlash System
if (np) ...              // inside AutoSlash System
```

Command Spell III System likewise不得呼叫 `autoSlash.start()/stop()`；它只投影 fraction / effective APS status。

### Why CS III is not a new modifier

CS III currently has no need to enter `state.modifiers.active`：

- it is permanent progression, stored as milestones；
- it does not modify Hydra Rule；
- it does not alter NP `endsAt`；
- it is consumed only when Core composes Auto execution policy。

Adding a new Effect Type here would be premature abstraction。

## 6. Effect Type E — Conversion

用途：資源轉換，例如 heads → materials。尚未正式落地。

## 7. Modifier Aggregator

Current minimal path：

```text
state.modifiers.active
↓
getActiveModifiers()
↓
resolveRuleContext()
↓
Hydra Rule
```

This path remains about rule modifiers. CS III Auto policy does not contaminate it。

Future generalized path may separately compose：

```text
capability resolver
policy resolver
stat resolver
conversion resolver
```

但現在不為一個已可由 injected callbacks 表達的需求預建完整框架。

## 8. Stacking

Future numeric stacking recommendation：

```text
BASE
↓
ADD
↓
MULTIPLY
↓
MIN / MAX clamp
↓
OVERRIDE
```

Current `hydra.headGrowth / disable` has no complex stacking rule。

NP has source lifecycle invariant：normal gameplay does not append a second active NP modifier while one is active。這是 NP resource/lifecycle rule，不是 generic modifier stacking semantics。

## 9. Temporary modifier lifecycle

NP modifier：

```text
active when startsAt <= simulationTime < endsAt
encounter change does not remove it
generation change does not remove it
Save/Restore preserves modifier + simulation timeline
GameClock expiry removes it
final expiry emits np:ended
```

View animation never decides lifecycle。

### Single NP window

```text
NP inactive
→ accepted cut can charge
→ READY can release one timed modifier

NP active
→ cut affects Hydra normally under suppression
→ cut gives 0 NP charge
→ release rejected: np-already-active

NP expires
→ charge / normal Hydra law resume
```

This prevents CS II 81-second TIME windows from self-sustaining indefinitely。

## 10. Command Spell III progression/status boundary

CS III uses existing milestone storage：

```text
hydra-iii-first-np-release
command-spell-3-lv1
command-spell-3-lv2
command-spell-3-lv3
```

Its System consumes semantic `np:released` only to establish first eligibility while fighting Hydra III。

It projects：

```text
base fraction 0
Lv1  1/9
Lv2  1/3
Lv3  1
```

Formal costs remain `null / pricePending` until player-facing economy confirms them。TEST can write these progression milestones in a non-persistent session。

This is not a Hydra modifier and not an NP duration modifier。

## 11. Command Spell II vs III separation

CS II：

```text
manual-only NP technique
→ manual strikeCount ×3 / ×6 / ×9
→ NP max / duration changes
```

CS III：

```text
Auto execution inside NP
→ fraction of CS I base APS
```

They must not multiply each other automatically：

```text
CS I = 9 APS
CS II manual = ×3
CS III Lv1 = 1/9

NP manual tap → 3 separate cuts
NP Auto       → 1 ordinary auto cut/sec
NOT 3 auto cuts/sec
```

This separation is a contract, not merely current tuning。

## 12. Tree View / Analyzer boundary

Tree View v0 is presentation/projection only and introduces **no Effect Type**。

```text
logical state
→ Tree View projection
→ observation
```

Forbidden：

```text
Tree View mesh/layout → rule modifier
Tree View open state → Hydra targeting
Tree View → direct Combat mutation
```

Future node-targeting may produce a `policy` or structured attack target, but must be designed when that gameplay exists rather than inferred from the current observation UI。

## 13. Support / Facility / Research

Future content should emit standard effects/status rather than direct mutations。

Forbidden pattern：

```js
if (hasSupportX) {
  hydra.logicalHeadCount -= 3n;
  np += 10;
}
```

Preferred path：

```text
content definition
→ standard effect/status
→ relevant resolver/System
```

## 14. Current implemented boundaries

```text
Capability
→ CS I → Auto Slash

Rule modifier
→ NP → hydra.headGrowth disabled
→ applies to Hydra I/II/III growth

NP timed lifecycle
→ GameClock-owned
→ cross-encounter/generation
→ no active self-charge
→ no nested release

Application policy composition
→ base NP pauses Auto
→ CS III fraction may permit Auto inside NP at reduced/full APS
→ AutoSlash remains generic

CS II manual technique
→ separate from CS III Auto policy

Tree View
→ observation only, no modifier/effect

Legacy alias
→ hydra.regrowth disable == hydra.headGrowth disable
```

Still not implemented：

```text
general stat-modifier aggregator
persistent/general policy aggregator
conversion aggregator
full capability aggregator
support/facility source collector
Tree node targeting policy
```

## 15. Final invariant

Do not solve a content request by making lower layers learn its name：

```text
Hydra Rule must not know Command Spell III
Auto Slash must not know NP / Command Spell III
NP modifier must not know Auto Slash
Tree View must not know Combat mutation APIs
```

**新的內容可以改變投影；不要讓它改壞積木邊界。**
