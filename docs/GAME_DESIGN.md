# Hydra Clicker — Game Design v0.15

> Playtest 5.1：對齊 `02_player_facing/LONG_TERM_COMMAND_SPELL_ECONOMY.md`。Humanity Evil 經濟改以「當代一隻 Hydra 的收入」作為相對單位 `U_n`；只把 proposal 中已有單值的價格正式落地，仍是範圍的後續升級一律保持 `PRICE TBD`。Command Spell II 的 81 秒不再視為長期 MAX；Command Spell III 第一階 1/9 Auto-in-NP 現在有正式 9U3 價格。

## 1. 核心一句話

玩家一開始以為自己在操縱狂戰士討伐會復原的九頭蛇；Hydra II 把普通攻擊翻面成 **CUT 1 → GROW 2**，迫使玩家利用 NP 的 head-growth suppression 與手動爆發。Hydra III 把同一規則擴到 729 logical heads，讓畫面第一次無法直接代表真正數量，並以 Tree View 開始從「砍怪」過渡到「觀測結構」。

長期三條令咒軸分工：

```text
Command Spell I   = 普通時間 throughput / APS，長期無限軸
Command Spell II  = NP 手動技法 + 停止時間尺度；手動連斬有限、時間軸長期延伸
Command Spell III = 把 I 的 Auto 帶進 NP 的有限 bridge；0 → 1/9 → 1/3 → FULL 後封頂
```

## 2. Hydra generations

目前：

```text
Hydra I   start 9 · max 9   = 9¹ · 99 kills to next
Hydra II  start 9 · max 81  = 9² · 99 kills to next
Hydra III start 9 · max 729 = 9³ · next generation not defined yet
```

99 是「一代要殺幾隻 Hydra」，不是 head cap。

### Hydra I

```text
accepted cut = -1
non-terminal cut → same head regrows after delay
head count reaches 0 → true kill
```

Regen curve：

```text
0 kills  → 1500ms
9 kills  → 350ms
30 kills → ~247ms
50 kills → ~174ms
66 kills → ~134ms
99 kills → 100ms floor
```

### Hydra II

普通狀態：

```text
CUT 1
→ GROW +2 immediately
→ net +1
→ clamp to 81
```

Examples：

```text
9 → 10
80 → 81
81 → 81
```

第一次 Hydra II 登場時，已購 Auto 暫停；玩家必須手動砍第一刀看到反轉，才完成 `hydra-ii-first-manual-cut` milestone。這個 milestone 同時是 Command Spell II 第一階的 gameplay eligibility。

### Hydra III

沿用結構增生規則，但 cap 擴張：

```text
CUT 1 → GROW +2
max = 729
```

因此第一隻 Hydra III 自然可從 9 長到 100+。當 logical heads 第一次到達 100：

```text
logical = 100
visible proxy = 99
→ Tree View unlock
```

Tree View v0 只做觀測，不提供 node targeting。

## 3. NP — head-growth suppression / time-stop window

基礎：

```text
NP max = 66
outside NP: accepted head cut = +1 NP
66/66 = READY
release → gauge resets
base duration = 3s
```

NP 建立 timed rule modifier：

```text
hydra.headGrowth = disabled
scope = timed
```

因此：

```text
Hydra I   → 新的 delayed regrowth 不排入
Hydra II  → GROW +2 變 GROW 0
Hydra III → GROW +2 變 GROW 0
```

NP active 時：

- accepted cuts 不充下一條 NP；
- nested release 被拒絕；
- Manual Cut 保持可用；
- base Auto Slash 暫停；
- Command Spell III 可按比例把 Auto 帶回 NP；
- NP 結束不補回 window 中已砍掉的頭。

TIME upgrade 只影響**未來**的寶解；已 active 的 modifier 保留 release 當下固定 `endsAt`。

## 4. Humanity Evil — normalized long-term economy

Humanity Evil 只由 **true Hydra kill** 取得。

正式收入 law：

```text
U_n = generation n 每殺一隻 Hydra 的 Humanity Evil
U_n = 11 × 3^(n - 1)
```

所以：

```text
U1 = 11
U2 = 33
U3 = 99
U4 = 297
...
```

每代 99 kills，gross income = `99 U_n`。

### 為什麼用 U_n

設計價格先用「這項升級等於當代幾隻 Hydra」思考，再換算 raw Humanity Evil。程式提供：

```text
getHumanityEvilCostForGenerationUnits(generation, units)
```

例如：

```text
36 U2 = 36 × 33 = 1188 HE
54 U2 = 54 × 33 = 1782 HE
9 U3  = 9 × 99  = 891 HE
```

### Catch-up 是刻意的

舊升級的 raw price **不隨新世代重新放大**。

因此一個原本值 54U4 的固定價格，到下一代自然約只值 18U5，再下一代約 6U6。這是內建 catch-up：玩家晚買舊內容會變便宜，而不是每一代重新把舊價格乘三。

### Mature pacing

Hydra I 是 cheap onboarding exception。成熟世代的 major-axis 參考節奏：

```text
第一個重要 ×3 step ≈ 36 U
第二個同軸 ×3 step ≈ 54 U
```

不代表每一條令咒都在同一代塞兩個 major purchases；三條軸要共享同一個 `99 U_n` 預算，形成 build choice。

## 5. Command Spell I — infinite throughput axis

能力：普通時間 Auto Slash。

APS ladder：

```text
1 → 3 → 9 → 27 → 81 → 243 → 729 → ...
```

目前正式價格：

| Level role | APS | Relative cost | Raw HE |
|---|---:|---:|---:|
| Hydra I onboarding | 1 | 9 U1 | 99 |
| Hydra I onboarding | 3 | 3 U1 | 33 |
| Hydra I onboarding | 9 | 6 U1 | 66 |
| Hydra I onboarding | 27 | 9 U1 | 99 |
| Hydra II mature I | 81 | 36 U2 | 1188 |
| Hydra II mature II | 243 | 54 U2 | 1782 |
| Hydra III next | 729 | **36–54 U3 range** | **PRICE TBD** |

Lv.1–6 沒有額外 kill gate：

```text
previous level owned
AND Humanity Evil >= current fixed price
→ purchasable
```

729 的 proposal 仍是 range，因此 normal purchase 必須拒絕 `price-pending`；TEST / already-owned 729 狀態仍合法。

Command Spell I 是長期無限軸；未來 2187、6561... 不應因目前資料只列到 729 就被概念上視為終點。

## 6. Command Spell II — finite manual technique + long-term time axis

玩家端：

> **「快點……再快點……！」**

Base：

```text
manual ×1 · NP66 · 3s
```

### Hydra II teaching trio — currently formal

| Lv | Beat | Eligibility | Relative cost | HE | Result |
|---:|---|---|---:|---:|---|
| 1 | STRIKE | first reversal cut · 0 Hydra II kills | 9 U2 | 297 | manual ×3 · NP132 · 3s |
| 2 | EFF I | 9 Hydra II kills | 6 U2 | 198 | manual ×3 · NP66 · 3s |
| 3 | TIME | 18 Hydra II kills | 27 U2 | 891 | manual ×3 · NP198 · 9s |

Lv.1 的 anti-softlock invariant 不變：第一刀 `9→10` 後，同一隻蛇仍活著時就可以取得資格。

### Later effects retained, prices pending

舊 Playtest 已驗證的 effect shapes 仍可由 TEST / old save 表示：

```text
manual ×6 / ×9
27s / 81s
higher NP requirements / efficiency beats
```

但 long-term proposal 把這些移到 Hydra III / IV 之後，且目前只給 range。因此 normal purchasing 在 Lv.3 後停於：

```text
PRICE TBD
```

不得沿用舊版 `396 / 330 / 495 / 594 / 495 / 693` 當正式價格。

### Manual branch is finite

手動連斬：

```text
1 → 3 → 6 → 9 cuts/tap
```

到 ×9 封頂，不往 ×27 / ×81 無限延伸。

### Time branch is long-term

81 秒**不是** Command Spell II 的概念 MAX。長期 time axis 可以跨世代繼續，例如 proposal 中的：

```text
9s → 27s → 81s → 243s → ...
```

實際未來階數、價格與 NP sawtooth 仍需逐代確認；目前 System 用 `futureExtensionPending` 表示「已列資料結束，但設計軸未結束」。

## 7. Command Spell III — finite Auto-in-NP bridge

玩家端：

> **「這裡怎麼沒有 SKIP???」**

第一次在 Hydra III 寶解後建立 gameplay eligibility：

```text
hydra-iii-first-np-release
```

效果軸固定：

```text
Base → NP Auto OFF
Lv1  → 1/9 of Command Spell I APS
Lv2  → 1/3 of Command Spell I APS
MAX  → FULL Command Spell I APS
```

Auto cuts 永遠是普通 auto strikes，**不乘 Command Spell II 的 manual ×3/×6/×9**。

目前價格：

| Level | Relative cost | Raw HE | Status |
|---|---:|---:|---|
| 1/9 | 9 U3 | 891 | formal |
| 1/3 | 9–18 U3 | — | PRICE TBD |
| FULL | 18–36 U3 | — | PRICE TBD |

Lv1 被揭露後，若 balance <891，slot 可查看但保持 dim；balance >=891 時才亮成可購買。Lv2/MAX 因仍是 range，formal purchase 會回 `price-pending`。

Command Spell III 是有限 bridge；FULL 後真正 MAX，不再新增更高倍率。

## 8. Command Spell UI contract

固定三槽：

```text
令咒
[ I ] [ II ] [ III ]
```

狀態語義：

```text
dormant      未揭露 / 未到第一個入口
available    NEW 且目前可買
affordable   已擁有，下一階目前可買
owned-dim    已揭露或已擁有，但目前買不起 / price pending
max          真正有限軸終點
```

`PRICE TBD` 必須是不可購買狀態，不能拿 range 的任一端點偷當正式價。

CS II end-of-current-data 若 `futureExtensionPending`：

```text
CURRENT = current technique
NEXT = LONG-TERM TIME AXIS · TBD
```

不能顯示假 MAX。

## 9. Tree View / representation break

Head View contract：

```text
logical 0–99 → same visible count
logical 100+ → visible 99
```

第一次 `logical=100` 時：

```text
Tree View unlock
LOGICAL HEADS 100
VISIBLE PROXY 99/99
BEYOND IMAGE +1
CURRENT CAP 729
```

Tree View v0 不決定 combat、target 或 Hydra math。

## 10. Persistence / compatibility

Save schema 維持 **1**。

- CS I / II / III level ownership 仍使用 existing `progression.milestones`。
- old/test-owned later CS II milestones 不回收；其 effect 繼續投影。
- 只是 normal economy 不再用已淘汰的舊精確價格往後買。
- old/test-owned 729 APS 仍合法。
- `U_n` 是 Data 計價工具，不是新的 persistent currency。

## 11. Current playtest questions

這一輪要驗證的是 pacing，不是底層正確性：

1. 81 APS 改成 **1188 HE = 36U2** 後，Hydra II 是否太早／太晚出現第一個成熟 throughput major beat？
2. 243 APS 改成 **1782 HE = 54U2** 後，和 CS II 的 297 / 198 / 891 是否形成真正的分配壓力？
3. CS II 在 Lv.3 後顯示 `PRICE TBD`，是否比讓玩家在 Hydra II 一口氣買完整九階更符合「跨世代養成」？
4. Hydra III 第一次寶解後，CS III 1/9 以 **891 HE = 9U3** 開價是否足夠像一個低門檻 bridge？
5. 玩家是否能理解 81 秒只是當前已實作效果，不是整條第二令咒的終點？

## 12. Still intentionally unresolved

- CS I 729 的 range 內正式單值。
- CS II Hydra III+ 各 branch 的正式單值價格、reveal cadence 與後續 NP requirement composition。
- CS III Lv2 / MAX 在各 range 內的正式單值。
- Hydra III 之後 generation 規則。
- Tree node targeting / Analyzer gameplay。
- Hydra II cap replacement 最終演出。
- Prestige / Offline Progress。
- 真正 Kirby–Paris Hydra 完整規則的登場世代。

原則：**用 `U_n` 維持跨世代可讀的購買壓力；用 raw price 不重算來自然產生 catch-up；range 沒定案就真的保持 TBD。**
