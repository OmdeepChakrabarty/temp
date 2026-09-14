import { MeshPhysicalMaterial } from 'three';
import type { CapabilityFactory, TypedHandle } from '../../core/types.js';

export interface PhysicalParams { kind?: string; roughness?: number; metalness?: number; }

export const preparePhysical: CapabilityFactory<PhysicalParams> = async (params) => {
  const mat = new MeshPhysicalMaterial({ roughness: params.roughness ?? 0.5, metalness: params.metalness ?? 0.5, color: 0xffffff });
  const handle: TypedHandle = { kind: 'material', version: 1, value: mat, ownership: 'borrowed', features: [] };
  return { outputs: new Map([['material', handle]]), dispose: async () => { mat.dispose(); } };
};