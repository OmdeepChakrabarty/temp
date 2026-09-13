import { HarnessError } from './errors.js';
/**
 * Serializes bounded renderer-state operations. It deliberately knows nothing
 * about Three.js state: adapters provide restoration in each operation.
 */
export class RendererAccessController {
    generation = 1;
    tail = Promise.resolve();
    disposed = false;
    get rendererGeneration() {
        return this.generation;
    }
    invalidateGeneration() {
        this.assertOpen();
        this.generation += 1;
        return this.generation;
    }
    async withAccess(expectedGeneration, operation) {
        this.assertOpen();
        const previous = this.tail;
        let release;
        this.tail = new Promise((resolve) => { release = resolve; });
        await previous;
        try {
            this.assertGeneration(expectedGeneration);
            const result = await operation();
            this.assertGeneration(expectedGeneration);
            return result;
        }
        finally {
            release?.();
        }
    }
    dispose() {
        this.disposed = true;
        this.generation += 1;
    }
    assertOpen() {
        if (this.disposed) {
            throw new HarnessError('CONTEXT_LOST', 'Renderer access is unavailable after disposal.', 'Create a new harness before preparing renderer-bound resources.');
        }
    }
    assertGeneration(expectedGeneration) {
        if (expectedGeneration !== this.generation) {
            throw new HarnessError('STALE_RENDERER_GENERATION', 'A renderer-bound operation completed for a stale generation.', 'Discard the result and re-prepare it with the current renderer generation.');
        }
    }
}
