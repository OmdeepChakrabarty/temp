import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'fs';
import { preparePerspective } from '../.test-dist/capabilities/cameras/perspective.js';

test('descriptor validity', () => {
  const d = JSON.parse(readFileSync('src/capabilities/cameras/perspective.descriptor.json', 'utf8'));
  assert.equal(d.id, 'cameras.perspective');
});

test('preparePerspective creates camera handle', async () => {
  const mockScope = { ownDisposable: () => {}, child: () => ({ ownDisposable: () => {}, dispose: () => {} }), defer: () => {}, dispose: async () => {} };
  const instance = await preparePerspective({ kind: 'perspective', fovDegrees: 60 }, new Map(), { scope: mockScope, signal: new AbortController().signal, diagnostics: { report: () => {} }, seed: 1, quality: { dprCap: 1 } });
  assert.ok(instance.outputs.has('camera'));
  await instance.dispose();
});