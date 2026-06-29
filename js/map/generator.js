export class Generator {
    constructor() {
        this.seed = Date.now();
        this.random = this.seededRandom;
    }
    
    generate(numProvinces = 50) {
        // Set seed for reproducibility
        this.random = this.seededRandom(this.seed);
        
        // Generate province centers using Poisson disk sampling
        const centers = this.generatePoissonCenters(numProvinces);
        
        // Generate Voronoi-like polygons
        const provinces = this.generateProvinces(centers);
        
        // Generate borders between provinces
        const borders = this.generateBorders(provinces);
        
        // Assign terrain types
        this.assignTerrain(provinces);
        
        // Calculate map bounds
        const bounds = this.calculateBounds(provinces);
        
        return {
            name: 'Random Map',
            version: '1.0',
            width: bounds.width,
            height: bounds.height,
            provinces: provinces,
            borders: borders
        };
    }
    
    generatePoissonCenters(numPoints) {
        const width = 800;
        const height = 600;
        const radius = Math.sqrt((width * height) / (numPoints * 2));
        const gridSize = radius / Math.sqrt(2);
        const gridWidth = Math.ceil(width / gridSize);
        const gridHeight = Math.ceil(height / gridSize);
        const grid = new Array(gridWidth * gridHeight).fill(null);
        
        const points = [];
        const active = [];
        
        // Random first point
        const firstPoint = {
            x: this.random() * width,
            y: this.random() * height
        };
        points.push(firstPoint);
        active.push(firstPoint);
        this.addToGrid(grid, gridWidth, gridSize, firstPoint);
        
        while (active.length > 0 && points.length < numPoints) {
            const index = Math.floor(this.random() * active.length);
            const point = active[index];
            let found = false;
            
            for (let i = 0; i < 30; i++) {
                const angle = this.random() * Math.PI * 2;
                const distance = radius + this.random() * radius;
                const newPoint = {
                    x: point.x + Math.cos(angle) * distance,
                    y: point.y + Math.sin(angle) * distance
                };
                
                if (this.isValidPoint(newPoint, grid, gridWidth, gridSize, radius, width, height)) {
                    points.push(newPoint);
                    active.push(newPoint);
                    this.addToGrid(grid, gridWidth, gridSize, newPoint);
                    found = true;
                    break;
                }
            }
            
            if (!found) {
                active.splice(index, 1);
            }
        }
        
        return points;
    }
    
    isValidPoint(point, grid, gridWidth, gridSize, radius, maxWidth, maxHeight) {
        if (point.x < 0 || point.x > maxWidth || point.y < 0 || point.y > maxHeight) {
            return false;
        }
        
        const gridX = Math.floor(point.x / gridSize);
        const gridY = Math.floor(point.y / gridSize);
        
        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                const nx = gridX + dx;
                const ny = gridY + dy;
                if (nx >= 0 && nx < gridWidth && ny >= 0 && ny < Math.ceil(maxHeight / gridSize)) {
                    const index = ny * gridWidth + nx;
                    const other = grid[index];
                    if (other) {
                        const dx = point.x - other.x;
                        const dy = point.y - other.y;
                        if (dx * dx + dy * dy < radius * radius) {
                            return false;
                        }
                    }
                }
            }
        }
        return true;
    }
    
    addToGrid(grid, gridWidth, gridSize, point) {
        const gridX = Math.floor(point.x / gridSize);
        const gridY = Math.floor(point.y / gridSize);
        const index = gridY * gridWidth + gridX;
        grid[index] = point;
    }
    
    generateProvinces(centers) {
        // Simple Voronoi-like generation using Delaunay triangulation
        const provinces = [];
        const numPoints = centers.length;
        
        // For each point, find its Voronoi cell
        for (let i = 0; i < numPoints; i++) {
            const center = centers[i];
            
            // Generate polygon points
            const points = this.generateVoronoiCell(center, centers, i);
            
            const province = {
                id: i,
                name: `استان ${i + 1}`,
                center: center,
                points: points,
                borderPoints: points,
                radius: 0,
                type: 'polygon',
                ownerId: null,
                terrain: 'plains',
                population: 1000 + Math.floor(this.random() * 9000),
                gold: 0,
                goldPerTurn: 1 + Math.floor(this.random() * 4),
                army: 0,
                maxArmy: 5 + Math.floor(this.random() * 10),
                defense: 1,
                neighbors: [],
                isCapital: false,
                buildings: [],
                color: this.randomColor()
            };
            
            provinces.push(province);
        }
        
        return provinces;
    }
    
    generateVoronoiCell(center, centers, index) {
        // Simplified: Generate a polygon around the center using random points
        const numPoints = 8 + Math.floor(this.random() * 5);
        const points = [];
        const radius = 30 + this.random() * 20;
        
        for (let i = 0; i < numPoints; i++) {
            const angle = (i / numPoints) * Math.PI * 2 + this.random() * 0.3;
            const r = radius * (0.7 + this.random() * 0.3);
            points.push({
                x: center.x + Math.cos(angle) * r,
                y: center.y + Math.sin(angle) * r
            });
        }
        
        return points;
    }
    
    generateBorders(provinces) {
        const borders = [];
        const numProvinces = provinces.length;
        
        for (let i = 0; i < numProvinces; i++) {
            for (let j = i + 1; j < numProvinces; j++) {
                const p1 = provinces[i];
                const p2 = provinces[j];
                const distance = this.getDistance(p1.center, p2.center);
                
                if (distance < 70) {
                    // Check if they're actually adjacent
                    const midpoint = {
                        x: (p1.center.x + p2.center.x) / 2,
                        y: (p1.center.y + p2.center.y) / 2
                    };
                    
                    // Generate border points
                    const points = this.generateBorderPoints(p1, p2);
                    
                    borders.push({
                        id: `b${i}-${j}`,
                        province1: i,
                        province2: j,
                        points: points,
                        type: 'land',
                        strength: 1,
                        color: '#fff',
                        width: 1,
                        isVisible: true
                    });
                    
                    // Add to neighbors
                    p1.neighbors.push(j);
                    p2.neighbors.push(i);
                }
            }
        }
        
        return borders;
    }
    
    generateBorderPoints(p1, p2) {
        const points = [];
        const midX = (p1.center.x + p2.center.x) / 2;
        const midY = (p1.center.y + p2.center.y) / 2;
        const angle = Math.atan2(p2.center.y - p1.center.y, p2.center.x - p1.center.x);
        const perpAngle = angle + Math.PI / 2;
        const length = 20 + this.random() * 10;
        
        for (let i = -2; i <= 2; i++) {
            const t = i / 2;
            const x = midX + Math.cos(perpAngle) * length * t + (this.random() - 0.5) * 5;
            const y = midY + Math.sin(perpAngle) * length * t + (this.random() - 0.5) * 5;
            points.push({ x, y });
        }
        
        return points;
    }
    
    assignTerrain(provinces) {
        const terrains = ['plains', 'hills', 'mountains', 'forest', 'desert', 'coast'];
        for (const province of provinces) {
            province.terrain = terrains[Math.floor(this.random() * terrains.length)];
        }
    }
    
    calculateBounds(provinces) {
        let minX = Infinity, minY = Infinity;
        let maxX = -Infinity, maxY = -Infinity;
        
        for (const province of provinces) {
            for (const point of province.points) {
                if (point.x < minX) minX = point.x;
                if (point.y < minY) minY = point.y;
                if (point.x > maxX) maxX = point.x;
                if (point.y > maxY) maxY = point.y;
            }
        }
        
        return {
            minX,
            minY,
            maxX,
            maxY,
            width: maxX - minX,
            height: maxY - minY
        };
    }
    
    getDistance(p1, p2) {
        const dx = p1.x - p2.x;
        const dy = p1.y - p2.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    seededRandom(seed) {
        return function() {
            seed = (seed * 9301 + 49297) % 233280;
            return seed / 233280;
        };
    }
    
    randomColor() {
        const colors = [
            '#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24',
            '#6c5ce7', '#00b894', '#e17055', '#0984e3',
            '#fdcb6e', '#e84393', '#00cec9', '#fd79a8',
            '#a29bfe', '#55efc4', '#f8a5c2', '#74b9ff'
        ];
        return colors[Math.floor(this.random() * colors.length)];
    }
    
    setSeed(seed) {
        this.seed = seed;
    }
}
