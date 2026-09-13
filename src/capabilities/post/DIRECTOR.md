# Post-processing director

## PURPOSE
Compose explicit render effects while retaining one correct linear-HDR-to-display output path.

## RESPONSIBILITIES
Implement a core RenderPipeline adapter using EffectComposer/addons and small purpose-built passes. Plan post.bloom, vignette, colorGrade, chromaticAberration, distortion, filmGrain, depthOfField and gated temporal motion effects. Own pass ordering, required depth/history inputs, resolution scales and target budget estimates.

## NON-RESPONSIBILITIES
No renderer creation, RAF, scene asset loading, automatic ray tracing/SSR/velocity buffers, or material-local tone mapping.

## DEPENDENCIES
Core, Three.js rendering types and version-matched postprocessing addons. No other capability factory imports; lens/depth facts arrive as core handles.

## DEPENDENCY DIRECTION
Post → core. App injects the pipeline builder; composition supplies ordered effect handles. Core depends only on RenderPipeline, never EffectComposer.

## PUBLIC API
Effect factories emit post-effect handles with stage, requiresDepth/history, resolutionScale and channels. createPipeline(scene,camera,effects,rendererAccess,scope) emits RenderPipeline. Core uses direct rendering if no effects. Effects alone do not render or own a second pipeline.

## DATA FLOW
Scene HDR/depth → depth-aware effects → bloom → linear grade/vignette/distortion/chromatic → optional linear grain → final OutputPass. ARCHITECTURE.md defines legal stages and output ownership.

## IMPLEMENTATION ORDER
No-op composer/output parity → bloom → vignette/grade/grain → distortion/chromatic → depth/DOF → temporal accumulation → true velocity-based blur only with a separate validated prepass contract.

## IMPORTANT PSEUDOCODE
```text
build pipeline:
  validate requested stage order and resource requirements
  sum target bytes including depth/MSAA/history/ping-pong
  reject budget or unsupported format; choose only declared fallbacks
  allocate targets and register owners without altering active renderer state
  create one scene pass, ordered effect passes, one final output transform
  store desired renderer settings; acquire state access only during render/warmup
resize:
  derive physical dimensions once from viewport and effect scale
  rebuild/resize targets; clear temporal histories
render:
  execute pipeline under state restoration; report GPU errors
```

The pinned addon adapter must configure intermediate rendering to remain linear HDR and final tone mapping/output conversion exactly once; test actual behavior instead of assuming global flags suffice. Depth-aware effects use the active camera's near/far/projection. Transmission and transparent objects may not be represented correctly in a simple depth texture; disclose and fixture these limits.

## CONSTRAINTS
No simultaneous direct scene render plus composer render. Zero strength effects must behave as identity within tolerance. Camera cuts/seek/resize invalidate temporal state. Initial motion accumulation is labeled ghosting-prone and not physically correct motion blur. True motion blur requires previous model/view/projection and velocity coverage of deforming objects.

## PERFORMANCE REQUIREMENTS
Half-resolution bloom by default; DOF disabled on constrained profile. Bound effect count by total bytes/draw/fill estimates, not an arbitrary infinite chain. Reuse compatible targets only where lifetimes do not overlap; begin with clear ownership rather than an elaborate render graph allocator.

## RESOURCE LIFECYCLE
Pipeline owns composer, pass internals not disposed by composer in the pinned version, depth/history targets and state lease. Document disposal responsibility per addon; avoid double ownership. Resize releases replaced targets; pipeline teardown restores renderer settings even after failure.

## ERROR HANDLING
INVALID_EFFECT_ORDER, MISSING_DEPTH, UNSUPPORTED_TARGET_FORMAT, POST_BUDGET_EXCEEDED, POST_COMPILE_FAILED. Optional effect removal is reported; mandatory visual requirements fail.

## TESTING REQUIREMENTS
Direct/no-op parity, linear color/exposure ramps, bloom threshold before tone map, pass ordering, zero-strength identity, DOF near/far focus, transparent limits, temporal reset, resize/DPR, target counts and complete disposal.

## INTEGRATION REQUIREMENTS
Core grants exclusive renderer ownership; composition provides active camera/environment/objects; cameras emit cut tokens; app exports effective effects/quality. Full output fixtures include native and custom materials.

## COMPLETION CHECKLIST
- [ ] Exactly one output conversion verified.
- [ ] All effect inputs/order/limits explicit.
- [ ] Depth/history invalidation tested.
- [ ] Target budget and disposal covered.
- [ ] Browser visual references inspected.
