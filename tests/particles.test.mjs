import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'fs';
import { cpuEmitterFactory } from '../.test-dist/capabilities/particles/cpuEmitter.js';

test('particles descriptor validity', () => {
  const d = JSON.parse(readFileSync('src/capabilities/particles/cpuEmitter.descriptor.json', 'utf8'));
  assert.equal(d.id, 'particles.cpuEmitter');
  assert.equal(d.category, 'particles');
});

test('particles factory integrates through interface with real buffers', async () => {
  assert.equal(typeof cpuEmitterFactory.prepare, 'function');
  const mockScope = { ownDisposable: () => {}, child: () => ({ ownDisposable: () => {}, dispose: () => {} }), defer: () => {}, dispose: async () => {} };
  const instance = await cpuEmitterFactory.prepare({ kind: 'cpuEmitter', count: 500, seed: 7 }, new Map(), { scope: mockScope, signal: new AbortController().signal, diagnostics: { report: () => {} }, seed: 7, quality: { dprCap: 1 } });
  assert.ok(instance.outputs.has('particle-system'));
  const system = (instance.outputs.get('particle-system') || { value: null }).value;
  assert.ok(system.count === 500);
  assert.ok(system.position instanceof Float32Array);
  assert.ok(system.seed === 7);
  await instance.dispose();
});
