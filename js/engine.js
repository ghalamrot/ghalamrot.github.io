export class GameEngine {
    constructor() {
        this.running = false;
        this.fps = 60;
        this.frameTime = 1000 / this.fps;
        this.lastTime = 0;
        this.accumulator = 0;
        this.updateCallback = null;
        this.renderCallback = null;
        this.frameCount = 0;
        this.fpsCounter = 0;
        this.fpsTimer = 0;
        this.currentFps = 0;
    }
    
    start(updateCallback, renderCallback) {
        if (this.running) return;
        
        this.running = true;
        this.updateCallback = updateCallback;
        this.renderCallback = renderCallback;
        this.lastTime = performance.now();
        this.accumulator = 0;
        
        console.log('🔄 Game engine started');
        this.loop(performance.now());
    }
    
    stop() {
        this.running = false;
        console.log('⏹️ Game engine stopped');
    }
    
    loop(currentTime) {
        if (!this.running) return;
        
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        // Cap delta time to prevent spiral of death
        const cappedDelta = Math.min(deltaTime, 100);
        
        // Accumulate time
        this.accumulator += cappedDelta;
        
        // Fixed timestep updates
        while (this.accumulator >= this.frameTime) {
            this.updateCallback(this.frameTime / 1000);
            this.accumulator -= this.frameTime;
            this.frameCount++;
        }
        
        // Render
        this.renderCallback();
        
        // FPS counter
        this.fpsCounter++;
        this.fpsTimer += cappedDelta;
        if (this.fpsTimer >= 1000) {
            this.currentFps = this.fpsCounter;
            this.fpsCounter = 0;
            this.fpsTimer = 0;
        }
        
        requestAnimationFrame((time) => this.loop(time));
    }
    
    getFPS() {
        return this.currentFps;
    }
    
    setFPS(fps) {
        this.fps = Math.max(10, Math.min(144, fps));
        this.frameTime = 1000 / this.fps;
    }
}
