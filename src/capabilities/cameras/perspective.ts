import { PerspectiveCamera } from 'three';
import type { CapabilityFactory, TypedHandle, PrepareContext } from '../../core/types.js';
import type { ResourceScope } from '../../core/scope.js';
export interface PerspectiveParams { kind?: string; fovDegrees?: number; }
export const perspectiveFactory: CapabilityFactory<PerspectiveParams> = {
  prepare: async (params: PerspectiveParams, ports, ctx: PrepareContext) => {
    const scope = (ctx as PrepareContext).scope as ResourceScope;
    const cam = new PerspectiveCamera(params.fovDegrees ?? 75, 1, 0.1, 1000);
    scope.ownDisposable(cam);
    const handle: TypedHandle = { kind: 'camera', version: 1, value: cam, ownership: 'borrowed', features: [] };
    return { outputs: new Map([['camera', handle]]), dispose: () => scope.dispose() };
  }
};