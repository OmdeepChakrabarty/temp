# Showcase compositions director

## PURPOSE
Demonstrate reusable capability composition and provide graded acceptance fixtures, not an example-code library.

## RESPONSIBILITIES
Maintain complete schema-valid scene JSON and adjacent expectation metadata: capability coverage, required assets/license IDs, seed, time checkpoints, viewport/profile, invariants, quality variants and limitations. Store scenes as files here initially, avoiding a directory per scene.

## NON-RESPONSIBILITIES
No shader source, particle loops, custom renderer setup, material implementation or hidden animation functions inside scene files. Missing reusable behavior must become a tested capability.

## DEPENDENCIES
Registry/core document types only if authored through a local typed helper; final documents must serialize to canonical JSON. Asset IDs resolve through approved manifests.

## DEPENDENCY DIRECTION
App/tooling/tests consume scene data. No capability imports scenes. Discovery descriptors reference scene IDs as metadata, not executable imports.

## PUBLIC API
Scene catalog records {id, level, title, document, expectations, requirements}. Planned levels and acceptance targets:

| Level / scene ID | Composition | Acceptance |
| --- | --- | --- |
| basic / basic-pbr | primitive + physical + static camera + approved HDRI | visible sphere, roughness response, correct output and cleanup |
| intermediate / intermediate-dissolve | procedural geometry + dissolve + timeline + input | endpoint visibility/shadows and scrub reproducibility |
| advanced / advanced-particle-rail | sampler + morph particles + rail + studio lights | synchronized movement, constrained fallback and bounded counts |
| cinematic / chrome-emergence | chrome hero + HDRI + particles + distortion/dissolve + rail + bloom | particle formation transfers to solid hero, readable framing and deliberate transition |
| HDRI realism / hdri-material-lab | roughness/metalness ladder + transmission + studio shadows + lens/DOF | rotation/reflection/color tests; screen-space limitations visible |
| extreme / extreme-instanced-storm | high-density instancing/qualified GPU field + trails + dynamic camera + optional motion | qualified hardware report, truthful degradation and leak stability |

## DATA FLOW
Agent selects discovery results → authors refs/params/tracks → schema/compatibility validation → composition runtime → deterministic capture and expected invariants.

## IMPLEMENTATION ORDER
basic-pbr at gate 1 → intermediate/advanced at gates 2–3 → cinematic at gate 3 → realism at gate 4 → extreme only after gate 5 hardware qualification.

## IMPORTANT PSEUDOCODE
```text
for scene in publishedSceneCatalog:
  validate schema, capability versions, refs and asset provenance
  for checkpoint in expectations:
    load fixed seed/quality; await ready
    seek using declared analytic/replay policy; await render completion
    capture and check structural + visual invariants
  dispose scene; compare resource counters to warmed baseline
```

Chrome emergence uses a shared eight-second timeline: 0–2 seconds establishes particles/environment; 2–5 attracts/morphs particles while dissolve threshold goes 1→0; 5–6 fades particles; 6–8 settles camera/hero and transitions. Exact artistic curves are authored later within those semantic checkpoints; reusable transition behavior remains in capabilities.

## CONSTRAINTS
No scene enters the published catalog until referenced capabilities/assets exist. Provide an explicit offline approved fixture and constrained variant; do not silently claim a neutral fallback meets an HDRI requirement. Keep realism uncluttered enough to inspect material response.

## PERFORMANCE REQUIREMENTS
Declare per-scene totals/minimum required features, not only per-node costs. Extreme is opt-in, never default startup. Fix quality during captures; interactive adaptation is labeled.

## RESOURCE LIFECYCLE
Scene documents own no resources. Runtime owns instantiated sessions. Network/user assets follow leases; repeated switching is a mandatory acceptance condition.

## ERROR HANDLING
Missing capability/assets/unsupported profile shows actionable requirements rather than blank canvas. Failed scene selection retains previous active scene.

## TESTING REQUIREMENTS
Schema/refs/manifest tests, deterministic time captures, visible camera framing, no NaNs/console errors, roughness/rotation response, motion synchronization, budgets and repeated replacement.

## INTEGRATION REQUIREMENTS
Descriptors link valid scene IDs; tooling reports coverage by capability/family. Agent-facing examples show minimal reusable compositions as well as full showcases, never copied implementation code.

## COMPLETION CHECKLIST
- [ ] Each delivered level has complete composition/expectations.
- [ ] No duplicated reusable algorithm.
- [ ] Assets and quality requirements explicit.
- [ ] Checkpoint screenshots inspected.
- [ ] Coverage/performance/cleanup evidence recorded.
