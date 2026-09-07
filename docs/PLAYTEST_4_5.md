# Playtest 4.5 — 三槽令咒 UI

## 目的

把已經能運作的 Command Spell I / II 經濟，從「兩顆功能型購買按鈕」改成玩家端已定義的固定三槽令咒介面。

本輪只改 presentation / interaction grammar，不改：

- Command Spell I APS / Humanity Evil 價格；
- Command Spell II 9-beat 數值；
- NP 規則；
- Hydra I / II / III 規則；
- Save schema。

## 玩家端結構

```text
令咒
[ I ] [ II ] [ III ]
```

三格從遊戲開始就存在。

### Dormant

第一次真正買得起以前：

```text
slot ghosted
EMPTY
non-clickable
```

### First affordability

第一次滿足正式 purchase 條件：

```text
NEW
bright
clickable
```

點槽只開 detail modal，不直接花錢。

### Owned / unaffordable

買過後不再消失：

```text
owned slot remains
next upgrade currently unavailable / too expensive
→ dim
→ still clickable
```

玩家仍可打開 modal 看 current / next / cost。

### Owned / affordable

```text
bright
LV UP
```

### MAX

MAX 使用獨立完成態，不與 dormant / poor 混淆。

## Detail modal

最低資訊：

```text
name / quote
level
CURRENT
NEXT
COST
mechanical description
PURCHASE / LV UP / MAX / PRICE TBD
close
```

真正購買路徑：

```text
slot tap
→ View opens modal
→ modal action
→ Application calls runtime.buyCommandSpellI() / buyCommandSpellII()
→ System validates / spends / emits semantic events
```

View 不修改 Humanity Evil、milestone、APS、NP config。

## Command Spell III boundary

本輪只保留第三格：

```text
[ III ]
EMPTY
dormant
disabled
```

不加入 click handler、System、價格或 gameplay effect。

## 729 APS pending state

正式玩家到 243 APS 後：

```text
Command Spell I Lv.6
243 APS
NEXT 729 APS
PRICE TBD
```

slot 仍可打開 detail modal，但 purchase disabled。

TEST 或 legacy already-owned 729 APS 仍可顯示 MAX。

## 本輪人工 Playtest

只需要看玩家端讀感：

1. 0 人類惡時，三格是否明顯是「預留的三個系統」而不是壞掉的按鈕。
2. 99 人類惡時，令咒 I 從 EMPTY → NEW 是否足夠醒目。
3. 點 NEW 後是否自然理解為「先看資訊，再確認購買」。
4. 買完後，窮的時候變暗、存夠錢後再亮，是否容易理解。
5. Hydra II 的令咒 II 出現時，是否能自然讀成與令咒 I 競爭同一筆人類惡。
6. 令咒 III 長期保持 EMPTY 時，是否產生合理的未來感而不是誤導玩家現在能解鎖。

## 自動測試邊界

- exactly 3 fixed slots；
- CS I / II dormant → NEW → owned-dim / affordable → MAX projection；
- CS I 729 pending → PRICE TBD；
- CS III dormant / disabled；
- panel View 不 import Systems / Math / Core；
- Application modal action 才能呼叫 purchase runtime API；
- iOS fixed controls 保持 touch-action lock。
