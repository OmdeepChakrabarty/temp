# Camera director

## PURPOSE
Provide predictable viewing and cinematic motion through composable camera rigs.

## RESPONSIBILITIES
Plan cameras.perspective, orbit, cinematic, rail, lookAt, shake and dolly. Expose lens/FOV, focus distance and aperture-like DOF intent as separate camera metadata; post implements blur. Orbit can use version-matched controls with lifecycle/input adapters.

## NON-RESPONSIBILITIES
No scene geometry factory imports, own RAF, postprocessing implementation, or claim that FOV alone physically simulates a lens.

## DEPENDENCIES
Core, Three.js cameras/math and selected controls addon. Paths and targets are borrowed typed handles.

## DEPENDENCY DIRECTION
Cameras → core. Path handles decouple geometry; interaction supplies commands; post reads camera/depth/lens metadata.

## PUBLIC API
Factories return camera and optional rig-object handles plus progress, position, orientation, target, fovDegrees, focusDistanceMeters and shake-amplitude channels as appropriate. LensSpec defines FOV or focalLength/sensorWidth with one canonical conversion, not conflicting independent values.

## DATA FLOW
Timeline/input commands → base rig position → path/look-at orientation → additive seeded shake → projection/world updates → active presentation camera and lens metadata.

## IMPLEMENTATION ORDER
Static perspective/resize → orbit command adapter → look-at/cinematic rig → constant-distance rail → dolly/lens conversion → additive shake and cut notifications.

## IMPORTANT PSEUDOCODE
```text
rail frame:
  distance = clamp(progress,0,1) * path.length
  sampleDistance(distance, position, tangent)
  compute orientation from target or parallel-transport frame
  handle parallel up/tangent and zero-length look direction explicitly
  apply seeded band-limited shake to a copy of base transform
  update projection only when lens/aspect changes
camera cut:
  emit discontinuity token; reset post/particle temporal histories
```

Dolly moves camera in meters; zoom changes projection; dolly-zoom derives FOV from distance and fixed subject framing with validated near/far limits. Shake must not accumulate drift into the base pose.

## CONSTRAINTS
Exactly one active presentation camera. Positive aspect/near and far > near. Clamp orbit near poles and prohibit coincident look-at target without a fallback orientation. Avoid multiple control/timeline owners of base transform; additive shake is explicit.

## PERFORMANCE REQUIREMENTS
No per-frame path rebuilding; reuse matrices/quaternions. Projection updates are dirty-driven. Near/far ranges should be tight enough for usable depth precision.

## RESOURCE LIFECYCLE
Cameras have no GPU buffer disposal, but owned controls/listeners/bindings require cleanup. Borrowed paths/targets are not disposed. Resize listeners belong to core/app, not each rig.

## ERROR HANDLING
INVALID_LENS, DEGENERATE_CAMERA_PATH, CAMERA_WRITER_CONFLICT. Preserve last valid orientation at transient degeneracy and report once when appropriate.

## TESTING REQUIREMENTS
Constant-speed rails; no shake drift; stable loop seams/up vectors; lens conversions/dolly framing; resize projection; exclusive writer checks; input teardown; DOF and cut/history integration.

## INTEGRATION REQUIREMENTS
Composition selects one camera; timeline binds progress; interaction queues orbit commands; post consumes depth/lens metadata and cut tokens without importing camera factories.

## COMPLETION CHECKLIST
- [ ] Static/orbit/rail/dolly vocabulary composable.
- [ ] Lens units and degeneracy rules tested.
- [ ] Base versus additive ownership explicit.
- [ ] Cut/resize integration verified.
- [ ] Controls cleanly dispose.
