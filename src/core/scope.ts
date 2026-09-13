import { HarnessError } from './errors.js';

export type Cleanup = () => void | Promise<void>;

export interface Disposable {
  dispose(): void | Promise<void>;
}

export interface Lease<T> {
  readonly value: T;
  release(): void;
}

export class ResourceScope {
  private readonly cleanups: Cleanup[] = [];
  private disposed = false;
  private disposing: Promise<void> | undefined;

  public get isDisposed(): boolean {
    return this.disposed;
  }

  public defer(cleanup: Cleanup): void {
    if (this.disposed) {
      void Promise.resolve(cleanup());
      throw new HarnessError('SCOPE_CLOSED', 'Cannot register cleanup on a disposed resource scope.', 'Allocate resources only while the capability scope is active.');
    }
    this.cleanups.push(cleanup);
  }

  public own<T>(resource: T, disposer: (resource: T) => void | Promise<void>): T {
    this.defer(() => disposer(resource));
    return resource;
  }

  public ownDisposable<T extends Disposable>(resource: T): T {
    return this.own(resource, (owned) => owned.dispose());
  }

  public child(): ResourceScope {
    const child = new ResourceScope();
    this.defer(() => child.dispose());
    return child;
  }

  public dispose(): Promise<void> {
    if (this.disposing) return this.disposing;
    this.disposed = true;
    this.disposing = this.disposeRegistered();
    return this.disposing;
  }

  private async disposeRegistered(): Promise<void> {
    const failures: unknown[] = [];
    for (let index = this.cleanups.length - 1; index >= 0; index -= 1) {
      const cleanup = this.cleanups[index];
      if (!cleanup) continue;
      try {
        await cleanup();
      } catch (error) {
        failures.push(error);
      }
    }
    this.cleanups.length = 0;
    if (failures.length > 0) throw new AggregateError(failures, 'One or more resource cleanups failed.');
  }
}

export const createLease = <T>(value: T, onRelease: () => void): Lease<T> => {
  let released = false;
  return {
    value,
    release(): void {
      if (released) return;
      released = true;
      onRelease();
    },
  };
};
