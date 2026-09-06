# Hydra Clicker — AI / Contributor Block Rules

> 這份文件是給 ChatGPT、Codex、Claude Code、其他 coding agent 與未來貢獻者看的施工守則。
>
> 它回答的不是「遊戲要做什麼」，而是：**新增功能時，程式應該放在哪一塊，以及哪些捷徑禁止走。**

## 0. 開工前先讀

修改核心程式前，依序閱讀：

1. `docs/GAME_DESIGN.md` — 目前遊戲設計與刻意未決事項。
2. `docs/ARCHITECTURE.md` — 模組分層與依賴方向。
3. `docs/BLOCK_CONTRACTS.md` — 積木之間的資料插頭。
4. `docs/EFFECT_MODIFIER_ARCHITECTURE.md` — Buff、英靈支援、迦勒底科技、設施的共同效果架構。

若程式與文件衝突，**不要默默猜設計意圖**。優先保留既有可玩行為，並把衝突寫成 TODO / issue 或更新文件。

---

# 1. 第一原則：先判斷這是什麼積木

任何新需求都先分類，再寫 code。

| 問題 | 應放的層 |
|---|---|
| 數量／結構怎麼計算？ | Math |
| 砍下去依規則發生什麼？ | Rules |
| 現在遊戲世界長什麼樣？ | State |
| 某功能怎麼隨時間運作？ | Systems |
| 玩家做了什麼？ | Input |
| 各系統依什麼順序執行？ | Core / Application |
| 玩家看到／操作什麼？ | UI / View |
| 畫面怎麼演？ | Visual |
| 聲音怎麼播？ | Audio |
| 數值、台詞、角色、價格是什麼？ | Data / Text |
| 關遊戲後留下什麼？ | Persistence |
| Buff／科技／支援如何改變既有規則？ | Effect / Modifier |

**Mechanic（機制）與 Interaction（互動）通常跨越多個積木，不要因此建立一個萬能 `mechanics.js` 或 `interaction.js`。**

---

# 2. 依賴方向只能往下

允許：

```text
data → 無依賴
math → data
systems → math + data
core → systems + math
view/audio → snapshot + semantic events + data
save → serializable logical state
```

禁止：

```text
math → Babylon.js
math → DOM
rules → animation
systems → mesh
view → 改 Hydra state
UI button → 直接改 headCount
support character → 直接呼叫 combat / hydra / NP internals
```

遇到跨層需求，先新增標準事件、request、modifier 或 snapshot 欄位，不得直接跨層取 reference 修改。

---

# 3. Hydra Math 是純邏輯核心

`math/` 必須能在沒有：

- Babylon.js
- DOM
- Canvas
- Audio
- Fate 角色名稱

的環境下單獨測試。

Hydra 規則只能輸入邏輯資料並輸出邏輯結果。

例如：

```text
Attack Request
      ↓
Hydra Rule
      ↓
Cut Result
```

不能：

```text
Hydra Rule
      ↓
播放斬擊動畫
```

---

# 4. 邏輯資料永遠比表現資料優先

不可破壞：

```text
LOGICAL HEAD COUNT ≠ VISIBLE HEAD COUNT
```

- 真實 Hydra 頭數是邏輯資料。
- Babylon.js 最多顯示約 99 顆 head mesh。
- 後期 Tree View 也必須使用 compressed representation，不得暴力建立所有節點。
- View 不得以 mesh 數量反推遊戲狀態。

離散數量：

```text
heads
materials
kills
currencies
```

使用整數層（第一版 `BigInt`）。

時間、速度、倍率可以使用 `Number`。

---

# 5. 所有延遲與自動化都服從 Game Clock

禁止把重要遊戲規則散落成無法保存的 `setTimeout()`。

以下都應由 clock / scheduler 管理：

- Hydra 再生
- Auto Slash
- NP duration
- Buff duration
- Facility production
- Offline progress（未來）

遊戲邏輯不得依賴畫面 FPS。

---

# 6. State、Save、History 要區分

### Runtime State

現在的世界：

```text
current heads
NP
active modifiers
pending regrowth
current Hydra generation
```

### Persistent Save

需要跨 session 保存：

```text
unlocks
upgrades
currencies
Hydra generation
logical Hydra state
milestones
```

### Statistics / History

累積紀錄：

```text
total heads cut
total Hydra kills
total NP releases
lifetime materials
```

不要因為三者都「是資料」就全部混成一個無界限 object。

---

# 7. Support / Facility / Research 不得直接修改核心系統

其他英靈、迦勒底科技、建設、研究、禮裝式支援等內容，原則上只提供標準化 **Effect / Modifier**。

錯誤：

```js
if (hasSupportX) {
  hydra.headCount -= 3n;
  np += 10;
  material += 5n;
}
```

正確方向：

```text
Support / Facility / Research Definition
                ↓
          Effect / Modifier
                ↓
        Modifier Aggregator
                ↓
   Combat / NP / Farming / Analyzer / Rules
```

角色名稱永遠不應成為核心規則判斷條件。

禁止：

```js
if (master === 'Gudako') ...
if (servant === 'Merlin') ...
```

應改成能力：

```js
if (capabilities.autoSlash) ...
if (policies.targeting === 'highest-growth') ...
```

---

# 8. 新 Buff 優先使用既有 Effect Type

建立新角色／科技前，先問能否用既有效果表示：

1. `stat-modifier` — 攻速、NP gain、素材倍率等數值修正。
2. `rule-modifier` — 修改 Hydra 再生／增殖規則的合法參數。
3. `capability` — 解鎖 Auto Slash、Analyzer 預測等新能力。
4. `policy` — 改變自動 targeting / farming 的決策策略。
5. `conversion` — 改變資源轉換方式，例如 heads → materials。

只有真的無法用既有型別描述時，才新增 Effect Type。

新增 Effect Type 必須：

- 寫進 `docs/EFFECT_MODIFIER_ARCHITECTURE.md`。
- 有純邏輯測試。
- 不依賴 Fate 專名。

---

# 9. UI / Visual / Audio 只讀語義結果

Systems 發：

```text
head:cut
hydra:killed
np:released
command-spell:unlocked
currency:gain
```

View / Audio 自己決定：

```text
頭飛出去
畫面震動
播放斬擊聲
跳 +人類惡
```

不要讓 Systems 直接操作 mesh、DOM、particle、sound object。

---

# 10. Fate 梗是可替換內容，不是核心架構

目前可以使用：

- Berserker / B叔式演出
- 咕噠子
- 令咒
- 人類惡
- 迦勒底
- 其他英靈支援梗

但它們應位於：

```text
data/
text/
assets/
view presentation
```

規則核心要能在換成原創 Hercules / Master / Research Base 後繼續運作。

---

# 11. 不要提前實作尚未決定的設計

目前文件明確標成未決的事情，不得擅自「補完成正式機制」。

例如：

- Hydra I 最終是 9 / 30 / 99 kills 才進 II。
- 第三令咒是否一定是 Tree Targeting。
- 真正 Kirby–Paris 規則在哪一代完整登場。
- 是否加入傳統 prestige/reset。

可以為未來留 interface，但不能偷偷固定玩法。

---

# 12. 每新增一塊，至少問四件事

### A. Ownership
誰擁有這份資料／規則？

### B. Input
它接受什麼？

### C. Output
它產生什麼標準結果？

### D. Test
不用 3D 畫面能不能驗證它？

答不出來時，代表積木邊界可能還不健康。

---

# 13. 最小測試要求

核心新功能應優先能用純邏輯測試驗證。

最低邊界：

```text
Hydra I:
9 → cut → 8 → regen deadline → 9

Render:
logical 1,000,000,000,000 → visible 99

Modifier:
base attackSpeed 4 × 1.25 → effective 5
移除 modifier → 回到 4

Capability:
未解鎖 autoSlash → 0 auto requests
解鎖後 → 正確產生 requests
```

---

# 14. 修改架構時同步更新文件

如果 code 真的需要改變：

- 積木責任
- 依賴方向
- Contract
- Effect Type
- Save schema

必須同步更新相應 `docs/*.md`。

不要讓文件只記錄最初理想、程式自行長成另一套架構。

---

# 15. 最後的施工判斷

新增功能時優先問：

> **「我是在增加一塊新積木，還是在偷偷讓舊積木知道太多？」**

如果一個需求迫使：

- Hydra Math 知道角色名稱，
- UI 知道增殖公式，
- 英靈支援直接改 headCount，
- Babylon animation 決定傷害結果，

先停下來重新找積木邊界。

這個專案允許功能怪、公式怪、敘事怪；**架構不要跟著怪。**
