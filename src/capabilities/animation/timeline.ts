import type { CapabilityFactory, TypedHandle, PrepareContext } from '../../core/types.js';
import type { ResourceScope } from '../../core/scope.js';
import { sampleScalar, mapLoopTime } from './easing.js';
import type { Keyframe } from './easing.js';

export interface TimelineParams {
  kind?: string;
  durationSeconds?: number;
  loop?: boolean;
  pingPong?: boolean;
  keyframes?: { time: number; value: number }[];
}

export interface ClipOutput {
  evaluate: (t: number) => number;
  duration: number;
  loop: boolean;
}

export const timelineFactory: CapabilityFactory<TimelineParams> = {
  prepare: async (params: TimelineParams, ports, ctx: PrepareContext) => {
    const scope = (ctx as PrepareContext).scope as ResourceScope;
    const duration = params.durationSeconds ?? 4;
    const loop = params.loop ?? false;
    const pingPong = params.pingPong ?? false;
    const kfs: Keyframe[] = params.keyframes ?? [{ time: 0, value: 0 }, { time: duration, value: 1 }];
    const kfsNonNull = kfs ?? [{ time: 0, value: 0 }, { time: duration, value: 1 }];
    // DIRECTOR: keyframes strictly increasing
    for (let i = 1; i < (kfs as Keyframe[]).length; i++) if ((kfs as Keyframe[])[i]!.time <= (kfs as Keyframe[])[i - 1]!.time) throw new Error('INVALID_KEYFRAMES');
    const clip: ClipOutput = {
      duration,
      loop,
      evaluate: (t: number) => {
        const mapped = mapLoopTime(t, duration, loop, pingPong);
        return sampleScalar({ keyframes: kfsNonNull }, mapped);
      }
    };
    const handle: TypedHandle = { kind: 'animation-clip', version: 1, value: clip, ownership: 'borrowed', features: ['loop', 'seek', 'easing', 'timestamped'] };
    return { outputs: new Map([['clip', handle]]), dispose: () => scope.dispose() };
  }
};
