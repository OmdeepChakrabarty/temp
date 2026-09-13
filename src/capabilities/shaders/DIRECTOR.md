# Shader system director

## PURPOSE
Provide reusable GPU math and controlled material extensions while preserving known lighting/output behavior.

## RESPONSIBILITIES
Plan namespaced GLSL utilities for noise, FBM, gradients, Fresnel, distortion, dissolve, environment reflection/refraction and procedural surfaces. Implement one extension compiler/manager and version-pinned IBL adapter. Utilities stay files in this directory initially; no independent shader framework is needed. Descriptor-backed extensions are capabilities; pure GLSL helpers need not become runtime nodes.

## NON-RESPONSIBILITIES
No renderer/PMREM ownership, scene-specific whole shaders, fake PBR claims, arbitrary runtime shader code from JSON, or separate material timeline.

## DEPENDENCIES
Core and the pinned Three.js shader/chunk/material APIs. No materials/environment factory imports.

## DEPENDENCY DIRECTION
Shaders → core; materials and particles may import public shader utilities. EnvironmentBinding arrives via core, preventing materials/environment cycles.

## PUBLIC API
buildExtension(spec), installExtensions(host,extensions), createShadowVariants(host), validateExtensionSet(), getIblAdapter(revision). Extension output is a material-extension handle; uniform channels have typed units/ranges. Hooks are named stages: vertex-position, vertex-normal, surface-color, alpha-discard, emissive and final-linear-radiance.

## DATA FLOW
Reviewed utility graph + extension descriptors → deterministic ordered source generation → stable program key → host compile → uniform updates without recompilation.

## IMPLEMENTATION ORDER
Utility naming/include resolver → noise/FBM/gradient tests → single-manager host hooks → Fresnel/dissolve → deformation normals/depth/distance parity → reflection/refraction artistic shaders → full custom-lit adapter only with reference tests.

## IMPORTANT PSEUDOCODE
```text
compile(host, extensions):
  reject duplicate IDs, conflicting writes and cyclic includes
  topo-sort utilities; emit each once under namespaced symbols
  sort extensions by stage then explicit priority then ID
  assert expected host chunk anchors exist exactly as required
  patch vertex/fragment and matched depth/distance variants
  programKey = hash(Three revision, source, defines, structural options)
  bind uniform references; exclude changing uniform values from key
```

Dissolve uses noise threshold with explicit endpoints (0 fully visible; 1 discarded) and a bounded edge band. Apply the same discard to shadow materials. Deformation adjusts normals analytically where possible; otherwise sample neighboring displaced positions with an explicit cost declaration. Bounds expand by known maximum displacement. Full custom IBL must sample PMREM CubeUV correctly with roughness and BRDF/Fresnel integration, rotation/intensity, diffuse/specular separation. Never treat PMREM as a samplerCube.

Shader math defaults: implement reviewed seeded 3D gradient noise using a deterministic integer hash, quintic lattice interpolation and a documented output range. FBM sums normalized octaves with default lacunarity 2 and gain 0.5; noise field scale/seed are explicit. Fresnel accents use Schlick's approximation with a clamped normal/view dot product, not an unconditional extra specular lobe on top of native PBR. Gradients interpolate declared linear-space color stops with sorted unique positions. Refraction uses Snell's-law direction and handles total internal reflection explicitly; a single environment lookup remains artistic, not volumetric transport. Keep CPU reference math for endpoint/range tests; do not claim bit-identical CPU/GPU noise across drivers.

## CONSTRAINTS
Pin Three.js revision; fail on missing patch anchors rather than silently rendering an unmodified material. Linear output; one pipeline-owned tone map. GLSL dialect explicitly matches WebGL2 and Three-generated prefixes. Unlit and artistic-environment shaders cannot satisfy a PBR requirement.

## PERFORMANCE REQUIREMENTS
Default FBM max 4 octaves; quality caps explicit. Bound shader permutations, source cache and noise work. No recompilation for ordinary uniform animation; avoid transparent overdraw and expensive fragment noise when vertex deformation suffices.

## RESOURCE LIFECYCLE
Scope owns uniform state and generated shadow materials; host owns its material. Release source/cache references at bounded eviction. No utility owns environment maps; consumers borrow environment binding leases through session ownership.

## ERROR HANDLING
SHADER_COMPILE_FAILED includes capability/stage/revision and numbered generated source artifact; PATCH_ANCHOR_MISMATCH rejects upgrade incompatibility. No hidden fallback to flat color.

## TESTING REQUIREMENTS
Source/include deterministic tests; real browser compile/render for native/extended materials, lights, instancing, shadows and post; dissolve endpoint/shadow parity; deformation normals; custom IBL versus Standard reference at multiple roughness/rotations/exposures.

## INTEGRATION REQUIREMENTS
Materials owns host integration; geometry supplies required attributes/bounds; environment supplies the declared PMREM layout; testing captures shader diagnostics and generated source. Pinned upgrades rerun the full permutation suite.

## COMPLETION CHECKLIST
- [ ] Utilities reusable/namespaced.
- [ ] Single deterministic patch manager.
- [ ] Uniform animation reuses programs.
- [ ] Shadow/color/IBL contracts verified.
- [ ] Unsupported custom lighting is honestly labeled.
