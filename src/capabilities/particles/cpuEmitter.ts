import type { CapabilityFactory, TypedHandle, PrepareContext } from '../../core/types.js';
import type { ResourceScope } from '../../core/scope.js';

export interface CpuEmitterParams { kind?: string; count?: number; lifetimeSeconds?: number; forceType?: string; seed?: number; }

export const cpuEmitterFactory: CapabilityFactory<CpuEmitterParams> = {
  prepare: async (params: CpuEmitterParams, ports, ctx: PrepareContext) => {
    const scope = (ctx as PrepareContext).scope as ResourceScope;
    const count = Math.min(params.count ?? 1000, 20000); // constrained ceiling per profile; higher requires explicit budget
    const seed = params.seed ?? 42;
    // Structure-of-arrays: fixed-size typed arrays, no per-frame allocation
    const position = new Float32Array(count * 3);
    const velocity = new Float32Array(count * 3);
    const age = new Float32Array(count);
    const active = new Uint8Array(count);
    // Seeded deterministic distribution: no Math.random()
    for (let i = 0; i < count; i++) {
      const r = ((seed + i * 1664525) % 2147483647) / 2147483647; // deterministic pseudo-random
      const theta = r * Math.PI * 2;
      const phi = Math.acos(2 * r - 1);
      position[i * 3] = Math.sin(phi) * Math.cos(theta);
      position[i * 3 + 1] = Math.sin(phi) * Math.sin(theta);
      position[i * 3 + 2] = Math.cos(phi);
      velocity[i * 3] = 0;
      velocity[i * 3 + 1] = 0;
      velocity[i * 3 + 2] = 0;
      age[i] = 0;
      active[i] = 1;
    }
    scope.ownDisposable({ dispose: () => {} }); // buffers owned by instance; cleared on scope dispose
    const handle: TypedHandle = { kind: 'particle-system', version: 1, value: { position, velocity, age, active, count, seed }, ownership: 'borrowed', features: ['cpu', 'seeded', 'fixed-capacity'] };
    return { outputs: new Map([['particle-system', handle]]), dispose: () => scope.dispose() };
  }
};
