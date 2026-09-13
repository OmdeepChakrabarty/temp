# Core runtime director

## PURPOSE
Supply the minimal stable runtime and contracts for every capability.

## RESPONSIBILITIES
Implement types/units, seeded RNG, scopes/leases, diagnostics, fixed clock, budgets/quality, renderer ownership, viewport/context generation, service interfaces and RenderPipeline. Suggested files: types.ts, scope.ts, clock.ts, random.ts, diagnostics.ts, quality.ts, renderer.ts, harness.ts, index.ts.

## NON-RESPONSIBILITIES
No fetching, PMREM, registry lookup, scene JSON interpretation, concrete effects, particle algorithms or inspector UI.

## DEPENDENCIES
Three.js and browser primitives; pure clock/math/scope modules must run without DOM.

## DEPENDENCY DIRECTION
Core imports no other src subsystem. Other modules import public core types/services.

## PUBLIC API
createHarness(canvas, options); ResourceScope; Lease<T>; CapabilityFactory/Instance; TypedHandle; PropertyHandle; AssetService interface; RendererAccess; EnvironmentBinding; RenderPipeline; FrameContext; DiagnosticsSink; DeviceProfile. Harness accepts prepared sessions, not raw scene documents.

## DATA FLOW
Wall time → fixed simulation ticks → presentation/camera/matrices → one pipeline render → sampled metrics. Commit prepared sessions at generation-checked frame boundaries.

## IMPLEMENTATION ORDER
Types/errors → scope/lease/random/clock tests → renderer/device/viewport → session slots/frame phases → quality/context recovery.

## IMPORTANT PSEUDOCODE
```text
own(resource, disposer):
  if scope.closed: disposer(resource); throw ScopeClosed
  register idempotent cleanup immediately; return resource
disposeScope():
  if closed: return
  mark closed first; drain cleanup in reverse order
  catch every exception; report aggregate after all callbacks
frame(now):
  if hidden/contextLost: reset wall baseline; return
  accumulator += min(wallDelta, 0.1)
  run at most 4 fixed 1/60 ticks; record/drop excess whole ticks
  interpolate; evaluate presentation; resolve camera; update matrices
  render exactly one active pipeline; sample metrics
```

## CONSTRAINTS
One RAF/renderer per harness. Separate tick, wall and presentation time. Enforce writer phases. Restrict offscreen renderer operations to state-restoring scopes. No disposed generation can accept async results.

## PERFORMANCE REQUIREMENTS
Reuse frame/vector objects, bound telemetry buffers and catch-up, resize only on dimension changes. Follow architecture quality windows/budgets; estimate GPU bytes separately from renderer.info.

## RESOURCE LIFECYCLE
Root owns renderer, scheduler/listeners, services and sessions. Abort pending work and stop scheduling before teardown. Child/manual disposal is idempotent. Context restoration invalidates renderer-bound leases and asks app to re-prepare the document, never reuse stale targets.

## ERROR HANDLING
SCOPE_CLOSED, CONTEXT_LOST, RENDER_FAILED, UNSUPPORTED_DEVICE, BUDGET_EXCEEDED include remediation. Suspend a failing render loop rather than repeatedly throwing each frame.

## TESTING REQUIREMENTS
Clock clamp/pause; RNG stability; partial/reentrant cleanup; ref counts; DPR/zero-size resize; swap races; context loss/restore; warmed leak baseline; renderer state restoration after exceptions.

## INTEGRATION REQUIREMENTS
Composition supplies sessions, app handles re-preparation, post implements RenderPipeline, asset/environment services respect generation and lifetime boundaries. Stable phase order is explicit.

## COMPLETION CHECKLIST
- [ ] Deterministic stepping and pause.
- [ ] Cleanup failure paths covered.
- [ ] Single render pipeline ownership.
- [ ] Resize/context recovery verified.
- [ ] Quality/diagnostics inspectable.
