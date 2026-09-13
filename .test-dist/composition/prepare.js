import { HarnessError } from '../core/errors.js';
const MAX_CONCURRENT_PREPARE = 4;
export const prepareScene = async (plan, state) => {
    const { scope, signal, diagnostics, seed, quality, rendererGeneration, factoryResolver } = state;
    if (signal.aborted) {
        throw new HarnessError('CONTEXT_LOST', 'Preparation was cancelled before starting.', 'Re-prepare the scene with a new signal.');
    }
    const completedOutputs = new Map();
    const instances = [];
    const sessionScope = scope.child();
    const prepareNode = async (nodeId) => {
        if (signal.aborted) {
            throw new HarnessError('CONTEXT_LOST', `Preparation of node '${nodeId}' was cancelled.`, 'Re-prepare the scene.');
        }
        const node = plan.document.nodes.find((n) => n.id === nodeId);
        if (!node) {
            throw new HarnessError('INVALID_DESCRIPTOR', `Node '${nodeId}' not found in plan.`, 'Check the scene document.');
        }
        const factory = factoryResolver.resolve(node.capability, node.version);
        if (!factory) {
            throw new HarnessError('UNSUPPORTED_DEVICE', `No factory registered for '${node.capability}@${node.version}'.`, 'Register the capability factory or use an available capability.');
        }
        const inputs = new Map();
        const nodeInputs = node.inputs ?? {};
        for (const [inputName, inputSpec] of Object.entries(nodeInputs)) {
            if ('$ref' in inputSpec && typeof inputSpec.$ref === 'string') {
                const ref = inputSpec.$ref;
                const parts = ref.split('.');
                if (parts.length !== 2) {
                    throw new HarnessError('INVALID_DESCRIPTOR', `Invalid input reference '${ref}' on node ${nodeId}.`, 'Use format: nodeId.outputName');
                }
                const [sourceNodeId, outputName] = parts;
                if (!sourceNodeId || !outputName) {
                    throw new HarnessError('INVALID_DESCRIPTOR', `Invalid input reference '${ref}' on node ${nodeId}.`, 'Use format: nodeId.outputName');
                }
                const sourceOutputs = completedOutputs.get(sourceNodeId);
                if (!sourceOutputs) {
                    throw new HarnessError('INVALID_DESCRIPTOR', `Node ${nodeId} depends on ${sourceNodeId} which has not been prepared.`, 'Check dependency ordering.');
                }
                const handle = sourceOutputs.get(outputName);
                if (!handle) {
                    throw new HarnessError('INVALID_DESCRIPTOR', `Node ${sourceNodeId} does not export output '${outputName}'.`, 'Reference a valid output port.');
                }
                inputs.set(inputName, handle);
            }
        }
        const nodeScope = sessionScope.child();
        try {
            const instance = await factory.prepare(node.params, inputs, {
                scope: nodeScope,
                signal,
                diagnostics,
                seed: seed + hashString(nodeId),
                quality,
            });
            if (!instance.outputs) {
                throw new HarnessError('RENDER_FAILED', `Node ${nodeId} did not produce outputs.`, 'The capability factory must return outputs.');
            }
            const outputs = new Map();
            for (const [name, handle] of instance.outputs.entries()) {
                outputs.set(name, handle);
            }
            instances.push(instance);
            completedOutputs.set(nodeId, outputs);
            signal.throwIfAborted?.();
            return {
                nodeId,
                instance,
                outputs,
            };
        }
        catch (error) {
            nodeScope.dispose();
            throw error;
        }
    };
    const order = plan.order;
    const pending = new Map();
    let nextIndex = 0;
    let failureReason;
    const runNext = async () => {
        while (nextIndex < order.length && pending.size < MAX_CONCURRENT_PREPARE) {
            const nodeId = order[nextIndex];
            nextIndex += 1;
            const promise = prepareNode(nodeId).catch((error) => {
                if (!failureReason)
                    failureReason = error;
                throw error;
            });
            pending.set(nodeId, promise);
        }
    };
    await runNext();
    while (pending.size > 0) {
        const settled = await Promise.race(Array.from(pending.entries()).map(async ([nodeId, promise]) => {
            try {
                await promise;
                return { nodeId, success: true };
            }
            catch {
                return { nodeId, success: false };
            }
        }));
        pending.delete(settled.nodeId);
        if (!settled.success) {
            for (const [nodeId, promise] of pending.entries()) {
                try {
                    await promise;
                }
                catch {
                }
            }
            pending.clear();
            break;
        }
        await runNext();
    }
    if (failureReason) {
        sessionScope.dispose();
        if (failureReason instanceof HarnessError) {
            throw failureReason;
        }
        throw new HarnessError('RENDER_FAILED', failureReason instanceof Error ? failureReason.message : 'Preparation failed.', 'Inspect diagnostics for details.');
    }
    if (signal.aborted) {
        sessionScope.dispose();
        throw new HarnessError('CONTEXT_LOST', 'Preparation was cancelled during execution.', 'Re-prepare the scene.');
    }
    const session = {
        id: plan.document.id,
        scene: {},
        camera: {},
        pipeline: {
            render: () => { },
            resize: () => { },
            dispose: () => { },
        },
        instances: Object.freeze(instances),
        rendererGeneration,
        scope: sessionScope,
        dispose: async () => {
            sessionScope.dispose();
        },
    };
    return session;
};
const hashString = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return Math.abs(hash);
};
