# Materials director

## PURPOSE
Make physically based materials the default surface vocabulary and support explicit custom alternatives.

## RESPONSIBILITIES
Plan materials.standard, physical, emissive, transparent, transmission and custom. Presets map to tested Standard/Physical parameters rather than duplicate BRDFs. Expose roughness/metalness/base color/emissive/opacity and appropriate IOR/thickness/clearcoat channels. Load maps through injected AssetService; assign color roles and validate UV/tangent needs.

## NON-RESPONSIBILITIES
No HDR loading/PMREM, scene environment ownership, geometry generation, post bloom, renderer tone mapping or undocumented photorealism guarantees.

## DEPENDENCIES
Core, Three.js materials, shaders' public extension manager. AssetService and material-extension handles are injected/borrowed.

## DEPENDENCY DIRECTION
Materials → core/shaders. Never import environment factories; composition supplies the environment binding. Geometry requirements are metadata, not factory imports.

## PUBLIC API
Factories output material handles with family/IBL/shadow/attribute features and declared PropertyHandles. Accept optional extension arrays and texture asset IDs. A custom material descriptor must say unlit, artistic-environment, or qualified custom-PBR IBL mode.

## DATA FLOW
Normalized artist parameters → linear color conversion and texture leases → material + extension installation → borrowed handle for mesh assembly → explicit animation channels.

## IMPLEMENTATION ORDER
Standard/Physical defaults → texture/color-role tests → emissive/transparency → extension support → transmission/clearcoat presets → qualified custom variants.

## IMPORTANT PSEUDOCODE
```text
prepare material:
  acquire each map lease with declared role; scope owns release
  convert artist sRGB colors once; leave scalar/data maps unchanged
  construct Standard or Physical; register material disposal
  validate extension conflicts and geometry feature requirements
  install one ordered extension manager; expose only declared channels
when a node requires independently animated properties:
  create an owned material instance, sharing texture leases only
```

Transparency specifies blend mode, depthWrite policy and known sorting limitations; prefer alphaTest for cutouts. Transmission is distinct from opacity: default opaque surface alpha with Physical transmission, sensible thickness/IOR, and explicit screen-space limitations. Do not use transparency to fake a dielectric and label it physical.

## CONSTRAINTS
Scalar ranges and units in schemas; metalness/roughness in [0,1], finite positive IOR/thickness constraints. Prefer plausible nonzero roughness defaults. Never inject a second tone map into materials. Avoid mutating shared material state across scenes.

## PERFORMANCE REQUIREMENTS
Feature use controls shader complexity; do not enable transmission/clearcoat/maps unnecessarily. Cache immutable presets only; limit program permutations and report feature-driven cost. Texture memory is charged to shared asset entries, not duplicated per borrower.

## RESOURCE LIFECYCLE
Own material and extension state; release map leases; matching shadow variants have explicit owners. Material.dispose does not dispose shared textures. Animated material instances are session-local.

## ERROR HANDLING
INCOMPATIBLE_EXTENSION, MISSING_UV_OR_TANGENT, INVALID_PBR_PARAMETER, UNSUPPORTED_IBL_MODE. Explain screen-space refraction limitations in metadata, not as runtime errors for valid use.

## TESTING REQUIREMENTS
Roughness/metalness matrix under HDRI; texture color correctness; emissive/bloom threshold; opaque/cutout/blended cases; transmission overlap/off-screen fixture; shared texture and isolated uniform tests; extension/shadow compile tests.

## INTEGRATION REQUIREMENTS
Geometry features validated before preparation; environment binder tests intensity/rotation on both native and extended PBR materials. Post reference compares direct and composer output.

## COMPLETION CHECKLIST
- [ ] PBR defaults and realism limits documented/tested.
- [ ] Extension and map ownership correct.
- [ ] Independent animation cannot mutate shared peers.
- [ ] Transmission/alpha choices explicit.
- [ ] Browser reference matrix passes.
