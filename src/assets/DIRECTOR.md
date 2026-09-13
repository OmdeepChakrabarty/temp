# Asset service director

## PURPOSE
Resolve, fetch, decode and share assets independently of renderer state and file storage.

## RESPONSIBILITIES
AssetService/provider resolution, texture/HDR loading, optional tested EXR/models, provenance, progress, cancellation, retries and byte-budgeted cache. Begin with texture and HDR loaders.

## NON-RESPONSIBILITIES
No PMREM, environment assignment, material creation, implicit license assumptions or mandatory external provider. Root assets/ stores approved files.

## DEPENDENCIES
Core leases/scopes/errors, fetch/File/Blob, version-matched Three.js loaders. Registry validates manifests; service still checks runtime limits.

## DEPENDENCY DIRECTION
Assets → core. Consumers use the core AssetService interface injected by app, not concrete cache internals.

## PUBLIC API
resolve(assetId,manifest), acquireTexture(descriptor,options,signal), acquireRadiance(descriptor,signal), registerProvider(provider), inspectCache(), evictUnused(), dispose(). Acquisitions return leases; decode/color-role settings are part of identity.

## DATA FLOW
Manifest/File/approved URL → provider descriptor → canonical key → bounded fetch/decode → shared lease → consumer. Report source identity and selected variant.

## IMPLEMENTATION ORDER
Identity/provenance → local textures/HDR → leases/dedup → cancellation/LRU → File input → opt-in external providers → additional formats as needed.

## IMPORTANT PSEUDOCODE
```text
acquire(key, signal):
  reuse entry or enqueue bounded job
  add consumer reservation; race shared job with consumer cancellation
  on abort: remove this reservation only
  abort shared fetch only if no reservations/leases remain
  after decode: discard late unwanted output or retain within idle budget
  return idempotent lease, increment delivered refcount
release():
  decrement once; mark lastUsed
  evict oldest zero-ref entries until under byte budget
```

Not all decode loaders support cancellation: late-result disposal remains mandatory. Remove failed entries or expire them after bounded backoff.

## CONSTRAINTS
Normal CORS, approved HTTPS, explicit network permission; no hidden proxy. Bound encoded bytes/decoded dimensions. Distinguish color/data texture keys. User files are session-local unless saved intentionally.

## PERFORMANCE REQUIREMENTS
Default four concurrent loads; configurable decoded-byte budget; smaller variants for constrained profiles; no unbounded permanent cache or repeated parse work in frames.

## RESOURCE LIFECYCLE
Own decoded textures, owned object URLs and relevant ImageBitmaps. Revoke/close only after consumers/uploads/recovery requirements finish; never revoke borrowed caller URLs. Service disposal cancels jobs and disposes late outputs. PMREM ownership is elsewhere.

## ERROR HANDLING
ASSET_NOT_FOUND, LICENSE_METADATA_MISSING, NETWORK_DISABLED, CORS_OR_FETCH_FAILED, DECODE_FAILED, ASSET_TOO_LARGE, ABORTED. Explain indistinguishable network/CORS failures honestly and retain the previous scene.

## TESTING REQUIREMENTS
Shared concurrent acquire; one/all abort; late decode; retry; zero-ref-only eviction; exact cleanup; color-key separation; local/offline/controlled network; oversized input; File URL teardown.

## INTEGRATION REQUIREMENTS
Environment leases radiance during conversion/background use. App supplies manifest/network policy. Root asset contract governs licensing and redistribution.

## COMPLETION CHECKLIST
- [ ] All sources use one descriptor model.
- [ ] Cancellation/ref counts tested.
- [ ] No renderer-state mutation.
- [ ] Provenance/cache bytes inspectable.
- [ ] Offline tests avoid external URLs.
