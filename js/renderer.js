export class Renderer {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.width = 0;
        this.height = 0;
        this.dpr = 1;
        this.background = '#0a0a1a';
        this.debugMode = false;
    }
    
    init(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.dpr = window.devicePixelRatio || 1;
        this.resize();
        
        window.addEventListener('resize', () => this.resize());
        
        console.log('🎨 Renderer initialized');
    }
    
    resize() {
        const rect = this.canvas.parentElement.getBoundingClientRect();
        this.width = rect.width;
        this.height = rect.height;
        
        this.canvas.width = this.width * this.dpr;
        this.canvas.height = this.height * this.dpr;
        this.canvas.style.width = this.width + 'px';
        this.canvas.style.height = this.height + 'px';
        
        this.ctx.scale(this.dpr, this.dpr);
    }
    
    render() {
        const ctx = this.ctx;
        
        // Clear canvas
        ctx.fillStyle = this.background;
        ctx.fillRect(0, 0, this.width, this.height);
        
        // TODO: Render game world
        this.renderMap(ctx);
        this.renderUnits(ctx);
        this.renderUI(ctx);
        
        if (this.debugMode) {
            this.renderDebug(ctx);
        }
    }
    
    renderMap(ctx) {
        // TODO: Render provinces, borders, terrain
        ctx.save();
        
        // Example: Draw a grid for testing
        ctx.strokeStyle = 'rgba(255,255,255,0.05)';
        ctx.lineWidth = 1;
        const gridSize = 50;
        for (let x = 0; x <= this.width; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, this.height);
            ctx.stroke();
        }
        for (let y = 0; y <= this.height; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(this.width, y);
            ctx.stroke();
        }
        
        ctx.restore();
    }
    
    renderUnits(ctx) {
        // TODO: Render military units
    }
    
    renderUI(ctx) {
        // TODO: Render in-game UI elements
    }
    
    renderDebug(ctx) {
        ctx.save();
        ctx.fillStyle = '#0f0';
        ctx.font = '12px monospace';
        ctx.fillText(`FPS: ${window.game?.engine?.getFPS() || 0}`, 10, 30);
        ctx.fillText(`Camera: (${window.game?.camera?.x || 0}, ${window.game?.camera?.y || 0})`, 10, 50);
        ctx.fillText(`Zoom: ${window.game?.camera?.zoom || 1}`, 10, 70);
        ctx.restore();
    }
    
    clear() {
        this.ctx.clearRect(0, 0, this.width, this.height);
    }
}
