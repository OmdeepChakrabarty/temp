import test from 'node:test';
import assert from 'node:assert/strict';
import * as composition from '../.test-dist/composition/index.js';

test('composition module exports expected functions', (t) => {
  assert.ok(typeof composition.validateAndPlan === 'function');
  assert.ok(typeof composition.prepareScene === 'function');
  assert.ok(typeof composition.compileBindings === 'function');
  // Check for the mesh factory
  assert.ok(typeof composition.composeMesh === 'function');
});