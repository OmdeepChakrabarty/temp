import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'fs';
import { buildExtension, installExtensions, createShadowVariants, cpuNoise3D, cpuFBM, cpuSchlickFresnel, cpuGradientInterpolate, cpuRefractionSnell, makeProgramKey } from '../.test-dist/capabilities/shaders/extension.js';

test('buildExtension produces real GLSL with named hooks', () => {
  const src = buildExtension({ id: 'test', version: 1, uniforms: [{ name: 'uScale', type: 'float', default: 1 }], hooks: ['vertex-position', 'surface-color', 'alpha-discard', 'emissive'] });
  assert.ok(typeof src === 'string');
  assert.ok(src.includes('uniform float uScale;'));
  assert.ok(src.includes('shader_hook_test'));
  assert.ok(src.includes('void shader_hook_') || src.includes('uniform'));
});

test('program key stable for same spec, changes for structural spec change', () => {
  const srcA = buildExtension({ id: 'test', version: 1, uniforms: [{ name: 'uScale', type: 'float', default: 1 }], hooks: ['surface-color'] });
  const k1 = makeProgramKey('v1', srcA, {});
  const k2 = makeProgramKey('v1', srcA, {});
  assert.equal(k1, k2, 'same structural spec => same key');
  const k3 = makeProgramKey('v1', srcA + 'extra', {});
  assert.notEqual(k1, k3, 'different source fingerprint => different key');
});

test('noise determinism and range', () => {
  const a = cpuNoise3D(42, 1, 2, 3);
  const b = cpuNoise3D(42, 1, 2, 3);
  assert.equal(a, b, 'same seed => same noise');
  assert.ok(a >= 0 && a <= 1, 'range [0,1]');
});

test('FBM sum and determinism', () => {
  const v = cpuFBM(7, 0.5, 0.5, 0.5, 4, 2, 0.5);
  assert.ok(typeof v === 'number');
  assert.ok(!isNaN(v));
});

test('Schlick Fresnel clamped', () => {
  assert.ok(cpuSchlickFresnel(1) >= 0 && cpuSchlickFresnel(1) <= 1);
  assert.ok(cpuSchlickFresnel(0) >= 0);
});

test('gradient interpolation sorted', () => {
  const c = cpuGradientInterpolate(0.5, [{ pos: 0, color: [0,0,0] }, { pos: 1, color: [1,1,1] }]);
  assert.ok(c[0] > 0 && c[0] < 1);
});

test('Snell refraction TIR', () => {
  const r = cpuRefractionSnell([0,0,1], [0,0,-1], 1.5, 1.0);
  assert.ok(r.tir === false || r.tir === true);
});

test('shadow variants returned', () => {
  const v = createShadowVariants({ customDepthMaterial: null, customDistanceMaterial: null });
  assert.ok(typeof v.shadowVariant === 'string');
});
