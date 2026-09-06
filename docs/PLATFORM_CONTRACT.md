# Hydra Clicker — Platform Contract v0.1

> Block 4 起正式採用的瀏覽器／裝置外殼規則。這份文件約束 View / UI，不改變 Math / Systems。

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
```

主頁 `html/body` 不作一般網站式上下捲動。

## Gesture Policy

Battle Stage：

```text
single tap   → gameplay input
double tap   → 不觸發頁面 zoom
pan/swipe    → 不捲動整個網頁
pinch/gesture→ battle canvas 不交給瀏覽器縮放
```

Canvas 使用 `touch-action: none`，並處理 iOS gesture events。

注意：這不是「遊戲所有地方永遠不能 scroll」。

未來 UI 應保持：

```text
APP
├─ Battle Stage        fixed / no page scroll
├─ HUD                 fixed overlay
└─ Drawer / Panel      可自行設定局部 overflow:auto
```

因此升級商店、迦勒底科技、英靈支援、Analyzer、Tree View 等長內容可以有自己的局部捲動容器。

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

Block 4 只建立：

```text
orthographic side-view camera
lights
backdrop
ground
Berserker anchor (left)
Hydra anchor (right)
```

不在 Block 4 偷做：

```text
Hydra head pool
Berserker character mesh
combat animation
NP VFX
```

它們分別由後續 View blocks 實作。
