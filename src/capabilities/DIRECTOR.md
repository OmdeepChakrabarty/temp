# Capability families director

## PURPOSE
Organize a growing reusable vocabulary by domain without creating a framework or gallery.

## RESPONSIBILITIES
Each family maintains implementations, adjacent descriptor JSON/parameter schemas, public entrypoint and conformance fixtures. Add a capability as files in its family, not a new directory by default. Shared runtime abstractions belong in core only after multiple consumers demonstrate need.

## NON-RESPONSIBILITIES
No application state, registry execution, renderer ownership, standalone animation loops, or showcase-specific hidden constants.

## DEPENDENCIES
Core and the explicit public dependencies in ARCHITECTURE.md. Each family director narrows its allowed imports.

## DEPENDENCY DIRECTION
Factories consume core service interfaces and borrowed handles. Sibling factory imports are prohibited except the documented materials/particles → shaders utility edges. Shader utilities never import their consumers.

## PUBLIC API
Every factory implements prepare(normalizedParams, resolvedInputs, context) returning outputs and declared hooks. Adjacent metadata declares ID/version, ports, requirements, cost, lifetime, seek mode and real examples. Runtime outputs must match descriptor declarations.

## DATA FLOW
Validated params + input handles → scope-owned preparation → immutable output map and explicit mutable property channels → scheduled hooks → scope disposal.

## IMPLEMENTATION ORDER
Core contract fixtures → primitive/physical/environment/static camera slice → remaining families by architecture gates. Do not publish descriptors ahead of implementations.

## IMPORTANT PSEUDOCODE
```text
prepare(params, inputs, ctx):
  child = ctx.scope.child()
  try:
    validate essential runtime assumptions
    allocate and register cleanup immediately
    await any required lease; check signal/generation
    expose only declared outputs and writable channels
    return instance whose dispose closes child
  catch:
    child.dispose(); rethrow structured capability error
```

## CONSTRAINTS
No ad hoc dependency lookup by node name, untyped property paths, global mutable random source, per-instance RAF or hidden DOM subscription. Explicit defaults/units/limits and honest IBL/backend support.

## PERFORMANCE REQUIREMENTS
Declare draw/target/texture estimates and scaling behavior. Frame loops reuse storage. Quality variants cannot silently change required semantics.

## RESOURCE LIFECYCLE
Owned resources register exactly once; borrowed inputs are never disposed. Shared resources use leases. Async preparation and partial failures follow core generation rules.

## ERROR HANDLING
Include capability version, node and parameter path; unsupported features have documented fallback or rejection. Never pretend a degraded visual effect is identical.

## TESTING REQUIREMENTS
Common conformance suite: defaults/invalid params, descriptor/output parity, determinism or declared replay, resize, cancellation, partial failure, create/dispose repetition and browser smoke.

## INTEGRATION REQUIREMENTS
New capabilities need schema/type generation, reviewed app loader entry, registry query fixture, composition example, and cost evidence. All outputs use core kinds/versions.

## COMPLETION CHECKLIST
- [ ] Factory/schema/descriptor agree.
- [ ] Real reusable example exists.
- [ ] Common and family-specific tests pass.
- [ ] Lifetime/seek/limits documented.
- [ ] No scene logic leaks into the library API.
