export type CapabilityStability = 'experimental' | 'stable';
export type IblCompatibility = 'none' | 'preserves-host-pbr' | 'custom-lit' | 'artistic-only';

export interface PortDescriptor {
  readonly kind: string;
  readonly version: number;
  readonly ownership: 'borrowed';
  readonly optional?: boolean;
  readonly requiresFeatures?: readonly string[];
}

export interface CapabilityDescriptor {
  readonly id: string;
  readonly version: string;
  readonly name: string;
  readonly category: string;
  readonly description: string;
  readonly inputSchema: string;
  readonly inputs: Readonly<Record<string, PortDescriptor>>;
  readonly outputs: Readonly<Record<string, PortDescriptor>>;
  readonly dependencies: readonly string[];
  readonly compatibility: Readonly<{ backend: 'webgl2'; ibl: IblCompatibility; requiresFeatures?: readonly string[] }>;
  readonly performance: Readonly<{ costClass: 'low' | 'medium' | 'high'; complexity: string }>;
  readonly lifecycle: Readonly<{ owned: readonly string[]; seek: 'analytic' | 'replay' | 'none'; resize: 'none' | 'rebuild' | 'resize'; contextRecovery: 'reprepare' }>;
  readonly examples: readonly string[];
  readonly tags: readonly string[];
  readonly limitations: readonly string[];
  readonly stability: CapabilityStability;
}

export interface CatalogQuery {
  readonly text?: string;
  readonly categories?: readonly string[];
  readonly tags?: readonly string[];
  readonly outputKind?: string;
  readonly ibl?: IblCompatibility;
  readonly backend?: 'webgl2';
  readonly offset?: number;
  readonly limit?: number;
}

export interface QueryMatch {
  readonly descriptor: CapabilityDescriptor;
  readonly reasons: readonly string[];
}

export interface QueryResult {
  readonly matches: readonly QueryMatch[];
  readonly total: number;
  readonly offset: number;
  readonly limit: number;
}
