import type { DiagnosticsSink } from './diagnostics.js';
import type { QualityProfile } from './quality.js';
import type { Lease, ResourceScope } from './scope.js';

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

export interface DeviceProfile {
  readonly backend: 'webgl2';
  readonly maxTextureSize: number;
  readonly maxSamples: number;
  readonly devicePixelRatio: number;
  readonly isSoftwareRenderer: boolean;
  readonly features: readonly string[];
}

export interface RendererAccess {
  readonly rendererGeneration: number;
  withAccess<T>(expectedGeneration: number, operation: () => Promise<T> | T): Promise<T>;
}

export interface EnvironmentBinding {
  readonly prefilteredMap: unknown;
  readonly intensity: number;
  readonly rotationRadians: number;
  readonly sourceId: string;
  readonly rendererGeneration: number;
  readonly iblModel: 'three-pmrem-cubeuv';
}

export interface AssetService {
  acquire<T>(assetId: string, options: Readonly<{ signal: AbortSignal; colorRole?: 'srgb' | 'data' | 'linear-radiance' }>): Promise<Lease<T>>;
}

export interface RenderPipeline<Scene = unknown, Camera = unknown> {
  render(scene: Scene, camera: Camera, frame: FrameContext): void;
  resize(viewport: Viewport): void;
  dispose(): void | Promise<void>;
}

/** A prepared session is opaque to core except for ordered frame hooks and presentation. */
export interface PreparedSession<Scene = unknown, Camera = unknown> {
  readonly scene: Scene;
  readonly camera: Camera;
  readonly pipeline: RenderPipeline<Scene, Camera>;
  readonly instances: readonly CapabilityInstance[];
  resize?(viewport: Viewport): void;
  dispose(): void | Promise<void>;
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
  readonly scope: ResourceScope;
  readonly signal: AbortSignal;
  readonly diagnostics: DiagnosticsSink;
  readonly seed: number;
  readonly quality: QualityProfile;
  readonly rendererAccess?: RendererAccess;
  readonly assets?: AssetService;
}

export interface CapabilityFactory<P> {
  prepare(params: P, ports: ReadonlyMap<string, TypedHandle>, context: PrepareContext): Promise<CapabilityInstance>;
}
