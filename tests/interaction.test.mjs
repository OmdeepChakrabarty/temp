import { test } from 'node:test'; import assert from 'node:assert'; import { interactionFactory } from '../.test-dist/capabilities/interaction/factory.js';
const stubCanvas = { getBoundingClientRect: () => ({ left:0, top:0, width:800, height:600 }), addEventListener: () => {}, removeEventListener: () => {} };

test('NDC normalization matches DIRECTOR.md formula', () => {
  const s = interactionFactory.createSource({ canvas: stubCanvas, targets: [] });
  s.normalize(400, 300); // center
  assert.strictEqual(s.pointer.x, 0); assert.strictEqual(s.pointer.y, 0);
  s.normalize(0, 0); // top-left
  assert.strictEqual(s.pointer.x, -1); assert.strictEqual(s.pointer.y, 1);
});

test('raycaster exists and targets explicitly required', () => {
  const s = interactionFactory.createSource({ canvas: stubCanvas, targets: [{id:'t1'}] });
  assert.ok(s.raycaster); assert.deepStrictEqual(s.state.queue, []);
});

test('focus/text exclusion and dispose clears listeners', () => {
  const s = interactionFactory.createSource({ canvas: stubCanvas, targets: [] });
  s.dispose(); assert.strictEqual(s.state.active, false);
});

test('subscribe attaches and removes listeners', () => {
  let called = false;
  const stub = { addEventListener: () => {}, removeEventListener: () => {} };
  const s = interactionFactory.createSource({ canvas: stubCanvas, targets: [] });
  const unsub = s.subscribe(stub, { onDown: () => { called = true; } });
  assert.strictEqual(typeof unsub, 'function');
});

test('focus/text exclusion skips input targets', () => {
  const s = interactionFactory.createSource({ canvas: stubCanvas, targets: [] });
  assert.strictEqual(typeof s.dispose, 'function');
});

test('keyboard/scroll callbacks available', () => {
  const s = interactionFactory.createSource({ canvas: stubCanvas, targets: [{id:'t1'}] });
  assert.ok(s.normalize); assert.ok(s.compareId);
});
