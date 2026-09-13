# Asset storage and licensing director

## PURPOSE
Store approved distributable media and reproducible manifest records separately from loading/rendering code.

## RESPONSIBILITIES
Plan manifest JSON, attribution/license records and small approved texture/HDR test assets. Provide resolution variants and checksums for reproducible fixtures. No media is supplied by this documentation pass. Keep initial files flat; any future provider/format directory requires a director.

## NON-RESPONSIBILITIES
No loading code, PMREM outputs, renderer state, mandatory provider account, arbitrary user uploads committed automatically or assumption that an online HDRI is freely redistributable.

## DEPENDENCIES
Canonical manifest schema from registry and explicit asset rights from creators/providers. No runtime dependencies.

## DEPENDENCY DIRECTION
Assets are data consumed by src/assets and tooling. Files must not depend on Three.js implementation paths. Runtime source does not bake provider URLs into material/environment factories.

## PUBLIC API
Manifest entry fields: id, kind, location {local|external|session}, source/provider, creator, license {identifierOrText, attribution, redistributionAllowed}, colorRole, optional checksum/dimensions/variants/byteSize. A session File reference is a runtime manifest extension, not a persistent serializable filesystem path. Unknown rights are represented explicitly and block redistribution.

## DATA FLOW
Approved source/user input → provenance review → local manifest or session descriptor → AssetService resolution → consumer lease. External source remains external unless redistribution permission is verified and the asset deliberately vendored.

## IMPLEMENTATION ORDER
Manifest schema/validation → tiny authored or demonstrably licensed test fixture + attribution → approved HDR radiance fixture for gate 1 → optional higher-resolution variants → future provider manifests.

## IMPORTANT PSEUDOCODE
```text
admit distributable asset:
  require creator/source/license/attribution and explicit redistribution right
  verify bytes match checksum and declared format/dimensions
  reject unsupported license decision as needing human review
  store original license/attribution with manifest record
resolve test asset:
  use local approved variant; forbid external network in deterministic tests
  if required file missing: actionable failure, never silent internet download
```

For Vite, treat root assets/ as the configured public directory in the future toolchain, so explicit manifest locations are stable root-relative URLs. Do not commit secrets or private user files there: approved public assets may be served/bundled. User File/Blob uploads remain outside this directory. Avoid a separate undocumented public/ tree.

## CONSTRAINTS
URLs require compatible CORS for browser fetch. Attribution obligations survive redistribution and report export where required. Do not assume CC0 or invent a license; retain evidence. Keep original radiance separate from generated PMREM, which is runtime/cache data.

## PERFORMANCE REQUIREMENTS
Small local test fixtures; target 1k/2k/4k HDR variants by quality where legitimately available. Record decoded dimensions and estimated memory; do not infer memory from compressed download size. Large optional files are not mandatory clone/startup payloads.

## RESOURCE LIFECYCLE
Repository files have no runtime GPU ownership. User Files/object URLs follow session leases. Build artifacts copy only approved local assets; downloaded optional assets have a documented local cache/cleanup policy outside tracked files.

## ERROR HANDLING
MISSING_PROVENANCE, REDISTRIBUTION_NOT_APPROVED, CHECKSUM_MISMATCH, MISSING_LOCAL_ASSET. Distinguish legal unknowns from network failures; require clarification of rights rather than inventing permission.

## TESTING REQUIREMENTS
Manifest required fields, local file existence/checksum, variant validity, color-role correctness, attribution preservation, external-network-disabled test mode and absence of session/private data in production bundle.

## INTEGRATION REQUIREMENTS
Environment uses asset IDs only; AssetService handles sources uniformly; showcases reference declared licenses/variants; tooling validates assets before capture.

## COMPLETION CHECKLIST
- [ ] Approved HDR fixture exists before gate 1 passes.
- [ ] Every tracked media file has provenance/rights.
- [ ] User/external/local strategies documented and tested.
- [ ] No renderer/cache implementation stored here.
- [ ] Offline fixtures and attribution checks pass.
