const hydra = new window.HydraModel(9);
const heracles = new window.HeraclesModel();

const headCount = document.querySelector('#head-count');
const cutCount = document.querySelector('#cut-count');
const hydraTarget = document.querySelector('#hydra-target');
const statusLine = document.querySelector('#status-line');

function render() {
  headCount.textContent = hydra.heads;
  cutCount.textContent = heracles.cuts;
}

hydraTarget.addEventListener('click', () => {
  const attacked = heracles.attack(hydra);

  if (!attacked) {
    statusLine.textContent = '九頭蛇目前已經沒有頭了。';
    return;
  }

  // TODO: 下一步把真正的「砍一顆、長幾顆」增殖規則放在這裡。
  statusLine.textContent = `斬擊 ${heracles.cuts}：剩下 ${hydra.heads} 顆頭。`;
  render();
});

render();
