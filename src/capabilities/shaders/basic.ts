import type { CapabilityFactory, TypedHandle, PrepareContext } from '../../core/types.js';
import type { ResourceScope } from '../../core/scope.js';

export interface BasicParams { kind?: string; uniformType?: string; name?: string; defaultValue?: number; min?: number; max?: number; }

export const basicFactory: CapabilityFactory<BasicParams> = {
  prepare: async (params: BasicParams, ports, ctx: PrepareContext) => {
    const scope = (ctx as PrepareContext).scope as ResourceScope;
    const spec = { kind: params.kind ?? 'float', name: params.name ?? 'uValue', defaultValue: params.defaultValue ?? 0, min: params.min, max: params.max };
    const handle: TypedHandle = { kind: 'material-extension', version: 1, value: spec, ownership: 'borrowed', features: ['uniform', 'extension-spec'] };
    return { outputs: new Map([['extension', handle]]), dispose: () => scope.dispose() };
  }
};