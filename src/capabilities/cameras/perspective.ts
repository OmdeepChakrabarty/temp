import { PerspectiveCamera } from 'three';
import type { CapabilityFactory, TypedHandle, PrepareContext } from '../../core/types.js';
export type ReadonlyMap<K, V> = globalThis.ReadonlyMap<K, V>;
import type { ResourceScope } from '../../core/scope.js';
export interface PerspectiveParams { kind?: string; fovDegrees?: number; }
export const preparePerspective = async (params: PerspectiveParams, ports: any, ctx: PrepareContext): Promise<any> => {
  const scope = (ctx as PrepareContext).scope as ResourceScope;
  const cam = new PerspectiveCamera(params.fovDegrees ?? 75, 1, 0.1, 1000);
  scope.ownDisposable(cam);
  const handle: TypedHandle = { kind: 'camera', version: 1, value: cam, ownership: 'borrowed', features: [] };
  const instance = { outputs: new Map([['camera', handle]]) as ReadonlyMap<string, TypedHandle>, dispose: async () => { await scope.dispose(); } };
  return instance as any;
};