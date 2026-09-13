# Preview and composition-root director

## PURPOSE
Provide a small accessible browser workspace for discovery, composition preview and agent inspection.

## RESPONSIBILITIES
Bootstrap core/services, inject registry/factory loaders and pipeline builder, select scenes, show canvas/discovery/property/timeline/diagnostic panels, handle user HDRI Files and export reproducibility reports. Use native DOM/CSS rather than a UI framework. Plan main.ts, factory-loaders.generated.ts, inspector.ts, controls.ts, styles.css and index.ts.

## NON-RESPONSIBILITIES
No particle/shader/camera algorithms, hidden scene fixes, library-global state, production remote-control endpoint or arbitrary module import from scene JSON.

## DEPENDENCIES
Core/assets/registry/composition/scenes and the explicit reviewed capability loader table. DOM/browser APIs; no extra state framework.

## DEPENDENCY DIRECTION
App is the highest runtime layer. Lower layers never import app. Generated loader table lives here so registry discovery remains implementation-free.

## PUBLIC API
Development-only `window.__HARNESS_DEV__` version 1 with async listCapabilities/query, listScenes, loadScene(documentOrId), setTime(seconds), play(), pause(), ready(), snapshot(), reset(). snapshot returns normalized scene identity, seed/time, requested/effective quality, device/revision, diagnostics, resource counters and timings. Tooling captures canvas via browser automation after ready; no arbitrary code-evaluation API is needed.

## DATA FLOW
UI/agent command → validate and prepare request → latest-wins coordinator → committed runtime → sampled inspector snapshot → screenshot/report. File input creates a session asset descriptor, never commits the file automatically.

## IMPLEMENTATION ORDER
Minimal canvas + basic scene + diagnostics → factory/service injection → discovery/scene selector → timeline/property panels → file inputs/report export → development bridge and accessibility polish.

## IMPORTANT PSEUDOCODE
```text
load(document):
  cancel prior pending preparation, not active session
  increment request token; set visible preparing status
  await composition.prepareScene(validated plan, services, signal)
  if token stale: dispose result; return cancelled
  request frame-boundary commit; await first rendered frame
  publish ready with exact scene/time/generation
HMR/close:
  cancel pending, remove bridge/listeners, dispose harness/services
```

Readiness additionally waits for requested stateful seek and shader/effect warmup. Limit inspector refresh to 5–10 Hz; rendering remains independent. Property edits respect schema units/ranges; structural edits trigger a new transaction, not in-place unsafe graph mutation.

## CONSTRAINTS
Keyboard-accessible controls, labels/focus management, responsive canvas and reduced-motion option. Keep shortcuts out of text inputs. Bridge excluded from production by build configuration and tested as absent. External asset access requires explicit user choice; no implicit downloads on discovery.

## PERFORMANCE REQUIREMENTS
Lazy-load selected capability factories using static import functions; debounce schema search/edit validation. Avoid DOM updates every animation frame. Default basic scene and balanced/constrained profile, not extreme showcase.

## RESOURCE LIFECYCLE
App owns DOM listeners, ResizeObserver, preview coordinator, service roots and development bridge. Dispose them on HMR/unmount; sessions own rendering allocations. Session File URLs are revoked when final users release them.

## ERROR HANDLING
Display structured validation/prepare/compile/runtime errors with node/path and suggested correction. Preserve usable preview after replacement failure. Distinguish unsupported WebGL2 from application failure and from missing assets.

## TESTING REQUIREMENTS
Accessible keyboard flow, fixed seed/time readiness, capture after async seek, latest-wins loads, malformed scene error panel, File asset lifecycle, zero-size/resize, HMR cleanup, production bridge absence and no unnecessary factory imports during discovery.

## INTEGRATION REQUIREMENTS
Tooling uses only the versioned bridge, not private app internals. Device facts feed registry compatibility and quality admission. Context restoration re-prepares the stored document and reports new generation.

## COMPLETION CHECKLIST
- [ ] Agent discover/run/inspect/modify loop works.
- [ ] Ready means a valid requested frame is rendered.
- [ ] Error/quality/resource state visible.
- [ ] Accessible controls and HMR teardown tested.
- [ ] Production build excludes development control bridge.
