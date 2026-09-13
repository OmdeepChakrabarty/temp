# AI-Native Three.js Animation Harness

A blueprint for a **capability platform**, not an example gallery: reusable Three.js capabilities, typed scene composition, machine-readable discovery, and an inspectable validation loop for AI coding agents.

**Status: Gate 0 foundation in progress.** The repository now has a strict TypeScript configuration plus tested, renderer-free core primitives for resource scopes, leases, diagnostics, deterministic random streams, fixed-step time, and quality limits. There is not yet a browser application, capability catalog, Three.js dependency set, or runnable scene.

## Start here

1. Read [AGENTS.md](AGENTS.md) for the global implementation contract.
2. Read [ARCHITECTURE.md](ARCHITECTURE.md) for decisions, interfaces, dependency graph, scene format, budgets, and delivery gates.
3. Follow the `DIRECTOR.md` in the directory you implement. Every directory in the blueprint has a local contract.
4. Implement the first vertical slice before expanding the capability catalog.

## Product

An agent should be able to ask for cinematic chrome emerging from particles and discover existing geometry, PBR materials, HDRI lighting, particle morphing, camera rails, synchronized animation, bloom, and transitions. Showcases prove those compositions; they never become the library's source of reusable behavior.

The realism stack combines HDRI/IBL, physically based materials, meaningful roughness/metalness, quality geometry and normals, reflections/refractions, shadows, camera behavior, tone mapping, color management, and restrained post-processing. HDRI alone does not produce realism.

## Architecture in one paragraph

One TypeScript project, native browser UI, Vite development/build tooling, Three.js WebGL2 rendering, and Three.js addons. A small core owns scheduling, resource scopes, diagnostics, quality, and the renderer. Independent capability families consume core services. A metadata-only registry discovers capabilities; an explicit factory table constructs them. Composition validates a serializable scene graph, prepares it transactionally, binds typed outputs, and commits it at a frame boundary. One application shell hosts previews and agent inspection.

## Development target

Use GitHub Codespaces for Node tooling and headless browser validation; the forwarded preview renders on the viewing browser's GPU. This repository currently lives on GitLab: publish or mirror it to a GitHub repository before creating a Codespace. No Codespaces provisioning is implied by these documents. No Colab dependency is required.

The available foundation checks are `npm run typecheck` and `npm run test:unit`. The remaining toolchain commands are specified in [tooling/DIRECTOR.md](tooling/DIRECTOR.md) and are implemented incrementally with their owning delivery gates. Once the dependency set and lockfile are added, the intended preview workflow is `npm ci`, `npm run dev -- --host 0.0.0.0`, then discover → compose → preview → inspect → validate.

## Delivery order

Contracts/toolchain → core and registry → geometry/materials/assets/environment → first composed PBR scene → animation/cameras/lighting/interaction → particles/shader extensions/post-processing → higher-end compositions → evaluation and tuning. Tooling and tests evolve alongside every slice, not after the library is complete.

## Final directory blueprint

All entries below exist in this documentation pass. Future source files are described by the local contracts, not scaffolded as empty implementations.

```text
.
├── README.md
├── AGENTS.md
├── ARCHITECTURE.md
├── .devcontainer/
│   └── DIRECTOR.md
├── assets/
│   └── DIRECTOR.md
├── src/
│   ├── DIRECTOR.md
│   ├── core/
│   │   └── DIRECTOR.md
│   ├── assets/
│   │   └── DIRECTOR.md
│   ├── registry/
│   │   └── DIRECTOR.md
│   ├── capabilities/
│   │   ├── DIRECTOR.md
│   │   ├── geometry/
│   │   │   └── DIRECTOR.md
│   │   ├── materials/
│   │   │   └── DIRECTOR.md
│   │   ├── shaders/
│   │   │   └── DIRECTOR.md
│   │   ├── environment/
│   │   │   └── DIRECTOR.md
│   │   ├── particles/
│   │   │   └── DIRECTOR.md
│   │   ├── animation/
│   │   │   └── DIRECTOR.md
│   │   ├── cameras/
│   │   │   └── DIRECTOR.md
│   │   ├── lighting/
│   │   │   └── DIRECTOR.md
│   │   ├── post/
│   │   │   └── DIRECTOR.md
│   │   └── interaction/
│   │       └── DIRECTOR.md
│   ├── composition/
│   │   └── DIRECTOR.md
│   ├── scenes/
│   │   └── DIRECTOR.md
│   └── app/
│       └── DIRECTOR.md
├── tooling/
│   └── DIRECTOR.md
└── tests/
    └── DIRECTOR.md
```

Root documentation is the root contract. When a future change introduces a major directory, add its local director and update this tree. Ordinary source files do not need their own directory or director.
