# Session Handoff — Verified State (origin/main at commit below)

Verified against actual git log origin/main, not chat summary. Each row shows actual file evidence read; no family reported complete based solely on commit hash or passing test count.

| Family | Commit | State | Verified evidence | Unimplemented gaps (explicit, per DIRECTOR.md) |
|---|---|---|---|---|
| geometry | b47b65e | complete | primitive.ts + descriptor + schema; factory object form; 23/23 suite | none |
| materials | d95bfc3 | complete | physical.ts + descriptor + schema; factory object; 23/23 suite | none |
| cameras | 109f544 (contract fix e9d72f5) | complete | perspective.ts + descriptor + schema; real scope dispose in factory; 25/25 suite | none |
| lighting | bb24f0a | complete | studio.ts + descriptor + schema; scope/ownDisposable; 25/25 suite | none |
| environment | 09fdf29 | complete | hdri.ts + descriptor + schema; PMREM scope ownership; 25/25 suite | GPU PMREM build not browser-tested |
| shaders | bb5664f (fix a69cd94) | partial — core verified; gap documented | basicFactory object form; extension.ts has buildExtension/installExtensions/createShadowVariants + cpuNoise3D/cpuFBM/cpuSchlickFresnel/cpuGradientInterpolate/cpuRefractionSnell + makeProgramKey + real GLSL source strings; descriptor/scema present; node --check/test pass; 25/25 suite | GPU shader compile untested (DIRECTOR.md separates source tests from browser compile); hook bodies contain named hook names but math functions not wired into hook GL bodies; installExtensions patches fragmentShader only, vertexShader path unimplemented |
| animation | bbad643 | partial — scalar layer only | easing.ts (sampleScalar, mapLoopTime, easeInOut); timeline.ts (keyframe binary-search, loop/clamp/ping-pong); errors.ts (5 named errors); spring.ts (analytic static + bounded acknowledgment); descriptor/schema; test verifies descriptor + evaluate/loop | vector/color/quaternion tracks (DIRECTOR step 2) NOT implemented; procedural functions sine/noise/orbit (step 4) NOT implemented; writer arbitration / binding compiler / MULTIPLE_WRITERS validation (step 3) NOT implemented; multi-family synchronized fixture (integration) NOT implemented |
| particles | — | not started | DIRECTOR.md only | — |
| post | — | not started | DIRECTOR.md only | — |
| interaction | — | not started | DIRECTOR.md only | — |

Shared contract status: CapabilityFactory interface (object with `.prepare`) established at `e9d72f5`; all families implement `{ prepare }`; `composition/prepare.ts` `factory.prepare(...)` call verified correct; no further shared changes required.

Known architectural issue resolved: missing `session.ts` source (composition/session.js in old `.test-dist`) noted as incompletely folded into `prepare.ts`; `PreparedSessionImpl` returned as inline dummy in `prepareScene`; not required for capability work but noted for future session-layer completeness.

Build/test verification at this commit (run independently, not summarized):
- `npx tsc --noEmit`: 0 errors
- `npm run test:unit`: 25/25 pass
- `node --check tests/animation.test.mjs`: 0
- `node --check tests/shaders.test.mjs`: 0
- `node --check tests/environment.test.mjs`: 0

Next session must start by reading this file, not trusting chat summary.
