# Hydra Clicker — Save Contract v0.2

> Persistence 只保存 logical state，不讓 Save 反過來決定遊戲規則。v0.2 補充 Playtest 2.4 的 66-point NP gauge 相容策略。

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

目前 Playtest 2.4 **沒有**改 state schema / save format。

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

以下離散數量保持 BigInt exact round-trip：

```text
heads
encounter
cuts
kills
currencies
materials
```

原生 JSON 不支援 BigInt，因此 serializer 使用 tagged representation；不得先轉成 Number。

## 4. NP gauge compatibility — Playtest 2.4

玩家現在看到：

```text
0 / 66 → 66 / 66
```

但 persistent field 仍是既有：

```text
state.berserker.np ∈ [0, 1]
```

轉換：

```text
points = round(normalized × 66)
normalized = points / 66
```

原因：

- 不新增 schema field。
- 舊存檔可直接載入。
- 舊 50% NP 自然變成 33/66。
- View 不需要把 0/66 presentation cache 存下來。

因此不要把 `berserker.np` 擅自改成 0..66 並假裝 schema 沒變。

## 5. Simulation time restore

Timed state：

```text
pending regrowth.executeAt
NP modifier.startsAt / endsAt
Hydra respawnAtMs
```

都使用 simulation time。

Load 時 GameClock 必須從保存的：

```text
state.time.simulationTimeMs
state.time.tick
```

繼續，不能重設為 0。

## 6. No Offline Progress

`savedAtEpochMs` 目前只是 metadata。

```text
關閉 8 小時
→ 重開
→ simulation 從離開點繼續
```

目前不補算：

```text
Auto Slash
Hydra regrowth
NP duration
Facility production
```

未來 Offline Farming 必須成為獨立 system + contract + tests。

## 7. Browser storage

目前：

```text
localStorage
key = hydra-clicker:save:v1
```

`save.js` 只依賴 Storage-like adapter，不依賴 DOM / Babylon。

Browser lifecycle：

```text
每 5 秒 simulation time autosave
currency / progression key events save
Command Spell purchase / upgrade save
visibility hidden save
pagehide final save
```

TEST → RESET SAVE 會先 suppress persistence，再 clear storage，避免 pagehide 把舊 snapshot 寫回。

## 8. Load failure

以下情況不得套半套 state：

```text
invalid JSON
unsupported formatVersion
invalid tagged BigInt
state validation failure
storage unavailable
```

Browser 可以 warning 後 fresh start。

## 9. Tests

至少保持：

```text
BigInt exact round-trip
normalized NP ratio round-trip
old np=0.5 → runtime projection 33/66
base APS / Command Spell milestones round-trip
pending regrowth preserves remaining simulation delay
timed NP modifier resumes on saved simulation timeline
8 real-world hours away → no offline simulation
Save core imports no Babylon / DOM gameplay View
```

## 10. 修改 Save 前先問

1. 這是 logical state 還是 presentation cache？
2. 這個時間是 simulation 還是 wall clock？
3. BigInt 是否仍精確？
4. 是否真的需要 schema / format migration？
5. 是否不小心開始做 offline progress？

第五題若是「是」，先停下來把它當新系統設計。
