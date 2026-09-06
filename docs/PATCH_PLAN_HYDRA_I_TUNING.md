# Hydra Clicker — Hydra I Tuning Patch Plan

> 來源：`docs/PLAYTEST_1.md`。第一次 iPhone 實機試玩後的 A–E patch 已完成；目前狀態為 **Playtest 2 Ready**。

## Status

```text
A. iOS Double-Tap Zoom              ✅ implemented
B. Hydra I Zero Heads = Kill        ✅ implemented
C. NP Multi-Encounter Timed Window  ✅ implemented
D. Respawn Pacing                   ✅ implemented (300ms base only)
E. Hydra Visual Silhouette          ✅ implemented
Berserker Art Pass                  ⏸ deferred
```

---

## Patch A — iOS Double-Tap Zoom ✅

### Playtest 1 Issue

HUD / NP button 區域偶發觸發 iOS Safari double-tap zoom，縮放後不易恢復。

### Implemented

- viewport 原有 `maximum-scale=1 / user-scalable=no` 保留。
- NP / Command Spell 標成 scoped fixed controls。
- fixed controls 改用 `pointerup` 執行 command。
- pointer 產生的 browser `click` default 阻止，避免 Safari 把第二次 tap 拿去 smart zoom。
- `dblclick` 與 iOS `gesturestart/change/end` browser default 阻止。
- CSS `touch-action: none` / `-webkit-touch-callout: none`。
- keyboard-generated click (`detail === 0`) 仍能 activation。

### Boundary

只鎖固定戰鬥 controls；未來 Drawer / Panel 仍可局部 scroll，不做全域 touch 暴力攔截。

### Playtest 2 Question

快速雙擊／連點 NP button，頁面尺寸是否完全不再改變？

---

## Patch B — Hydra I Zero Heads = Kill ✅

### Playtest 1 Issue

砍完九顆頭仍常需要等 NP 才能真正推進 encounter，前段像在等待寶解。

### Implemented Experimental Rule

```text
head count reaches 0
→ depleted = true
→ killed = true
→ pending regrowth cancelled
→ hydra:killed
```

普通攻擊現在本身可以殺 Hydra。

### Important

這是 **Playtest 2 experimental Hydra I rule**，不是刪掉 `depleted / killed` 架構區分。後續 Hydra 世代仍可能再次出現：

```text
0 current heads != terminal mathematical death
```

### Playtest 2 Question

普通砍到 0 就能完成一輪，是否明顯比較不無聊？

---

## Patch C — NP Multi-Encounter Timed Window ✅

### Playtest 1 Issue

原本 NP 用 encounter scope；殺掉一隻 Hydra 後下一場清除效果，因此寶解只能服務一隻敵人。

### Implemented

NP modifier 已由：

```text
scope: encounter
```

改成：

```text
scope: timed
startsAt
endsAt
```

目前 3.0 秒窗口只看 Game Clock：

```text
NP release
↓
Hydra A killed
↓
Hydra B respawns
↓
if now < endsAt
  regeneration suppression remains active
↓
Hydra B / C / ... can be farmed in same NP
```

### Boundary

- Progression 不延長 NP。
- NP 不 spawn Hydra。
- Hydra Rule 只吃 `regrowthEnabled`，不知道 source 名叫 NP。
- Save / Restore 中 active timed modifier 與 simulation timeline 都會保存。

### Playtest 2 Question

同一次 NP 能連殺多隻後，是否形成值得期待的割草／爆發期？

---

## Patch D — Respawn Pacing ✅

### Playtest 1 Issue

Hydra killed 後空場主觀過久，也讓 NP multi-kill 缺乏連續感。

### Implemented Tuning

```text
respawnDelayMs = 300
```

原本 1200ms 已降為 300ms。

### Deliberate Non-Implementation

暫時**沒有**做：

```text
NP active → respawn 100–150ms
```

原因：不想讓 Progression 直接寫 `if NP`。先用單一 300ms 做 Playtest 2；如果 NP farming 仍被空場打斷，再設計正式 encounter/progression modifier。

### Playtest 2 Question

300ms 是太快、剛好，還是仍太慢？NP 期間是否仍需要額外加速？

---

## Patch E — Hydra Visual Silhouette ✅

### Playtest 1 Issue

Hydra 本體太胖；九頭向中央上方收束，輪廓像花束而不是多頭怪。

### Implemented

1. 移除大型 torso / haunch / tail。
2. 只留小型 `hydra-root-base`，避免頸部完全漂浮。
3. 初始九個 head slot 改成：
   - 底部窄。
   - 越高水平 spread 越大。
   - 左右近似對稱但保留小幅 height / depth 差。
4. Head Pool contract 不變。
5. 99 visible cap 不變。
6. View 仍不寫回 State。

### Desired Shape

```text
      ●             ●
        ●         ●
          ●     ●
            ● ●
             ●
             root
```

### Playtest 2 Question

現在是否比胖本體／向內收束的舊版更容易一眼讀成「九頭蛇」？

---

## Deferred — Berserker Art Pass ⏸

目前 placeholder 與 B叔辨識度低，但本輪刻意不處理。

玩法節奏確認後再做：

```text
body proportion
hair silhouette
weapon silhouette
attack posing
GLB replacement
```

---

# Playtest 2 Ready

目前施工：

```text
Playtest 1 feedback
↓
Patch A–E ✅
↓
Core CI ✅
↓
GitHub Pages deploy
↓
PLAYTEST 2 ON IPHONE
↓
Grill
↓
Hydra II ?
```

## Do Not Do Yet

- 不進 Hydra II。
- 不做正式 B叔 GLB。
- 不做完整 Support / Facility aggregator。
- 不加入 offline farming。
- 不因 Hydra I 實驗規則刪除 `depleted / killed` 的架構區分。

## Playtest 2 Questions

1. iOS fixed controls 的 double-tap zoom 是否完全消失？
2. 普通砍到 0 就 kill，是否明顯比較不無聊？
3. NP 能跨 encounter 連殺多隻後，有沒有形成值得期待的爆發期？
4. 300ms respawn 是否太快／剛好／仍太慢？
5. Hydra 移除胖本體、頭向上外擴後，輪廓是否更清楚？

這五題大致成立後，再決定 Hydra I 的正式節奏與是否進 Hydra II。
