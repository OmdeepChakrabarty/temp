import { BoxGeometry, SphereGeometry, PlaneGeometry, TorusGeometry, TorusKnotGeometry } from 'three';
import type { CapabilityFactory, TypedHandle } from '../../core/types.js';
import type { PrepareContext } from '../../core/types.js';
import type { ResourceScope } from '../../core/scope.js';

export interface PrimitiveParams {
  kind: 'box'|'sphere'|'plane'|'torus'|'torusKnot';
  width?: number; height?: number; depth?: number;
  radius?: number; segments?: number; detail?: number;
}

export const preparePrimitive: CapabilityFactory<PrimitiveParams> = async (params, ports, ctx) => {
  const scope: ResourceScope = (ctx as PrepareContext).scope;
  let geometry: BoxGeometry | SphereGeometry | PlaneGeometry | TorusGeometry | TorusKnotGeometry;
  switch (params.kind) {
    case 'box': geometry = new BoxGeometry(params.width ?? 1, params.height ?? 1, params.depth ?? 1); break;
    case 'sphere': geometry = new SphereGeometry(params.radius ?? 1, params.segments ?? 32, params.segments ?? 16); break;
    case 'plane': geometry = new PlaneGeometry(params.width ?? 1, params.height ?? 1); break;
    case 'torus': geometry = new TorusGeometry(params.radius ?? 1, params.segments ?? 32, 16); break;
    case 'torusKnot': geometry = new TorusKnotGeometry(params.radius ?? 1, params.segments ?? 128, 16); break;
    default: throw new Error('Unsupported primitive kind');
  }
  scope.ownDisposable(geometry);
  const handle: TypedHandle = { kind: 'geometry', version: 1, value: geometry, ownership: 'borrowed', features: [] };
  return { outputs: new Map([['geometry', handle]]), dispose: () => scope.dispose() };
};