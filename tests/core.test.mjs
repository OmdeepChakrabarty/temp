import assert from 'node:assert/strict';
import test from 'node:test';
import { FixedClock, ResourceScope, SeededRandom, createLease, deriveSeed } from '../.test-dist/core/index.js';

test('resource scopes dispose in reverse order and continue after cleanup failure', async () => {
  const scope = new ResourceScope();
  const calls = [];
  scope.defer(() => { calls.push('first'); });
  scope.defer(() => { calls.push('second'); throw new Error('expected'); });
  scope.defer(() => { calls.push('third'); });
  await assert.rejects(scope.dispose(), (error) => error instanceof AggregateError);
  assert.deepEqual(calls, ['third', 'second', 'first']);
  await assert.rejects(scope.dispose(), (error) => error instanceof AggregateError);
  assert.deepEqual(calls, ['third', 'second', 'first']);
});

test('child scopes and leases are idempotent', async () => {
  const parent = new ResourceScope();
  const child = parent.child();
  let cleanups = 0;
  child.defer(() => { cleanups += 1; });
  await child.dispose();
  await parent.dispose();
  assert.equal(cleanups, 1);
  let releases = 0;
  const lease = createLease('environment', () => { releases += 1; });
  lease.release(); lease.release();
  assert.equal(releases, 1);
});

test('seed streams are stable and isolated by stable node ID', () => {
  const seed = 42;
  const a = new SeededRandom(deriveSeed(seed, 'particles.cloud'));
  const b = new SeededRandom(deriveSeed(seed, 'particles.cloud'));
  const c = new SeededRandom(deriveSeed(seed, 'materials.hero'));
  assert.deepEqual([a.next(), a.next(), a.next()], [b.next(), b.next(), b.next()]);
  assert.notEqual(a.next(), c.next());
});

test('fixed clock clamps wall delta, caps catch-up, and pauses without catch-up', () => {
  const clock = new FixedClock();
  clock.advance(0);
  const advance = clock.advance(1);
  assert.equal(advance.fixedFrames.length, 4);
  assert.ok(advance.droppedSeconds > 0);
  const before = clock.simulationTimeSeconds;
  clock.setPaused(true, 2);
  clock.advance(20);
  assert.equal(clock.simulationTimeSeconds, before);
  clock.setPaused(false, 20);
  assert.equal(clock.advance(20 + 1 / 60).fixedFrames.length, 1);
});
