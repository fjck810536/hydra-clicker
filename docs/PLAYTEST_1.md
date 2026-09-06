# Hydra Clicker — Playtest 1

> 第一次 iPhone / GitHub Pages 實機試玩紀錄。這份文件只記錄玩家實際遇到的問題與體感，不把解法混進觀察本身。

## 測試結果概況

- 已成功長時間遊玩至至少 99 次 Hydra 擊殺。
- Command Spell I 可成功購買。
- Auto Slash 自動化正常運作。
- 重新整理後，砍頭數、擊殺數、人類惡沒有歸零；未逐項核對精準數值，但 Persistence 基本路徑看起來正常。

## 問題 1 — iOS 偶發雙擊放大

### 觀察

- 偶爾會發生頁面被放大的狀況。
- 高度懷疑與 NP / 寶具解放按鈕雙擊有關。
- 發生後一般點擊很難縮回正常比例。
- 再次點擊寶解按鈕時，有時會突然恢復正常大小。

### 目前判斷

問題可能位於 HUD / button 區域的 iOS Safari double-tap zoom / gesture handling，而非 Babylon canvas 本身。

---

## 問題 2 — NP 期間只能有效殺一隻 Hydra

### 觀察

- Hydra 被殺後，有時新 Hydra 出現得很慢。
- NP / 寶具解放目前比較像只服務當前 encounter。
- 玩家希望 NP 有效期間可以連續殺多隻 Hydra，而不是殺一隻後就失去這段爆發窗口。

### 期望體感

NP 應該比較像一段「Berserker 無雙時間」：

```text
NP active
↓
Hydra 1 killed
↓
Hydra 2 spawn
↓
仍在 NP active
↓
Hydra 2 killed
↓
...
```

---

## 問題 3 — 必須等 NP 才能真正擊殺，前段偏無聊

### 觀察

目前 Hydra I 的邏輯要求：

```text
把頭砍到 0
↓
若仍有 regrowth
↓
不算真正 kill
↓
必須等 NP suppress regrowth
```

實際遊玩後，這讓平時斬擊更像是在「充 NP」，真正推進只有 NP window 發生。

### 玩家希望先試的方向

暫時改成：

> **頭數砍到 0 就直接算殺死 Hydra。**

先用實機體感驗證這個版本是否比較好玩，再決定要不要恢復更嚴格的 regeneration kill condition。

---

## 問題 4 — Hydra 視覺太胖，頭部構圖過度集中

### 觀察

- Hydra 大本體佔比過大，看起來偏胖。
- 玩家傾向先直接移除本體。
- 目前九顆頭是向上「集中」的扇形。
- 期望改成向上「擴散」的扇形。

### 期望構圖

不是：

```text
    ●
   ●●
  ●●●
   ●●
```

而是更接近：

```text
●     ●     ●
  ●   ●   ●
    ●   ●
```

重點：

- 左右更張開。
- 上升時逐步擴散。
- 中央不要像花束一樣擠成一團。
- 之後可以再加入輕微高低、前後與尺寸差。

---

## 問題 5 — Berserker placeholder 不像 B叔

### 觀察

目前角色只做到功能性 placeholder，外型與 B叔差距很大。

### 優先級

低於前四項。

目前可以暫時保留：

```text
左側角色
+ 可讀的揮刀動作
+ 正確攻擊節奏
```

正式比例、輪廓、武器、動作風格之後再做。

---

## Playtest 1 核心結論

第一次實機測試沒有暴露出需要推倒重做的架構問題；主要問題集中在：

```text
Platform / HUD gesture
NP lifecycle
Hydra I kill condition
Encounter respawn pacing
Hydra visual composition
```

因此下一輪應先做 Hydra I tuning patch，而不是直接進 Hydra II。
