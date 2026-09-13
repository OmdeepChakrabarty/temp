import type { DiagnosticsSink } from './diagnostics.js';
import type { QualityProfile } from './quality.js';

export type { ResourceScope } from './scope.js';

export type Ownership = 'borrowed';
export type FramePhase = 'simulation' | 'presentation' | 'camera';

export interface TypedHandle<T = unknown> {
  readonly kind: string;
  readonly version: number;
  readonly value: T;
  readonly ownership: Ownership;
  readonly features: readonly string[];
}

export interface PropertyHandle<T> extends TypedHandle<T> {
  readonly kind: 'property';
  readonly valueType: string;
  readonly writerPolicy: 'exclusive' | 'additive';
  read(): T;
  write(value: T): void;
}

export interface FrameContext {
  readonly tick: number;
  readonly simulationTimeSeconds: number;
  readonly presentationTimeSeconds: number;
  readonly interpolation: number;
}

export interface CapabilityInstance {
  readonly outputs: ReadonlyMap<string, TypedHandle>;
  readonly hooks?: {
    simulate?(frame: FrameContext): void;
    evaluate?(frame: FrameContext): void;
    present?(frame: FrameContext): void;
  };
  reset?(seed: number): void;
  resize?(viewport: Viewport): void;
  dispose(): void | Promise<void>;
}

export interface Viewport {
  readonly cssWidth: number;
  readonly cssHeight: number;
  readonly pixelWidth: number;
  readonly pixelHeight: number;
  readonly dpr: number;
}

export interface PrepareContext {
  readonly scope: import('./scope.js').ResourceScope;
  readonly signal: AbortSignal;
  readonly diagnostics: DiagnosticsSink;
  readonly seed: number;
  readonly quality: QualityProfile;
}

export interface CapabilityFactory<P> {
  prepare(params: P, ports: ReadonlyMap<string, TypedHandle>, context: PrepareContext): Promise<CapabilityInstance>;
}

export interface DeviceProfile {
  readonly backend: 'webgl2';
  readonly maxTextureSize: number;
  readonly maxColorAttachments: number;
  readonly maxDrawBuffers: number;
  readonly supportsFloat32Textures: boolean;
  readonly supportsDepthTexture: boolean;
  readonly supportsShaderTextureLOD: boolean;
  readonly anisotropyMax: number;
}

export interface RenderPipeline {
  render(scene: unknown, camera: unknown, frame: FrameContext): void;
  resize(viewport: Viewport): void;
  dispose(): void | Promise<void>;
}

export interface PreparedSession {
  readonly id: string;
  readonly scene: unknown;
  readonly camera: unknown;
  readonly pipeline: RenderPipeline;
  readonly instances: readonly CapabilityInstance[];
  readonly rendererGeneration: number;
  resize?(viewport: Viewport): void;
  dispose(): void | Promise<void>;
}

export interface EnvironmentBinding {
  readonly prefilteredMap: unknown;
  readonly intensity: number;
  readonly rotation: number;
  readonly sourceId: string;
  readonly rendererGeneration: number;
  readonly iblModel: 'three-pmrem-cubeuv';
}
