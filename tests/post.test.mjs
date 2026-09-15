import { test } from 'node:test';
import assert from 'node:assert';
import { capabilityFactory } from '../.test-dist/capabilities/post/factory.js';

test('pipeline creates real composer with passes', () => {
  const p = capabilityFactory.createPipeline({ children:[] }, { matrix: new Float32Array(16) }, [], { renderer: { domElement: { width:1,height:1 } } }, undefined);
  assert.ok(p.composer, 'composer exists');
  assert.strictEqual(typeof p.render, 'function');
});

test('pass order without bloom: RenderPass then OutputPass', () => {
  const p = capabilityFactory.createPipeline({ children:[] }, { matrix: new Float32Array(16) }, [], { renderer: { domElement: { width:1,height:1 } } }, undefined);
  const passes = p.composer.passes || [];
  assert.strictEqual(passes[0].name || passes[0].constructor.name, 'RenderPass');
  assert.strictEqual(passes[passes.length-1].name || passes[passes.length-1].constructor.name, 'OutputPass');
});
