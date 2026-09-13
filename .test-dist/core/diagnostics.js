export class Diagnostics {
    capacity;
    now;
    entries = [];
    constructor(capacity = 200, now = () => performance.now()) {
        this.capacity = capacity;
        this.now = now;
        if (!Number.isInteger(capacity) || capacity < 1) {
            throw new RangeError('Diagnostic capacity must be a positive integer.');
        }
    }
    report(diagnostic) {
        const { timestampMs = this.now(), ...entry } = diagnostic;
        this.entries.push({ ...entry, timestampMs });
        if (this.entries.length > this.capacity)
            this.entries.shift();
    }
    snapshot() {
        return [...this.entries];
    }
    clear() {
        this.entries.length = 0;
    }
}
