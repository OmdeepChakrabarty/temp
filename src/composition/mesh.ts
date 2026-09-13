import type { TypedHandle } from '../core/types.js';
import { HarnessError } from '../core/errors.js';

export interface MeshAssemblyParams {
  readonly geometry: string;
  readonly material: string;
  readonly transform?: {
    readonly position?: readonly [number, number, number];
    readonly rotation?: readonly [number, number, number, number];
    readonly scale?: readonly [number, number, number];
  };
  readonly visible?: boolean;
}

export interface MeshAssemblyInputs {
  readonly geometry: TypedHandle;
  readonly material: TypedHandle;
}

export const composeMesh = (
  params: MeshAssemblyParams,
  inputs: MeshAssemblyInputs,
): { sceneObject: unknown; outputs: Map<string, TypedHandle> } => {
  const { geometry, material } = inputs;

  if (geometry.kind !== 'geometry') {
    throw new HarnessError('INVALID_DESCRIPTOR', `Expected geometry handle, got '${geometry.kind}'.`, 'Provide a geometry output reference.');
  }

  if (material.kind !== 'material') {
    throw new HarnessError('INVALID_DESCRIPTOR', `Expected material handle, got '${material.kind}'.`, 'Provide a material output reference.');
  }

  const sceneObject: Record<string, unknown> = {
    type: 'Mesh',
    geometry: geometry.value,
    material: material.value,
    visible: params.visible ?? true,
  };

  if (params.transform) {
    if (params.transform.position) {
      sceneObject.position = params.transform.position;
    }
    if (params.transform.rotation) {
      sceneObject.quaternion = params.transform.rotation;
    }
    if (params.transform.scale) {
      sceneObject.scale = params.transform.scale;
    }
  }

  const outputs = new Map<string, TypedHandle>();
  outputs.set('object3d', {
    kind: 'object3d',
    version: 1,
    value: sceneObject,
    ownership: 'borrowed',
    features: [],
  } as TypedHandle);

  return { sceneObject: sceneObject as unknown, outputs };
};
