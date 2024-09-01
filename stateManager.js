
class StateManager {
    constructor() {
        this.instances = {};
    }

    register(key, instance) {
        this.instances[key] = instance;
        // Trigger an event when an instance is registered
    }

    get(key) {
        return this.instances[key];
    }
}

const stateManager = new StateManager();
module.exports = stateManager;