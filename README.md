# hydra-clicker

拔—灑卡，幹死那頭海德拉！

一個瀏覽器上直接玩的增殖九頭蛇 clicker 原型。

## 核心循環（暫定）

1. 點擊／攻擊九頭蛇的頭。
2. 被砍下的頭消失。
3. 九頭蛇依目前規則重新增殖。
4. 玩家持續砍，在頭數失控前壓制它。

## 專案結構

- `index.html` — 遊戲入口
- `css/style.css` — 畫面樣式
- `js/game.js` — 遊戲循環與 UI
- `js/hydra.js` — 九頭蛇狀態、斷頭與增殖規則
- `js/heracles.js` — 攻擊者狀態、攻擊行為
- `assets/images/` — 圖像素材
- `assets/audio/` — 音效／音樂
- `assets/fonts/` — 字型

目前先以原創 prototype 骨架進行，之後再逐步決定角色演出與美術素材。
