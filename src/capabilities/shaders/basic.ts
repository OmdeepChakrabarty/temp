import { buildExtension, installExtensions, createShadowVariants, cpuNoise3D, cpuFBM, cpuSchlickFresnel, cpuGradientInterpolate, cpuRefractionSnell, makeProgramKey } from './extension.js';
import type { CapabilityFactory, TypedHandle, PrepareContext } from '../../core/types.js';
import type { ResourceScope } from '../../core/scope.js';

export interface BasicParams { kind?: string; uniformType?: string; name?: string; defaultValue?: number; min?: number; max?: number; }

export const basicFactory: CapabilityFactory<BasicParams> = {
  prepare: async (params: BasicParams, ports, ctx: PrepareContext) => {
    const scope = (ctx as PrepareContext).scope as ResourceScope;
    const spec = { kind: params.kind ?? 'float', name: params.name ?? 'uValue', defaultValue: params.defaultValue ?? 0, min: params.min, max: params.max };
    const extensionSource = buildExtension({ id: params.kind ?? 'basic', version: 1, uniforms: [{ name: params.name ?? 'uValue', type: (params.uniformType as 'float'|'vec2'|'vec3'|'vec4'|'color'|'int') ?? 'float', default: params.defaultValue ?? 0 }], hooks: ['vertex-position', 'surface-color', 'alpha-discard', 'emissive'] });
    const programKey = makeProgramKey('three-r186', extensionSource, {});
    const handle: TypedHandle = { kind: 'material-extension', version: 1, value: { spec, source: extensionSource, key: programKey, shadowVariant: createShadowVariants({ customDepthMaterial: null, customDistanceMaterial: null }) }, ownership: 'borrowed', features: ['uniform', 'extension-spec', 'source-generated', 'program-key-stable'] };
    return { outputs: new Map([['extension', handle]]), dispose: () => scope.dispose() };
  }
};