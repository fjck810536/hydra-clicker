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

## Bounded SVG prototype (implemented)

`geometry.js` owns a deterministic **presentation-only synthetic projection**, not Hydra rules.
The demo selector uses the proposed `9^n` scale and exact BigInt totals. This is not a
snapshot of the live game's topology, and attack/NP/spell feedback in this shell is a
UI demo. No game state or save is read or written.

- Fixed-depth ternary curved scaffold: 40 branch paths.
- 27 terminal cluster proxies, each with a three-prong silhouette path, one circle,
  and one summary label; one root circle.
- 122 SVG graphical elements / 176 individual curve, circle and text primitives.
  The count is identical for III, IV, V, VI and XVIII; zoom never expands topology.
- Exact quotient/remainder partition: cluster totals always sum to logical total.
- Background taps bubble to shell attacks. Inspect, drag and pinch consume input.
- Pan, anchored pinch/wheel zoom (70–400%), keyboard arrows, +/− and Home;
  visible zoom buttons and 全景 recover from any pan position.
- Selection emits `node-selected` with string `logicalHeads` and `synthetic: true`.
- `rendered` emits bounded primitive count; mount returns `destroy()` for cleanup.

No graphics dependencies, animation loop, timers or per-logical-head allocation.
Runtime cost is bounded by the visual budget (BigInt/text cost grows with digit count).

Run `npm test` from the repository root. Open `../responsive-test.html` for reproducible
390×844, 430×932 and 1280×900 browser layout/input regression checks. That harness uses
CSS iframe viewports and synthetic event checks, not iOS hardware emulation. Real
browser taps/drag/wheel should also be exercised on the prototype itself.
