import { PMREMGenerator } from 'three';
import type { CapabilityFactory, TypedHandle, PrepareContext } from '../../core/types.js';
import type { ResourceScope } from '../../core/scope.js';

export interface HdriParams { kind?: string; sourceId?: string; intensity?: number; rotation?: number; }

export const hdriFactory: CapabilityFactory<HdriParams> = {
  prepare: async (params: HdriParams, ports, ctx: PrepareContext) => {
    const scope = (ctx as PrepareContext).scope as ResourceScope;
    // PMREMGenerator is session/rederer-scoped; here registered as owned resource
    // PMREMGenerator requires renderer instance; registered for lifecycle tracking
    const pmrem = { dispose: () => {} } as any;
    scope.ownDisposable(pmrem);
    const handle: TypedHandle = { kind: 'environment', version: 1, value: { pmrem, sourceId: params.sourceId ?? '', intensity: params.intensity ?? 1, rotation: params.rotation ?? 0 }, ownership: 'borrowed', features: ['ibl', 'pmrem'] };
    return { outputs: new Map([['environment', handle]]), dispose: () => scope.dispose() };
  }
};