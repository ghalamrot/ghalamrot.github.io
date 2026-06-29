export class Pathfinding {
    constructor() {
        this.gridSize = 20;
        this.grid = [];
        this.width = 0;
        this.height = 0;
    }

    initialize(map) {
        this.width = map.width || 1000;
        this.height = map.height || 1000;
        this.buildGrid(map);
    }

    buildGrid(map) {
        const cols = Math.ceil(this.width / this.gridSize);
        const rows = Math.ceil(this.height / this.gridSize);
        this.grid = Array(rows).fill(null).map(() => Array(cols).fill(0));
        
        // Mark obstacles (provinces with enemy)
        for (const province of map.provinces) {
            if (province.ownerId !== null) {
                const gridX = Math.floor(province.center.x / this.gridSize);
                const gridY = Math.floor(province.center.y / this.gridSize);
                if (gridX >= 0 && gridX < cols && gridY >= 0 && gridY < rows) {
                    this.grid[gridY][gridX] = 1; // Obstacle
                }
            }
        }
    }

    findPath(startX, startY, endX, endY) {
        const start = {
            x: Math.floor(startX / this.gridSize),
            y: Math.floor(startY / this.gridSize)
        };
        const end = {
            x: Math.floor(endX / this.gridSize),
            y: Math.floor(endY / this.gridSize)
        };

        // A* algorithm
        const openSet = [];
        const closedSet = new Set();
        const cameFrom = new Map();
        const gScore = new Map();
        const fScore = new Map();

        const startKey = `${start.x},${start.y}`;
        gScore.set(startKey, 0);
        fScore.set(startKey, this.heuristic(start, end));
        openSet.push(start);

        while (openSet.length > 0) {
            // Find node with lowest fScore
            let current = openSet[0];
            let currentIndex = 0;
            for (let i = 1; i < openSet.length; i++) {
                const key = `${openSet[i].x},${openSet[i].y}`;
                const currentKey = `${current.x},${current.y}`;
                if (fScore.get(key) < fScore.get(currentKey)) {
                    current = openSet[i];
                    currentIndex = i;
                }
            }

            // Check if we reached the goal
            if (current.x === end.x && current.y === end.y) {
                return this.reconstructPath(cameFrom, current);
            }

            // Move current from open to closed
            openSet.splice(currentIndex, 1);
            closedSet.add(`${current.x},${current.y}`);

            // Check neighbors
            const neighbors = this.getNeighbors(current);
            for (const neighbor of neighbors) {
                const neighborKey = `${neighbor.x},${neighbor.y}`;
                
                if (closedSet.has(neighborKey)) continue;
                if (this.grid[neighbor.y]?.[neighbor.x] === 1) continue; // Obstacle

                const tentativeG = gScore.get(`${current.x},${current.y}`) + 1;
                
                if (!gScore.has(neighborKey) || tentativeG < gScore.get(neighborKey)) {
                    cameFrom.set(neighborKey, current);
                    gScore.set(neighborKey, tentativeG);
                    fScore.set(neighborKey, tentativeG + this.heuristic(neighbor, end));
                    
                    if (!openSet.some(n => n.x === neighbor.x && n.y === neighbor.y)) {
                        openSet.push(neighbor);
                    }
                }
            }
        }

        return []; // No path found
    }

    getNeighbors(node) {
        const neighbors = [];
        const directions = [
            { x: 0, y: -1 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: -1, y: 0 },
            { x: 1, y: -1 }, { x: 1, y: 1 }, { x: -1, y: 1 }, { x: -1, y: -1 }
        ];

        for (const dir of directions) {
            const newX = node.x + dir.x;
            const newY = node.y + dir.y;
            if (newX >= 0 && newX < this.grid[0]?.length && 
                newY >= 0 && newY < this.grid.length) {
                neighbors.push({ x: newX, y: newY });
            }
        }

        return neighbors;
    }

    heuristic(a, b) {
        // Manhattan distance
        return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
    }

    reconstructPath(cameFrom, current) {
        const path = [];
        let node = current;
        
        while (node) {
            path.unshift({
                x: node.x * this.gridSize + this.gridSize / 2,
                y: node.y * this.gridSize + this.gridSize / 2
            });
            const key = `${node.x},${node.y}`;
            node = cameFrom.get(key);
        }
        
        return path;
    }

    isWalkable(x, y) {
        const gridX = Math.floor(x / this.gridSize);
        const gridY = Math.floor(y / this.gridSize);
        return !(this.grid[gridY]?.[gridX] === 1);
    }

    updateGrid(map) {
        this.buildGrid(map);
    }
}
