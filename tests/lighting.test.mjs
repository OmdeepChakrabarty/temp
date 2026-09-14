import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'fs';
import { studioFactory } from '../.test-dist/capabilities/lighting/studio.js';

test('lighting descriptor validity', () => {
  const d = JSON.parse(readFileSync('src/capabilities/lighting/studio.descriptor.json', 'utf8'));
  assert.equal(d.id, 'lighting.studio');
  assert.equal(d.category, 'lighting');
});

test('lighting factory integrates through interface', async () => {
  assert.equal(typeof studioFactory.prepare, 'function');
  const scope = { ownDisposable: () => {}, child: () => ({ ownDisposable: () => {}, dispose: () => {} }), defer: () => {}, dispose: async () => {} };
  const instance = await studioFactory.prepare({ kind: 'studio', intensity: 1.2, shadowMapSize: 1024 }, new Map(), { scope, signal: new AbortController().signal, diagnostics: { report: () => {} }, seed: 1, quality: { dprCap: 1 } });
  assert.ok(instance.outputs.has('rig'));
  await instance.dispose();
});