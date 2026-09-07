# Playtest 5 — Hydra III / Tree View / Command Spell III

這輪只測三件事：

1. Hydra III 的「規則不變、規模失控」是否成立。
2. 99 → 100 時 Tree View 是否像自然的 representation reveal。
3. Command Spell III 的 NP Auto 0 → 1/9 → 1/3 → FULL 是否有清楚體感。

正式 Command Spell III Humanity Evil 價格仍 **TBD**；本輪用 TEST 驗證機制，不測經濟。

---

## A. 先測 99 → 100 / Tree View

```text
TEST
→ HYDRA III · 99 HEADS
→ 手動點戰場一次
```

預期：

```text
Hydra III normal rule
99 → CUT1 / GROW2 → 100 logical heads

HEADS HUD → 100
3D Hydra visible proxy → 仍最多99 heads
TREE VIEW → 第一次出現
```

打開 TREE VIEW 後應看到：

```text
LOGICAL HEADS   100
VISIBLE PROXY   99 / 99
BEYOND IMAGE    +1
CURRENT CAP     729
```

這個畫面目前**不能 targeting、不能砍 node**；只測「數字已經比怪物外觀更大」是否讀得出來。

---

## B. 測第三令咒第一次 reveal

保持 Hydra III 狀態：

```text
TEST
→ NP READY
→ NP RELEASE
```

如果第三令咒還沒被 TEST 強制解鎖，這應該是 Hydra III 戰鬥中的第一次寶解，因此：

```text
令咒 III slot
EMPTY / dormant
↓ first Hydra III NP release
NEW · PRICE TBD
```

它應該可以點開看資訊，但不能正式購買；價格沒有被工程端擅自填上。

Modal：

```text
「這裡怎麼沒有 SKIP???」
COMMAND SPELL III
CURRENT  AUTO IN NP · OFF
NEXT     AUTO IN NP · 1/9 · <effective APS>
COST     PRICE TBD
```

---

## C. 先用 9 APS 測倍率差

把令咒 I 切到 Lv.3 / 9 APS：

```text
TEST
→ CS I TEST 第1次 = Lv.1
→ CS I TEST 第2次 = Lv.3 · 9 APS
```

如果 NP 已結束，重新：

```text
NP READY
→ NP RELEASE
```

### C0 — 沒有 CS III

預期：

```text
NP active
AUTO = PAUSED
manual only
```

### C1 — CS III Lv.1

```text
CS III TEST 第1次
→ Lv.1
→ AUTO IN NP = 1/9
```

令咒 I 9 APS 時：

```text
9 × 1/9 = 1 APS inside NP
```

### C2 — CS III Lv.2

```text
CS III TEST 第2次
→ Lv.2
→ AUTO IN NP = 1/3
```

預期：

```text
9 × 1/3 = 3 APS inside NP
```

### C3 — CS III MAX

```text
CS III TEST 第3次
→ MAX
→ AUTO IN NP = FULL
```

預期：

```text
9 × 1 = 9 APS inside NP
```

要回答的不是「數學有沒有對」，自動測試已經驗證；人工主要看：

> 1 APS / 3 APS / 9 APS 在時停裡是不是明顯三段，而不是都感覺一樣。

---

## D. 驗證 CS II 不會偷乘到 Auto

若想直接看交互：

```text
TEST
→ COMMAND SPELL II · ×3 NP
→ CS I = 9 APS
→ CS III Lv.1 = 1/9
→ NP READY
→ NP RELEASE
```

預期同時存在：

```text
manual tap = ×3 separate cuts
Auto       = 1 APS
```

不是：

```text
Auto = 1 APS × manual×3
```

第三令咒只把令咒 I 的 Auto 帶進 NP；第二令咒仍只處理手動技法。

---

## E. 高速 sanity check（可選）

不需要拿這條當主要人工測試；只是想看高速時可用：

```text
CS I TEST → Lv.6 · 243 APS
```

則 CS III 應投影：

```text
Lv.1  243 × 1/9 = 27 APS
Lv.2  243 × 1/3 = 81 APS
MAX   243 × 1   = 243 APS
```

這可以快速確認第三令咒不是寫死成 1 / 3 / 9 APS，而是真的橋接「目前令咒 I APS」。

---

## 本輪刻意不測／不決定

- Command Spell III 正式 Humanity Evil 價格。
- Command Spell I 729 APS 正式價格。
- Hydra IV transition。
- Tree node targeting。
- 真正 recursive / compressed Hydra tree。
- Analyzer 完整數據面板。
- Hydra II 81-cap 最終 presentation。
- multistrike 頭數逐刀可見動畫 queue polish。

Playtest 5 的判斷核心：

> **Hydra III 是否成功讓「頭數」第一次從怪物外觀裡逃出去；第三令咒是否自然地把既有 Auto 技術帶進這個更大的時停戰場。**
