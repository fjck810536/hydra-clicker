import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
const context = vm.createContext({window:{}});
vm.runInContext(readFileSync(new URL('../02_player_facing/tree_scene_shell/astra_tree/geometry.js', import.meta.url),'utf8'), context);
const {project} = context.window.HydraTreeGeometry;

test('Tree compression preserves exact totals, including uneven and astronomical BigInt counts', () => {
  for(const total of [0n,1n,12n,173n,729n,6561n,59049n,531441n,9n**18n,10n**100n+7n]) {
    const result=project(total);
    assert.equal(result.clusters.reduce((sum,c)=>sum+c.count,0n),total);
    assert.ok(result.clusters.every(c=>c.count>=0n));
    assert.equal(result.clusters.length,27);
    assert.equal(result.branches.length,40);
    assert.equal(result.primitiveCount,176);
    assert.equal(result.branches.length + result.clusters.length*5 + 1,176);
  }
});
test('Tree geometry and allocation are deterministic and independent of logical scale', () => {
  const small=project(729n), large=project(9n**18n);
  assert.deepEqual(small.branches,large.branches);
  assert.deepEqual(small,project(729n));
  assert.equal(new Set(small.clusters.map(c=>c.id)).size,27);
  assert.ok(small.clusters.every(c=>Number.isFinite(c.x)&&Number.isFinite(c.y)));
  for(const c of small.clusters) assert.ok(small.branches.some(b=>b.id===c.id));
});
test('Tree presentation rejects lossy counts',()=>{
  assert.throws(()=>project(729));
  assert.throws(()=>project(-1n));
});
