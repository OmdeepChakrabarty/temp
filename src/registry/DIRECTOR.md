# Registry director

## PURPOSE
Discover and validate capabilities without executing their code.

## RESPONSIBILITIES
Canonical descriptor/scene/manifest/port/ref schemas, default normalization, generated catalog, metadata indexes, dependencies and compatibility predicates. Parameter schemas/descriptors live beside implementations. Plan schemas, catalog.generated.json, query.ts, compatibility.ts, validate.ts and index.ts.

## NON-RESPONSIBILITIES
No renderer, fetching, factory execution, remote plugins, or compatibility inferred solely from tags. App owns the factory loader table.

## DEPENDENCIES
Core types, Ajv with JSON Schema 2020-12; build-time json-schema-to-typescript for canonical schema-derived types.

## DEPENDENCY DIRECTION
Registry → core; composition/app/tooling consume registry. Never import capability implementation modules.

## PUBLIC API
query(filter), describe(id, version), normalizeParams(descriptor,input), validateSceneDocument(document), dependencyClosure(selection), checkCompatibility(plan,device). Return match reasons, limitations and supported/unsupported/unknown status; unknown device support is not success.

## DATA FLOW
Local schemas/descriptors → validated generated catalog → indexed search. Scene + device facts → structural/compatibility report → normalized composition input.

## IMPLEMENTATION ORDER
ID/version/ports → schemas/defaults → catalog checks → query → dependencies/predicates → CLI/browser parity.

## IMPORTANT PSEUDOCODE
```text
validate(document):
  reject unknown versions/fields and duplicate IDs
  normalize fresh copies; check finite numbers and units/ranges
  resolve references; compare port kind/version/features
  evaluate conditional requirements against params/device facts
  require explicit dependency providers; do not instantiate hidden nodes
  topo-sort refs; return a concrete cycle path if invalid
query(filter):
  intersect category/tag/output/IBL/backend indexes
  rank text over id/name/description/tags; stable tie-break by ID
  return descriptors/reasons without importing factories
```

Predicates use a small schema-defined algebra: all/any/not, parameter equality/range, device/handle feature and conflict. No JavaScript expressions.

## CONSTRAINTS
Exact capability versions in scenes, independent schema version, explicit tested migrations. Reject additional properties at stable boundaries. Published example IDs resolve. Planned unimplemented inventory stays in docs, not catalog.

## PERFORMANCE REQUIREMENTS
Compile validators once; build indexes once per catalog version. Default result limit 50 with pagination/total count. Cache only immutable metadata.

## RESOURCE LIFECYCLE
Own JSON/index memory only. No live session handles or GPU caches. Development watchers belong to tooling.

## ERROR HANDLING
Return code, JSON pointer, node/capability, expected/actual requirement and remediation. Aggregate independent failures up to a default cap of 100.

## TESTING REQUIREMENTS
Unknown fields/default immutability; duplicate/missing refs; version/cycle errors; conditional features; IBL compatibility; query ranking/pagination; generated freshness; renderer-free import.

## INTEGRATION REQUIREMENTS
Tooling checks descriptor/factory key parity; composition validates actual returned outputs. New port kinds require schema/core and producer/consumer tests.

## COMPLETION CHECKLIST
- [ ] Architecture metadata fields validated.
- [ ] Dissolve/particle/HDRI queries tested.
- [ ] Catalog/types reproducible.
- [ ] Invalid combinations fail before allocation.
- [ ] Metadata imports execute no factory.
