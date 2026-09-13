# Lighting director

## PURPOSE
Provide reusable direct-light arrangements complementing, not replacing, HDRI/IBL.

## RESPONSIBILITIES
Plan lighting.studio, cinematic, threePoint and dynamic rigs using directional/point/spot/area lights where qualified. Expose intensity/color/position/shadow controls; specify units per light type and the pinned Three.js physically based lighting behavior. Rect-area lights require tested addon setup and do not promise shadow casting.

## NON-RESPONSIBILITIES
No HDR loading, environment ownership, material BRDF, baked lightmaps, global illumination or automatic scene-wide shadow setup.

## DEPENDENCIES
Core and Three.js lights/math plus version-matched area-light helper if used.

## DEPENDENCY DIRECTION
Lighting → core. Composition attaches rig Object3Ds; animation targets channels; no material/environment factory imports.

## PUBLIC API
Factories emit light-rig/object3d handles and typed property channels. Parameters specify key/fill/rim roles, meters, intensity units, colors, shadow map size, bias/normalBias and frustum intent. Expose estimated shadow pass cost.

## DATA FLOW
Rig preset + explicit overrides → owned lights/targets → composition attaches rig → camera/scene geometry participates via explicit cast/receive flags → direct and environment lighting combine in PBR materials.

## IMPLEMENTATION ORDER
Static directional/ambient-free PBR reference → three-point/studio rigs → shadow controls/frustum fitting → cinematic dynamic tracks → area-light qualification.

## IMPORTANT PSEUDOCODE
```text
fit directional shadow(bounds):
  transform relevant caster/receiver bounds into light space
  expand by explicit safety margin; derive near/far and orthographic extents
  snap center to shadow texel grid to reduce shimmer
  update only when bounds/light changes beyond threshold
create rig:
  assign key/fill/rim transforms and color/intensity from normalized params
  enable shadows only on explicitly selected lights
```

Avoid adding ambient light by default to a calibrated HDRI scene; it can wash out the realism reference. Presets expose artistic choices without mutating exposure.

## CONSTRAINTS
HDRI does not supply direct contact shadows. Light types differ in intensity units; descriptors name units rather than claiming all numbers are interchangeable. Bias is scene-scale-sensitive and must be adjustable. One shadowed key light is the default.

## PERFORMANCE REQUIREMENTS
Constrained profile: at most one 1024 shadow map by default; balanced: one 2048 or equivalent budget; high may admit more explicitly. Point-light shadows require six views and must be costed accordingly. Cap shadow casters and avoid rebuilding frusta every frame unnecessarily.

## RESOURCE LIFECYCLE
Scope owns lights/target objects and shadow resources according to the pinned Three.js disposal API. Dispose light/shadow owner once; do not separately double-dispose internal targets. Borrowed scene geometry remains untouched.

## ERROR HANDLING
INVALID_LIGHT_PARAMETER, SHADOW_BUDGET_EXCEEDED, UNSUPPORTED_SHADOW_TYPE. Report effective shadow quality and explicit disabled features.

## TESTING REQUIREMENTS
Known key/fill/rim arrangement; shadow acne/peter-panning references; fitted bounds under motion; area-light limitations; dynamic intensity tracks; point-light cost estimates; repeated rig replacement/resource baseline.

## INTEGRATION REQUIREMENTS
Composition sets object cast/receive flags, geometry/shaders preserve depth variants, environment provides indirect lighting, inspector reports shadow cost separately from main draw calls.

## COMPLETION CHECKLIST
- [ ] Reusable rigs with explicit units.
- [ ] Shadow settings/costs validated.
- [ ] HDRI plus direct-light reference inspected.
- [ ] Dynamic binding and cleanup tested.
