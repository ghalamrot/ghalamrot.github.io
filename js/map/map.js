import { EventBus } from '../eventBus.js';
import { Province } from './province.js';
import { Border } from './border.js';
import { Generator } from './generator.js';
import { Loader } from './loader.js';

export class MapManager {
    constructor() {
        this.provinces = [];
        this.borders = [];
        this.width = 0;
        this.height = 0;
        this.name = '';
        this.version = '1.0';
        this.generator = new Generator();
        this.loader = new Loader();
        this.eventBus = EventBus;
        this.selectedProvince = null;
        this.hoveredProvince = null;
    }
    
    init() {
        console.log('🗺️ Map manager initialized');
    }
    
    generateRandom() {
        const config = window.game?.state?.settings || {};
        const numProvinces = config.mapSize || 50;
        const mapData = this.generator.generate(numProvinces);
        this.loadMapData(mapData);
        
        this.eventBus.emit('map:generated', { provinces: this.provinces.length });
        console.log(`🗺️ Generated random map with ${this.provinces.length} provinces`);
    }
    
    loadMap(filename) {
        try {
            const mapData = this.loader.load(filename);
            this.loadMapData(mapData);
            
            this.eventBus.emit('map:loaded', { name: this.name, provinces: this.provinces.length });
            console.log(`🗺️ Loaded map: ${this.name} (${this.provinces.length} provinces)`);
        } catch (error) {
            console.error('Failed to load map:', error);
            this.eventBus.emit('map:loadError', { error });
        }
    }
    
    loadMapData(data) {
        this.name = data.name || 'Unknown';
        this.version = data.version || '1.0';
        this.width = data.width || 1000;
        this.height = data.height || 1000;
        
        // Clear existing data
        this.provinces = [];
        this.borders = [];
        
        // Create provinces
        for (const provinceData of data.provinces) {
            const province = new Province(provinceData);
            this.provinces.push(province);
        }
        
        // Create borders
        for (const borderData of data.borders || []) {
            const border = new Border(borderData);
            this.borders.push(border);
        }
        
        // Calculate neighbors
        this.calculateNeighbors();
        
        // Set map bounds for camera
        this.updateCameraBounds();
    }
    
    calculateNeighbors() {
        // Clear existing neighbors
        for (const province of this.provinces) {
            province.neighbors = [];
        }
        
        // Calculate from borders
        for (const border of this.borders) {
            const p1 = this.getProvince(border.province1);
            const p2 = this.getProvince(border.province2);
            if (p1 && p2) {
                if (!p1.neighbors.includes(p2.id)) p1.neighbors.push(p2.id);
                if (!p2.neighbors.includes(p1.id)) p2.neighbors.push(p1.id);
            }
        }
        
        // Calculate from geometry (if no borders defined)
        if (this.borders.length === 0) {
            this.calculateNeighborsByDistance();
        }
    }
    
    calculateNeighborsByDistance() {
        const threshold = 50; // Distance threshold for neighbor detection
        
        for (let i = 0; i < this.provinces.length; i++) {
            for (let j = i + 1; j < this.provinces.length; j++) {
                const p1 = this.provinces[i];
                const p2 = this.provinces[j];
                
                const distance = this.getDistance(p1.center, p2.center);
                if (distance < threshold) {
                    p1.neighbors.push(p2.id);
                    p2.neighbors.push(p1.id);
                }
            }
        }
    }
    
    getDistance(point1, point2) {
        const dx = point1.x - point2.x;
        const dy = point1.y - point2.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    getProvince(id) {
        return this.provinces.find(p => p.id === id);
    }
    
    getProvincesByOwner(playerId) {
        return this.provinces.filter(p => p.ownerId === playerId);
    }
    
    getProvinceAt(x, y) {
        // Simple point-in-polygon test
        for (const province of this.provinces) {
            if (this.isPointInProvince(x, y, province)) {
                return province;
            }
        }
        return null;
    }
    
    isPointInProvince(x, y, province) {
        // Simple distance-based check for circles
        if (province.type === 'circle') {
            const dx = x - province.center.x;
            const dy = y - province.center.y;
            return (dx * dx + dy * dy) <= (province.radius * province.radius);
        }
        
        // Polygon check
        const points = province.points || province.borderPoints;
        if (!points || points.length < 3) return false;
        
        let inside = false;
        for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
            const xi = points[i].x, yi = points[i].y;
            const xj = points[j].x, yj = points[j].y;
            
            const intersect = ((yi > y) !== (yj > y)) &&
                (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
            if (intersect) inside = !inside;
        }
        return inside;
    }
    
    selectProvince(id) {
        const province = this.getProvince(id);
        if (province) {
            this.selectedProvince = province;
            this.eventBus.emit('province:selected', province);
        }
    }
    
    hoverProvince(id) {
        const province = this.getProvince(id);
        if (province !== this.hoveredProvince) {
            this.hoveredProvince = province;
            this.eventBus.emit('province:hovered', province);
        }
    }
    
    updateCameraBounds() {
        let minX = Infinity, minY = Infinity;
        let maxX = -Infinity, maxY = -Infinity;
        
        for (const province of this.provinces) {
            const points = province.points || province.borderPoints || [province.center];
            for (const point of points) {
                if (point.x < minX) minX = point.x;
                if (point.y < minY) minY = point.y;
                if (point.x > maxX) maxX = point.x;
                if (point.y > maxY) maxY = point.y;
            }
        }
        
        // Add padding
        const padding = 50;
        const bounds = {
            minX: minX - padding,
            minY: minY - padding,
            maxX: maxX + padding,
            maxY: maxY + padding
        };
        
        const camera = window.game?.camera;
        if (camera) {
            camera.setBounds(bounds);
        }
        
        return bounds;
    }
    
    update(deltaTime) {
        // Update province animations, etc.
        for (const province of this.provinces) {
            province.update(deltaTime);
        }
    }
  }
