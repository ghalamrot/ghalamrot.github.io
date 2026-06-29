export class EventBus {
    constructor() {
        this.events = new Map();
        this.onceEvents = new Map();
        this.debugMode = false;
    }
    
    on(event, callback) {
        if (!this.events.has(event)) {
            this.events.set(event, new Set());
        }
        this.events.get(event).add(callback);
        
        if (this.debugMode) {
            console.log(`📡 Event listener registered: ${event}`);
        }
    }
    
    off(event, callback) {
        if (this.events.has(event)) {
            this.events.get(event).delete(callback);
        }
    }
    
    once(event, callback) {
        if (!this.onceEvents.has(event)) {
            this.onceEvents.set(event, new Set());
        }
        this.onceEvents.get(event).add(callback);
    }
    
    emit(event, data) {
        if (this.debugMode) {
            console.log(`📡 Event emitted: ${event}`, data);
        }
        
        // Regular events
        if (this.events.has(event)) {
            for (const callback of this.events.get(event)) {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in event handler for ${event}:`, error);
                }
            }
        }
        
        // Once events
        if (this.onceEvents.has(event)) {
            const callbacks = this.onceEvents.get(event);
            for (const callback of callbacks) {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in once event handler for ${event}:`, error);
                }
            }
            this.onceEvents.delete(event);
        }
    }
    
    clear() {
        this.events.clear();
        this.onceEvents.clear();
    }
    
    enableDebug() {
        this.debugMode = true;
    }
    
    disableDebug() {
        this.debugMode = false;
    }
}
