export class Troop {
    constructor(data) {
        this.id = data.id || Math.random();
        this.ownerId = data.ownerId || 0;
        this.provinceId = data.provinceId || null;
        this.type = data.type || 'infantry';
        this.count = data.count || 10;
        this.maxCount = data.maxCount || 50;
        this.health = data.health || 100;
        this.maxHealth = data.maxHealth || 100;
        this.attack = data.attack || 5;
        this.defense = data.defense || 3;
        this.speed = data.speed || 2;
        this.position = data.position || { x: 0, y: 0 };
        this.targetPosition = data.targetPosition || null;
        this.moving = false;
        this.path = [];
        this.pathIndex = 0;
        this.animating = false;
        this.animationProgress = 0;
        this.selected = false;
        this.battleId = null;
    }

    moveTo(targetX, targetY) {
        this.targetPosition = { x: targetX, y: targetY };
        this.moving = true;
        this.path = this.findPath(this.position, this.targetPosition);
        this.pathIndex = 0;
    }

    findPath(from, to) {
        // Simple straight line path
        const path = [];
        const steps = Math.floor(this.getDistance(from, to) / 20);
        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            path.push({
                x: from.x + (to.x - from.x) * t,
                y: from.y + (to.y - from.y) * t
            });
        }
        return path;
    }

    getDistance(p1, p2) {
        const dx = p1.x - p2.x;
        const dy = p1.y - p2.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    update(deltaTime) {
        if (this.moving && this.path.length > 0) {
            const speed = this.speed * 100 * deltaTime;
            const target = this.path[this.pathIndex];
            
            if (!target) {
                this.moving = false;
                this.path = [];
                this.pathIndex = 0;
                return;
            }

            const dx = target.x - this.position.x;
            const dy = target.y - this.position.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < speed) {
                this.position.x = target.x;
                this.position.y = target.y;
                this.pathIndex++;
                
                if (this.pathIndex >= this.path.length) {
                    this.moving = false;
                    this.path = [];
                    this.pathIndex = 0;
                    this.targetPosition = null;
                }
            } else {
                this.position.x += (dx / distance) * speed;
                this.position.y += (dy / distance) * speed;
            }
        }

        // Animation
        if (this.animating) {
            this.animationProgress += deltaTime;
            if (this.animationProgress >= 1) {
                this.animating = false;
                this.animationProgress = 0;
            }
        }
    }

    attack(target) {
        this.animating = true;
        this.animationProgress = 0;
        
        const damage = this.attack * (this.count / 10);
        target.takeDamage(damage);
        
        return {
            damage: damage,
            remaining: target.health
        };
    }

    takeDamage(damage) {
        this.health -= damage;
        this.count = Math.floor((this.health / this.maxHealth) * this.maxCount);
        if (this.count < 0) this.count = 0;
        if (this.health < 0) this.health = 0;
    }

    isAlive() {
        return this.health > 0 && this.count > 0;
    }

    getCombatPower() {
        return this.attack * (this.count / 10) * (this.health / 100);
    }

    toJSON() {
        return {
            id: this.id,
            ownerId: this.ownerId,
            provinceId: this.provinceId,
            type: this.type,
            count: this.count,
            maxCount: this.maxCount,
            health: this.health,
            maxHealth: this.maxHealth,
            attack: this.attack,
            defense: this.defense,
            speed: this.speed,
            position: this.position
        };
    }
              }
