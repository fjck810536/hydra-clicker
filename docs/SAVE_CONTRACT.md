# Hydra Clicker — Save Contract v0.1

> Block 9 persistence contract。目標是讓 Hydra I vertical slice 可以可靠關閉／重開，而不讓 Persistence 反過來污染遊戲規則。

## 1. 第一原則

Save 只保存 **logical state**。

```text
Runtime snapshot
      ↓
Save serializer
      ↓
versioned JSON envelope
      ↓
Storage adapter
```

禁止：

```text
Babylon scene
mesh
material / particle
DOM element
animation object
head-pool slot
visibleHeadCount cache
```

View 在讀檔後只從 restored snapshot 重新投影。

---

## 2. Block 9 Save Envelope

目前格式版本：

```text
formatVersion = 1
```

概念資料：

```js
{
  formatVersion: 1,
  savedAtEpochMs: 1780000000000,
  state: {
    // logical GameState only
  }
}
```

`state.schemaVersion` 與 `save.formatVersion` 是不同概念：

- `formatVersion`：外層存檔編碼／envelope 格式。
- `state.schemaVersion`：遊戲 logical state 的結構版本。

未來若其中一層改變，應明確 migration，不要猜測舊資料。

---

## 3. BigInt

遊戲離散數量使用 BigInt：

```text
heads
encounter
cuts
kills
currencies
materials
```

原生 JSON 不支援 BigInt，因此 `save.js` 使用明確 tagged representation 做 round trip。

要求：

```text
BigInt → serialized tagged value → BigInt
```

不得先轉成 Number。

例如一個天文 logical head count 必須精確保存，不能因為 persistence 而失去位數。

---

## 4. Simulation Time 必須一起恢復

Hydra 的 timed state 使用 simulation time：

```text
pending regrowth.executeAt
NP modifier.startsAt / endsAt
Hydra respawnAtMs
```

因此載入 state 時，GameClock 也必須從：

```text
state.time.simulationTimeMs
state.time.tick
```

繼續。

錯誤：

```text
load state at simulationTime = 12000
clock restart at 0
```

這會讓所有 timed event 延遲或永遠不觸發。

正確：

```text
saved state = 12000 ms
saved clock = tick 120
↓ load
clock resumes at 12000 ms / tick 120
```

---

## 5. Block 9 明確不做 Offline Progress

`savedAtEpochMs` 目前只是 metadata / 未來 offline 計算的依據。

現在：

```text
關閉遊戲 8 小時
↓
重新開啟
↓
simulation 從離開時繼續
```

不是：

```text
8 小時 × Auto Slash
8 小時 × Facility production
8 小時 × Hydra regrowth
```

**不要只因為有 `savedAtEpochMs` 就自動補算現實時間。**

未來若加入 Offline Farming，必須先定義：

- 哪些 systems 可 offline。
- offline elapsed time 上限。
- Auto Slash / NP / Hydra encounter 如何批次模擬。
- 大數／compressed tree 的 offline 成本。
- 玩家是否需要 offline capability / facility。

然後再新增獨立 offline-progress system 與 tests。

---

## 6. Storage Adapter

Block 9 browser adapter：

```text
localStorage
key = hydra-clicker:save:v1
```

但核心 serializer 不知道 `window` 或 DOM。

```text
save.js
├─ serializeGameSave()
├─ deserializeGameSave()
└─ createSaveStore(Storage-like object)
```

所以未來可以替換：

```text
IndexedDB
Cloud Save
export/import file
platform storage
```

而不改 Hydra / Combat / View。

---

## 7. Browser Save Lifecycle

目前 browser app：

```text
每 5 秒 simulation time
→ autosave

Humanity Evil / progression 關鍵事件
→ save

Command Spell unlock
→ save

visibilitychange → hidden
→ save

pagehide
→ final save
```

Autosave cadence 是 persistence policy，不是遊戲規則。

---

## 8. Load Failure

以下情況不得把半套 state 套進遊戲：

```text
invalid JSON
unsupported formatVersion
invalid BigInt payload
state validation failure
localStorage unavailable / throws
```

Browser 可以：

```text
console warning
↓
start fresh runtime
```

Persistence failure 不應阻止 Hydra Clicker 啟動。

未來正式版如果需要玩家可見的 save recovery UI，再另外增加。

---

## 9. 測試邊界

Block 9 至少保持：

```text
BigInt round trip exact

pending regrowth:
cut → save at 700ms → restore at 700ms
→ 1400ms still 8 heads
→ 1500ms regrow to 9

real-world 8 hours away
→ no automatic simulation advancement

Save core
→ no Babylon / DOM / gameplay-system imports

App
→ saveStore.save(runtime.snapshot())
→ never save stage / mesh / View objects
```

---

## 10. 修改 Save 時的問題

每次改 persistence 前先問：

1. 這是 logical state 還是 presentation cache？
2. 這個時間是 simulation time 還是 wall-clock time？
3. 這個 BigInt 是否仍然精確？
4. 舊 formatVersion / state.schemaVersion 如何處理？
5. 是否正在不小心實作 offline progress？

如果第五題答案是「是」，先停下來，把它當成新的遊戲系統設計，而不是 Save 的順手功能。
