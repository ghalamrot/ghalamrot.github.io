export class Province {
    constructor(data) {
        this.id = data.id || Math.random();
        this.name = data.name || `Province ${this.id}`;
        this.center = data.center || { x: 0, y: 0 };
        this.points = data.points || [];
        this.borderPoints = data.borderPoints || [];
        this.radius = data.radius || 30;
        this.type = data.type || 'circle'; // 'circle' or 'polygon'
        this.ownerId = data.ownerId || null;
        this.terrain = data.terrain || 'plains';
        this.population = data.population || 1000;
        this.gold = data.gold || 0;
        this.goldPerTurn = data.goldPerTurn || 1;
        this.army = data.army || 0;
        this.maxArmy = data.maxArmy || 10;
        this.defense = data.defense || 1;
        this.neighbors = data.neighbors || [];
        this.isCapital = data.isCapital || false;
        this.buildings = data.buildings || [];
        this.color = data.color || '#888';
        this.selected = false;
        this.hovered = false;
        this.flashTimer = 0;
        this.flashSpeed = 0;
    }
    
    getOwner() {
        if (this.ownerId === null) return null;
        const state = window.game?.state;
        return state?.getPlayerById(this.ownerId) || null;
    }
    
    getColor() {
        if (this.ownerId !== null) {
            const owner = this.getOwner();
            return owner?.color || '#888';
        }
        return this.color || '#888';
    }
    
    isOwned() {
        return this.ownerId !== null;
    }
    
    isNeighbor(provinceId) {
        return this.neighbors.includes(provinceId);
    }
    
    getNeighborProvinces() {
        const map = window.game?.map;
        if (!map) return [];
        return this.neighbors
            .map(id => map.getProvince(id))
            .filter(p => p !== undefined);
    }
    
    addBuilding(building) {
        this.buildings.push(building);
        // Apply building effects
        if (building.type === 'fortress') {
            this.defense += 2;
        }
        if (building.type === 'market') {
            this.goldPerTurn += 1;
        }
        if (building.type === 'barracks') {
            this.maxArmy += 5;
        }
    }
    
    removeBuilding(buildingId) {
        const index = this.buildings.findIndex(b => b.id === buildingId);
        if (index !== -1) {
            const building = this.buildings[index];
            // Remove effects
            if (building.type === 'fortress') {
                this.defense -= 2;
            }
            if (building.type === 'market') {
                this.goldPerTurn -= 1;
            }
            if (building.type === 'barracks') {
                this.maxArmy -= 5;
            }
            this.buildings.splice(index, 1);
            return true;
        }
        return false;
    }
    
    getTotalGold() {
        return this.gold + this.goldPerTurn;
    }
    
    update(deltaTime) {
        // Flash animation
        if (this.flashTimer > 0) {
            this.flashTimer -= deltaTime;
        }
    }
    
    flash(duration = 0.5, speed = 2) {
        this.flashTimer = duration;
        this.flashSpeed = speed;
    }
    
    isFlashing() {
        return this.flashTimer > 0;
    }
    
    getFlashValue() {
        if (!this.isFlashing()) return 0;
        return Math.sin(this.flashTimer * this.flashSpeed * Math.PI * 2) * 0.5 + 0.5;
    }
    
    toJSON() {
        return {
            id: this.id,
            name: this.name,
            center: this.center,
            points: this.points,
            borderPoints: this.borderPoints,
            radius: this.radius,
            type: this.type,
            ownerId: this.ownerId,
            terrain: this.terrain,
            population: this.population,
            gold: this.gold,
            goldPerTurn: this.goldPerTurn,
            army: this.army,
            maxArmy: this.maxArmy,
            defense: this.defense,
            neighbors: this.neighbors,
            isCapital: this.isCapital,
            buildings: this.buildings,
            color: this.color
        };
    }
}
