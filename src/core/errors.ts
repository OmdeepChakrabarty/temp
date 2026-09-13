export type HarnessErrorCode =
  | 'SCOPE_CLOSED'
  | 'CONTEXT_LOST'
  | 'RENDER_FAILED'
  | 'UNSUPPORTED_DEVICE'
  | 'BUDGET_EXCEEDED'
  | 'NONFINITE_VALUE'
  | 'HARNESS_DISPOSED'
  | 'STALE_RENDERER_GENERATION'
  | 'INVALID_DESCRIPTOR';

export class HarnessError extends Error {
  public constructor(
    public readonly code: HarnessErrorCode,
    message: string,
    public readonly remediation: string,
    public readonly path?: string,
  ) {
    super(message);
    this.name = 'HarnessError';
  }
}

export const assertFinite = (value: number, path: string): number => {
  if (!Number.isFinite(value)) {
    throw new HarnessError(
      'NONFINITE_VALUE',
      `Expected a finite number at ${path}.`,
      'Provide a finite numeric value.',
      path,
    );
  }
  return value;
};
