import { validateDescriptor } from './validate.js';
const normalized = (value) => value.toLocaleLowerCase();
export class CapabilityCatalog {
    byKey = new Map();
    byId = new Map();
    constructor(descriptors) {
        for (const descriptor of descriptors) {
            validateDescriptor(descriptor);
            const key = `${descriptor.id}@${descriptor.version}`;
            if (this.byKey.has(key))
                throw new Error(`Duplicate capability descriptor: ${key}`);
            this.byKey.set(key, descriptor);
            const versions = this.byId.get(descriptor.id) ?? [];
            versions.push(descriptor);
            versions.sort((left, right) => right.version.localeCompare(left.version, undefined, { numeric: true }));
            this.byId.set(descriptor.id, versions);
        }
    }
    describe(id, version) {
        return version === undefined ? this.byId.get(id)?.[0] : this.byKey.get(`${id}@${version}`);
    }
    query(filter = {}) {
        const offset = Math.max(0, filter.offset ?? 0);
        const limit = Math.min(50, Math.max(1, filter.limit ?? 50));
        const text = filter.text?.trim().toLocaleLowerCase();
        const matches = [];
        for (const descriptor of this.byKey.values()) {
            const reasons = [];
            if (filter.categories?.length && !filter.categories.includes(descriptor.category))
                continue;
            if (filter.categories?.length)
                reasons.push(`category:${descriptor.category}`);
            if (filter.tags?.length && !filter.tags.every((tag) => descriptor.tags.includes(tag)))
                continue;
            if (filter.tags?.length)
                reasons.push(...filter.tags.map((tag) => `tag:${tag}`));
            if (filter.outputKind && !Object.values(descriptor.outputs).some((output) => output.kind === filter.outputKind))
                continue;
            if (filter.outputKind)
                reasons.push(`output:${filter.outputKind}`);
            if (filter.ibl && descriptor.compatibility.ibl !== filter.ibl)
                continue;
            if (filter.ibl)
                reasons.push(`ibl:${filter.ibl}`);
            if (filter.backend && descriptor.compatibility.backend !== filter.backend)
                continue;
            if (filter.backend)
                reasons.push(`backend:${filter.backend}`);
            const corpus = `${descriptor.id} ${descriptor.name} ${descriptor.description} ${descriptor.tags.join(' ')}`.toLocaleLowerCase();
            if (text && !corpus.includes(text))
                continue;
            if (text)
                reasons.unshift(`text:${text}`);
            matches.push({ descriptor, reasons });
        }
        matches.sort((left, right) => {
            const leftText = text ? this.score(left.descriptor, text) : 0;
            const rightText = text ? this.score(right.descriptor, text) : 0;
            return rightText - leftText || left.descriptor.id.localeCompare(right.descriptor.id) || left.descriptor.version.localeCompare(right.descriptor.version);
        });
        return { matches: matches.slice(offset, offset + limit), total: matches.length, offset, limit };
    }
    dependencyClosure(selection) {
        const result = [];
        const visited = new Set();
        const visiting = new Set();
        const visit = (id, version) => {
            const descriptor = this.describe(id, version);
            if (!descriptor)
                throw new Error(`Unknown capability dependency: ${version === undefined ? id : `${id}@${version}`}`);
            const key = `${descriptor.id}@${descriptor.version}`;
            if (visited.has(key))
                return;
            if (visiting.has(key))
                throw new Error(`Capability dependency cycle: ${[...visiting, key].join(' -> ')}`);
            visiting.add(key);
            for (const dependency of descriptor.dependencies) {
                const [dependencyId, dependencyVersion] = dependency.split('@', 2);
                if (!dependencyId)
                    throw new Error(`Invalid dependency in ${key}: ${dependency}`);
                visit(dependencyId, dependencyVersion);
            }
            visiting.delete(key);
            visited.add(key);
            result.push(descriptor);
        };
        for (const item of selection)
            visit(item.id, item.version);
        return result;
    }
    score(descriptor, text) {
        const candidate = normalized(text);
        if (normalized(descriptor.id) === candidate)
            return 4;
        if (normalized(descriptor.id).includes(candidate))
            return 3;
        if (normalized(descriptor.name).includes(candidate))
            return 2;
        return 1;
    }
}
