(() => {
  window.mountHydraTree = function mountHydraTree(container, shellApi) {
    container.innerHTML = `
      <div class="astra-tree-placeholder" style="position:absolute;inset:0;display:grid;place-items:center;padding:24px;text-align:center;">
        <div style="max-width:520px;pointer-events:none;">
          <div style="font-size:11px;letter-spacing:.18em;color:rgba(255,255,255,.5);margin-bottom:10px;">ASTRA TREE MODULE SLOT</div>
          <div style="font-size:clamp(26px,7vw,54px);font-weight:800;letter-spacing:.06em;margin-bottom:10px;">TREE GOES HERE</div>
          <div style="color:rgba(255,255,255,.56);line-height:1.55;">這一層只是一個可替換的 placeholder。Astra 之後直接重寫 <code>astra_tree/tree.js</code>，Scene 2 的滑入／覆蓋／底欄固定結構不需要重做。</div>
        </div>
      </div>`;

    shellApi.emitTreeEvent('mounted', { source: 'placeholder' });
  };
})();
