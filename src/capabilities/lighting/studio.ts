import { DirectionalLight, Object3D } from 'three';
import type { CapabilityFactory, TypedHandle, PrepareContext } from '../../core/types.js';
import type { ResourceScope } from '../../core/scope.js';

export interface StudioParams { kind?: string; intensity?: number; color?: string; shadowMapSize?: number; }

export const studioFactory: CapabilityFactory<StudioParams> = {
  prepare: async (params: StudioParams, ports, ctx: PrepareContext) => {
    const scope = (ctx as PrepareContext).scope as ResourceScope;
    const rig = new Object3D();
    const light = new DirectionalLight(params.color ?? '#ffffff', params.intensity ?? 1);
    light.castShadow = true;
    light.shadow.mapSize.width = params.shadowMapSize ?? 1024;
    light.shadow.mapSize.height = params.shadowMapSize ?? 1024;
    rig.add(light);
    scope.ownDisposable(light);
    scope.ownDisposable(rig);
    const handle: TypedHandle = { kind: 'light-rig', version: 1, value: rig, ownership: 'borrowed', features: ['shadow'] };
    return { outputs: new Map([['rig', handle]]), dispose: () => scope.dispose() };
  }
};