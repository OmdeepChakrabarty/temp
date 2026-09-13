export { validateAndPlan } from './plan.js';
export { prepareScene } from './prepare.js';
export { compileBindings, type BindingResolution } from './bindings.js';
export { composeMesh, type MeshAssemblyParams, type MeshAssemblyInputs } from './mesh.js';
export type {
  SceneDocument,
  SceneNode,
  NodeInput,
  PropertyBinding,
  PresentationSpec,
  ConstructionPlan,
  PreparedSession,
  RenderPipeline,
  FactoryResolver,
  PrepareContext,
  NodePreparationResult,
} from './types.js';
