# Astra Tree Module Slot

這個資料夾是給 Astra 直接生成 / 重寫 Tree View 本體用的。

## 不要修改的範圍

Tree Scene 的滑入 / 收起、Scene 1 覆蓋關係、底部固定欄位，都由上一層 shell 處理：

- `../index.html`
- `../scene-shell.css`
- `../scene-shell.js`

Astra 不需要重做這些。

## Astra 主要修改檔案

> `tree.js`

請保留這個全域入口：

```js
window.mountHydraTree = function mountHydraTree(container, shellApi) {
  // 在 container 裡建立 Tree View。
};
```

### `container`

就是 Scene 2 中完整可用的 Tree 顯示區。它已經：

- 完整覆蓋主戰鬥區；
- 永遠停在底部固定操作列上方；
- 不需要自己處理 drawer animation；
- 可以自行建立 SVG / Canvas / DOM。

### `shellApi`

目前提供：

```js
shellApi.setTreeOpen(true | false)
shellApi.getTreeOpen()
shellApi.emitTreeEvent(name, detail)
```

Tree 本體如果要通知外層，例如 node 被選到，可以：

```js
shellApi.emitTreeEvent('node-selected', {
  nodeId: 'example-node'
});
```

## Scene 2 行為要求

- Scene 2 打開時完整覆蓋 Scene 1。
- Scene 2 本身仍然是一個主要 click 區域。
- Tree 互動不能遮掉下方寶具 / 人類惡 / 令咒列。
- 左側 TREE 箭頭由 shell 負責，Astra 不需製作。
- 關閉時整個 Scene 2 向右滑出，Scene 1 重新露出。

## 現階段 Tree 本體可以先是假資料

第一輪只需要把視覺與互動放進這個 mount point。之後再接真 Hydra logical-head state。
