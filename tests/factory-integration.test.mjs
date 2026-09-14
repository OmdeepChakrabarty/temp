import test from 'node:test';
import assert from 'node:assert/strict';
import { primitiveFactory } from '../.test-dist/capabilities/geometry/primitive.js';

test('geometry factory integrates through CapabilityFactory.interface (factory.prepare exists)', async () => {
  assert.equal(typeof primitiveFactory.prepare, 'function', 'factory must expose .prepare per interface');
  const instance = await primitiveFactory.prepare({ kind: 'box', width: 1, height: 1, depth: 1 }, new Map(), { scope: { ownDisposable: () => {}, child: () => ({ ownDisposable: () => {}, dispose: () => {} }), defer: () => {}, dispose: async () => {} }, signal: new AbortController().signal, diagnostics: { report: () => {} }, seed: 1, quality: { dprCap: 1 } });
  assert.ok(instance.outputs.has('geometry'));
});