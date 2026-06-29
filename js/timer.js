import { EventBus } from './eventBus.js';

export class Timer {
    constructor() {
        this.startTime = 0;
        this.elapsed = 0;
        this.isRunning = false;
        this.tickCallbacks = new Map();
        this.intervalCallbacks = new Map();
        this.timeoutCallbacks = new Map();
        this.tickInterval = 1000; // 1 second
        this.tickAccumulator = 0;
        this.eventBus = EventBus;
        this.lastTick = 0;
        this.gameTime = 0;
        this.speed = 1;
    }
    
    init() {
        this.startTime = performance.now();
        this.isRunning = true;
        console.log('⏱️ Timer initialized');
    }
    
    start() {
        if (!this.isRunning) {
            this.startTime = performance.now() - this.elapsed;
            this.isRunning = true;
        }
    }
    
    stop() {
        if (this.isRunning) {
            this.elapsed = performance.now() - this.startTime;
            this.isRunning = false;
        }
    }
    
    reset() {
        this.startTime = performance.now();
        this.elapsed = 0;
        this.gameTime = 0;
        this.tickAccumulator = 0;
        this.lastTick = 0;
    }
    
    update(deltaTime) {
        if (!this.isRunning) return;
        
        const dt = deltaTime * this.speed;
        this.elapsed += dt;
        this.gameTime += dt;
        
        // Tick handling
        this.tickAccumulator += dt * 1000; // Convert to milliseconds
        while (this.tickAccumulator >= this.tickInterval) {
            this.tickAccumulator -= this.tickInterval;
            this.onTick();
        }
        
        // Update interval callbacks
        for (const [id, callback] of this.intervalCallbacks) {
            if (callback.next <= this.elapsed) {
                callback.fn();
                callback.next = this.elapsed + callback.interval;
            }
        }
    }
    
    onTick() {
        this.lastTick = this.elapsed;
        this.eventBus.emit('timer:tick', {
            elapsed: this.elapsed,
            gameTime: this.gameTime,
            tick: Math.floor(this.elapsed / (this.tickInterval / 1000))
        });
        
        // Execute tick callbacks
        for (const [id, callback] of this.tickCallbacks) {
            callback();
        }
    }
    
    onTick(callback) {
        const id = Symbol('tick');
        this.tickCallbacks.set(id, callback);
        return id;
    }
    
    offTick(id) {
        this.tickCallbacks.delete(id);
    }
    
    setInterval(callback, interval) {
        const id = Symbol('interval');
        this.intervalCallbacks.set(id, {
            fn: callback,
            interval: interval,
            next: this.elapsed + interval
        });
        return id;
    }
    
    clearInterval(id) {
        this.intervalCallbacks.delete(id);
    }
    
    setTimeout(callback, delay) {
        const id = Symbol('timeout');
        this.timeoutCallbacks.set(id, {
            fn: callback,
            time: this.elapsed + delay,
            executed: false
        });
        return id;
    }
    
    clearTimeout(id) {
        this.timeoutCallbacks.delete(id);
    }
    
    getTime() {
        return this.elapsed;
    }
    
    getGameTime() {
        return this.gameTime;
    }
    
    setSpeed(speed) {
        this.speed = Math.max(0.1, Math.min(10, speed));
    }
    
    getSpeed() {
        return this.speed;
    }
    
    getFormattedTime() {
        const seconds = Math.floor(this.gameTime);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        
        if (days > 0) {
            return `${days}d ${hours % 24}h`;
        } else if (hours > 0) {
            return `${hours}h ${minutes % 60}m`;
        } else if (minutes > 0) {
            return `${minutes}m ${seconds % 60}s`;
        } else {
            return `${seconds}s`;
        }
    }
}
