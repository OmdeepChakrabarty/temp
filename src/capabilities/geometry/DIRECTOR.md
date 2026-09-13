# Geometry director

## PURPOSE
Supply reusable shapes, paths and sampling data rather than scene-specific meshes.

## RESPONSIBILITIES
Plan geometry.primitive (box/sphere/plane/torus/torusKnot), buffer, proceduralSurface, curve, tube, instanced, morph and surfaceSampler. Support indexed BufferGeometry, normals/UVs/tangents where required, bounds, typed attributes and detail limits. Instanced geometry capability combines borrowed geometry/material with instance transforms and exposes an Object3D; ordinary mesh assembly remains composition.mesh.

## NON-RESPONSIBILITIES
No renderer, lighting, material implementation, particle simulation or global animation clock. Do not make every geometry factory return a Mesh.

## DEPENDENCIES
Core and Three.js geometry/math utilities. Materials and paths are borrowed core handles.

## DEPENDENCY DIRECTION
Geometry → core. Camera/particle factories consume path/sampler handles without importing geometry factories.

## PUBLIC API
Factories emit geometry, path, surface-sampler or object3d handles. Path supports length, sampleDistance(distance,outPosition,outTangent), and optional stable frames. Morph exposes bounded weight property channels. Surface sampler supports sample(seed/index,outPosition,outNormal).

## DATA FLOW
Validated dimensions/control points/attributes → deterministic buffers/path tables → immutable shared geometry or owned mutable instance buffers → composition/camera/particles.

## IMPLEMENTATION ORDER
Primitives and buffer validation → curves/arc-length tables → tubes/surface sampler → procedural surfaces → instancing → topology-compatible morphs.

## IMPORTANT PSEUDOCODE
```text
surface sampler:
  iterate triangles, rejecting out-of-range indices/nonfinite vertices
  compute triangle areas; skip zero-area faces
  build normalized cumulative area table
  sample triangle by binary search of seeded random area
  u = sqrt(random()); v = random()
  barycentric = (1-u, u*(1-v), u*v)
  interpolate position and normal into caller-provided buffers
rail lookup:
  precompute arc lengths with configurable error tolerance
  binary-search distance; interpolate parameter; evaluate curve
```

Use parallel-transport frames for tubes/rails to reduce twist; define a fallback axis for nearly parallel tangents. Morph targets require equal vertex counts/index topology and compatible attributes; unrelated meshes need a separate sampled particle morph, not index guessing.

## CONSTRAINTS
Meters/Y-up; finite attributes, correct item sizes/index ranges, nonzero useful extents. Normal/tangent capabilities must be declared. Transparent instancing does not promise per-instance sorting. Dynamic deformation must update or conservatively expand bounds.

## PERFORMANCE REQUIREMENTS
Generate static buffers once, cache immutable geometry via leases, instance repeated shapes, update only dirty attribute ranges. Default procedural mesh limit 250k vertices balanced/50k constrained unless an explicit budget admits more. Account for all attributes and index buffers.

## RESOURCE LIFECYCLE
Owner disposes BufferGeometry and owned instance resources; material/geometry borrowers do not. Mutable geometry gets a distinct instance or copy-on-write lease. Release CPU sampling tables with their scope.

## ERROR HANDLING
INVALID_TOPOLOGY, MISSING_ATTRIBUTE, DEGENERATE_SURFACE, DETAIL_BUDGET_EXCEEDED include attribute/index paths. Empty/zero-area samplers fail clearly.

## TESTING REQUIREMENTS
Topology/normal/bounds tests; deterministic and statistically area-weighted samples; closed-curve seams; arc-length speed tolerance; tube frame continuity; instanced draw counts; morph endpoints; repeated dispose/resize rendering.

## INTEGRATION REQUIREMENTS
Material compatibility checks consume geometry features. Particles use stable seeded samplers; cameras consume paths. Shadow/deformation fixtures verify expanded bounds.

## COMPLETION CHECKLIST
- [ ] Required geometry vocabulary has tested descriptors as delivered.
- [ ] Outputs expose correct attributes/bounds.
- [ ] Sampler/path algorithms are deterministic.
- [ ] Ownership and draw/memory limits verified.
- [ ] No particle/camera implementation is duplicated here.
