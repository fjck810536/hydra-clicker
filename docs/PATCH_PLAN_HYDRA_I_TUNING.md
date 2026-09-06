# Hydra Clicker — Hydra I Tuning Patch Plan

> 來源：`docs/PLAYTEST_1.md`。這份文件把第一次實機試玩問題轉成可逐項施工的 patch，並明確區分責任層。

## Patch A — iOS Double-Tap Zoom

### Issue

HUD / NP button 區域偶發觸發 iOS Safari double-tap zoom，且縮放後不易恢復。

### Ownership

```text
Platform / HUD / Input
```

### Patch

- 重新檢查 viewport meta 與 iOS Safari gesture behavior。
- Battle Stage 與固定 HUD controls 統一 gesture lock。
- NP / Command Spell 等按鈕不得因連點造成頁面 zoom。
- 不破壞未來 drawer / panel 的局部 scroll 能力。
- 必要時增加 scoped double-tap prevention；不要用會破壞所有 accessibility / panel input 的全域暴力 handler。

### Expected Feel

快速連按 NP / HUD button 時，頁面尺寸完全不變。

### Test

- iPhone Safari 快速雙擊 NP button 不 zoom。
- 快速雙擊 battle canvas 不 zoom。
- portrait `100dvh` 與 safe area 不退化。

---

## Patch B — Hydra I Zero Heads = Kill

### Issue

目前 `depleted != killed` 導致玩家即使把九顆頭砍完，仍常需要等 NP 才能真正推進 encounter，前段節奏偏等待。

### Ownership

```text
Hydra I Rule
```

### Experimental Rule Change

Hydra I 暫時改成：

```text
head count reaches 0
→ killed = true
→ pending regrowth cancelled
```

也就是普通攻擊本身就能殺 Hydra。

### Important

這是 **Playtest 2 experimental rule**，不是永久推翻 `depleted / killed` 架構。

`depleted` 與 `killed` 仍保留為不同概念，因為 Hydra II / III / Kirby–Paris generation 之後可能再次需要：

```text
0 visible/current heads
≠ terminal mathematical death
```

只是 Hydra I 的 current rule 暫時令兩者在 `heads → 0` 時同時成立。

### Expected Feel

平時點擊也能正常完成一輪；NP 不再是唯一推進工具。

### Test

```text
Hydra I: 1 head
normal cut
→ 0 heads
→ killed true
→ pending regrowth empty
→ hydra:killed once
```

---

## Patch C — NP Becomes Multi-Encounter Time Window

### Issue

目前 NP modifier 使用 encounter scope；殺掉一隻 Hydra 後，下一場會清掉 NP effect，因此爆發窗口只能服務一隻敵人。

### Ownership

```text
NP / Modifier lifecycle / Progression
```

### Patch

將 NP regeneration suppression 從：

```text
scope: encounter
```

改成更接近：

```text
scope: timed
startsAt
endsAt
```

效果只看 Game Clock 是否仍在 NP window，不因 encounter respawn 清除。

### Rule

```text
NP release
↓
3.0s timed window
↓
Hydra A killed
↓
Hydra B respawns
↓
if now < endsAt
  NP effect remains active
↓
can kill Hydra B / C / ...
```

### Boundary

- Progression 不可自己延長 NP。
- NP 不可直接 spawn Hydra。
- Hydra Rule 只吃 resolved rule context，不知道 source 名稱是 NP。

### Expected Feel

NP 是短暫割草／無雙時間，而不是單體王專用鑰匙。

### Test

- NP active → kill Hydra 1 → respawn Hydra 2 → modifier still active。
- Window deadline passed → modifier expires even if encounter changed multiple times。
- Save / restore mid-NP preserves remaining simulation-time window。

---

## Patch D — Respawn Pacing

### Issue

Hydra killed 後的新 encounter 有時主觀等待過久，NP multi-kill 也會因此失去連續感。

### Ownership

```text
Progression Data / Encounter Loop
```

### Prototype Tuning

先測：

```text
normal respawnDelayMs = 300
NP-active respawnDelayMs = 100–150
```

### Architecture Option

不要把 `if NP` 寫死在 Progression。

較健康的方式之一：

```text
base respawn delay
+ resolved progression / encounter modifier
```

但如果為了 Playtest 2 還沒有必要建立完整 progression modifier system，可以先只把 normal delay 降到 300ms，先測主要節奏；NP-special delay 可在後續 patch 再決定。

### Expected Feel

- 普通 kill 有極短的確認 beat。
- NP 時不被長時間空場打斷。

---

## Patch E — Hydra Visual Silhouette

### Issue

Hydra 本體過胖；九頭目前向中央上方收束，輪廓像一團花束，不像向外生長的多頭怪。

### Ownership

```text
Hydra View only
```

### Patch

1. 暫時移除大型 body mesh。
2. 只保留極小 root / neck base（若完全漂浮才需要）。
3. 重寫 head slot poses：
   - 隨高度增加而增加水平 spread。
   - 左右對稱但不要完全機械鏡像。
   - 加少量 depth / height / scale variation。
4. 不改 Head Pool contract。
5. 不改 `logicalHeadCount → visibleHeadCount`。

### Desired Shape

```text
lower: narrow-ish root
upper: wider fan
```

而不是：

```text
lower: wide body
upper: heads converge inward
```

### Test

- 9-head initial pool 仍存在。
- 99 visible cap 不變。
- View 不寫回 State。
- body removal 不影響 head slot lifecycle。

---

## Deferred — Berserker Art Pass

### Issue

目前 placeholder 與 B叔辨識度低。

### Decision

本輪不處理。

優先確定：

```text
Hydra I loop
NP multi-kill feel
respawn pacing
Hydra silhouette
```

等玩法節奏穩定後，再做 Berserker：

```text
body proportion
hair silhouette
weapon silhouette
attack posing
GLB replacement
```

---

# Recommended Construction Order

```text
A. Fix iOS double-tap zoom
↓
B. Hydra I zero heads = kill
↓
C. NP timed across encounters
↓
D. Respawn delay tuning
↓
E. Hydra silhouette / fan layout
↓
Playtest 2 on iPhone
↓
Grill before Hydra II
```

## Do Not Do Yet

- 不進 Hydra II。
- 不做正式 B叔 GLB。
- 不做完整 Support / Facility aggregator。
- 不加入 offline farming。
- 不因 Playtest 1 就刪除 `depleted / killed` 的架構區分。

## Playtest 2 Questions

下一輪實機只需要回答：

1. 普通砍到 0 就 kill，是否明顯比較不無聊？
2. NP 能連殺多隻後，有沒有形成值得期待的爆發期？
3. 300ms 左右 respawn 是否太快／剛好／仍太慢？
4. Hydra 移除胖本體、頭向上外擴後，輪廓是否更清楚？
5. iOS double-tap zoom 是否完全消失？

如果這五題大致成立，再決定 Hydra I 的正式節奏與何時進 Hydra II。
