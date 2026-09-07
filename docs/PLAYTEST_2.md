# Hydra Clicker — iPhone Playtest 2 / Hydra I Seal Candidate

> 這份紀錄保存 Hydra I 從 Playtest 2.0 到 2.4 的實機結論。它是下一階段 Hydra II 的比較基準，不代表所有數值永遠不可調。

## 1. 已驗證的玩家節奏

目前 Hydra I 在 iPhone 直立模式形成的自然節奏：

```text
Hydra 1–5
→ 手動狂點仍能明顯壓過再生

約 Hydra 6
→ 一般雙拇指快速點擊開始撞上再生速度
→ 玩家會真正注意到「頭正在長回來」

66 heads cut
→ NP READY
→ 3 秒 regeneration suppression

9 kills
→ Command Spell I / Auto Slash 1 APS

12 / 16 / 22 / 30 / 40 kills
→ 2 / 4 / 8 / 16 / 32 APS

66 kills
→ 64 APS MAX

約 95 kills
→ 64 APS 開始撞上 100ms regen floor

95–99
→ 一次 NP 足以完成最後收尾
```

這條節奏同時服務 active clicker 與 idle 玩家：

- 狂點玩家前期會先靠操作硬壓，約第 6 隻自然撞牆。
- 放置玩家靠 Auto Slash 的 milestone 逐步跨過中段。
- Auto 不會在 52 kills 就提前到 64 APS；40→66 故意留下 32 APS plateau。

## 2. NP 最終 Playtest 2 配置

```text
Gauge = 66 points
1 accepted head cut = +1 NP
66 / 66 = READY
release → 0
window = 3000ms
```

Manual / Auto Slash 目前使用相同充能規則。

NP 是 timed rule modifier：

```text
hydra.regrowth = disabled
scope = timed
```

它可跨 Hydra encounter，不因敵人死亡而結束。

### 空場寶解

實機發現後期快速周回時，若 Hydra defeated / respawn gap 禁止按 NP，READY 按鈕會反覆亮／暗閃爍。

因此目前規則：

> 只要 NP READY，即使場上暫時沒有 Hydra，也允許 release。

代價只是 3 秒 window 會從按下當刻開始消耗。

## 3. Command Spell I 最終 Playtest 2 曲線

```text
kills  level    cost   Auto Slash
9      Lv.1      99      1 APS
12     Lv.2      22      2 APS
16     Lv.3      33      4 APS
22     Lv.4      44      8 APS
30     Lv.5      66     16 APS
40     Lv.6      88     32 APS
66     Lv.MAX   132     64 APS
```

刪除先前實驗：

```text
52 kills → 64 APS
66 kills → 128 APS
```

實機顯示 64 APS 已有充分飽和感；128 APS 會抹掉約 95 kills 出現的自然再生牆。

## 4. Regen Curve

```text
0 kills   → 1500ms
1         → 1276ms
3         → 923ms
6         → 569ms
9         → 350ms
30        → 247ms
50        → 174ms
66        → 134ms
99        → 100ms floor
```

前 0→9 快速惡化；9→99 繼續加速但單隻造成的增幅遞減。

## 5. Platform 結論

Playtest 2.2 後採 battle-shell-wide iOS gesture lock：

- viewport minimum / maximum scale = 1
- user-scalable=no
- battle shell touchend / multi-touch / dblclick / gesture defaults blocked

後續實機回報頁面異常 zoom 已停止。

## 6. Hydra I Seal Candidate

目前不再優先新增 Hydra I 數值系統。

Hydra I 的任務已經成立：

> 教玩家「砍頭不等於扣 HP；你必須讓斬擊節奏跑贏再生」。

下一個 playtest 不再問 Hydra I 能不能更快，而是問：

> 玩家把這整套解法學熟後，如果 Hydra 的規則突然改成 CUT 1 → GROW 2，認知反轉是否成立？
