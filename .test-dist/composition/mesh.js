import { HarnessError } from '../core/errors.js';
export const composeMesh = (params, inputs) => {
    const { geometry, material } = inputs;
    if (geometry.kind !== 'geometry') {
        throw new HarnessError('INVALID_DESCRIPTOR', `Expected geometry handle, got '${geometry.kind}'.`, 'Provide a geometry output reference.');
    }
    if (material.kind !== 'material') {
        throw new HarnessError('INVALID_DESCRIPTOR', `Expected material handle, got '${material.kind}'.`, 'Provide a material output reference.');
    }
    const sceneObject = {
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
    const outputs = new Map();
    outputs.set('object3d', {
        kind: 'object3d',
        version: 1,
        value: sceneObject,
        ownership: 'borrowed',
        features: [],
    });
    return { sceneObject: sceneObject, outputs };
};
