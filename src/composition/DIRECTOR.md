# Scene composition director

## PURPOSE
Turn validated serializable capability graphs into complete, transactionally replaceable scene sessions.

## RESPONSIBILITIES
Resolve typed ports, plan construction DAGs, prepare nodes with bounded concurrency, validate actual outputs, bind property channels, attach presentation objects/camera/environment, build injected pipelines, coordinate hierarchy and ownership. Implement the small composition.mesh factory here; it assembles borrowed geometry/material into an owned Mesh and exposes transform/visibility channels. Suggested files: plan.ts, prepare.ts, bindings.ts, mesh.ts, session.ts, index.ts.

## NON-RESPONSIBILITIES
No hardcoded capability factory imports except local assembly factories, algorithms from capability families, direct app DOM work, hidden dependency instantiation or arbitrary executable expressions.

## DEPENDENCIES
Core and registry public validation API; Three.js scene/object assembly through core-compatible types. App injects FactoryResolver, services and PipelineBuilder.

## DEPENDENCY DIRECTION
Composition → core/registry. App imports composition and supplies the loader table. Registry/families/core do not import composition.

## PUBLIC API
validateAndPlan(document, catalog, device), prepareScene(plan, services, signal), PreparedSession, compileBindings(), composition.mesh factory. Prepared sessions expose commit hooks, scene/camera/pipeline, reset/seek and idempotent disposal.

## DATA FLOW
Document → normalized validation → topological plan → scoped node preparation → port validation → bindings/hierarchy/presentation → warmup → frame-boundary commit → runtime hooks.

## IMPLEMENTATION ORDER
DAG/type validation → static mesh assembly → transaction scopes → camera/environment/light presentation → bindings → async race handling → post injection → reset/seek orchestration.

## IMPORTANT PSEUDOCODE
```text
prepare(plan):
  pending = session(scope.child(), new generation, abort controller)
  try:
    process ready nodes with concurrency <= 4
    resolve inputs from completed outputs; await injected factory
    verify instance outputs match descriptor; register cleanup immediately
    on first failure: stop launch, abort, settle in-flight work
    validate exclusive/additive property writers and phase ordering
    attach only declared presentation objects; reject multiple parents
    apply one environment and choose one camera
    build pipeline if needed; warm shader variants in scratch render
    return pending only if generation still newest
  catch:
    abort and dispose everything prepared; retain existing active scene
commit(pending):
  at frame boundary, recheck generation
  swap session, activate inputs, dispose previous session
```

Check both construction cycles and parenting cycles. A geometry/material may have multiple consumers; an Object3D has one parent. Shader extensions supplying shadow variants must be wired by mesh assembly to customDepthMaterial/customDistanceMaterial through declared material-handle features. Material sharing cannot silently create shared mutable animated uniforms.

## CONSTRAINTS
Validate before fetch/allocation. JSON contains exact versions and typed references, not code. Bindings target published channels, not arbitrary property paths. General feedback cycles are unsupported; stateful capabilities encapsulate feedback. Asset IDs resolve only through the selected manifest/session assets.

## PERFORMANCE REQUIREMENTS
Compile graphs/bindings once per document; no per-frame graph traversal or type validation. Bound parallel prepare/warmup work. Live parameter changes use mutable channels; topology/structural material changes re-prepare transactionally.

## RESOURCE LIFECYCLE
Session owns node scopes, scene attachment, bindings and pipeline. Node scopes own allocations, while input handles are borrowed. Dispose bindings/subscriptions before producers. Store original normalized document/seed for context recovery; never retain stale GPU handles across generations.

## ERROR HANDLING
MISSING_PORT, PORT_TYPE_MISMATCH, CONSTRUCTION_CYCLE, HIERARCHY_CYCLE, MULTIPLE_PARENTS, MULTIPLE_WRITERS, PREPARE_FAILED and STALE_SESSION include paths/node IDs. Batch failures preserve first cause plus cleanup diagnostics.

## TESTING REQUIREMENTS
Diamond/shared-resource DAG; cycles/missing refs; wrong output from factory; duplicate parent/writer; async fail/abort/latest-wins races; activation only after commit; shadow variant assembly; failed replacement keeps previous frame; seek/context recovery; leak tests.

## INTEGRATION REQUIREMENTS
App injects exact factory loaders and services; registry provides metadata; core schedules/commits; post supplies pipeline; showcases are declarative consumers. End-to-end chrome emergence is the cross-family acceptance fixture.

## COMPLETION CHECKLIST
- [ ] Invalid scenes fail before allocation.
- [ ] Typed outputs/bindings enforced at runtime.
- [ ] Transaction rollback and latest-wins tested.
- [ ] Camera/environment/post ownership unambiguous.
- [ ] Shared resources survive dependent-node disposal correctly.
