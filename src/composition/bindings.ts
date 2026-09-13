import type { PropertyBinding, SceneDocument } from './types.js';
import type { TypedHandle } from '../core/types.js';
import { HarnessError } from '../core/errors.js';

export interface BindingResolution {
  readonly target: string;
  readonly channel: string;
  readonly sourceHandle: TypedHandle;
}

export const compileBindings = (
  bindings: readonly PropertyBinding[] | undefined,
  completedOutputs: ReadonlyMap<string, ReadonlyMap<string, TypedHandle>>,
): readonly BindingResolution[] => {
  if (!bindings || bindings.length === 0) {
    return [];
  }

  const resolutions: BindingResolution[] = [];

  for (const binding of bindings) {
    const { target, channel, source, sourceOutput } = binding;

    if (!target || typeof target !== 'string') {
      throw new HarnessError('INVALID_DESCRIPTOR', 'Binding target must be a string.', 'Specify the node ID to bind to.');
    }

    if (!channel || typeof channel !== 'string') {
      throw new HarnessError('INVALID_DESCRIPTOR', 'Binding channel must be a string.', 'Specify the property channel name.');
    }

    if (!source || typeof source !== 'string') {
      throw new HarnessError('INVALID_DESCRIPTOR', 'Binding source must be a string.', 'Specify the source node ID.');
    }

    if (!sourceOutput || typeof sourceOutput !== 'string') {
      throw new HarnessError('INVALID_DESCRIPTOR', 'Binding sourceOutput must be a string.', 'Specify the source output port name.');
    }

    const sourceOutputs = completedOutputs.get(source);
    if (!sourceOutputs) {
      throw new HarnessError('INVALID_DESCRIPTOR', `Binding source '${source}' was not prepared.`, 'Ensure the source node is in the dependency plan.');
    }

    const handle = sourceOutputs.get(sourceOutput);
    if (!handle) {
      throw new HarnessError('INVALID_DESCRIPTOR', `Source '${source}' does not export output '${sourceOutput}'.`, 'Reference a valid output port.');
    }

    if (handle.kind !== 'property') {
      throw new HarnessError('INVALID_DESCRIPTOR', `Output '${sourceOutput}' from '${source}' is not a property handle.`, 'Bind only property-type outputs.');
    }

    resolutions.push({
      target,
      channel,
      sourceHandle: handle,
    });
  }

  return Object.freeze(resolutions);
};
