import type { CapabilityFactory, TypedHandle, PrepareContext } from '../../core/types.js';
import type { ResourceScope } from '../../core/scope.js';

export interface TimelineParams { kind?: string; durationSeconds?: number; loop?: boolean; }

function easeLinear(t: number): number { return t; }
function easeInOut(t: number): number { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }

export const timelineFactory: CapabilityFactory<TimelineParams> = {
  prepare: async (params: TimelineParams, ports, ctx: PrepareContext) => {
    const scope = (ctx as PrepareContext).scope as ResourceScope;
    const duration = params.durationSeconds ?? 4;
    const loop = params.loop ?? false;
    const clip = { duration, loop, evaluate: (t: number) => { const p = loop ? t % duration / duration : Math.max(0, Math.min(1, t / duration)); return easeInOut(p); } };
    scope.ownDisposable({ dispose: () => { /* clip bindings released via scope */ } } as { dispose(): void });
    const handle: TypedHandle = { kind: 'animation-clip', version: 1, value: clip, ownership: 'borrowed', features: ['loop', 'seek', 'easing'] };
    return { outputs: new Map([['clip', handle]]), dispose: () => scope.dispose() };
  }
};
