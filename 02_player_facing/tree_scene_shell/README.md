# Tree Scene Shell — Player-Facing Prototype

這是一個獨立的玩家端介面原型，只用來確認 **Scene 1 / Scene 2 / 底部固定列** 的空間關係。

## 核心版面

### A. Scene 1 — 主戰鬥區

- 玩家原本的主要 click 區。
- Tree 關閉時完整可見。

### B. Scene 2 — Tree Drawer

- 從右側滑入。
- **完整覆蓋 A 區，而不是把 A 區縮窄。**
- 開啟後，玩家主要 click 行為轉移到 Scene 2。
- Scene 2 自己可以承載 Tree 的 click / pan / inspect 等互動。
- Scene 2 不得侵入底部固定操作列。

### C. 底部固定列

永遠固定在最上層，不受 Scene 1 / Scene 2 切換影響：

- 寶具解放卡；
- 人類惡 / 購買資訊；
- 令咒欄。

## 開啟 / 收起

### Tree 關閉

右側中央有小型：

> `TREE ◀`

點擊後 Scene 2 從右側滑入，覆蓋 Scene 1。

### Tree 開啟

收起控制移到 Scene 2 左側中央：

> `▶ TREE`

點擊後 Scene 2 向右滑出，Scene 1 重新露出。

## Astra 插槽

Tree 本體預留在：

> `astra_tree/`

Astra 原則上只需要重寫：

> `astra_tree/tree.js`

並保留：

```js
window.mountHydraTree = function mountHydraTree(container, shellApi) {
  // Tree View
};
```

這樣每次 Astra 更新 Tree 本體後，都可以直接放回同一個 shell 裡看，不需要重做場景切換或底部操作欄。

## 檔案

- `index.html` — Scene 1 / Scene 2 / bottom bar 結構
- `scene-shell.css` — 覆蓋與滑動版面
- `scene-shell.js` — Tree 開關、兩個 Scene 的 demo click 行為、Astra mount API
- `astra_tree/tree.js` — Astra 可直接替換的 Tree View
- `astra_tree/README.md` — Astra 模組契約
