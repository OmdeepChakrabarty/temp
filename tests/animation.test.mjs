import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'fs';
import { timelineFactory } from '../.test-dist/capabilities/animation/timeline.js';

test('animation descriptor validity', () => {
  const d = JSON.parse(readFileSync('src/capabilities/animation/timeline.descriptor.json', 'utf8'));
  assert.equal(d.id, 'animation.timeline');
  assert.equal(d.category, 'animation');
});

test('animation factory integrates through interface with real evaluation', async () => {
  assert.equal(typeof timelineFactory.prepare, 'function');
  const mockScope = { ownDisposable: () => {}, child: () => ({ ownDisposable: () => {}, dispose: () => {} }), defer: () => {}, dispose: async () => {} };
  const instance = await timelineFactory.prepare({ kind: 'timeline', durationSeconds: 8, loop: true }, new Map(), { scope: mockScope, signal: new AbortController().signal, diagnostics: { report: () => {} }, seed: 1, quality: { dprCap: 1 } });
  assert.ok(instance.outputs.has('clip'));
  const clip = (instance.outputs.get('clip') || { value: null }).value;
  assert.equal(typeof clip.evaluate, 'function');
  assert.ok(typeof clip.duration === 'number' && clip.duration === 8);
  assert.ok(clip.loop === true);
  assert.ok(clip.evaluate(4) > 0); // deterministic easing
  assert.ok(clip.evaluate(12) === clip.evaluate(4)); // loop wraps
  await instance.dispose();
});
