import { EventBus } from './eventBus.js';

export class Camera {
    constructor() {
        this.x = 0;
        this.y = 0;
        this.zoom = 1;
        this.minZoom = 0.3;
        this.maxZoom = 3;
        this.targetX = 0;
        this.targetY = 0;
        this.targetZoom = 1;
        this.smoothness = 0.08;
        this.width = 0;
        this.height = 0;
        this.dragging = false;
        this.dragStartX = 0;
        this.dragStartY = 0;
        this.dragStartCamX = 0;
        this.dragStartCamY = 0;
        this.bounds = null;
        this.eventBus = EventBus;
    }
    
    init(canvas) {
        const rect = canvas.parentElement.getBoundingClientRect();
        this.width = rect.width;
        this.height = rect.height;
        
        // Center camera
        this.x = this.width / 2;
        this.y = this.height / 2;
        this.targetX = this.x;
        this.targetY = this.y;
        
        console.log('📷 Camera initialized');
    }
    
    update() {
        // Smooth camera movement
        this.x += (this.targetX - this.x) * this.smoothness;
        this.y += (this.targetY - this.y) * this.smoothness;
        this.zoom += (this.targetZoom - this.zoom) * this.smoothness;
        
        // Clamp zoom
        this.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.zoom));
        
        // Clamp to bounds if set
        if (this.bounds) {
            this.clampToBounds();
        }
    }
    
    moveTo(x, y) {
        this.targetX = x;
        this.targetY = y;
    }
    
    moveBy(dx, dy) {
        this.targetX += dx;
        this.targetY += dy;
    }
    
    zoomTo(zoom, centerX, centerY) {
        if (centerX === undefined) centerX = this.width / 2;
        if (centerY === undefined) centerY = this.height / 2;
        
        const oldZoom = this.zoom;
        this.targetZoom = Math.max(this.minZoom, Math.min(this.maxZoom, zoom));
        
        // Zoom towards center point
        const ratio = this.targetZoom / oldZoom;
        this.targetX = centerX - (centerX - this.x) * ratio;
        this.targetY = centerY - (centerY - this.y) * ratio;
    }
    
    zoomIn(amount = 0.1) {
        this.zoomTo(this.zoom + amount);
    }
    
    zoomOut(amount = 0.1) {
        this.zoomTo(this.zoom - amount);
    }
    
    screenToWorld(screenX, screenY) {
        return {
            x: (screenX - this.x) / this.zoom + this.x,
            y: (screenY - this.y) / this.zoom + this.y
        };
    }
    
    worldToScreen(worldX, worldY) {
        return {
            x: (worldX - this.x) * this.zoom + this.x,
            y: (worldY - this.y) * this.zoom + this.y
        };
    }
    
    setBounds(bounds) {
        this.bounds = bounds;
        this.clampToBounds();
    }
    
    clampToBounds() {
        if (!this.bounds) return;
        
        const { minX, minY, maxX, maxY } = this.bounds;
        
        // Calculate visible area
        const halfWidth = this.width / (2 * this.zoom);
        const halfHeight = this.height / (2 * this.zoom);
        
        this.targetX = Math.max(minX + halfWidth, Math.min(maxX - halfWidth, this.targetX));
        this.targetY = Math.max(minY + halfHeight, Math.min(maxY - halfHeight, this.targetY));
    }
    
    startDrag(x, y) {
        this.dragging = true;
        this.dragStartX = x;
        this.dragStartY = y;
        this.dragStartCamX = this.x;
        this.dragStartCamY = this.y;
        this.eventBus.emit('camera:dragStart', { x, y });
    }
    
    dragTo(x, y) {
        if (!this.dragging) return;
        
        const dx = x - this.dragStartX;
        const dy = y - this.dragStartY;
        
        this.targetX = this.dragStartCamX - dx / this.zoom;
        this.targetY = this.dragStartCamY - dy / this.zoom;
        
        this.eventBus.emit('camera:drag', { x, y, dx, dy });
    }
    
    endDrag() {
        this.dragging = false;
        this.eventBus.emit('camera:dragEnd');
    }
    
    reset() {
        this.x = this.width / 2;
        this.y = this.height / 2;
        this.zoom = 1;
        this.targetX = this.x;
        this.targetY = this.y;
        this.targetZoom = 1;
    }
}
