# Hydra Clicker — Save Contract v0.3

> v0.3 補充 Playtest 3 NP modifier target 從 `hydra.regrowth` 升級為 `hydra.headGrowth` 的相容策略。State schema / save format 仍不變。

## 1. Save envelope

```js
{
  formatVersion: 1,
  savedAtEpochMs,
  state: {
    // logical GameState only
  }
}
```

`formatVersion` 與 `state.schemaVersion` 分開。

目前仍沒有改 state schema / save format。

## 2. Save only logical state

保存：

```text
Hydra logical state
pending regrowth
simulation time / tick
normalized NP ratio
active timed modifiers
Humanity Evil
Command Spell capability
berserker base APS
progression milestones
statistics
```

不保存：

```text
Babylon scene / mesh / material / particle
DOM
animation objects
visibleHeadCount cache
NP display-point cache
TEST UI state
```

## 3. BigInt

離散數量保持 BigInt exact round-trip：

```text
heads
encounter
cuts
kills
currencies
materials
```

Serializer 使用 tagged representation；不得先轉 Number。

## 4. NP gauge compatibility

Player-facing：

```text
0 / 66 → 66 / 66
```

Persistent field：

```text
state.berserker.np ∈ [0, 1]
```

轉換：

```text
points = round(normalized × 66)
normalized = points / 66
```

舊 50% NP → 33/66。

## 5. NP timed modifier target compatibility

新 NP release 保存：

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

Playtest 2 / early Playtest 3 save 可能仍有：

```text
target: hydra.regrowth
```

不做 rewrite migration，也不 bump schema。Runtime modifier resolver 將舊 `hydra.regrowth / disable` 視為 `hydra.headGrowth / disable` 的 compatibility alias，直到該 modifier 原本的 `endsAt` 到期。

因此：

```text
old active NP save
→ load exact modifier
→ resolver interprets legacy target
→ Hydra I / Hydra II head growth remains suppressed for remaining simulation time
```

## 6. Simulation time restore

Timed state：

```text
pending regrowth.executeAt
NP modifier.startsAt / endsAt
Hydra respawnAtMs
```

都使用 simulation time。

Load 時 GameClock 從保存的：

```text
state.time.simulationTimeMs
state.time.tick
```

繼續，不能重設為 0。

## 7. No Offline Progress

`savedAtEpochMs` 目前只是 metadata。

```text
關閉 8 小時
→ 重開
→ simulation 從離開點繼續
```

目前不補算 Auto Slash、Hydra growth、NP duration、Facility production。

## 8. Browser storage

目前：

```text
localStorage
key = hydra-clicker:save:v1
```

Browser lifecycle：

```text
每 5 秒 simulation time autosave
currency / progression key events save
Command Spell purchase / upgrade save
visibility hidden save
pagehide final save
```

TEST preset session 會 `suppressPersistence = true`，不覆蓋玩家正常 save。

## 9. Load failure

以下情況不得套半套 state：

```text
invalid JSON
unsupported formatVersion
invalid tagged BigInt
state validation failure
storage unavailable
```

Browser 可以 warning 後 fresh start。

## 10. Tests

至少保持：

```text
BigInt exact round-trip
normalized NP ratio round-trip
old np=0.5 → runtime projection 33/66
active timed modifiers round-trip
legacy hydra.regrowth NP target remains effective after load
base APS / Command Spell milestones round-trip
pending regrowth preserves remaining simulation delay
8 real-world hours away → no offline simulation
Save core imports no Babylon / DOM gameplay View
```

## 11. 修改 Save 前先問

1. 這是 logical state 還是 presentation cache？
2. 這個時間是 simulation 還是 wall clock？
3. BigInt 是否仍精確？
4. 是否真的需要 schema / format migration？
5. 是否不小心開始做 offline progress？

第五題若是「是」，先停下來把它當新系統設計。
