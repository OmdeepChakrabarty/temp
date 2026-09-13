import type { DiagnosticsSink } from './diagnostics.js';
import type { QualityProfile } from './quality.js';
import type { ResourceScope } from './scope.js';

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
  readonly scope: ResourceScope;
  readonly signal: AbortSignal;
  readonly diagnostics: DiagnosticsSink;
  readonly seed: number;
  readonly quality: QualityProfile;
}

export interface CapabilityFactory<P> {
  prepare(params: P, ports: ReadonlyMap<string, TypedHandle>, context: PrepareContext): Promise<CapabilityInstance>;
}
