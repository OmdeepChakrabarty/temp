import { HarnessError } from '../core/errors.js';
export const validateAndPlan = (document) => {
    const nodeIds = new Set(document.nodes.map((n) => n.id));
    for (const node of document.nodes) {
        if (!node.id || typeof node.id !== 'string') {
            throw new HarnessError('INVALID_DESCRIPTOR', 'Node must have a string id.', 'Provide a unique string identifier for each node.');
        }
        if (!node.capability || typeof node.capability !== 'string') {
            throw new HarnessError('INVALID_DESCRIPTOR', `Node ${node.id} must specify a capability string.`, 'Provide a valid capability identifier.');
        }
        if (!node.version || typeof node.version !== 'string') {
            throw new HarnessError('INVALID_DESCRIPTOR', `Node ${node.id} must specify a version string.`, 'Provide a semantic version for the capability.');
        }
    }
    const duplicates = new Set();
    const seen = new Set();
    for (const node of document.nodes) {
        if (seen.has(node.id)) {
            duplicates.add(node.id);
        }
        seen.add(node.id);
    }
    if (duplicates.size > 0) {
        throw new HarnessError('INVALID_DESCRIPTOR', `Duplicate node IDs: ${Array.from(duplicates).join(', ')}.`, 'Each node must have a unique ID.');
    }
    const adjacency = new Map();
    for (const node of document.nodes) {
        adjacency.set(node.id, { indegree: 0, dependents: [] });
    }
    for (const node of document.nodes) {
        const inputs = node.inputs ?? {};
        for (const input of Object.values(inputs)) {
            if ('$ref' in input && typeof input.$ref === 'string') {
                const ref = input.$ref;
                const parts = ref.split('.');
                if (parts.length !== 2) {
                    throw new HarnessError('INVALID_DESCRIPTOR', `Invalid input reference '${ref}' on node ${node.id}.`, 'Use format: nodeId.outputName');
                }
                const [sourceNodeId] = parts;
                if (!sourceNodeId || !nodeIds.has(sourceNodeId)) {
                    throw new HarnessError('INVALID_DESCRIPTOR', `Node ${node.id} references non-existent node '${sourceNodeId ?? ''}'.`, 'Reference an existing node ID.');
                }
                const sourceInfo = adjacency.get(sourceNodeId);
                const targetInfo = adjacency.get(node.id);
                sourceInfo.dependents.push(node.id);
                targetInfo.indegree += 1;
            }
        }
    }
    const cycleResult = detectCycle(adjacency, document.nodes.map((n) => n.id));
    if (cycleResult.hasCycle) {
        throw new HarnessError('INVALID_DESCRIPTOR', `Construction cycle detected involving: ${cycleResult.cycleNodes.join(', ')}.`, 'Remove circular dependencies between nodes.');
    }
    const order = [];
    const queue = [];
    for (const [id, info] of adjacency.entries()) {
        if (info.indegree === 0) {
            queue.push(id);
        }
    }
    queue.sort();
    while (queue.length > 0) {
        const current = queue.shift();
        order.push(current);
        const info = adjacency.get(current);
        const dependents = [...info.dependents].sort();
        for (const dependent of dependents) {
            const depInfo = adjacency.get(dependent);
            depInfo.indegree -= 1;
            if (depInfo.indegree === 0) {
                queue.push(dependent);
                queue.sort();
            }
        }
    }
    if (order.length !== document.nodes.length) {
        throw new HarnessError('INVALID_DESCRIPTOR', 'Could not complete topological sort; check for cycles or missing nodes.', 'Ensure all dependencies are resolvable.');
    }
    const edges = new Map();
    for (const [id, info] of adjacency.entries()) {
        edges.set(id, Object.freeze([...info.dependents]));
    }
    return Object.freeze({
        document: Object.freeze(document),
        order: Object.freeze(order),
        edges,
    });
};
const detectCycle = (adjacency, allNodes) => {
    const visiting = new Set();
    const visited = new Set();
    const cycleNodes = [];
    const dfs = (nodeId) => {
        if (visiting.has(nodeId)) {
            return true;
        }
        if (visited.has(nodeId)) {
            return false;
        }
        visiting.add(nodeId);
        const info = adjacency.get(nodeId);
        for (const dependent of info.dependents) {
            if (dfs(dependent)) {
                cycleNodes.push(nodeId);
                return true;
            }
        }
        visiting.delete(nodeId);
        visited.add(nodeId);
        return false;
    };
    for (const nodeId of allNodes) {
        if (!visited.has(nodeId) && dfs(nodeId)) {
            return { hasCycle: true, cycleNodes: Object.freeze(cycleNodes) };
        }
    }
    return { hasCycle: false, cycleNodes: [] };
};
