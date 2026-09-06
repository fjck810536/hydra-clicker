# Hydra Clicker — Platform Contract v0.3

> Block 4 起正式採用的瀏覽器／裝置外殼規則；Playtest 2 後再次補強 iOS Safari zoom 防護。這份文件約束 View / UI，不改變 Math / Systems。

## Primary Target

```text
iOS Safari
Portrait first
Static HTML / GitHub Pages
```

桌面瀏覽器仍應可開啟，但版面與操作優先以 iPhone 直立螢幕判斷。

## Viewport

主遊戲殼使用：

```text
100vw × 100dvh
viewport-fit=cover
safe-area insets
initial-scale=1
minimum-scale=1
maximum-scale=1
user-scalable=no
```

主頁 `html/body` 不作一般網站式上下捲動。

## Gesture Policy

Battle Stage：

```text
single tap   → gameplay input
double tap   → 不觸發頁面 zoom
pan/swipe    → 不捲動整個網頁
pinch/gesture→ battle shell 不交給瀏覽器縮放
```

Canvas 與目前整個 battle shell 都使用 `touch-action: none`。

### Why the shell owns the lock

Playtest 1 先發現 NP button 快速連點可能觸發 Safari smart zoom，所以最初只加強 fixed controls；Playtest 2 又出現無法確定來源的頁面放大，表示 zoom path 不只存在於按鈕／canvas，本體 HUD 空白區或 Safari 的 touchend synthesis 仍可能進入 browser zoom。

因此目前 Playtest build 採較強策略：

```text
battle shell capture phase
├─ touchend default prevented
├─ multi-touch touchmove default prevented
├─ dblclick default prevented
└─ gesturestart / change / end default prevented
```

Gameplay 不依賴 browser-generated touch `click`：

```text
stage input     → pointer event
fixed controls → pointerup command
keyboard        → click(detail === 0)
```

所以攔掉 touchend 的 browser default 不會拿掉目前主要操作。

### Fixed Battle Controls

固定戰鬥控制（NP / Command Spell / TEST tools）仍保留自己的 scoped protection：

```text
[data-fixed-control]
→ touch-action: none
→ pointerup 直接執行 command
→ pointer-generated click default 阻止
→ dblclick / gesture default 阻止
```

鍵盤產生的 `click`（`detail === 0`）仍保留 activation。

## Future scroll panels

目前 battle shell 是完全鎖手勢的 prototype。這不是宣告「遊戲永遠不能有 scroll」。

未來加入升級商店、迦勒底科技、Analyzer、Tree View 等長內容時，應把可捲動 panel 做成明確的 interaction surface，重新收窄 gesture guard，而不是偷偷在 battle shell 內解除 zoom lock。

目標結構仍是：

```text
APP
├─ Battle Stage        fixed / no page scroll / no browser zoom
├─ Fixed HUD Controls  pointer-driven
└─ Drawer / Panel      未來獨立 interaction policy
```

## Orientation

主遊戲不為手機橫屏重新設計一套完整 battle composition。

小尺寸裝置進入 landscape 時顯示旋轉提示：

```text
PORTRAIT MODE
請將裝置轉回直立。
```

桌面寬螢幕不必強制遮蔽；它只是次要開發／debug 環境。

## Render / Simulation Separation

Babylon render loop 與 logical Game Clock 可以各自運行。

```text
requestAnimationFrame / Babylon FPS
              ↓
            VIEW

GameClock fixed-step
              ↓
 Math / Systems / State
```

畫面掉幀不能改變 Hydra 的數學規則。

## Babylon Dependency

Phase 3 原型使用 Babylon.js 官方 CDN 以降低部署摩擦。

正式公開／長期版本應改成可控的 package / self-hosted build，不把第三方學習 CDN 當永久 production dependency。

## Stage Composition

Block 4 建立：

```text
orthographic side-view camera
lights
backdrop
ground
Berserker anchor (left)
Hydra anchor (right)
```

後續 View blocks 已在其上加入 Hydra head pool、Berserker placeholder、NP tint 與 HUD；它們仍不得反過來控制 logical combat。
