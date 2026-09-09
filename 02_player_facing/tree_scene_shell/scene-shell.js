(() => {
  const app = document.getElementById('appShell');
  const drawer = document.getElementById('treeDrawer');
  const openButton = document.getElementById('openTree');
  const closeButton = document.getElementById('closeTree');
  const sceneOne = document.getElementById('sceneOne');
  const treeScene = document.getElementById('treeScene');
  const treeHost = document.getElementById('treeHost');
  const sceneOneClicks = document.getElementById('sceneOneClicks');
  const sceneTwoClicks = document.getElementById('sceneTwoClicks');

  let aClicks = 0;
  let bClicks = 0;

  function setTreeOpen(open) {
    app.classList.toggle('tree-open', open);
    drawer.setAttribute('aria-hidden', String(!open));
    openButton.setAttribute('aria-expanded', String(open));
    drawer.inert = !open;
    sceneOne.inert = open;
    openButton.inert = open;
    (open ? closeButton : openButton).focus({preventScroll:true});
    window.dispatchEvent(new CustomEvent('hydra:tree-shell-toggle', { detail: { open } }));
  }

  function incrementSceneOne() {
    aClicks += 1;
    sceneOneClicks.textContent = String(aClicks);
    window.dispatchEvent(new CustomEvent('hydra:scene-click', { detail: { scene: 1, count: aClicks } }));
  }

  function incrementSceneTwo() {
    bClicks += 1;
    sceneTwoClicks.textContent = String(bClicks);
    window.dispatchEvent(new CustomEvent('hydra:scene-click', { detail: { scene: 2, count: bClicks } }));
  }

  openButton.addEventListener('click', (event) => {
    event.stopPropagation();
    setTreeOpen(true);
  });

  closeButton.addEventListener('click', (event) => {
    event.stopPropagation();
    setTreeOpen(false);
  });

  sceneOne.addEventListener('pointerup', event => {if(event.button === 0) incrementSceneOne();});
  treeScene.addEventListener('pointerup', (event) => {
    if (event.target.closest('button, a, input, select, textarea')) return;
    if(event.button === 0) incrementSceneTwo();
  });

  sceneOne.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      incrementSceneOne();
    }
  });

  document.getElementById('bottomBar').addEventListener('pointerup', (event) => {
    event.stopPropagation();
  });

  const feedback = document.getElementById('demoFeedback');
  document.querySelector('.np-card').addEventListener('click', () => {
    feedback.textContent = 'DEMO · 寶具解放！ ナインライブズ';
    window.dispatchEvent(new CustomEvent('hydra:demo-action', {detail:{action:'np'}}));
  });
  document.querySelector('.resource-panel').addEventListener('click', () => {
    feedback.textContent = 'DEMO · 人類惡 792 · 購買與升級尚未接入正式經濟';
  });
  document.querySelectorAll('.command-slots button').forEach(button => button.addEventListener('click', () => {
    feedback.textContent = `DEMO · 令咒 ${button.textContent} 已選取（操作回饋）`;
    window.dispatchEvent(new CustomEvent('hydra:demo-action', {detail:{action:'command',slot:button.textContent}}));
  }));

  const shellApi = {
    setTreeOpen,
    getTreeOpen: () => app.classList.contains('tree-open'),
    emitTreeEvent(name, detail = {}) {
      window.dispatchEvent(new CustomEvent(`hydra:tree:${name}`, { detail }));
    }
  };

  window.HydraTreeShell = shellApi;

  if (typeof window.mountHydraTree === 'function') {
    window.mountHydraTree(treeHost, shellApi);
  } else {
    treeHost.innerHTML = '<div style="padding:24px;color:rgba(255,255,255,.55)">Astra tree module not mounted.</div>';
  }
})();
