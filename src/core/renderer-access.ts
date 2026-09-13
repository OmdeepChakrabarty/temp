import { HarnessError } from './errors.js';

/**
 * Serializes bounded renderer-state operations. It deliberately knows nothing
 * about Three.js state: adapters provide restoration in each operation.
 */
export class RendererAccessController {
  private generation = 1;
  private tail: Promise<void> = Promise.resolve();
  private disposed = false;

  public get rendererGeneration(): number {
    return this.generation;
  }

  public invalidateGeneration(): number {
    this.assertOpen();
    this.generation += 1;
    return this.generation;
  }

  public async withAccess<T>(expectedGeneration: number, operation: () => Promise<T> | T): Promise<T> {
    this.assertOpen();
    const previous = this.tail;
    let release: (() => void) | undefined;
    this.tail = new Promise<void>((resolve) => { release = resolve; });
    await previous;
    try {
      this.assertGeneration(expectedGeneration);
      const result = await operation();
      this.assertGeneration(expectedGeneration);
      return result;
    } finally {
      release?.();
    }
  }

  public dispose(): void {
    this.disposed = true;
    this.generation += 1;
  }

  private assertOpen(): void {
    if (this.disposed) {
      throw new HarnessError('CONTEXT_LOST', 'Renderer access is unavailable after disposal.', 'Create a new harness before preparing renderer-bound resources.');
    }
  }

  private assertGeneration(expectedGeneration: number): void {
    if (expectedGeneration !== this.generation) {
      throw new HarnessError('STALE_RENDERER_GENERATION', 'A renderer-bound operation completed for a stale generation.', 'Discard the result and re-prepare it with the current renderer generation.');
    }
  }
}
