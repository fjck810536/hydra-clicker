# Hydra Clicker — Game Design v0.2

> 積木編程第二階段：先固定「遊戲如何逐層改變玩家對 Hydra 的理解」，再進入 Babylon.js 實作。

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

## 3. 主要進程不是 Prestige

目前不把 Hydra I → II → III 稱作傳統 Prestige。

這些是 **Hydra Generation / Hydra Theory 層級**：

- 玩家已購買的自動化保留。
- 角色能力與核心升級保留。
- 新一代 Hydra 會引入新的規則。
- 傳統「重置換永久倍率」式 Prestige 是否加入，延後決定。

## 4. Hydra I — Regeneration Tutorial

### 規則

- 初始 9 heads。
- 一次斬首只移除 1 head。
- 被砍的 head 會在延遲後長回，因此總頭數不增值。
- 隨著 Hydra 討伐數增加，再生延遲逐步縮短。

例：

```text
Hydra #1   regen 1.50 s
Hydra #3   regen 1.20 s
Hydra #9   regen 0.60 s
Hydra #30  regen 0.20 s
Hydra #99  regen nearly instant
```

數值只是假定，之後平衡。

### 教學目的

讓玩家形成第一個直覺：

> Hydra = 會復原的敵人；我要讓攻擊速度跑贏再生速度。

### NP

- 斬擊／戰鬥累積 NP。
- NP 解放後進入短時間「有效斬殺窗口」。
- 第一版可表現成再生暫停。
- 後期若數學規則成熟，可重新解釋成「選到不再生的合法結構位置」，而非魔法封印。

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

它不是 Fate 正史上的正式能量，而是 Riyo 咕噠子式 meta 梗：

> 從「拯救人理」逐漸滑向「發現可以無限刷素材」。

所有 Fate 專名與梗必須放在 data/text 層，避免規則層依賴 IP 名稱，方便之後改成原創皮。

## 6. Command Spell I — Auto Slash

第一令咒功能：

```text
AUTO SLASH
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

目的：讓玩家在 30 秒左右發現：

> 頭數不是 HP；我越砍，它可能越多。

Hydra II 解鎖第二令咒購買權。

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
- 真正 Kirby–Paris 規則在哪一代完整登場。
- 是否存在傳統 prestige/reset。
- 第三令咒最終是否確定為 Tree Targeting。
- Fate fan-game 皮是否保留到公開版本。
- 後期巨大整數／序數使用哪個 notation。

這些都應該等核心 loop 可玩後再決定。

## 15. 下一階段成功條件

第三階段原型只需要證明五件事：

1. Babylon.js 固定側視角舞台能運行。
2. 一個低模 placeholder Berserker 能循環 attack animation。
3. Hydra I 的 9 heads 可被斬、延遲長回。
4. 邏輯頭數和渲染頭數已分離。
5. Auto Slash 可以完全不碰 3D 模組地被開關。

做到這五件，才開始加 Hydra II。
