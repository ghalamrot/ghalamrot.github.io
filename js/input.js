import { EventBus } from './eventBus.js';

export class InputManager {
    constructor() {
        this.keys = new Map();
        this.mouse = {
            x: 0,
            y: 0,
            worldX: 0,
            worldY: 0,
            buttons: new Map(),
            wheel: 0
        };
        this.touches = new Map();
        this.keyDownHandlers = new Map();
        this.keyUpHandlers = new Map();
        this.mouseDownHandlers = new Map();
        this.mouseUpHandlers = new Map();
        this.mouseMoveHandlers = new Map();
        this.mouseWheelHandlers = new Map();
        this.eventBus = EventBus;
        this.enabled = true;
    }
    
    init() {
        // Keyboard events
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        document.addEventListener('keyup', (e) => this.handleKeyUp(e));
        
        // Mouse events
        const canvas = document.getElementById('gameCanvas');
        canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        canvas.addEventListener('wheel', (e) => this.handleWheel(e));
        canvas.addEventListener('contextmenu', (e) => e.preventDefault());
        
        // Touch events
        canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e));
        canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e));
        canvas.addEventListener('touchend', (e) => this.handleTouchEnd(e));
        canvas.addEventListener('touchcancel', (e) => this.handleTouchEnd(e));
        
        console.log('⌨️ Input manager initialized');
    }
    
    handleKeyDown(e) {
        if (!this.enabled) return;
        this.keys.set(e.key, true);
        this.eventBus.emit('keydown', { key: e.key, event: e });
        
        // Handle shortcuts
        if (e.ctrlKey && e.key === 's') {
            e.preventDefault();
            this.eventBus.emit('game:save');
        }
        if (e.key === 'Escape') {
            this.eventBus.emit('ui:escape');
        }
        if (e.key === 'Tab') {
            e.preventDefault();
            this.eventBus.emit('ui:toggleSidebar');
        }
        if (e.key === 'm' || e.key === 'M') {
            this.eventBus.emit('ui:toggleMinimap');
        }
    }
    
    handleKeyUp(e) {
        if (!this.enabled) return;
        this.keys.delete(e.key);
        this.eventBus.emit('keyup', { key: e.key, event: e });
    }
    
    handleMouseDown(e) {
        if (!this.enabled) return;
        const rect = e.target.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        this.mouse.buttons.set(e.button, true);
        this.mouse.x = x;
        this.mouse.y = y;
        
        // Convert to world coordinates
        const world = this.getWorldCoords(x, y);
        this.mouse.worldX = world.x;
        this.mouse.worldY = world.y;
        
        this.eventBus.emit('mousedown', { 
            button: e.button, 
            x, 
            y, 
            worldX: world.x, 
            worldY: world.y,
            event: e 
        });
    }
    
    handleMouseMove(e) {
        if (!this.enabled) return;
        const rect = e.target.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        this.mouse.x = x;
        this.mouse.y = y;
        
        const world = this.getWorldCoords(x, y);
        this.mouse.worldX = world.x;
        this.mouse.worldY = world.y;
        
        this.eventBus.emit('mousemove', { 
            x, 
            y, 
            worldX: world.x, 
            worldY: world.y,
            event: e 
        });
    }
    
    handleMouseUp(e) {
        if (!this.enabled) return;
        this.mouse.buttons.delete(e.button);
        this.eventBus.emit('mouseup', { button: e.button, event: e });
    }
    
    handleWheel(e) {
        if (!this.enabled) return;
        e.preventDefault();
        this.mouse.wheel = e.deltaY;
        this.eventBus.emit('wheel', { 
            delta: e.deltaY, 
            x: this.mouse.x, 
            y: this.mouse.y,
            event: e 
        });
    }
    
    handleTouchStart(e) {
        if (!this.enabled) return;
        e.preventDefault();
        
        for (const touch of e.changedTouches) {
            const rect = e.target.getBoundingClientRect();
            const x = touch.clientX - rect.left;
            const y = touch.clientY - rect.top;
            
            this.touches.set(touch.identifier, { x, y, startX: x, startY: y });
            
            const world = this.getWorldCoords(x, y);
            this.eventBus.emit('touchstart', {
                id: touch.identifier,
                x,
                y,
                worldX: world.x,
                worldY: world.y
            });
        }
    }
    
    handleTouchMove(e) {
        if (!this.enabled) return;
        e.preventDefault();
        
        for (const touch of e.changedTouches) {
            const rect = e.target.getBoundingClientRect();
            const x = touch.clientX - rect.left;
            const y = touch.clientY - rect.top;
            
            const touchData = this.touches.get(touch.identifier);
            if (touchData) {
                touchData.x = x;
                touchData.y = y;
            }
            
            const world = this.getWorldCoords(x, y);
            this.eventBus.emit('touchmove', {
                id: touch.identifier,
                x,
                y,
                worldX: world.x,
                worldY: world.y
            });
        }
    }
    
    handleTouchEnd(e) {
        if (!this.enabled) return;
        e.preventDefault();
        
        for (const touch of e.changedTouches) {
            this.touches.delete(touch.identifier);
            this.eventBus.emit('touchend', { id: touch.identifier });
        }
    }
    
    getWorldCoords(screenX, screenY) {
        const camera = window.game?.camera;
        if (!camera) return { x: screenX, y: screenY };
        
        return camera.screenToWorld(screenX, screenY);
    }
    
    isKeyDown(key) {
        return this.keys.has(key);
    }
    
    isMouseDown(button = 0) {
        return this.mouse.buttons.has(button);
    }
    
    getMousePosition() {
        return { x: this.mouse.x, y: this.mouse.y };
    }
    
    getWorldMousePosition() {
        return { x: this.mouse.worldX, y: this.mouse.worldY };
    }
    
    update(deltaTime) {
        // Reset wheel each frame
        this.mouse.wheel = 0;
    }
    
    enable() {
        this.enabled = true;
    }
    
    disable() {
        this.enabled = false;
    }
}
