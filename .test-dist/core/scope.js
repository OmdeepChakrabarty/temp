import { HarnessError } from './errors.js';
export class ResourceScope {
    cleanups = [];
    disposed = false;
    disposing;
    get isDisposed() {
        return this.disposed;
    }
    defer(cleanup) {
        if (this.disposed) {
            void Promise.resolve(cleanup());
            throw new HarnessError('SCOPE_CLOSED', 'Cannot register cleanup on a disposed resource scope.', 'Allocate resources only while the capability scope is active.');
        }
        this.cleanups.push(cleanup);
    }
    own(resource, disposer) {
        this.defer(() => disposer(resource));
        return resource;
    }
    ownDisposable(resource) {
        return this.own(resource, (owned) => owned.dispose());
    }
    child() {
        const child = new ResourceScope();
        this.defer(() => child.dispose());
        return child;
    }
    dispose() {
        if (this.disposing)
            return this.disposing;
        this.disposed = true;
        this.disposing = this.disposeRegistered();
        return this.disposing;
    }
    async disposeRegistered() {
        const failures = [];
        for (let index = this.cleanups.length - 1; index >= 0; index -= 1) {
            const cleanup = this.cleanups[index];
            if (!cleanup)
                continue;
            try {
                await cleanup();
            }
            catch (error) {
                failures.push(error);
            }
        }
        this.cleanups.length = 0;
        if (failures.length > 0)
            throw new AggregateError(failures, 'One or more resource cleanups failed.');
    }
}
export const createLease = (value, onRelease) => {
    let released = false;
    return {
        value,
        release() {
            if (released)
                return;
            released = true;
            onRelease();
        },
    };
};
