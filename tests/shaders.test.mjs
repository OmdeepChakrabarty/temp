import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'fs';
import { basicFactory } from '../.test-dist/capabilities/shaders/basic.js';

test('shaders descriptor validity', () => {
  const d = JSON.parse(readFileSync('src/capabilities/shaders/basic.descriptor.json', 'utf8'));
  assert.equal(d.id, 'shaders.basic');
  assert.equal(d.outputs.extension.kind, 'material-extension');
});

test('shaders factory integrates through interface', async () => {
  assert.equal(typeof basicFactory.prepare, 'function');
  const mockScope = { ownDisposable: () => {}, child: () => ({ ownDisposable: () => {}, dispose: () => {} }), defer: () => {}, dispose: async () => {} };
  const instance = await basicFactory.prepare({ kind: 'float', uniformType: 'float', name: 'uScale' }, new Map(), { scope: mockScope, signal: new AbortController().signal, diagnostics: { report: () => {} }, seed: 1, quality: { dprCap: 1 } });
  assert.ok(instance.outputs.has('extension'));
  await instance.dispose();
});