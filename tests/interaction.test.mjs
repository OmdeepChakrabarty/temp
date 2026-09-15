import test from 'node:test';
import assert from 'node:assert/strict';
import { interactionFactory } from '../.test-dist/capabilities/interaction/factory.js';

function stubEl(id) {
  const listeners = {};
  return {
    id,
    addEventListener(type, fn) { (listeners[type] ||= []).push(fn); },
    removeEventListener(type, fn) { if (listeners[type]) listeners[type] = listeners[type].filter(f => f !== fn); },
    getBoundingClientRect() { return { x: 0, y: 0, width: 10, height: 10, top: 0, left: 0, bottom: 10, right: 10, toJSON: () => {} }; },
    setPointerCapture() {},
    releasePointerCapture() {},
    _listeners: listeners
  };
}

test('factory export and stub cleanup', async () => {
  assert.equal(typeof interactionFactory.prepare, 'function');
  const cap = await interactionFactory.prepare();
  const el = stubEl('a');
  const unsub = cap.subscribe(el, { hover: () => {}, click: () => {} });
  assert.ok(typeof unsub === 'function');
  unsub();
  assert.strictEqual(el._listeners.pointerdown?.length || 0, 0);
  await cap.dispose();
});
