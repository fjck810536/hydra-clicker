# Playtest 5.1 — Long-term Command Spell Economy

本輪不是重測 Hydra / NP 邏輯；CI 已覆蓋底層。人工只看 **價格節奏、選擇壓力與 UI 語義**。

## A. Command Spell I — Hydra II mature prices

新版正式值：

```text
81 APS  = 36 U2 = 1188 人類惡
243 APS = 54 U2 = 1782 人類惡
729 APS = 36–54 U3 range → PRICE TBD
```

觀察：

1. 81 APS 是否像 Hydra II 第一個真正的 major throughput purchase？
2. 243 APS 是否夠晚，讓玩家有理由先把資源花在令咒 II？
3. 243 後看到 729 `PRICE TBD` 是否自然，而不是像壞掉的商店？

## B. Command Spell II — only the Hydra-II teaching trio is formally priced

```text
Lv1 STRIKE  = 297 = 9U2
Lv2 EFF I   = 198 = 6U2
Lv3 TIME 9s = 891 = 27U2
Lv4+        = PRICE TBD
```

觀察：

1. 第一刀 `9→10` 後 297 的入口是否仍有「問題出現 → 解法出現」的效果？
2. 198 的效率 relief 是否像便宜的回饋？
3. 891 的 9 秒是否足夠像 Hydra II 的大投資？
4. Lv3 後停在 `PRICE TBD` 是否比一口氣把 ×6 / ×9 / 27s / 81s 全買完更像跨世代養成？

注意：TEST / old save 仍可持有後續效果；這不是 bug。只是 formal economy 暫不出售 range 尚未定案的後續。

## C. Command Spell III — first real bridge purchase

Hydra III 第一次寶解後：

```text
Lv1 Auto-in-NP 1/9
cost = 9U3 = 891 人類惡
```

若 balance 不足：slot 應已揭露、可點開看，但保持 dim。  
若 balance >=891：應亮成可購買。

買下後：

```text
Lv1 = 1/9
Lv2 = PRICE TBD
```

觀察：891 是否像「便宜但有感的第一個 bridge」，而不是又一個 major wall。

## D. Conceptual UI checks

確認不要再出現以下舊語義：

```text
81s = Command Spell II MAX          ❌
CS III Lv1 = PRICE TBD              ❌
81 APS = 1782                       ❌
243 APS = 2178                      ❌
CS II Lv3 = 396                     ❌
```

現在應是：

```text
81 APS = 1188
243 APS = 1782
CS II Lv3 = 891
CS III Lv1 = 891
CS II 81s owned/test effect ≠ conceptual MAX
```

## E. One question to answer after playing

> **Hydra II 的 99U2 總預算，現在有沒有真的讓「先投 Auto，還是先投 NP 技法」變成選擇？**

如果答案是有，這套 `U_n + raw-price catch-up` 就可以作為往 Hydra III / IV 延伸的基準；如果沒有，再調的是 relative U cost，而不是重新發明一套貨幣公式。
