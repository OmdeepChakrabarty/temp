import assert from 'node:assert/strict';
import test from 'node:test';
import { CapabilityCatalog, validateDescriptor } from '../.test-dist/registry/index.js';

const descriptor = (id, overrides = {}) => ({
  id, version: '1.0.0', name: id, category: 'materials', description: 'PBR material host', inputSchema: './params.schema.json',
  inputs: {}, outputs: { material: { kind: 'material', version: 1, ownership: 'borrowed' } }, dependencies: [],
  compatibility: { backend: 'webgl2', ibl: 'preserves-host-pbr' }, performance: { costClass: 'low', complexity: 'one material' },
  lifecycle: { owned: [], seek: 'none', resize: 'none', contextRecovery: 'reprepare' }, examples: [], tags: ['pbr', 'hdri'], limitations: [], stability: 'stable', ...overrides,
});

test('metadata catalog queries without executing factories and returns deterministic reasons', () => {
  const catalog = new CapabilityCatalog([descriptor('materials.physical'), descriptor('materials.unlit', { name: 'Unlit', tags: ['artistic'], compatibility: { backend: 'webgl2', ibl: 'none' } })]);
  const query = catalog.query({ text: 'physical', tags: ['pbr'], outputKind: 'material', ibl: 'preserves-host-pbr' });
  assert.equal(query.total, 1);
  assert.equal(query.matches[0].descriptor.id, 'materials.physical');
  assert.deepEqual(query.matches[0].reasons, ['text:physical', 'tag:pbr', 'output:material', 'ibl:preserves-host-pbr']);
  assert.equal(catalog.describe('materials.physical', '1.0.0').name, 'materials.physical');
});

test('descriptor validation rejects unknown fields and unsafe port ownership', () => {
  assert.throws(() => validateDescriptor(descriptor('materials.physical', { unexpected: true })), /not allowed/);
  assert.throws(() => validateDescriptor(descriptor('materials.physical', { outputs: { material: { kind: 'material', version: 1, ownership: 'owned' } } })), /borrowed/);
});

test('dependency closure is ordered and fails for missing dependencies', () => {
  const base = descriptor('shaders.extension');
  const host = descriptor('materials.physical', { dependencies: ['shaders.extension@1.0.0'] });
  const catalog = new CapabilityCatalog([host, base]);
  assert.deepEqual(catalog.dependencyClosure([{ id: 'materials.physical', version: '1.0.0' }]).map((entry) => entry.id), ['shaders.extension', 'materials.physical']);
  assert.throws(() => new CapabilityCatalog([descriptor('materials.physical', { dependencies: ['missing.capability@1.0.0'] })]).dependencyClosure([{ id: 'materials.physical' }]), /Unknown capability dependency/);
});
