# Validation director

## PURPOSE
Provide evidence that capabilities compose correctly, render as intended and release resources, not merely compile as TypeScript.

## RESPONSIBILITIES
Organize shared conformance helpers, pure tests, schema-invalid fixtures, browser shader/runtime fixtures, approved tiny render assets, scene expectations, visual baselines and performance probes. Initially keep files in this directory with descriptive suffixes; add subdirectories only when useful and provide their directors. Test-specific asset provenance is still required.

## NON-RESPONSIBILITIES
No duplicated production implementation, universal pixel equality, silent software-rendered hardware passes, automatic baseline acceptance or unlicensed fixtures.

## DEPENDENCIES
Vitest for pure tests, Playwright for browser integration/capture, public source APIs, app development bridge and controlled approved fixtures. Pin browser version with the lockfile/tooling setup.

## DEPENDENCY DIRECTION
Tests consume all relevant public modules. Production modules import no tests. Pure tests avoid DOM/GL; browser tests deliberately allocate real WebGL2 contexts.

## PUBLIC API
Shared test helpers: assertCapabilityConformance(factory,descriptor), withHarnessFixture(), captureAt(scene,time,seed,quality), collectDiagnostics(), assertResourceConvergence(), qualifyPerformance(). These are test APIs, not browser runtime exports.

## DATA FLOW
Fixtures + schemas/factories → pure conformance → composed browser scenes → compile/render/error capture → screenshot/counter/timing assertions → machine-readable artifacts and reviewed baselines.

## IMPLEMENTATION ORDER
Scopes/clock/schema tests at gate 0 → basic PBR/HDR browser fixture at gate 1 → every capability's contract tests → cross-family shader/shadow/post permutations → leak/context races → realism/performance qualification.

## IMPORTANT PSEUDOCODE
```text
conformance(factory, descriptor):
  assert defaults valid; invalid input rejected before allocation
  prepare valid fixture; compare exact output names/kinds/features
  run declared hooks; resize; reset/seek according to declared model
  dispose twice; assert cleanup counters stable
  inject failures at every awaited/allocation boundary; assert rollback
leak convergence:
  warm identical scene twice; record stable baseline
  repeat 20 times: load, seek, resize, replace, dispose
  flush documented renderer cleanup frames
  compare owned-resource counts and estimated bytes to baseline tolerance
  distinguish retained documented caches from monotonic growth
```

Shader matrix covers native/extended Standard/Physical, instancing, relevant UV/tangent features, direct lights, environment, shadow depth/distance, transmission, post output and custom-lit adapter where published. Use pairwise structural combinations plus all known conflict pairs rather than blindly exhausting an exponential product. Compile warmup alone is insufficient; render a frame and collect actual shader diagnostics.

## CONSTRAINTS
Fix seed, clock, browser build, viewport, DPR, quality and asset checksums for captures. Await all assets/shader preparation/replay plus a completed frame. Assert no console error/page error/unhandled rejection; explicitly reviewed exclusions need a rationale and narrow matching. Missing WebGL2/extension results remain visible as unsupported, never false success.

## PERFORMANCE REQUIREMENTS
Hardware budgets come from ARCHITECTURE.md and must record actual device/resolution/timing method. Gate portable CI on counts/bounds/leaks and functional captures; keep qualified hardware timing a separate required release evidence for high-end claims. Avoid flaky exact timing assertions in ordinary unit tests.

## RESOURCE LIFECYCLE
Each fixture owns harness/browser session/resources and cleans up in finally. Visual baseline files are intentional repository assets; transient screenshots/reports are ignored artifacts. Context-loss tests restore or dispose their contexts explicitly.

## ERROR HANDLING
Failures retain diagnostics, generated shader source, screenshot, normalized scene and reproducibility manifest. Timeout messages identify phase (load/compile/seek/render). Never reinterpret a browser crash as a successful unsupported-feature check.

## TESTING REQUIREMENTS
Test the helpers: injected shader compile error is detected, late async leak fails, wrong baseline fails, unsupported WebGL is labeled, stale generated catalog fails and cleanup executes after assertion failures. Cover asset license metadata and offline operation.

## INTEGRATION REQUIREMENTS
Every published capability supplies a minimal fixture and every showcase supplies time checkpoints/expectations. Root tooling runs gates; app exposes readiness/metrics. Native and no-op composer output parity is a mandatory color regression test.

## COMPLETION CHECKLIST
- [ ] Pure/contract/browser/visual layers exist.
- [ ] Failures produce reproducible evidence.
- [ ] Shader errors and leaks are detected by negative tests.
- [ ] Hardware claims are qualified, not inferred from CI.
- [ ] All delivered scenes/capabilities have coverage.
