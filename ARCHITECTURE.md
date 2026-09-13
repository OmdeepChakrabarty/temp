# Architecture: AI-native animation capability platform

## 1. Scope and decisions

This is an implementation blueprint, not a running harness. The objective is a library that can grow to hundreds of discoverable, compatible capabilities. Scenes are consumers and acceptance fixtures, not the organizing abstraction of the library.

Choose one TypeScript project with plain DOM UI and Vite. Use Three.js WebGLRenderer/WebGL2 and version-matched addons as the first and only renderer backend. WebGPU/TSL is a future explicit backend, not a promise that GLSL, render targets, and post effects will transfer unchanged. Keep backend-dependent types marked in metadata; do not write a speculative multi-backend abstraction.

Use small modules, constructor/function arguments for services, a single runtime, declarative scene documents, JSON Schema, and an explicit local factory table. No framework/ECS/plugin marketplace is necessary. Start with CPU particles and instanced analytic motion; stateful GPU simulation is gated behind measured need and target support.

## 2. Boundaries and actual dependency graph

An arrow below means **imports/depends on**, not execution order.

```text
core                 -> Three.js only (plus browser primitives)
assets               -> core, Three.js loaders
registry             -> core types, JSON Schema validator
shaders              -> core, Three.js shader/material APIs
geometry             -> core
materials            -> core, shaders public extension API
(environment)        -> core, assets
animation            -> core
cameras              -> core
lighting             -> core
interaction          -> core
particles            -> core, shaders public utilities
post                 -> core, Three.js postprocessing addons
composition          -> core, registry public validation API
scenes               -> registry/core document types only
app                  -> core, assets, registry, composition, scenes,
                        explicit capability factory table
(tooling)            -> schemas/catalog/documents; browser adapter via app API
tests                -> public APIs of the modules under test
```

`environment` lives in capabilities, as do the other family names above. All families may use core **service interfaces**; only assets implements AssetService. Composition knows output handle kinds, not concrete capability implementations. The app is the composition root that injects factory loaders, AssetService, and services into composition. Generated factory imports live in app, never in the metadata-only registry entrypoint.

Particles accept a borrowed geometry/sampler handle; cameras accept a path handle. They do not import geometry factories. Materials consume environment through the scene binding established by composition and the core environment contract, not by importing the environment factory. Animation binds declared property handles, never imports cameras/materials/particles. Post implements a core RenderPipeline interface and does not own the renderer. These rules eliminate likely registry↔capability, materials↔environment, animation↔scene, and core↔post cycles. A static import-boundary test enforces them.

Independent work: schemas/catalog tooling and core pure math can begin together; geometry, shaders, assets, animation, cameras, lighting, interaction, and post can develop independently after core contracts stabilize. Materials wait for shader extension contracts; environment waits for asset leases; GPU particles wait for shader utilities and resource tests. All integrate through core ports and composition.

## 3. Units, coordinate and color conventions

Right-handed Three.js world, Y up; meters for distance, seconds for time, radians internally. JSON field names include units where ambiguous, such as `fovDegrees`, `rotationRadians`, `focusDistanceMeters`. Convert degrees once at boundaries. Quaternions represent orientation tracks; do not interpolate Euler angles for cinematic paths.

Linear-sRGB is the working space. Mark albedo/emissive color textures as sRGB, data maps (normal/roughness/metalness/AO/displacement) as non-color, and decoded HDR radiance as linear according to the pinned loader's documented behavior. Artist hex colors enter as sRGB and are converted once. Preserve HDR values through lighting and linear effects; default output is ACES filmic tone mapping plus sRGB output. Do not bake tone mapping into reusable shaders or apply output conversion twice. Use the selected Three.js revision's real API, tested in fixtures, rather than copying obsolete color-management snippets.

## 4. Core runtime and lifecycle

One Harness owns renderer, scheduling, diagnostic bus, renderer generation, quality controller, and the active scene session. DOM UI and event listeners belong to app/interaction. Services passed to factories are narrow views, not a global mutable service locator.

Conceptual interfaces (documentation only):

```text
CapabilityFactory<P>.prepare(params: P, ports: ResolvedInputs,
  ctx: {scope, signal, assets, rendererAccess, diagnostics, seed, quality})
  -> Promise<CapabilityInstance>

CapabilityInstance = {
  outputs: ReadonlyMap<PortName, TypedHandle>,
  hooks?: { simulate(fixedFrame), evaluate(frame), present(frame) },
  reset?(seed), resize?(viewport), dispose(): void
}

TypedHandle = {kind, version, value, ownership: 'borrowed', features}
PropertyHandle<T> = {kind: 'property', valueType, read(), write(T), range,
                     writerPolicy: 'exclusive' | 'additive'}
ResourceScope = {own(resource, disposer), defer(cleanup), child(), dispose()}
Lease<T> = {value: T, release(): void} // release idempotent per lease
RenderPipeline = {render(scene, camera, frame), resize(viewport), dispose()}
EnvironmentBinding = {prefilteredMap, intensity, rotation, sourceId,
                      rendererGeneration, iblModel: 'three-pmrem-cubeuv'}
```

Allocation must register cleanup immediately, before the next await. Scopes recursively own children; a child manually disposed is safe when its parent later disposes it. Instance dispose delegates to its scope and never disposes borrowed outputs. Composers/passes may internally own targets: register the owning composer or pass once; explicitly own only resources its version does not dispose.

Lifecycle: uninitialized → preparing → ready → active ↔ suspended → disposing → disposed; failures can enter disposing from any state. `prepare` may allocate, but cannot mutate the active scene or install active input subscriptions. Parent session signal cancels pending work. Check generation/signal after every await; release any late acquired lease. Disposal attempts every cleanup even if one throws, reporting aggregated diagnostics. Shared caches dispose only on final release and eviction, not on arbitrary scene teardown.

```text
loadScene(document):
  validated = validateSchemasAndCompatibility(document) // no side effects
  plan = topoSortConstructionEdges(validated)
  pending = new Session(scope.child(), AbortController(), nextGeneration())
  try:
    for ready batch in plan with bounded preparation concurrency:
      resolve borrowed ports from completed nodes
      await factory.prepare(params, ports, pending.context)
      reject late results if pending signal/generation is stale
    compile materials + warm effects with a disposable scratch frame
    at frame boundary:
      verify pending still newest
      atomically replace active session and render pipeline
      enable pending subscriptions; dispose previous session
  catch error:
    abort pending; dispose pending; keep previous active scene; report error
```

Bound concurrent preparation (initial default 4); stop launching nodes after failure, abort, then settle in-flight tasks before final cleanup. A failed replacement does not blank a working preview. Initial failure presents a useful error panel.

Context loss: stop rendering, mark generation invalid, and release scene renderer-bound leases. On restoration rebuild renderer services/caches and re-prepare the stored document with the same seed; never reuse old target/PMREM handles. Report restoration failure with retry. Page visibility pauses accumulation rather than performing seconds of catch-up. Resize uses CSS size × clamped DPR, ignores zero-size rendering, and propagates physical target dimensions without accidentally applying DPR twice.

## 5. Frame phases and temporal behavior

Fixed simulation step is 1/60 s; clamp wall delta to 0.1 s, max 4 catch-up steps per presentation. Record dropped simulation time. Paused time does not advance. Frame order:

```text
sample input commands
for each fixed tick:
  evaluate simulation-driving tracks at tick time
  apply tick commands and simulate stateful systems
  update bounded state history
interpolate state for presentation
apply presentation tracks/procedural transforms
resolve camera orientation and additive shake
update world matrices and dynamic bounds
execute one active render pipeline
collect sampled diagnostics/metrics
```

Each mutable property has a declared writer and phase. Input commands use the next simulation tick; presentation-only camera controls use the camera phase. Reject multiple exclusive writers, even across phases. Additive channels use a stable node-ID ordering. Never use traversal order as an accidental scheduling API. Seed random streams by scene seed + stable node ID, so inserting an unrelated node does not change another system's random sequence.

Analytic tracks can seek directly. Stateful CPU/GPU systems reset and simulate fixed ticks from time zero or a compatible checkpoint; seeking backwards is not negative-delta integration. UI exposes progress/cancel for expensive seeks, defaults to a 30-second interactive seek limit for replay systems, and allows longer explicit offline capture jobs. Checkpoints include seed, schema/capability versions, fixed tick, and quality. GPU replay is repeatable within a qualified device/driver, not bit-identical across devices. Motion blur/trails/temporal effects reset history after seek, camera cuts, resize, and scene replacement.

## 6. Registry: discovery without execution

Store one descriptor JSON and one parameter schema per capability, alongside its implementation in the family directory. Registry owns descriptor/scene schemas and a generated aggregate JSON catalog. A separate explicit local loader map is generated into app from reviewed entries. No filesystem scanning or dynamic remote import in the browser.

Descriptor schema uses JSON Schema 2020-12 with additional properties rejected at stable document boundaries. Parameter schemas are canonical; generate TS types from them, compile schemas with Ajv at build/startup, and reject nonfinite numbers and unknown references before construction. Apply defaults to a fresh normalized copy, never mutate caller input. Descriptor and capability versions are separate from scene format version. IDs are stable lowercase dotted identifiers, e.g. `materials.physical`, not labels. Changes to input/output semantics require a capability major version. Exact versions are recorded in documents; migrations are pure, explicit, tested transforms, never silently applied during render.

Required metadata:

| Field | Contract |
| --- | --- |
| id, version, name, category, description | Stable identity, semver, human-readable semantics |
| inputSchema | Local canonical schema reference: units, defaults, ranges, descriptions |
| inputs, outputs | Named handle kind/version, optionality, feature requirements, ownership |
| dependencies | Required capability IDs/version ranges, plus parameter-conditional requirements; not JS imports |
| compatibility | Backend, required extensions/formats, IBL mode, material families, conflicts, ordered effects constraints |
| performance | Cost class, dominant complexity, draw/target estimates, quality limits, benchmark reference |
| lifecycle | Owned resource classes, shared leases, resize policy, seek model, context recovery |
| examples | Existing scene IDs and minimal composition fixture |
| tags, limitations | Search terms, supported combinations and honest unsupported cases |
| stability | experimental or stable; unimplemented ideas are not catalog entries |

Conceptual descriptor excerpt:

```json
{
  "id": "shaders.dissolve",
  "version": "1.0.0",
  "name": "PBR-preserving dissolve extension",
  "category": "shaders",
  "description": "Noise-threshold visibility with optional emissive edge",
  "inputSchema": "./dissolve.params.schema.json",
  "inputs": {},
  "outputs": {"extension": {"kind": "material-extension", "version": 1, "ownership": "borrowed"}},
  "dependencies": [],
  "compatibility": {"backend": "webgl2", "ibl": "preserves-host-pbr", "materialFamilies": ["standard", "physical"], "requiresFeatures": ["matched-shadow-discard"]},
  "performance": {"costClass": "medium", "complexity": "visible fragments times noise octaves", "defaultMaxOctaves": 4},
  "lifecycle": {"owned": ["uniform-state"], "seek": "analytic", "resize": "none", "contextRecovery": "reprepare"},
  "examples": ["intermediate-dissolve"],
  "tags": ["dissolve", "transition", "noise", "hdri-compatible"],
  "limitations": ["No volumetric interior is generated"],
  "stability": "experimental"
}
```

This is a schema design example, not an implemented entry. Complete schemas must encode discriminated cost/compatibility structures rather than accepting arbitrary strings as rules.

Discovery API: `query({text?, categories?, tags?, outputKind?, ibl?, backend?})`, `describe(id, version)`, `dependencyClosure(selection)`, `checkCompatibility(scene, deviceProfile)`. Search indexes ID/name/description/tags with stable scoring; structured filters are authoritative. Return match reasons, limitations, unresolved requirements, and example IDs. Querying "dissolve" returns dissolve extensions and compatible material hosts; "particles" filters family; "HDRI" filters PBR-preserving or explicit IBL support. Do not label a raw unlit shader IBL-compatible just because it samples a texture.

## 7. Composition document and ports

SceneDocument fields: `schemaVersion`, `id`, `seed`, `quality`, `assets`, `nodes`, `bindings`, `presentation`, `requirements`. Nodes have stable `id`, exact `capability`/`version`, normalized `params`, and named `inputs` with `$ref: node.output`. Params hold immutable construction data; animation/interaction bind mutable property handles separately. Asset IDs resolve against the document's manifest merged with an explicitly selected project manifest; duplicates/conflicting provenance are errors.

Output kinds include geometry, path, surface-sampler, material, material-extension, object3d, camera, environment, light-rig, particle-system, animation-clip, property, interaction-source, and post-effect. Feature sets express normals, tangents, UVs, depth, transmission, shadow-discard, and IBL layout. Subtyping/compatibility rules live in registry schemas/core type guards, not string guessing.

Composition provides a small built-in `composition.mesh` factory to join borrowed geometry/material handles into an owned Object3D. It lives in composition and is registered by app exactly like other factories. Composition also creates its Three.Scene and resolves `presentation.objects`, one `camera`, optional `environment`, and ordered `effects`. Light-rig/particle-system handles expose attachable Object3Ds via declared adapters. No implicit addition of every output object to the scene.

```text
scene "chrome-emergence" (abbreviated pseudo-JSON):
  assets.studio = licensed-or-user HDR asset descriptor
  nodes.env = environment.hdri(source: asset:studio)
  nodes.shape = geometry.primitive(kind: torusKnot, detail: high)
  nodes.surface = geometry.surfaceSampler(geometry <- shape.geometry, seed)
  nodes.dissolve = shaders.dissolve(scale: 3, edgeEmission: 1.5)
  nodes.chrome = materials.physical(metalness: 1, roughness: 0.16,
                                    extensions <- [dissolve.extension])
  nodes.hero = composition.mesh(geometry <- shape.geometry,
                                material <- chrome.material)
  nodes.cloud = particles.surfaceMorph(target <- surface.sampler, count: 12000)
  nodes.rail = geometry.curve(controlPoints: [...])
  nodes.camera = cameras.rail(path <- rail.path, lookAt: [0,0,0])
  nodes.rig = lighting.studio(...)
  nodes.bloom = post.bloom(threshold: 1, strength: 0.3)
  nodes.timeline = animation.timeline(durationSeconds: 8, tracks: [...])
  bindings = timeline.heroVisibility -> dissolve.threshold,
             timeline.formation -> cloud.progress,
             timeline.cameraTravel -> camera.progress
  presentation = objects:[hero.object,cloud.object,rig.object],
                 camera:camera.camera, environment:env.environment,
                 effects:[bloom.effect]
```

The real JSON schema requires complete numeric control points/tracks; ellipses above illustrate wiring only. Dissolve convention is documented as 0 = fully visible, 1 = fully discarded; an emergence track runs 1 → 0. Particle formation runs 0 → 1, then fades while solid visibility rises. Parameter constraints catch roughness outside [0,1]. This composition becomes a tested cinematic fixture only when all factories exist.

Construction references form a DAG; reject missing nodes/ports, kind/version mismatch, self-reference, and cycles with a path diagnostic. Hierarchical parenting is a second acyclic relation with single-parent ownership, independent of construction ordering. Bindings are validated after output discovery: types/units/phases must match and writers must not conflict. Do not use unrestricted arbitrary property paths such as `object.material.foo`. Feedback belongs inside an explicit stateful capability; general graph cycles are not supported.

## 8. Realism, HDRI and custom material lighting

Prefer MeshStandardMaterial and MeshPhysicalMaterial. Metal surfaces derive their appearance from reflected surroundings, plausible roughness, and geometry; base color does not substitute for environment lighting. Transmission in Three.js is a screen-space approximation with ordering and off-screen limitations, not a path tracer. HDRI gives indirect/specular lighting but not contact shadows or a model of local interreflection. Use direct shadow-casting lights, quality geometry/normals, grounded scale, and intentional camera/exposure.

Environment service decodes HDR/EXR through AssetService, generates PMREM on the harness renderer, and returns a leased renderer-generation-scoped binding. Source radiance/background and prefiltered IBL are distinct resources. PMREM roughness filtering is not interchangeable with a normal cubemap mip chain. Share PMREM entries by source content identity + conversion settings + renderer generation; no simultaneous generators per scene. Source texture lease may be released after prefiltering unless still used as background. Rotation/intensity are binding properties and normally do not create new PMREM entries. Test background rotation/intensity independently from environment rotation/intensity against the pinned Three.js version.

Custom shader tiers:

1. Standard/Physical materials with normal documented parameters.
2. A version-pinned, composable shader-extension manager for distortion, dissolve, gradients, Fresnel/emissive accents. One manager owns onBeforeCompile, stable program keys, declarations, and ordered hooks. Keep Three's BRDF, IBL, shadows, tone mapping, and color pipeline. Deformation/discard must be mirrored in depth/distance materials for shadows; displacement normals and bounds must remain valid.
3. Full ShaderMaterial only when tiers 1–2 cannot express the behavior. Explicitly declare unlit versus custom-lit. For lit output, use a revision-pinned IBL adapter that understands PMREM CubeUV layout, roughness sampling, environment rotation/intensity, Fresnel/BRDF integration, and diffuse/specular split. Do not sample PMREM as samplerCube or add environment RGB to base color and call it PBR. Adapter conformance compares against a standard-material reference across roughness, rotation, and exposure. Reject IBL requirements when the adapter is unavailable. A simple artistic reflection/refraction shader may be supported but must be labeled non-PBR and list missing lighting features.

Texture transforms/tangent frames, transmission thickness/IOR, shadow bias, tone mapping, and lens focus are part of material/scene presets; presets expose parameters rather than hiding fixed renderer changes.

## 9. Rendering and post-processing

Core renders directly with renderer tone mapping/output conversion when there are no effects. With a pipeline, post owns EffectComposer/pass internals using linear HDR intermediates. Core grants exclusive renderer-state access only for a bounded render, conversion, or warmup operation and restores prior state in finally. A prepared but uncommitted pipeline stores desired settings without changing the active pipeline's renderer state. Scratch warmup/conversion runs between active frames under the same serialized access guard; asynchronous preparation must never hold mutable renderer state across an await. Detaching a pipeline releases its resources and leaves the core's direct-render defaults intact. The pinned addon adapter owns the exact renderer/pass settings so intermediate passes do not tone-map and the final OutputPass performs the one output transform. Test parity between direct and no-op composer paths; do not assume setting a global renderer flag alone guarantees correctness.

Order: scene HDR color + required depth → depth-aware physical effects (DOF, supported motion) → bloom → linear grading/vignette/distortion/chromatic effects → optional final film grain → one tone-map/output conversion. Each effect declares legal stage and depth/history needs. Initial grain is linear pre-output; a future display-space grain must declare a separate terminal stage and cannot introduce a second tone map. Bloom runs before output with controllable threshold; DOF and transmission interactions require fixtures. No SSR, path tracing, motion vectors, or temporal antialiasing is implied by the MVP. Initial motion effects are analytic camera shake or documented temporal accumulation; true motion blur requires previous transforms/velocity and is an advanced gated capability.

## 10. Performance and graceful degradation

Initial **engineering targets**, not guarantees:

| Profile | DPR cap | CPU particles | Instanced analytic particles | Draw calls | Approx. app-managed GPU bytes | Post |
| --- | --- | --- | --- | --- | --- | --- |
| constrained | 1.0 | 2,000 | 10,000 | 100 | 128 MiB | half-res bloom or none; no DOF |
| balanced | 1.5 | 10,000 | 50,000 | 250 | 256 MiB | half-res bloom; optional DOF |
| high | 2.0 | 20,000 | 200,000 | 500 | 512 MiB | qualified full effects |

Counts are admission ceilings, not a license to combine every maximum. Evaluate pixel count, material cost, fill/overdraw, lights/shadows, texture/target bytes, and device extensions together. Defaults start balanced on qualified desktop, constrained on unknown/mobile/software renderers. Detect actual limits and float-render-target support; user-agent strings are not capability tests. Fall back to analytic instancing/CPU if GPU simulation is unsupported; reject a mandatory semantic requirement rather than silently changing it.

Working target on a declared reference desktop: 1080p, median 60 fps, p95 frame time ≤20 ms over a warmed 10-second capture, CPU update p95 ≤4 ms. Constrained reference mobile targets 30 fps/p95 ≤40 ms at its declared viewport. Store device/browser/driver/render resolution and timing method. Software headless results validate function, not these hardware targets.

Pool typed arrays; no object creation in particle/frame loops. Reuse vectors/matrices, precompute geometry, batch/instance repeated meshes, upload only changed ranges, cap shader octaves and transparent layers, and avoid synchronous GPU readback. Use async GPU timing only when timer extensions exist and disjoint results are discarded. Estimate texture bytes by dimensions × channels × bytes/channel × mip factor × faces; include all depth, MSAA, ping-pong, shadow, PMREM CubeUV, and history allocations. renderer.info is not a byte-accurate memory meter. Report estimates separately from measured counters.

Quality controller samples over 2-second windows: degrade after 3 consecutive budget failures; upgrade only after 10 seconds below 70% budget; never change quality during deterministic tests/capture. Degrade DPR, effect resolution/DOF/history, particle count, shadow resolution, then geometry detail, respecting each scene's minimum required features. Rebuild affected resources transactionally. Report every decision and effective parameter. CPU simulation density changes require reset or an explicit remap, not silent array truncation.

## 11. Asset provenance and licensing

Root assets/ stores approved distributable files and manifests; src/assets/ stores loaders. No HDRI binary is assumed to exist. Manifest records require ID, kind, location, creator, source/provider, license identifier or text, attribution, redistribution permission, color role, and optional checksum/dimensions. A URL is not a license. User files stay session-local unless deliberately saved; external URLs require CORS and explicit network-enabled preview. Reproducible tests use small approved local fixtures. No arbitrary development-server proxy is required.

AssetService resolves local assets, session File/Blob references, approved external HTTPS URLs, and future providers into the same descriptor. It does not set renderer state or generate PMREM. Deduplicate fetch/decode by canonical identity plus decode/color options; use leases, bounded concurrency, and byte-budgeted zero-reference LRU eviction. Aborting one consumer must not cancel another's acquisition. Failed entries have bounded retry backoff, never permanent poison. An offline scene can opt into visibly labeled procedural neutral lighting; scenes requiring HDRI fail clearly instead of claiming the fallback is equivalent.

## 12. Validation and agent inspection

Tooling exposes lint/typecheck, unit/contract tests, catalog generation/checking, scene validation, build, browser smoke tests, deterministic capture, and qualified performance probes. Exact planned commands live in tooling/DIRECTOR.md.

- Pure tests: schemas/defaults, math, topology, easing, leases, seeded sampling, cancellation, budget estimates.
- Contract tests: every published descriptor matches its factory, output kinds, valid examples, and prepare/reset/resize/dispose behavior; reject stale catalog/types and illegal imports.
- Browser tests: real WebGL2 contexts, shader/material/shadow/post permutations, compile diagnostics, page/console errors and unhandled rejections, context loss/restoration and replacement races.
- Scene tests: fixed seed/time/quality/viewport, screenshots, no missing assets/NaNs, bounds and camera visibility assertions.
- Performance/leaks: warmed qualified runs, p50/p95 timings and draw/target counters, repeated swaps/resize/dispose. Internal renderer caches need not fall to zero; counters must converge to a documented warmed baseline. Byte estimates are not measured VRAM.

A successful TypeScript build does not prove shaders compile or scenes look correct. Readiness waits for assets, compilation, seek completion, and a rendered frame. The development-only versioned inspection API exposes discovery, scene load, setTime, play/pause, readiness, diagnostics, metrics/effective quality, and reset. Export JSON reports, PNGs, and reproducibility manifests. Do not expose this bridge in production by default.

Visual baselines are browser/device-family specific, with reviewed updates and tolerances. Pair screenshots with luminance/silhouette/region assertions; do not demand universal pixel equality. Codespaces software rendering can check function, not high-end hardware timing. Missing WebGL2 is an explicit unsupported/failed gate, not a passing screenshot test.

## 13. Implementation order and release gates

| Gate | Build | Exit evidence |
| --- | --- | --- |
| 0 | Pin toolchain/devcontainer; strict types; scope/clock/diagnostics; canonical schemas; test runners | clean install/build/lint/typecheck; schema/scope tests; browser WebGL2 probe |
| 1 | Discovery; primitive; physical material; assets/HDRI/PMREM; static camera/light; composition.mesh; transactional preview | composed PBR sphere and approved HDR fixture; query/scene validation; screenshot; disposal/swap tests |
| 2 | Timeline/easing/property bindings; curves/rails; rigs; input; CPU/analytic instanced particles | synchronized scene; deterministic scrub/reset; interaction teardown; constrained profile |
| 3 | Noise/FBM/Fresnel/gradient/dissolve/deformation extensions; bloom/grading/vignette/distortion/grain; particle morph/trails/explosion | shadow/compile permutations; output parity; cinematic chrome emergence; budget report |
| 4 | Transmission presets; realism references; IBL rotation/intensity tests; DOF; custom-lit IBL adapter only if needed | roughness/metalness matrix; exposure/color tests; limitations; desktop/mobile qualification |
| 5 | Optional stateful GPU particles, temporal motion/history, extreme density, tuning | fallback/extension tests; target benchmarks; context recovery; replay and overdraw assessment |

Tooling/tests start at gate 0 and expand with every slice. Full local inventories are roadmaps, not a reason to postpone the first working composition. Nothing enters the published catalog until its implementation and conformance fixture exist. Work independently along the dependency graph in section 2, integrating through core contracts at each gate.

## 14. Codespaces operating model

Use a supported pinned Node LTS and browser system dependencies; privately forward Vite port 5173. npm ci installs the lockfile; licensed downloads remain opt-in. The Codespace does builds/headless checks; the forwarded preview uses the viewing browser's GPU. No powerful local machine or GPU-equipped Codespace is required for ordinary implementation. Hardware qualification can be deferred to a labeled target-device run, never fabricated. Bound test workers for small Codespaces. No Colab, CUDA, or external compute service is a core dependency; future offline providers exchange assets/jobs through tooling.

## 15. Trade-offs and evolution

WebGL2 is focused and testable but limits compute and requires version-pinned shader adapters. JSON composition improves reproducibility while intentionally excluding arbitrary expressions/general feedback cycles. A native DOM shell avoids framework overhead but must still be accessible. Explicit local factory registration simplifies bundling/discovery; it is not a remote plugin marketplace. Raster IBL/transmission is not path tracing. GPU byte estimates and device-qualified captures are honest approximations, not universal guarantees.

Expand by adding schemas, descriptors, factories, and fixtures rather than runtime managers. Split packages only when distribution/build needs justify it. Make schema migrations explicit and tested; record major decision changes here with rationale and affected contracts. README.md contains the final tree; every listed non-root directory has a sixteen-section DIRECTOR.md.
