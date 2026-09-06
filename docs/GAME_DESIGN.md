# Hydra Clicker — Game Design v0.3

> 積木編程第二階段：固定「遊戲如何逐層改變玩家對 Hydra 的理解」，並把第一次 iPhone 實機試玩後的 Hydra I tuning 明確記錄為 Playtest 2 實驗規則。

## 1. 核心一句話

玩家一開始以為自己在操縱狂戰士討伐會復原的九頭蛇；中期發現九頭蛇的增殖其實可以被利用成素材農場；後期再逐步解鎖樹狀結構與數學分析儀，發現自己操作的不是單純 HP，而是一套可分析的 Hydra 規則系統。

遊戲同時追求三件事：

1. 不懂數學也能玩的爽快 clicker。
2. 玩久後逐步理解規則與公式的數學玩具。
3. 從 FGO 式惡搞 fan-game 外觀逐漸變成數學儀器／證明介面的媒體作品。

## 2. 表層演出

- 固定側視角 2.5D。
- 低模狂戰士在左側持續斬擊。
- Hydra 在右側承受斬首與再生。
- 角色本質上以動畫狀態機運作，不做完整 RPG 戰鬥 AI。
- 後期切換 Tree View / Analyzer 時，戰鬥仍可在旁持續運行。
- 視覺最多同時渲染 99 顆頭；真正頭數與畫面頭數分離。

Playtest 1 後，Hydra I 暫時移除大型胖 body，只保留小型 root / neck base；九頭排列改成「越高越向左右擴散」的扇形，以提高多頭輪廓辨識度。這只是 View tuning，不改 Hydra Math。

## 3. 主要進程不是 Prestige

目前不把 Hydra I → II → III 稱作傳統 Prestige。

這些是 **Hydra Generation / Hydra Theory 層級**：

- 玩家已購買的自動化保留。
- 角色能力與核心升級保留。
- 新一代 Hydra 會引入新的規則。
- 傳統「重置換永久倍率」式 Prestige 是否加入，延後決定。

## 4. Hydra I — Regeneration Tutorial

### 基本規則

- 初始 9 heads。
- 一次斬首只移除 1 head。
- 非 terminal cut 的 head 會在延遲後長回，因此玩家仍會感受到「砍得不夠快就白砍」。
- 隨著 Hydra 討伐數增加，再生延遲可逐步縮短；目前 prototype 還未正式套入這條曲線。

例：

```text
Hydra #1   regen 1.50 s
Hydra #3   regen 1.20 s
Hydra #9   regen 0.60 s
Hydra #30  regen 0.20 s
Hydra #99  regen nearly instant
```

數值只是假定，之後平衡。

### Playtest 2 實驗：0 Heads = Kill

第一次實機試玩發現：如果「砍到 0」仍只能算 depleted、還必須等 NP 才能真正殺死 Hydra，前期容易變成只是在等寶解。

因此 Hydra I 暫時改成：

```text
head count reaches 0
→ depleted = true
→ killed = true
→ cancel all pending regrowth
→ encounter clear
```

這是 **Hydra I 的目前實驗 rule**，不是刪除 `depleted != killed` 的架構區分。

後續 Hydra II / III / Kirby–Paris 型規則仍可能再次出現：

```text
0 current/visible heads
!= terminal mathematical death
```

### 教學目的

Playtest 2 想驗證兩個直覺能否同時成立：

1. Hydra = 會復原的敵人；我要讓斬擊節奏跑贏再生。
2. 即使沒有 NP，只要真的把九顆頭在再生前砍光，我就能完成一輪。

這讓 NP 不再是唯一推進鑰匙，而是爆發工具。

### NP — Timed Farming Burst

- 斬擊／戰鬥累積 NP。
- NP 解放後進入短時間 regeneration suppression window。
- 目前 prototype：3.0 秒。
- 既有 pending regrowth 在 window 中暫停。
- window 中的新 cut 不建立 regrowth。
- **NP window 只看 Game Clock，不因一隻 Hydra 死掉而結束。**
- 新 Hydra respawn 後，只要 `now < endsAt`，同一個 NP window 繼續有效。

因此玩家可以：

```text
NP release
↓
kill Hydra A
↓
Hydra B respawn
↓
kill Hydra B
↓
Hydra C ...
```

NP 的體感目標從「單體王斬殺鑰匙」改成：

> 短暫割草／無雙／高速 farming 窗口。

後期若數學規則成熟，可重新解釋成合法結構操作，而不是魔法封印。

### Encounter Respawn

Playtest 1 的 1.2 秒空場主觀過久，Playtest 2 暫時改成：

```text
respawnDelayMs = 300
```

先只測單一 300ms，不為了 NP 另外硬寫 100ms 特例。若 Playtest 2 仍覺得 NP farming 被空場打斷，再設計正式 encounter-speed modifier。

### Milestone（暫定）

- 3 kills：開始顯示周回／素材感。
- 9 kills：第一令咒購買權或自動化核心解鎖。
- 99 kills：Hydra II 主線門檻候選。

99 不一定最後是硬門檻；需要用實際遊玩時間驗證。

## 5. Master 資源：人類惡

原型階段使用惡搞型資源：

```text
HUMANITY EVIL / 人類惡
```

來源候選：

- 討伐一隻 Hydra。
- 解放一次 NP。
- 長時間自動周回。
- 觸發特定「過度 Farming」行為。

目前 prototype 實際已使用：

```text
Hydra I kill → +11 人類惡
9 kills → 99 人類惡
```

這只是方便測完整周回的 tuning，不是最終經濟。

它不是 Fate 正史上的正式能量，而是 Riyo 咕噠子式 meta 梗：

> 從「拯救人理」逐漸滑向「發現可以無限刷素材」。

所有 Fate 專名與梗必須放在 data/text 層，避免規則層依賴 IP 名稱，方便之後改成原創皮。

## 6. Command Spell I — Auto Slash

第一令咒功能：

```text
AUTO SLASH
```

目前 prototype：

```text
requires 9 Hydra kills
cost 99 人類惡
```

解鎖後，Berserker 不再依賴玩家點擊，可自動攻擊。

之後可購買：

- Attack Speed
- Heads per Strike / Attack Range
- Rage Gain
- NP Gain
- Auto-target 基礎邏輯

玩家點擊在後期可以退化為：

- 臨時爆速
- 手動指定
- 特殊指令

而非永遠必須狂點。

## 7. Hydra II — 1 Cut → 2 Heads

Hydra II 開始第一次背叛前期直覺。

```text
9 heads
CUT 1
GROW 2
=> 10 heads
```

此階段仍然不必直接進入完整 Kirby–Paris Hydra。

目的：讓玩家在短時間內發現：

> 頭數不是 HP；我越砍，它可能越多。

Hydra II 解鎖第二令咒購買權。

**但 Playtest 2 完成前仍不進 Hydra II。**

## 8. Command Spell II — Auto NP

第二令咒功能：

```text
AUTO NP
```

- NP 滿足條件後自動解放。
- 可有額外升級：NP threshold、NP priority、NP skip / fast animation 等 meta 功能。
- 初期故意讓自動 NP 播放完整演出，可以形成手遊周回惡搞；之後再用昂貴升級跳過。

## 9. Hydra III — The Farm Reveal

第三階段的核心不是「更難的王」，而是第一次認知反轉：

> 我們其實不是在殺蛇；我們在維持一座會自己長頭的素材農場。

假設每斬一顆 head 都產生素材：

```text
Material/sec ≈ Cuts/sec
```

此時 Hydra 增殖速度從威脅轉化為供給速度。

玩家理解：

```text
Attack Speed ↑
→ cuts ↑
→ regrowth / head supply ↑
→ harvestable heads ↑
→ materials ↑
```

於是早期看似陷阱的攻速升級，在新的經濟模型裡其實是產能升級。

## 10. Tree View

Tree View 不必一開始存在。

建議進程：

1. 早期完全隱藏結構，只看怪物。
2. 中期 Analyzer 顯示統計值。
3. 再解鎖只讀 Tree View。
4. 更後期解鎖 Tree Targeting。

第三令咒目前預留為：

```text
COMMAND SPELL III
STRUCTURE COMMAND / TREE TARGETING
```

使玩家可以直接指定某個 branch / leaf 給 Berserker 攻擊。

## 11. Hydra Analyzer

分析儀應該逐級進化，而不是一開始丟高等數學。

### v0.1

```text
Heads
Cuts/sec
Regrowth/sec
Net Growth
```

### v0.2

```text
CUT 1
SPAWN 2
ΔH = +1
```

### v1.x

加入：

- depth
- branch pattern
- reproduction factor
- turn/stage
- compressed subtree counts

### v∞（概念）

才可能顯示：

- termination rank
- ordinal-like notation
- 更接近 Kirby–Paris Hydra 的真正分析資料

玩家和開發者都不需要在遊戲早期先懂這些數學。

## 12. Logical Heads ≠ Rendered Heads

這是不可破壞的工程規則。

```text
LOGICAL HYDRA
可能非常巨大

↓ projection

VISUAL HYDRA
最多 99 heads
```

- 真實 head count 必須是整數。
- 大數先以 `BigInt` 或可替換的巨大整數層處理。
- UI 可以用科學記號顯示巨大整數，但底層不能使用浮點數代表真實頭數。
- Tree View 也不能真的產生數兆節點；後期需要 compressed tree / repeated branch pattern。

## 13. 支援角色原則

未來可以加入其他 Master / Servant 支援，但不能只做：

```text
+20% DPS
```

支援角色最好對應一種新的規則操作，例如：

- 預測下一刀增殖量。
- 自動選擇最低／最高增殖 leaf。
- 凍結 turn coefficient。
- 合併相同 subtree。
- 改變初始 Hydra tree。
- 改變 farming 轉換率。

先設計功能，再選哪個 Fate 角色最適合演這個功能。

## 14. 目前刻意不決定的事

- Hydra I 主線究竟打 9、30、99 隻。
- Playtest 2 的「0 heads = kill」是否成為正式 Hydra I 規則。
- respawn 300ms 是否太快／剛好／仍太慢。
- NP 3.0s multi-encounter burst 是否需要特殊 respawn 加速。
- 真正 Kirby–Paris 規則在哪一代完整登場。
- 是否存在傳統 prestige/reset。
- 第三令咒最終是否確定為 Tree Targeting。
- Fate fan-game 皮是否保留到公開版本。
- 後期巨大整數／序數使用哪個 notation。

## 15. 下一個成功條件 — Playtest 2

目前 Block 1–9 已完成；下一步不是增加大系統，而是確認這五件 tuning：

1. iPhone Safari 快速連點固定 HUD control 不再 double-tap zoom。
2. 普通攻擊砍到 0 就 kill，是否明顯比較不無聊。
3. NP 能跨 encounter 連殺多隻後，是否形成值得期待的爆發期。
4. 300ms respawn 是否合適。
5. 移除胖 body、頭向上外擴後，Hydra silhouette 是否更清楚。

這五點大致成立後，再 Grill 是否進 Hydra II。
