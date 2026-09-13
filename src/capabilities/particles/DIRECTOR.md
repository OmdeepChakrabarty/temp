# Particle systems director

## PURPOSE
Compose large animated point/sprite/mesh populations without bespoke showcase simulation code.

## RESPONSIBILITIES
Plan particles.cpuEmitter, instancedField, surfaceMorph, trails, explosion and later gpuField. Reusable forces include attraction/repulsion, drag, turbulence/noise fields; emitters include point/sphere/surface. Support lifetime/color/size curves, seeded distributions and bounded quality variants.

## NON-RESPONSIBILITIES
No global clock, geometry factory imports, per-particle Object3Ds, collision engine, automatic PBR sprites or unqualified million-particle performance claims.

## DEPENDENCIES
Core, public shader utilities, Three.js Points/InstancedMesh/buffers/targets. Surface samplers/geometry/materials are borrowed handles; assets are injected services.

## DEPENDENCY DIRECTION
Particles → core/shaders. Animation drives declared channels; geometry supplies sampler handles. Never import scene implementations.

## PUBLIC API
Factories return particle-system/object handles, emissionRate/attraction/progress/opacity channels and reset/seek metadata. Parameters declare CPU, analytic-instanced or stateful-GPU execution explicitly; fallback equivalence and reset policy are part of metadata.

## DATA FLOW
Seed/emitter/force configuration + optional sampled target → pooled arrays or GPU state → fixed simulation or analytic evaluation → instanced/point rendering → cost/active-count metrics.

## IMPLEMENTATION ORDER
Seeded CPU emitter and forces → analytic instanced field → surface morph/explosion → bounded trails → stateful GPU ping-pong only after extension and benchmark qualification.

## IMPORTANT PSEUDOCODE
```text
CPU fixed tick:
  accrue emission fraction; spawn into free-index ring up to capacity
  for active index:
    acceleration = bounded attraction/repulsion + sampled turbulence
    velocity += acceleration * dt
    velocity *= exp(-drag * dt)
    position += velocity * dt; age += dt
    recycle expired indices; write dirty ranges without allocation
morph:
  precompute stable seeded source/target pairs once
  position = lerp(source, target, easedProgress) + bounded noise envelope
GPU tick:
  read old position/velocity textures; write distinct new targets
  finish all state outputs then swap read/write roles
  never sample from the target currently being written
```

Surface targets use area-weighted sampling, then deterministic spatial sorting (Morton order) on source/target sets to reduce tangled travel; it is an approximation, not optimal transport. Trails use fixed-capacity per-particle circular histories or explicitly labeled screen-space history. GPU fallback uses two passes if required rather than assuming MRT/float renderability.

## CONSTRAINTS
Cap force near zero distance; bound displacement and update conservative culling bounds. Distinguish analytic seek from reset/replay stateful seek. Alpha sprites have overdraw/sorting limitations; mesh particles may use PBR, point shaders do not become PBR automatically.

## PERFORMANCE REQUIREMENTS
Follow profile ceilings in ARCHITECTURE.md; benchmark draw calls and fill rate, not count alone. Structure-of-arrays typed storage, no allocation in ticks, no per-frame readback. GPU state bytes = particle texels × channels × bytes × number of states × ping-pong count, plus render resources. Reject unsupported float render targets or choose a declared fallback.

## RESOURCE LIFECYCLE
Own buffers, simulation targets and internal rendering materials; release borrowed resources/leases properly. On reset/seek resize or camera cuts clear histories. Dispose both ping-pong sides and all trail storage. Capacity changes rebuild transactionally.

## ERROR HANDLING
PARTICLE_CAPACITY_EXCEEDED, INVALID_FORCE, GPU_SIMULATION_UNSUPPORTED, INVALID_MORPH_TARGET. Report actual fallback/count and semantic differences. Never silently truncate an artistic requirement.

## TESTING REQUIREMENTS
Seed repeatability, finite integration/zero distance, emission fraction, lifetime reuse, morph endpoints/distribution, bounded trails, CPU replay seek, GPU read/write separation and fallback, constrained rendering, repeated capacity/scene changes and disposal.

## INTEGRATION REQUIREMENTS
Timeline synchronizes morph/solid dissolve via shared time; cameras/post invalidate history on cuts; geometry provides stable sampler semantics; inspector shows effective counts and execution mode.

## COMPLETION CHECKLIST
- [ ] CPU and analytic modes work before GPU mode.
- [ ] Forces/morph/trails reusable and bounded.
- [ ] Determinism/seek behavior declared/tested.
- [ ] Draw/byte/fill budgets measured on qualified devices.
- [ ] No leaked buffers or history targets.
