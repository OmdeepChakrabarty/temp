# Agent tooling director

## PURPOSE
Make the discover → compose → inspect → validate loop reproducible from a small Codespace or CI environment.

## RESPONSIBILITIES
Implement catalog/type generation, factory-table parity, metadata query CLI, scene validation, import/doc checks, browser capture/performance wrappers and structured reports. Scripts live here; generated schemas/types/catalog live in their owning source modules. Pin compatible npm tools and lockfile at gate 0.

## NON-RESPONSIBILITIES
No application algorithms, runtime remote plugin loading, required external compute, fabricated performance evidence or downloaded assets without license approval.

## DEPENDENCIES
Node LTS, TypeScript, Vite, ESLint, Vitest, Playwright, Ajv and json-schema-to-typescript as planned in AGENTS.md. Browser automation uses the versioned app inspection bridge. Verify/pin releases during implementation; these commands do not exist yet.

## DEPENDENCY DIRECTION
Tooling consumes metadata/schemas/documents and public APIs. Runtime code never imports tooling or Node built-ins. Generated loader imports stay in app.

## PUBLIC API
Implement these npm script contracts:

| Command | Result |
| --- | --- |
| npm run dev -- --host 0.0.0.0 | Vite preview on private forwarded 5173 |
| npm run lint / npm run typecheck | static/style/type gates |
| npm run test:unit | pure and contract tests |
| npm run catalog:generate | normalized catalog, canonical generated types and reviewed factory map |
| npm run catalog:check | validate metadata/factory/example parity and generated freshness |
| npm run capabilities -- --query dissolve --json | metadata search without renderer; category/IBL/output filters also supported |
| npm run scenes:validate | all published scene/ref/asset/compatibility checks |
| npm run build | production bundle, no development bridge |
| npm run test:browser | development-preview shader/runtime/readiness checks; separate production smoke |
| npm run capture -- --scene basic-pbr --time 1 --seed 42 --quality balanced | fixed-viewport PNG + JSON manifest/report |
| npm run perf -- --scene chrome-emergence --profile balanced | warmed timings/counters with hardware/software qualification |
| npm run docs:check | links, final tree and mandatory director headings |
| npm run validate | lint, types, unit/contracts, catalog, scenes, build and browser functional gates |

Support --help, --json and explicit output-directory options. Document unsupported hardware gates separately from functional validation. CLI errors use nonzero status, structured code/path/remediation and no misleading success. Capture accepts viewport/browser options with recorded defaults (1280×720, Chromium, DPR 1).

## DATA FLOW
Canonical schemas/descriptors → validated/generated outputs → checks; scene selection → browser bridge load/seek/ready → capture/metrics → report artifacts. Never scrape UI text when the bridge provides structured data.

## IMPLEMENTATION ORDER
Package/lockfile/scripts → schema/type/catalog checks → unit/build gates → metadata CLI → browser bridge tests/capture → performance/reporting → documentation/import checks. Tests/tooling grow alongside each capability gate.

## IMPORTANT PSEUDOCODE
```text
generate:
  enumerate reviewed descriptor files in stable sorted order
  validate schemas/IDs/versions/examples and factory entry parity
  generate canonical types/catalog/loader table deterministically
  check mode: regenerate in memory and compare; exit nonzero on drift
capture:
  start owned preview server if needed; await bounded readiness timeout
  launch browser; install page/console/rejection listeners before navigation
  probe WebGL2 and record software/hardware facts
  bridge.loadScene; pause; set seed/quality via document; setTime
  await bridge.ready and next completed render
  export PNG + manifest + diagnostics; fail on errors
  always close browser/server and temporary capture resources
```

## CONSTRAINTS
No screenshots or benchmark reports committed by default; baseline updates are explicit reviewed actions. No baseline auto-accept on failure. CLI input is data and never a shell command or module path. Keep CI/provider configuration optional until chosen; do not assume GitLab or GitHub runners have GPUs.

## PERFORMANCE REQUIREMENTS
Default one browser worker and two unit workers on small Codespaces, configurable. Avoid launching one browser per capability; reuse isolated contexts with clean runtime teardown. Warm performance runs for 2 seconds then sample at least 10 seconds; record p50/p95 and dropped frames.

## RESOURCE LIFECYCLE
Own subprocesses, browser contexts, local servers and temporary output directories; cleanup on failure/interruption. Retain requested artifacts, not abandoned processes. Never dispose an externally supplied preview server.

## ERROR HANDLING
SCHEMA_DRIFT, INVALID_CATALOG, BROWSER_UNAVAILABLE, WEBGL_UNSUPPORTED, CAPTURE_TIMEOUT, RUNTIME_DIAGNOSTIC_ERROR and PERFORMANCE_UNQUALIFIED. A software renderer produces functional artifacts but cannot pass a hardware target gate.

## TESTING REQUIREMENTS
CLI golden JSON, stable sort/generation, stale artifact rejection, invalid args/paths, server cleanup/timeouts, bridge version mismatch, shader failure detection, report metadata completeness and production bridge absence.

## INTEGRATION REQUIREMENTS
AGENTS.md references these script contracts. Every new capability updates generator inputs, examples and conformance coverage. Tooling records revision/lockfile hash and asset identities to reproduce results.

## COMPLETION CHECKLIST
- [ ] Commands implemented with documented help/status.
- [ ] Discovery runs without a renderer.
- [ ] Capture readiness and cleanup verified.
- [ ] Reports distinguish estimates/measurements/unsupported gates.
- [ ] Generated files and docs checked automatically.
