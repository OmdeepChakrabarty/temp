export class HarnessError extends Error {
    code;
    remediation;
    path;
    constructor(code, message, remediation, path) {
        super(message);
        this.code = code;
        this.remediation = remediation;
        this.path = path;
        this.name = 'HarnessError';
    }
}
export const assertFinite = (value, path) => {
    if (!Number.isFinite(value)) {
        throw new HarnessError('NONFINITE_VALUE', `Expected a finite number at ${path}.`, 'Provide a finite numeric value.', path);
    }
    return value;
};
