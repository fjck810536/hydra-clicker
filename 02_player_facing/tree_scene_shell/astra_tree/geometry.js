/* Presentation-only synthetic topology. Never imports or mutates game state. */
(() => {
  const MAX_DEPTH = 3;
  const CLUSTERS = 27;
  function project(total) {
    if (typeof total !== 'bigint' || total < 0n) throw new TypeError('Expected nonnegative BigInt');
    const branches = [], clusters = [];
    function grow(x, y, angle, length, depth, id) {
      const ex = x + Math.cos(angle) * length;
      const ey = y + Math.sin(angle) * length;
      const bend = Math.sin(id.length * 2.7 + x) * length * .12;
      branches.push({ id, depth, d: `M${x},${y} Q${(x+ex)/2+bend},${(y+ey)/2} ${ex},${ey}` });
      if (depth === MAX_DEPTH) {
        const index = clusters.length;
        const count = total / BigInt(CLUSTERS) + (BigInt(index) < total % BigInt(CLUSTERS) ? 1n : 0n);
        const twigs = [-.65, 0, .65].map(offset => {
          const a = angle + offset;
          const tx = ex + Math.cos(a)*15, ty = ey + Math.sin(a)*15;
          return `M${ex},${ey} Q${ex+Math.cos(angle)*8},${ey+Math.sin(angle)*8} ${tx},${ty}`;
        }).join(' ');
        clusters.push({ id, x: ex, y: ey, count, twigs });
      } else {
        [-1, 0, 1].forEach((side, i) => grow(ex, ey, angle + side * (1.0 * .6**depth), length * .74, depth+1, `${id}.${i+1}`));
      }
    }
    grow(0, 280, -Math.PI/2, 120, 0, 'root');
    // 40 branch curves + 81 silhouette curves + 28 circles + 27 text labels.
    return { total, branches, clusters, primitiveCount: 176 };
  }
  window.HydraTreeGeometry = Object.freeze({ project, MAX_DEPTH, CLUSTERS });
})();
