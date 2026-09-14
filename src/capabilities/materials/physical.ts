import { MeshPhysicalMaterial } from 'three';
import type { CapabilityFactory, TypedHandle, PrepareContext } from '../../core/types.js';
import type { ResourceScope } from '../../core/scope.js';

export interface PhysicalParams { kind?: string; roughness?: number; metalness?: number; }

export const physicalFactory: CapabilityFactory<PhysicalParams> = {
  prepare: async (params: PhysicalParams, ports, ctx: PrepareContext) => {
    const scope = (ctx as PrepareContext).scope as ResourceScope;
    const mat = new MeshPhysicalMaterial({ roughness: params.roughness ?? 0.5, metalness: params.metalness ?? 0.5, color: 0xffffff });
    scope.ownDisposable(mat);
    const handle: TypedHandle = { kind: 'material', version: 1, value: mat, ownership: 'borrowed', features: [] };
    return { outputs: new Map([['material', handle]]), dispose: () => scope.dispose() };
  }
};