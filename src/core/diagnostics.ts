export type DiagnosticLevel = 'debug' | 'info' | 'warning' | 'error';

export interface Diagnostic {
  readonly code: string;
  readonly level: DiagnosticLevel;
  readonly message: string;
  readonly timestampMs: number;
  readonly remediation?: string;
  readonly context?: Readonly<Record<string, unknown>>;
}

export interface DiagnosticsSink {
  report(diagnostic: Omit<Diagnostic, 'timestampMs'> & { readonly timestampMs?: number }): void;
}

export class Diagnostics implements DiagnosticsSink {
  private readonly entries: Diagnostic[] = [];

  public constructor(private readonly capacity = 200, private readonly now = () => performance.now()) {
    if (!Number.isInteger(capacity) || capacity < 1) {
      throw new RangeError('Diagnostic capacity must be a positive integer.');
    }
  }

  public report(diagnostic: Omit<Diagnostic, 'timestampMs'> & { readonly timestampMs?: number }): void {
    const { timestampMs = this.now(), ...entry } = diagnostic;
    this.entries.push({ ...entry, timestampMs });
    if (this.entries.length > this.capacity) this.entries.shift();
  }

  public snapshot(): readonly Diagnostic[] {
    return [...this.entries];
  }

  public clear(): void {
    this.entries.length = 0;
  }
}
