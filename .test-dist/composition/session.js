/**
 * A prepared session ready for frame-boundary commit.
 * Implements the PreparedSession interface from core/types.ts
 */
export class PreparedSessionImpl {
    id;
    scene;
    camera;
    pipeline;
    environment;
    instances;
    constructor(id, scene, camera, pipeline, instances, environment) {
        this.id = id;
        this.id = id;
        this.scene = scene;
        this.camera = camera;
        this.pipeline = pipeline;
        this.instances = Object.freeze(instances);
        if (environment !== undefined) {
            this.environment = environment;
        }
    }
    resize(viewport) {
        this.pipeline.resize(viewport);
        for (const instance of this.instances) {
            instance.resize?.(viewport);
        }
    }
    async dispose() {
        const failures = [];
        // Dispose instances in reverse order
        for (let i = this.instances.length - 1; i >= 0; i--) {
            try {
                await this.instances[i].dispose();
            }
            catch (error) {
                failures.push(error);
            }
        }
        // Dispose pipeline
        try {
            await this.pipeline.dispose();
        }
        catch (error) {
            failures.push(error);
        }
        if (failures.length > 0) {
            // Note: We don't throw here to avoid unhandled rejections during cleanup
            console.warn('Session disposal encountered cleanup failures:', failures);
        }
    }
}
