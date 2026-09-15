import type { CapabilityFactory, TypedHandle, PrepareContext } from '../../core/types.js';
import type { ResourceScope } from '../../core/scope.js';

export interface CpuEmitterParams { kind?: string; count?: number; lifetimeSeconds?: number; forceType?: string; seed?: number; }

function seededRandom(seed: number, idx: number): number {
  let s = (seed + idx * 1664525) | 0;
  s = (s ^ (s >> 16)) * 0x85ebca6b | 0;
  s = (s ^ (s >> 13)) * 0xc2b2ae35 | 0;
  s = s ^ (s >> 16);
  return ((s >>> 0) % 2147483647) / 2147483647;
}

export const cpuEmitterFactory: CapabilityFactory<CpuEmitterParams> = {
  prepare: async (params: CpuEmitterParams, ports, ctx: PrepareContext) => {
    const scope = (ctx as PrepareContext).scope as ResourceScope;
    const count = Math.min(params.count ?? 1000, 20000);
    const seed = params.seed ?? 42;
    const lifetime = params.lifetimeSeconds ?? 3;
    const drag = 0.5; // default drag coefficient for exp(-drag*dt)
    // Structure-of-arrays: fixed-size typed arrays, no per-frame allocation
    const pos = new Float32Array(count * 3);
    const vel = new Float32Array(count * 3);
    const age = new Float32Array(count);
    const active = new Uint8Array(count);
    const freeIndex = new Uint32Array(count); // ring buffer of free indices
    let freeHead = 0;
    let emissionFraction = 0;
    const emitRatePerSecond = count / Math.max(0.1, lifetime); // approximate

    // Initial deterministic spawn (point/sphere shapes per DIRECTOR)
    for (let i = 0; i < Math.min(count, 100); i++) {
      const r = seededRandom(seed, i);
      const theta = r * Math.PI * 2;
      const phi = Math.acos(2 * r - 1);
      pos[i * 3] = Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = Math.cos(phi);
      active[i] = 1;
    }
    for (let i = Math.min(count, 100); i < count; i++) active[i] = 0;
    for (let i = 0; i < count; i++) freeIndex[i] = i;
    freeHead = count;

    // Tick/update mechanism per DIRECTOR pseudocode
    let simTime = 0; // deterministic simulated time, not wall-clock
    const tick = (dt: number) => {
      simTime += dt; // accumulate simulated time for seed derivation
      emissionFraction += dt * emitRatePerSecond;
      // Spawn into free-index ring up to capacity
      while (emissionFraction >= 1 && freeHead > 0) {
        emissionFraction -= 1;
      const idx = (freeHead > 0) ? (freeIndex[freeHead - 1] as number) : 0;
      if (freeHead <= 0 || idx < 0 || idx >= count) break;
        if (idx >= count || idx < 0) break;
        const r0 = seededRandom(seed + idx, idx); // pure seed+index, no wall time
        active[idx] = 1;
        age[idx] = 0;
        pos[idx * 3] = (r0 - 0.5) * 2 * 0.5;
        pos[idx * 3 + 1] = (r0 - 0.5) * 2 * 0.5;
        pos[idx * 3 + 2] = (r0 - 0.5) * 2 * 0.5;
        vel[idx * 3] = 0;
        vel[idx * 3 + 1] = 0;
        vel[idx * 3 + 2] = 0;
        freeHead--;
      }
      // Per-active particle update (force + drag + position + age)
      for (let i = 0; i < count; i++) if (active[i]) {
        // Bounded attraction/repulsion near zero (constraint)
      const dx = (pos[i * 3] as number) ?? 0;
      const dy = (pos[i * 3 + 1] as number) ?? 0;
      const dz = (pos[i * 3 + 2] as number) ?? 0;
        const distSq = dx * dx + dy * dy + dz * dz;
        const forceType = params.forceType ?? "attraction";
        const isRepulsion = forceType === "repulsion";
        const safeDist = Math.max(distSq, 1e-6); // cap near-zero
        const forceMag = 0.1 / Math.sqrt(safeDist) * (isRepulsion ? -1 : 1);
        const ax = (forceMag * dx) / Math.sqrt(safeDist);
        const ay = (forceMag * dy) / Math.sqrt(safeDist);
        const az = (forceMag * dz) / Math.sqrt(safeDist);
        // Turbulence/noise sample (deterministic)
        const noise = Math.sin((seed + i) * 0.1 + simTime) * 0.05; // deterministic turbulence from simulated time
        // Integration
        const v0 = vel[i * 3] as number; const v1 = vel[i * 3 + 1] as number; const v2 = vel[i * 3 + 2] as number;
        vel[i * 3] = v0 + (ax + noise) * dt;
        vel[i * 3 + 1] = v1 + (ay + noise) * dt;
        vel[i * 3 + 2] = v2 + (az + noise) * dt;
        vel[i * 3] = (vel[i * 3] as number) * Math.exp(-drag * dt);
        vel[i * 3 + 1] = (vel[i * 3 + 1] ?? 0) * Math.exp(-drag * dt);
        vel[i * 3 + 2] = (vel[i * 3 + 2] ?? 0) * Math.exp(-drag * dt);
        const p0 = pos[i * 3] as number; const p1 = pos[i * 3 + 1] as number; const p2 = pos[i * 3 + 2] as number;
        pos[i * 3] = p0 + (vel[i * 3] as number) * dt;
        pos[i * 3 + 1] = p1 + (vel[i * 3 + 1] as number) * dt;
        pos[i * 3 + 2] = p2 + (vel[i * 3 + 2] as number) * dt;
        const a0 = age[i] as number;
        age[i] = a0 + dt;
        // Recycle expired
        if ((age[i] as number) >= lifetime) {
          active[i] = 0;
          freeIndex[freeHead++] = i;
        }
      }
    };

    const system = { seed, position: pos, velocity: vel, age, active, count, tick, reset: () => { emissionFraction = 0; freeHead = count; for (let i = 0; i < count; i++) active[i] = 0; }, getProgress: () => emissionFraction / (count / Math.max(0.1, lifetime)) };
    scope.ownDisposable({ dispose: () => { /* buffers released with scope */ } });
    const handle: TypedHandle = { kind: 'particle-system', version: 1, value: system, ownership: 'borrowed', features: ['cpu', 'seeded', 'fixed-capacity', 'tick', 'force', 'recycle'] };
    return { outputs: new Map([['particle-system', handle]]), dispose: () => scope.dispose() };
  }
};
