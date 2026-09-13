# HDRI / IBL director

## PURPOSE
Make environment lighting a first-class, reusable service-backed capability for realistic PBR compositions.

## RESPONSIBILITIES
Plan environment.hdri and explicitly labeled environment.neutral fallback. Decode through AssetService; generate/share PMREM; expose separate background/lighting choices, intensity and rotation channels; maintain renderer-generation cache and budget diagnostics. Support HDR initially and EXR after loader qualification.

## NON-RESPONSIBILITIES
No unlicensed assets, asset-provider coupling, material BRDF implementation, automatic direct shadows, path tracing or claim that HDRI alone guarantees realism.

## DEPENDENCIES
Core, src/assets service implementation contracts, Three.js PMREMGenerator and radiance loader outputs. Actual consumers receive assets via injection.

## DEPENDENCY DIRECTION
Environment → core/assets. Materials/shaders use core EnvironmentBinding rather than importing this factory. Composition owns applying the resulting binding to its scene.

## PUBLIC API
environment.hdri.prepare emits EnvironmentBinding plus background handle and intensity/rotation PropertyHandles. Internal acquirePrefiltered(sourceLease,settings,rendererGeneration) returns a lease. Expose cache stats and release/evict APIs through the harness-scoped environment service injected by app.

## DATA FLOW
Manifest radiance ID → decoded linear texture lease → renderer-scoped PMREM conversion → prefiltered lease → scene/native PBR and qualified shader adapter. Original radiance is retained only if used as background or needed by an explicit cache policy.

## IMPLEMENTATION ORDER
Single HDR + native physical material → separate background/IBL → shared PMREM leases → rotation/intensity → cancellation/restoration → neutral fallback and qualified custom adapter integration.

## IMPORTANT PSEUDOCODE
```text
acquire environment:
  radiance = await assets.acquireRadiance(source, signal)
  key = hash(content identity, decode/conversion settings, renderer generation)
  share one pending conversion per key under generation-scoped service
  execute PMREM conversion in renderer-state scope between frames
  register output render target as owner (not its texture separately)
  release source after conversion unless background retains a lease
  check generation/signal; return idempotent prefiltered lease
on session release:
  release background and PMREM leases
  dispose only zero-ref cache entries selected for eviction
```

A shared conversion retains its own source lease; one cancelled consumer cannot release the source beneath other consumers. Serialize conversion on a renderer; restore prior target/viewport/state even on failure. Rotation/intensity change binding uniforms/properties without regenerating PMREM. Key changes for actual conversion settings, not presentation controls.

## CONSTRAINTS
Radiance remains linear; source equirectangular and PMREM CubeUV are different layouts. Test actual pinned scene.environment/background rotation/intensity APIs. Distinguish physical radiance scale from exposure. No raw equirectangular texture advertised as prefiltered roughness-correct IBL.

## PERFORMANCE REQUIREMENTS
Initial source-width targets: 1k constrained, 2k balanced, 4k high, selected from licensed variants where available; apply actual format/texture limits. Charge CubeUV target dimensions and temporary conversion peaks to budget. Never regenerate PMREM every frame.

## RESOURCE LIFECYCLE
Harness service owns PMREMGenerator, pending conversions and zero-ref LRU. Each PMREM render target owns its texture. Sessions lease results. On context loss invalidate all generation keys; restore by reacquiring source/rebuilding. Dispose generator on service teardown and all late outputs.

## ERROR HANDLING
HDR_DECODE_FAILED, PMREM_UNSUPPORTED, ENVIRONMENT_BUDGET_EXCEEDED, STALE_RENDERER_GENERATION. Optional neutral fallback must be explicit and reported; required HDRI errors retain the previous scene.

## TESTING REQUIREMENTS
Native PBR roughness ladder; chrome versus dielectric; rotation and independent background/intensity; cache sharing; cancel-one/all; source/target exact disposal; repeated replace; context restoration; custom shader reference match; color/exposure/output parity.

## INTEGRATION REQUIREMENTS
Gate 1 must include real approved HDR radiance, not only a procedural fallback. Root assets supplies provenance; composition applies one active environment. Materials expose PBR support, shader adapters declare layout/revision compatibility.

## COMPLETION CHECKLIST
- [ ] HDRI works in the first useful vertical slice.
- [ ] PMREM/background leases and cancellation correct.
- [ ] PBR/native and custom compatibility explicit.
- [ ] Rotation/color/roughness tests pass.
- [ ] Cache budget and context recovery verified.
