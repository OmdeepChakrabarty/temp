# Source director

## PURPOSE
Contain the browser platform and preview under one strict TypeScript project.

## RESPONSIBILITIES
Maintain explicit public entrypoints, import boundaries, and separation of services, capabilities, composition and app. Each subsystem should expose index.ts; avoid a root barrel that eagerly imports every factory.

## NON-RESPONSIBILITIES
No binaries, build scripts, reports, provisioning, or showcase-only reusable algorithms.

## DEPENDENCIES
Three.js/addons and registry validation dependencies as specified globally. Toolchain packages belong in the future root manifest.

## DEPENDENCY DIRECTION
Enforce ARCHITECTURE.md's graph. App is the composition root; core is the leaf dependency. Families exchange typed handles, not app state.

## PUBLIC API
Separate future library entrypoints for createHarness, discovery, composition and core types. Keep app bootstrap separate from metadata-only imports.

## DATA FLOW
Document → schema/compatibility validation → factory preparation → typed handles → committed session → frames → inspection.

## IMPLEMENTATION ORDER
Compiler/import rules → core contracts and registry schemas → gate 1 vertical slice → remaining delivery gates. No placeholder classes.

## IMPORTANT PSEUDOCODE
```text
check imports:
  resolve relative paths and aliases, including generated files
  reject forbidden graph edges and private cross-directory imports
  reject runtime browser imports of Node-only tooling/tests
  assert metadata entrypoint reaches no executable factory/renderer
```

## CONSTRAINTS
ES modules, named exports, strict typing, explicit units and ownership. No top-level GPU allocations or hidden mutable globals. Generated artifacts have one canonical source.

## PERFORMANCE REQUIREMENTS
Metadata queries remain renderer-free; explicit static lazy import loaders split factories. Do not eagerly initialize the catalog's implementations.

## RESOURCE LIFECYCLE
Runtime state belongs to harness/session scopes, not module singletons. App HMR tears down the previous harness.

## ERROR HANDLING
Preserve structured error context across boundaries; do not swallow errors as console warnings.

## TESTING REQUIREMENTS
Import graph/entrypoint tests, Node metadata import smoke, browser production build, no initialization side effects.

## INTEGRATION REQUIREMENTS
Public handle changes require producer/consumer tests. New major directories require directors and README tree updates.

## COMPLETION CHECKLIST
- [ ] Entrypoints and boundaries enforced.
- [ ] Strict checks/build pass.
- [ ] No unfinished capability is advertised.
- [ ] Local subsystem contracts pass.
