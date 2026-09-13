# Animation director

## PURPOSE
Coordinate reusable time-based behavior with one deterministic runtime clock.

## RESPONSIBILITIES
Plan animation.timeline, keyframes, procedural, spring and uniform-track capabilities; easing/interpolation utilities; named clip outputs, looping, synchronized tracks and typed property binding. Spring-like motion uses a damped oscillator, not arbitrary easing mislabeled as physics.

## NON-RESPONSIBILITIES
No RAF, renderer, direct imports of materials/cameras/particles, arbitrary JavaScript expressions in scene JSON, or unrestricted object-path mutation.

## DEPENDENCIES
Core math/clock/property contracts and Three.js quaternion/vector math where useful. No additional animation framework initially.

## DEPENDENCY DIRECTION
Animation → core. Composition binds clip outputs to borrowed PropertyHandles. Producers/consumers are independent families.

## PUBLIC API
Factories emit animation-clip and typed track-output handles. evaluate(time,out), reset(seed), getDuration(), describeChannels(). Parameters define interpolation, phase, units, loop mode, duration and keyframes. Internal binding compiler validates exclusive/additive writers.

## DATA FLOW
Timeline time → track segment lookup → eased/interpolated value → declared phase/property write → subsystem evaluates → shared frame renders.

## IMPLEMENTATION ORDER
Easing/scalar tracks → vector/color/quaternion tracks → timeline/loop synchronization → typed bindings → procedural functions → analytic damped spring/static target, then fixed-step moving-target spring.

## IMPORTANT PSEUDOCODE
```text
sample(track,t):
  map loop time, with explicit clamp/ping-pong boundary rules
  binary-search keyframe interval (cached cursor for forward playback)
  alpha = normalized local time; ease(alpha)
  interpolate scalar/vector linearly, quaternion by shortest-path slerp
  interpolate artist colors in linear working space
write:
  reject multiple exclusive writers to the same channel
  order permitted additive contributions by stable node ID
  write once in the declared simulation or presentation phase
seek stateful spring/system:
  restore compatible checkpoint or reset seed/state
  replay nonnegative fixed ticks; expose progress and cancellation
```

Keyframe times must be strictly increasing; zero-duration clips use an explicit constant-value form. Spring options use frequency/damping ratio with units; implement closed-form under/critical/over-damped solutions for static targets, or stable bounded fixed-step integration for moving targets. Procedural functions come from a reviewed vocabulary (sine, noise, orbit), not eval.

## CONSTRAINTS
One source of time; no wall-clock reads in tracks. Simulation-driving properties evaluate at tick time, presentation tracks after simulation. Seek/loop endpoints are defined and covered by tests. Quaternion interpolation does not use Euler component lerp.

## PERFORMANCE REQUIREMENTS
Precompile track bindings/segments; reuse output storage; no keyframe sorting per frame. Bound stateful seek to architecture limits and checkpoints; no synchronous GPU reads for scrubbing.

## RESOURCE LIFECYCLE
Own clip tables and registrations; release bindings on session teardown. Animation never disposes targets. Reset stateful caches on document/seed/version/quality changes.

## ERROR HANDLING
INVALID_KEYFRAMES, CHANNEL_TYPE_MISMATCH, MULTIPLE_WRITERS, SEEK_LIMIT_EXCEEDED, NONFINITE_ANIMATION. Errors name track and target channel.

## TESTING REQUIREMENTS
Easing endpoints/monotonic families, loop boundaries, quaternion short arc, linear color interpolation, spring stability/damping regimes, seek versus forward playback, simulation/presentation ordering and synchronized particle/material/camera fixture.

## INTEGRATION REQUIREMENTS
Composition resolves target ports, not string paths. Interaction submits commands through the same writer arbitration. Inspector controls play/pause/time and displays replay progress.

## COMPLETION CHECKLIST
- [ ] Shared clock and typed channel writes.
- [ ] Deterministic track/loop/seek tests pass.
- [ ] Spring behavior bounded and documented.
- [ ] Synchronized multi-family example exists.
- [ ] No retained target references after disposal.
