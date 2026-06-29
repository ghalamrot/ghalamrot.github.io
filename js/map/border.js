export class Border {
    constructor(data) {
        this.id = data.id || Math.random();
        this.province1 = data.province1;
        this.province2 = data.province2;
        this.points = data.points || [];
        this.type = data.type || 'land'; // 'land', 'river', 'mountain', 'sea'
        this.strength = data.strength || 1;
        this.color = data.color || '#fff';
        this.width = data.width || 1;
        this.isVisible = data.isVisible !== undefined ? data.isVisible : true;
    }
    
    getLength() {
        let length = 0;
        for (let i = 1; i < this.points.length; i++) {
            const dx = this.points[i].x - this.points[i-1].x;
            const dy = this.points[i].y - this.points[i-1].y;
            length += Math.sqrt(dx * dx + dy * dy);
        }
        return length;
    }
    
    getMidpoint() {
        if (this.points.length === 0) return { x: 0, y: 0 };
        const midIndex = Math.floor(this.points.length / 2);
        return this.points[midIndex];
    }
    
    isPointOnBorder(x, y, threshold = 5) {
        for (let i = 1; i < this.points.length; i++) {
            const p1 = this.points[i-1];
            const p2 = this.points[i];
            const distance = this.distanceToSegment(x, y, p1, p2);
            if (distance < threshold) return true;
        }
        return false;
    }
    
    distanceToSegment(x, y, p1, p2) {
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const len2 = dx * dx + dy * dy;
        
        if (len2 === 0) {
            const ddx = x - p1.x;
            const ddy = y - p1.y;
            return Math.sqrt(ddx * ddx + ddy * ddy);
        }
        
        let t = ((x - p1.x) * dx + (y - p1.y) * dy) / len2;
        t = Math.max(0, Math.min(1, t));
        
        const px = p1.x + t * dx;
        const py = p1.y + t * dy;
        
        const ddx = x - px;
        const ddy = y - py;
        return Math.sqrt(ddx * ddx + ddy * ddy);
    }
    
    getTypeIcon() {
        const icons = {
            land: '⛰️',
            river: '🌊',
            mountain: '🏔️',
            sea: '🌅'
        };
        return icons[this.type] || '❓';
    }
    
    toJSON() {
        return {
            id: this.id,
            province1: this.province1,
            province2: this.province2,
            points: this.points,
            type: this.type,
            strength: this.strength,
            color: this.color,
            width: this.width,
            isVisible: this.isVisible
        };
    }
}
