(() => {
  window.mountHydraTree = function mountHydraTree(container, shellApi) {
    const lifetime = new AbortController();
    const on = (target, name, callback, options = {}) => target.addEventListener(name, callback, {...options, signal:lifetime.signal});
    container.innerHTML = `
      <section class="tree-controls" aria-label="Tree controls">
        <label>DEMO · 合成結構 <select aria-label="Hydra demo scale">
          <option value="3">HYDRA III · 729</option><option value="4" selected>HYDRA IV · 6,561</option>
          <option value="5">HYDRA V · 59,049</option><option value="6">HYDRA VI · 531,441</option>
          <option value="18">HYDRA XVIII · 9¹⁸</option>
        </select></label>
        <div class="tree-total"><strong></strong><span> logical heads</span></div>
      </section>
      <svg class="hydra-tree" viewBox="-220 -70 440 380" aria-label="Hydra branching structure; drag to pan, pinch to zoom" tabindex="0">
        <g class="tree-world"></g>
      </svg>
      <div class="tree-inspect" role="status" aria-live="polite"></div>
      <div class="tree-navigation" aria-label="Tree navigation">
        <button type="button" data-action="out" aria-label="縮小">−</button>
        <button type="button" data-action="fit">全景</button>
        <button type="button" data-action="in" aria-label="放大">＋</button>
        <output class="tree-zoom">100%</output>
      </div>
      <p class="tree-hint">空白輕點：攻擊 · 拖曳：平移 · 捏合：縮放<br>點亮的末端：檢視群集</p>`;
    const svg = container.querySelector('svg'), world = container.querySelector('.tree-world');
    const inspect = container.querySelector('.tree-inspect');
    const scaleSelect = container.querySelector('select');
    const NS = 'http://www.w3.org/2000/svg';
    let model, selected = null, zoom = 1, panX = 0, panY = 0;
    let moved = false, pinch = null, start = null;
    const pointers = new Map();
    function el(tag, attributes, parent = world) {
      const element = document.createElementNS(NS, tag);
      for (const [key,value] of Object.entries(attributes)) element.setAttribute(key,String(value));
      parent.append(element);
      return element;
    }
    function select(id) {
      selected = id;
      for (const node of world.querySelectorAll('[data-node]')) {
        node.classList.toggle('selected', node.dataset.node === id);
        node.setAttribute('aria-pressed', String(node.dataset.node === id));
      }
      const cluster = model.clusters.find(item => item.id === id);
      inspect.innerHTML = '';
      const title = document.createElement('strong');
      title.textContent = cluster ? `群集 ${id.replace('root.', '')} · ×${cluster.count.toLocaleString()}` : `ROOT · ${model.total.toLocaleString()} heads`;
      const detail = document.createElement('span');
      detail.textContent = cluster ? '此末端代表整棵壓縮子樹；三條細枝只是輪廓。' : '27 個群集 · 合成分佈，非實際戰鬥譜系';
      inspect.append(title, detail);
      shellApi.emitTreeEvent('node-selected', {nodeId:id, logicalHeads: String(cluster ? cluster.count : model.total), synthetic:true});
    }
    function transform() {
      panX = Math.max(-370*zoom, Math.min(370*zoom,panX));
      panY = Math.max(-340*zoom, Math.min(340*zoom,panY));
      world.setAttribute('transform',`translate(${panX} ${panY}) translate(0 130) scale(${zoom}) translate(0 -130)`);
      container.querySelector('.tree-zoom').textContent = `${Math.round(zoom*100)}%`;
    }
    function point(x,y) {
      const p = new DOMPoint(x,y);
      return p.matrixTransform(svg.getScreenCTM().inverse());
    }
    function zoomAt(next, anchor = {x:0,y:130}) {
      next = Math.max(.7, Math.min(4,next));
      const ratio = next/zoom;
      panX = anchor.x - (anchor.x-panX)*ratio;
      panY = anchor.y-130 - (anchor.y-130-panY)*ratio;
      zoom = next;
      transform();
    }
    function reset() { zoom=1; panX=0; panY=0; transform(); }
    function render() {
      model = window.HydraTreeGeometry.project(9n ** BigInt(scaleSelect.value));
      world.replaceChildren();
      container.dataset.logicalHeads = String(model.total);
      container.dataset.primitives = String(model.primitiveCount);
      container.querySelector('.tree-total strong').textContent = model.total.toLocaleString();
      for (const branch of model.branches) el('path',{d:branch.d,class:`tree-branch depth-${branch.depth}`,'stroke-width':5-branch.depth*1.3});
      for (const cluster of model.clusters) {
        const g = el('g',{'data-node':cluster.id, role:'button',tabindex:0,'aria-label':`群集 ${cluster.id.replace('root.','')}，${cluster.count} heads`,'aria-pressed':'false',class:'tree-cluster'});
        el('path',{d:cluster.twigs,class:'cluster-twigs'},g);
        el('circle',{cx:cluster.x,cy:cluster.y,r:8,class:'cluster-dot'},g);
        const label = el('text',{x:cluster.x,y:cluster.y+20,class:'cluster-count','text-anchor':'middle'},g);
        label.textContent = cluster.count < 10000n ? `×${cluster.count}` : '×…';
      }
      el('circle',{cx:0,cy:280,r:8,class:'tree-root','data-node':'root',role:'button',tabindex:0,'aria-label':'Root total','aria-pressed':'false'});
      select(selected && model.clusters.some(c=>c.id===selected) ? selected : 'root');
      shellApi.emitTreeEvent('rendered',{logicalHeads:String(model.total),primitives:model.primitiveCount,clusters:27,synthetic:true});
    }
    on(scaleSelect,'change',render);
    on(container.querySelector('.tree-navigation'),'click',event=>{
      const action=event.target.closest('button')?.dataset.action;
      if(action==='fit') reset();
      if(action==='in') zoomAt(zoom*1.3);
      if(action==='out') zoomAt(zoom/1.3);
    });
    on(svg,'pointerdown',event=>{
      if(event.button!==0) return;
      pointers.set(event.pointerId,{x:event.clientX,y:event.clientY});
      svg.setPointerCapture(event.pointerId);
      if(pointers.size===1) {start={x:event.clientX,y:event.clientY,panX,panY,node:event.target.closest('[data-node]')?.dataset.node}; moved=false;}
      if(pointers.size===2) {
        moved=true;
        const [a,b]=[...pointers.values()];
        pinch={distance:Math.hypot(a.x-b.x,a.y-b.y)};
      }
    });
    on(svg,'pointermove',event=>{
      if(!pointers.has(event.pointerId)) return;
      pointers.set(event.pointerId,{x:event.clientX,y:event.clientY});
      if(pointers.size>=2) {
        const [a,b]=[...pointers.values()];
        const distance=Math.hypot(a.x-b.x,a.y-b.y);
        if(pinch?.distance>0) zoomAt(zoom*distance/pinch.distance,point((a.x+b.x)/2,(a.y+b.y)/2));
        pinch={distance};
      } else if(start && !pinch) {
        if(Math.hypot(event.clientX-start.x,event.clientY-start.y)>7) moved=true;
        if(moved) {
          const a=point(start.x,start.y),b=point(event.clientX,event.clientY);
          panX=start.panX+b.x-a.x; panY=start.panY+b.y-a.y; transform();
        }
      }
    });
    on(svg,'pointerup',event=>{
      if(!pointers.has(event.pointerId)) return;
      // Gestures and inspect consume input; a stationary background tap bubbles to the shell attack input.
      if(moved || start?.node || pointers.size>1) event.stopPropagation();
      if(!moved && pointers.size===1 && start?.node) select(start.node);
      pointers.delete(event.pointerId);
      if(!pointers.size) {start=null;pinch=null;}
    });
    function cancel(event) {pointers.delete(event.pointerId); moved=true; if(!pointers.size){start=null;pinch=null;}}
    on(svg,'pointercancel',cancel);
    on(svg,'lostpointercapture',cancel);
    on(svg,'wheel',event=>{event.preventDefault();zoomAt(zoom*Math.exp(-event.deltaY*.002),point(event.clientX,event.clientY));},{passive:false});
    on(svg,'keydown',event=>{
      const node=event.target.closest('[data-node]');
      if(node && ['Enter',' '].includes(event.key)) {event.preventDefault();select(node.dataset.node);return;}
      const moves={ArrowLeft:[30,0],ArrowRight:[-30,0],ArrowUp:[0,30],ArrowDown:[0,-30]};
      if(moves[event.key]) {event.preventDefault();panX+=moves[event.key][0];panY+=moves[event.key][1];transform();}
      if(event.key==='+' || event.key==='=') zoomAt(zoom*1.3);
      if(event.key==='-') zoomAt(zoom/1.3);
      if(event.key==='Home') reset();
    });
    // Pointer capture cannot survive a scene close/reopen as an active gesture.
    on(window,'hydra:tree-shell-toggle',()=>{pointers.clear();start=null;pinch=null;moved=true;});
    render(); reset();
    shellApi.emitTreeEvent('mounted',{source:'synthetic-bounded-svg'});
    return {destroy(){lifetime.abort();container.replaceChildren();}};
  };
})();
