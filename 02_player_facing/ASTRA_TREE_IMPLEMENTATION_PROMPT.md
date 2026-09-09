# Astra Tree View Implementation Brief

請直接執行，不要只做分析或回報建議。

## Repository

https://github.com/fjck810536/hydra-clicker

Default branch: `main`

這是一個 browser-based Hydra clicker / incremental game，iOS Safari portrait-first。

## 開工前必讀

先閱讀：

1. `AGENTS.md`
2. `README.md`
3. `02_player_facing/tree_scene_shell/README.md`
4. `02_player_facing/tree_scene_shell/astra_tree/README.md`
5. `02_player_facing/HYDRA_GENERATION_SCALE.md`

如果需要修改核心或正式遊戲整合，再依 `AGENTS.md` 繼續閱讀相關 `docs/` architecture / contracts。

## 權限與邊界

你可以讀取整個 repository，也可以修改任何為了完成 Tree View、整合、debug、測試與部署所必要的檔案。

`02_player_facing/` 不是你的寫入限制。

但請遵守兩條原則：

- 不要任意重構與 Tree View 無關的系統。
- 優先用最小、可回退、符合既有 architecture 的方式完成整合。

`02_player_facing/tree_scene_shell/` 是 UX / interaction reference prototype，不是唯一可修改目錄。

---

# 任務目標

先完成一版可以實際操作、可以公開預覽的 Hydra Tree View prototype。

Tree View 是一個「Scene 2」，從右側滑入後完整覆蓋主戰鬥 Scene 1，但不覆蓋底部主要操作列。

## 已確認的 Scene 行為

### Scene 1 — Main Battle

- Tree 關閉時完整可見。
- 玩家主要 click 行為在這裡發生。

### Scene 2 — Tree View

- 從右側滑入。
- 開啟後完整覆蓋 Scene 1；不要把 Scene 1 縮窄成左右分割畫面。
- Scene 2 開啟後，玩家仍可在這個區域持續 click / attack。
- Tree 自己可以承載 click / pan / inspect 等互動。
- 不得覆蓋底部固定操作列。

### Bottom Bar

底部固定列永遠可見、可操作，且 z-index 高於 Scene 1 / Scene 2：

- 寶具解放卡
- 人類惡 / 購買資訊
- 令咒欄

### Open / Close

Tree 關閉時：

- 右側中央有 `TREE ◀`
- 點擊後 Scene 2 從右側滑入

Tree 開啟時：

- 收起控制在左側中央，`▶ TREE`
- 點擊後 Scene 2 向右滑出
- Scene 1 重新露出

這套 shell 已經存在，請先實際打開確認，不要重做成別的 layout。

Reference path:

`02_player_facing/tree_scene_shell/`

---

# Tree View 第一版視覺目標

先做一個簡潔、可理解、可擴充的 2D rooted branching structure。

不要先做 3D。

優先使用 SVG / DOM；除非現有架構明顯更適合 Canvas，否則不要為第一版新增大型圖形依賴。

## 重要：視覺上要有「碎形般的遞迴分岔感」

Tree View 的外觀應該更接近：

> 一個不斷遞迴分岔、局部形態與整體相似、越往外圍越密集的 branching organism

而不是：

> 公司組織圖、家譜、一般 taxonomy diagram、整齊左右排列的 node graph

也就是說，畫面應該有明顯的 **fractal-like visual grammar / recursive branching feel**：

- 一個 root / trunk 向外分成較大的 branches；
- 大 branch 再分成較小、視覺上相似的 sub-branches；
- 越接近外圍，分岔可以越密、越細；
- outer clusters 應讓人感覺「裡面還藏著更多相似分岔」，即使那些分岔沒有真的 render；
- 整體看起來像一個會增殖的有機／數學結構，而不是資訊管理圖表。

可以使用曲線、角度變化、有限層數的 recursive-looking branch geometry、cluster silhouette 等方式製造這種感覺。

### 但「fractal-like」只代表視覺語法，不代表完整計算或完整展開碎形

這是硬性效能要求：

> **不要把每個 logical head 都建立成一個 DOM / SVG node。**

> **不要因為要呈現碎形感，就 literal recursive-expand 整棵 logical Hydra。**

Hydra 的 logical complexity 可以快速增加，但 rendered visual complexity 應保持大致穩定。

理想關係是：

```text
logical complexity ↑↑↑↑↑
rendered complexity ≈ constant
```

換句話說：

- 可以讓 120–180 個 visual nodes / branch primitives 看起來像一個巨大的碎形生命體；
- 不需要，也不應該真的 render 729、6,561、59,049 或更多 logical heads；
- 超過 visual budget 的部分應被壓縮成 subtree / cluster；
- cluster 的輪廓與分岔方式可以暗示其內部還有更多 self-similar structure；
- 「像碎形」是 perceptual illusion / visual grammar，不是 full recursive simulation。

如果要在「碎形感」與「效能／可讀性」之間取捨，優先保留效能、壓縮表示與互動清楚度。

---

# Tree 的結構概念

- root / trunk = Hydra 的結構根部
- internal nodes = branch / generation structure
- outer leaves = heads 的結構表示
- cluster / subtree proxy = 被壓縮的大量 logical descendants
- 大量 logical heads 不得真的建立等量 DOM / SVG nodes
- 必須支援 compressed / clustered representation

Hydra long-term scale：

- Hydra I cap = 9
- Hydra II cap = 81
- Hydra III cap = 729
- Hydra IV cap = 6,561
- Hydra V cap = 59,049
- Hydra VI cap = 531,441
- 一般公式：Hydra generation `n` 的 maximum logical heads = `9^n`

主戰鬥畫面的 visible heads 約在 99 左右封頂，因此 Tree View 的價值是顯示「logical structure」，不是再畫更多 literal snake heads。

第一版只需要把 Hydra III / IV 級尺度的抽象化做清楚即可。

---

# 第一版資料策略

如果正式遊戲目前還沒有足夠的 Tree logical structure state，可以先用 deterministic synthetic / demo tree data 完成視覺與互動。

不要因此亂改 Hydra core rule。

如果可以很乾淨地從現有 snapshot / logical state 接入 head count，則可以接；如果需要跨層直接改 state，先不要。

任何正式整合都要遵守：

`logical head count != visible node count`

Tree View 不得用畫面節點數量反推真實 head count。

## 壓縮表示要求

Tree renderer 應該把 logical structure 映射成有限的 visual representation。

建議第一版：

- visible rendered nodes / branch primitives 約控制在 **120–180** 以內；
- 可以依 viewport 與效能稍微調整，但不要隨 logical head count 線性增加；
- 當 logical structure 超出 budget 時，優先合併成 cluster / subtree proxy；
- cluster 可以顯示例如 `×12`、`×173`、`×4,782` 等摘要數量；
- cluster 仍應保留 fractal-like branching silhouette，而不是變成單純表格或方框清單。

---

# 第一版必要功能

至少完成：

1. Tree Scene 正確滑入 / 收起。
2. Scene 2 完整覆蓋 Scene 1，而不是左右並排。
3. Bottom Bar 全程保持可見、可點。
4. Tree renderer 真正顯示一個具有 fractal-like recursive branching feel 的 rooted branching structure，不再是 placeholder。
5. 視覺上不要像公司組織圖／家譜；要像遞迴增殖的有機／數學結構。
6. Tree 可在手機 portrait 畫面正常閱讀。
7. Tree 可 pan / zoom，或至少提供等效的安全瀏覽方式。
8. 點擊 node / cluster 時有清楚的 selected / inspect feedback。
9. Tree 超過可視節點上限時採 cluster / subtree aggregation，不暴力建立 729 / 6,561 / 59,049 個節點。
10. Scene 2 的非 UI 控制區仍可維持主要 click / attack 行為，不可因 SVG / overlay 把整個 attack surface 吃掉。
11. Bottom Bar 的寶具、資源、令咒按鈕不得因 Tree pointer events 失效。
12. Tree 的 logical scale 增大時，render complexity 不應近似線性跟著 logical heads 增長。

---

# 不要在第一版做的東西

先不要：

- Tree 上直接改 Hydra state
- branch-targeted cutting
- Kirby–Paris 完整結構規則
- 大型 3D tree
- full recursive fractal simulation
- 一頭對應一個 visual node
- 一次加入大量新遊戲機制
- 為了 Tree 重寫整個戰鬥架構

第一版的目標是：

> 讓我可以打開公開網址，在 iPhone portrait 上切換 Scene 1 / Scene 2，看到一個真正可互動、可擴充、視覺上具有碎形遞迴分岔感的 Hydra Tree View，並且原本底部操作仍可用。

同時必須保持：

> **看起來像很大的碎形結構，但實際 render 的 visual complexity 是受控、壓縮、有限的。**

---

# 實作方式

現有 prototype mount point：

`02_player_facing/tree_scene_shell/astra_tree/tree.js`

目前入口：

```js
window.mountHydraTree = function mountHydraTree(container, shellApi) {
  // Tree View
};
```

`shellApi` 提供：

```js
shellApi.setTreeOpen(true | false)
shellApi.getTreeOpen()
shellApi.emitTreeEvent(name, detail)
```

你可以直接從這個 mount point 開始做第一版。

如果為了完成更好的 prototype 或正式整合，需要修改 shell、CSS、主遊戲 UI、view adapter、snapshot 或部署設定，可以修改必要檔案；但要保持既有 architectural separation。

---

# Debug / 驗收流程

不要做到「code 看起來對」就停止。

你必須實際跑起頁面並操作。

至少檢查：

- Tree 關閉 → Scene 1 可 click
- `TREE ◀` → Scene 2 正確從右滑入
- Scene 2 完整覆蓋 Scene 1
- `▶ TREE` → Scene 2 正確向右收起
- Tree open 時可 pan / zoom / inspect
- Tree open 時主要 click surface 仍能工作
- 寶具按鈕可點
- 人類惡 / 購買區不被 Tree 蓋住
- 三個令咒 slot 不被 Tree 蓋住
- 快速連續展開 / 收起沒有壞狀態
- iOS Safari portrait 方向不 overflow / 不產生意外 page zoom
- console 沒有未處理 error
- resource / script path 在部署後沒有 404
- Hydra III / IV demo logical scale 增大時，visual node / primitive 數量仍維持在受控範圍，而不是跟著 logical heads 暴增

建議至少測這些 viewport：

- 390 × 844
- 430 × 932
- 一個 desktop viewport 作基本 sanity check

如果 repo tests 可執行，至少跑：

```bash
npm test
```

有錯就修，修完重新測；不要把已知可修 bug 留給我自己處理。

---

# Git / Deploy

完成後：

1. 將最終變更 commit 並 push 到 repository。
2. 檢查 repo 現有 GitHub Pages / deployment 設定。
3. 優先沿用既有 deployment，不要無理由替換整套部署方式。
4. 讓本次 Tree prototype 或整合結果有一個可以直接在瀏覽器打開的公開 URL。
5. Push / deploy 之後，必須再次打開「公開 URL」做一輪最終驗證；不能只驗 localhost。
6. 如果 Pages 已存在但 subpath 無法正確載入，修正相對路徑 / base path / deployment config 後再驗。

不要猜公開網址；請實際確認部署後可打開的 URL。

---

# 最後交件格式

完成後只要清楚回報以下內容：

- **Public preview URL:** 可直接打開操作的網址
- **Commit SHA:** 最終 commit
- **Changed files:** 主要修改檔案
- **What works:** 已完成的 Tree 行為
- **Rendering strategy:** 如何做到 fractal-like 外觀但維持 compressed / bounded render complexity
- **Tests run:** 自動測試與手動 viewport / browser 驗證
- **Known issues:** 如果仍有真的無法在本次解決的問題，列出；沒有就寫 `None`

最重要的是：

> 不要只給程式碼或截圖。我要一個你已經親自打開、debug、確認可以操作的部署網址。
