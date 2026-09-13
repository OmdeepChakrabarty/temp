import { HarnessError } from '../core/errors.js';
const capabilityId = /^[a-z][a-z0-9]*(?:\.[a-z][a-z0-9]*)+$/;
const semver = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;
function fail(path, message) {
    throw new HarnessError('INVALID_DESCRIPTOR', `Invalid capability descriptor at ${path}: ${message}`, 'Correct the descriptor metadata before publishing it.', path);
}
function nonEmptyString(value, path) {
    if (typeof value !== 'string' || value.trim() === '')
        fail(path, 'expected a non-empty string');
}
function stringList(value, path) {
    if (!Array.isArray(value) || value.some((entry) => typeof entry !== 'string' || entry.trim() === ''))
        fail(path, 'expected an array of non-empty strings');
}
function validatePorts(ports, path) {
    if (typeof ports !== 'object' || ports === null || Array.isArray(ports))
        fail(path, 'expected a port object');
    for (const [name, port] of Object.entries(ports)) {
        if (!/^[a-z][a-z0-9-]*$/.test(name) || typeof port !== 'object' || port === null || Array.isArray(port))
            fail(`${path}/${name}`, 'expected a named port descriptor');
        const candidate = port;
        nonEmptyString(candidate.kind, `${path}/${name}/kind`);
        if (!Number.isInteger(candidate.version) || candidate.version < 1)
            fail(`${path}/${name}/version`, 'expected a positive integer');
        if (candidate.ownership !== 'borrowed')
            fail(`${path}/${name}/ownership`, 'only borrowed outputs may cross capability boundaries');
        if (candidate.optional !== undefined && typeof candidate.optional !== 'boolean')
            fail(`${path}/${name}/optional`, 'expected a boolean');
        if (candidate.requiresFeatures !== undefined)
            stringList(candidate.requiresFeatures, `${path}/${name}/requiresFeatures`);
    }
}
/** Validates metadata only; it imports neither factories nor renderer APIs. */
export const validateDescriptor = (descriptor) => {
    const candidate = descriptor;
    const required = ['id', 'version', 'name', 'category', 'description', 'inputSchema', 'inputs', 'outputs', 'dependencies', 'compatibility', 'performance', 'lifecycle', 'examples', 'tags', 'limitations', 'stability'];
    for (const field of required)
        if (!(field in candidate))
            fail(`/${field}`, 'is required');
    for (const field of Object.keys(candidate))
        if (!required.includes(field))
            fail(`/${field}`, 'is not allowed');
    nonEmptyString(candidate.id, '/id');
    if (!capabilityId.test(candidate.id))
        fail('/id', 'must be a lowercase dotted identifier');
    nonEmptyString(candidate.version, '/version');
    if (!semver.test(candidate.version))
        fail('/version', 'must be a semantic version');
    for (const field of ['name', 'category', 'description', 'inputSchema'])
        nonEmptyString(candidate[field], `/${field}`);
    validatePorts(candidate.inputs, '/inputs');
    validatePorts(candidate.outputs, '/outputs');
    for (const field of ['dependencies', 'examples', 'tags', 'limitations'])
        stringList(candidate[field], `/${field}`);
    if (typeof candidate.compatibility !== 'object' || candidate.compatibility === null)
        fail('/compatibility', 'expected an object');
    const compatibility = candidate.compatibility;
    if (compatibility.backend !== 'webgl2' || !['none', 'preserves-host-pbr', 'custom-lit', 'artistic-only'].includes(compatibility.ibl))
        fail('/compatibility', 'contains unsupported backend or IBL mode');
    if (compatibility.requiresFeatures !== undefined)
        stringList(compatibility.requiresFeatures, '/compatibility/requiresFeatures');
    if (typeof candidate.performance !== 'object' || candidate.performance === null)
        fail('/performance', 'expected an object');
    const performance = candidate.performance;
    if (!['low', 'medium', 'high'].includes(performance.costClass))
        fail('/performance/costClass', 'must be low, medium, or high');
    nonEmptyString(performance.complexity, '/performance/complexity');
    if (typeof candidate.lifecycle !== 'object' || candidate.lifecycle === null)
        fail('/lifecycle', 'expected an object');
    const lifecycle = candidate.lifecycle;
    stringList(lifecycle.owned, '/lifecycle/owned');
    if (!['analytic', 'replay', 'none'].includes(lifecycle.seek) || !['none', 'rebuild', 'resize'].includes(lifecycle.resize) || lifecycle.contextRecovery !== 'reprepare')
        fail('/lifecycle', 'contains an unsupported lifecycle policy');
    if (!['experimental', 'stable'].includes(candidate.stability))
        fail('/stability', 'must be experimental or stable');
    return descriptor;
};
