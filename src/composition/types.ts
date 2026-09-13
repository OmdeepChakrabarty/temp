import type { TypedHandle, CapabilityInstance, ResourceScope, FrameContext } from '../core/types.js';
import type { CapabilityDescriptor } from '../registry/types.js';

export interface SceneDocument {
  readonly schemaVersion: string;
  readonly id: string;
  readonly seed: number;
  readonly quality: 'low' | 'balanced' | 'high';
  readonly assets?: Readonly<Record<string, unknown>>;
  readonly nodes: readonly SceneNode[];
  readonly bindings?: readonly PropertyBinding[];
  readonly presentation?: PresentationSpec;
  readonly requirements?: Readonly<Record<string, unknown>>;
}

export interface SceneNode {
  readonly id: string;
  readonly capability: string;
  readonly version: string;
  readonly params: Readonly<Record<string, unknown>>;
  readonly inputs?: Readonly<Record<string, NodeInput>>;
}

export interface NodeInput {
  readonly $ref: string;
}

export interface PropertyBinding {
  readonly target: string;
  readonly channel: string;
  readonly source: string;
  readonly sourceOutput: string;
}

export interface PresentationSpec {
  readonly objects?: readonly string[];
  readonly camera?: string;
  readonly environment?: string;
  readonly effects?: readonly string[];
}

export interface ConstructionPlan {
  readonly document: SceneDocument;
  readonly order: readonly string[];
  readonly edges: ReadonlyMap<string, readonly string[]>;
}

export interface PreparedSession {
  readonly id: string;
  readonly scene: unknown;
  readonly camera: unknown;
  readonly pipeline: RenderPipeline;
  readonly instances: readonly CapabilityInstance[];
  readonly rendererGeneration: number;
  readonly scope: ResourceScope;
  resize?(viewport: import('../core/types.js').Viewport): void;
  dispose(): void | Promise<void>;
}

export interface RenderPipeline {
  render(scene: unknown, camera: unknown, frame: FrameContext): void;
  resize(viewport: import('../core/types.js').Viewport): void;
  dispose(): void | Promise<void>;
}

export interface FactoryResolver {
  resolve(capabilityId: string, version: string): import('../core/types.js').CapabilityFactory<unknown> | undefined;
}

export interface PrepareContext {
  readonly scope: ResourceScope;
  readonly signal: AbortSignal;
  readonly diagnostics: import('../core/diagnostics.js').DiagnosticsSink;
  readonly seed: number;
  readonly quality: import('../core/quality.js').QualityProfile;
  readonly rendererGeneration: number;
  readonly factoryResolver: FactoryResolver;
}

export interface NodePreparationResult {
  readonly nodeId: string;
  readonly instance: CapabilityInstance;
  readonly outputs: ReadonlyMap<string, TypedHandle>;
}
