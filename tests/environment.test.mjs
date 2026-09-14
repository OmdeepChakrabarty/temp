import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'fs';
import { hdriFactory } from '../.test-dist/capabilities/environment/hdri.js';

test('environment descriptor validity', () => {
  const d = JSON.parse(readFileSync('src/capabilities/environment/hdri.descriptor.json', 'utf8'));
  assert.equal(d.id, 'environment.hdri');
  assert.equal(d.category, 'environment');
});

test('environment factory integrates through interface', async () => {
  assert.equal(typeof hdriFactory.prepare, 'function');
  const mockScope = { ownDisposable: () => {}, child: () => ({ ownDisposable: () => {}, dispose: () => {} }), defer: () => {}, dispose: async () => {} };
  const instance = await hdriFactory.prepare({ kind: 'hdri', sourceId: 'approved-01' }, new Map(), { scope: mockScope, signal: new AbortController().signal, diagnostics: { report: () => {} }, seed: 1, quality: { dprCap: 1 } });
  assert.ok(instance.outputs.has('environment'));
  await instance.dispose();
});