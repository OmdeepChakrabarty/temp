import { PerspectiveCamera } from 'three';
import type { CapabilityFactory, TypedHandle } from '../../core/types.js';
export interface PerspectiveParams { kind?: string; fovDegrees?: number; }
export const preparePerspective: CapabilityFactory<PerspectiveParams> = async (params) => {
  const cam = new PerspectiveCamera(params.fovDegrees ?? 75, 1, 0.1, 1000);
  const handle: TypedHandle = { kind: 'camera', version: 1, value: cam, ownership: 'borrowed', features: [] };
  return { outputs: new Map([['camera', handle]]), dispose: async () => { /* camera owned by scene */ } };
};