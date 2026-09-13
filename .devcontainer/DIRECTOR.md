# Codespaces development environment director

## PURPOSE
Specify a reproducible low-friction GitHub Codespaces workspace without requiring a GPU server or powerful local workstation.

## RESPONSIBILITIES
At gate 0 create devcontainer.json and, only if necessary, a small container image definition. Pin supported Node LTS, npm-compatible environment and browser-test system dependencies. Configure private port 5173 forwarding and bounded test workers. The repository currently resides on GitLab; it must first be published/mirrored to GitHub for GitHub Codespaces. This document does not provision that mirror or a Codespace.

## NON-RESPONSIBILITIES
No Three.js implementation, application-specific scripts duplicated here, mandatory Colab/CUDA/GPU passthrough, automatic external HDR downloads or embedded credentials.

## DEPENDENCIES
GitHub Codespaces/devcontainers support, supported Node LTS, project package lockfile, Playwright's selected browser/system requirements. Choose and verify exact versions when implementing gate 0, not speculative pins in this documentation pass.

## DEPENDENCY DIRECTION
Devcontainer invokes project tooling; application code never imports environment configuration. The same npm scripts work outside Codespaces.

## PUBLIC API
Intended workflow after gate 0:

```text
create Codespace from the GitHub-hosted repository
npm ci
npm run validate                 # after the corresponding gates exist
npm run dev -- --host 0.0.0.0
open privately forwarded port 5173
npm run capabilities -- --query dissolve --json
npm run capture -- --scene basic-pbr --time 1 --seed 42 --quality balanced
```

Commands are implementation targets, not available in this docs-only checkout. Record minimum memory/storage from actual clean-container runs; begin targeting a small two-core Codespace with one browser worker.

## DATA FLOW
Repository/lockfile → reproducible environment → build/test server on remote CPU → forwarded preview → viewing browser renders on its GPU. Headless browser in the Codespace may use software rendering and must report that distinction.

## IMPLEMENTATION ORDER
Pin Node/image → clean install → compiler/unit/build commands → Playwright browser/system setup → port forwarding → capture smoke → clean rebuild verification and resource tuning.

## IMPORTANT PSEUDOCODE
```text
post-create:
  verify pinned Node/npm versions
  install exactly from committed lockfile
  install selected browser and documented system dependencies
  do not download licensed/optional art assets
smoke:
  run unit/build checks; launch preview with owned process handle
  probe WebGL2; capture approved basic fixture if supported
  mark software rendering as functional-only evidence
  close browser and server in finally
```

## CONSTRAINTS
Private forwarding by default; no secret in committed config. Use non-root development user where supported. Do not disable browser isolation merely to bypass setup problems. Network failures produce actionable setup guidance rather than silently changing versions.

## PERFORMANCE REQUIREMENTS
Bound worker/process concurrency, reuse dependency caches safely by lockfile identity, keep mandatory assets small, avoid GPU requirements. High-end hardware timings require a labeled external browser/device qualification run; ordinary development still works remotely.

## RESOURCE LIFECYCLE
Workspace owns temporary servers/browser processes and package caches; tooling closes owned processes. Document cache/report cleanup and avoid filling workspace with unbounded captures. Stopping a Codespace should not leave a required external compute service running.

## ERROR HANDLING
Missing browser/system library/port/WebGL reports include exact failed step and recovery. Unsupported WebGL cannot be labeled a passing render test. Never assume Colab can repair a missing browser GPU.

## TESTING REQUIREMENTS
Fresh container rebuild, npm ci reproducibility, forwarded preview access, browser smoke and software/hardware labeling, two-core worker limits, clean shutdown and no automatic asset downloads.

## INTEGRATION REQUIREMENTS
Root package scripts are authoritative; app uses Vite on 5173; tooling provides all validation/capture commands; assets supplies offline approved fixtures. Future optional compute backends live in separate tooling adapters exchanging assets/jobs, not core services.

## COMPLETION CHECKLIST
- [ ] Fresh Codespace reaches preview using documented steps.
- [ ] Lockfile/Node/browser versions reproducible.
- [ ] No GPU or external compute required for routine work.
- [ ] Functional versus hardware tests distinguished.
- [ ] Private forwarding and process cleanup verified.
