export class Player {
    constructor(data) {
        this.id = data.id || 0;
        this.name = data.name || 'بازیکن';
        this.color = data.color || '#ff6b6b';
        this.isHuman = data.isHuman || false;
        this.gold = data.gold || 100;
        this.army = data.army || 10;
        this.provinces = data.provinces || [];
        this.diplomacy = data.diplomacy || {};
        this.technology = data.technology || 1;
        this.culture = data.culture || 0;
        this.kills = data.kills || 0;
        this.losses = data.losses || 0;
    }
    
    addGold(amount) {
        this.gold += amount;
    }
    
    spendGold(amount) {
        if (this.gold >= amount) {
            this.gold -= amount;
            return true;
        }
        return false;
    }
    
    addArmy(amount) {
        this.army += amount;
    }
    
    removeArmy(amount) {
        this.army = Math.max(0, this.army - amount);
    }
    
    addProvince(provinceId) {
        if (!this.provinces.includes(provinceId)) {
            this.provinces.push(provinceId);
            return true;
        }
        return false;
    }
    
    removeProvince(provinceId) {
        const index = this.provinces.indexOf(provinceId);
        if (index !== -1) {
            this.provinces.splice(index, 1);
            return true;
        }
        return false;
    }
    
    getTotalPopulation() {
        const map = window.game?.map;
        if (!map) return 0;
        let total = 0;
        for (const provinceId of this.provinces) {
            const province = map.getProvince(provinceId);
            if (province) {
                total += province.population;
            }
        }
        return total;
    }
    
    getTotalGold() {
        const map = window.game?.map;
        if (!map) return this.gold;
        let total = this.gold;
        for (const provinceId of this.provinces) {
            const province = map.getProvince(provinceId);
            if (province) {
                total += province.gold;
            }
        }
        return total;
    }
    
    getIncome() {
        const map = window.game?.map;
        if (!map) return 0;
        let income = 0;
        for (const provinceId of this.provinces) {
            const province = map.getProvince(provinceId);
            if (province) {
                income += province.goldPerTurn;
            }
        }
        return income;
    }
    
    hasDiplomaticRelation(otherPlayerId) {
        return this.diplomacy[otherPlayerId] !== undefined;
    }
    
    getRelation(otherPlayerId) {
        return this.diplomacy[otherPlayerId] || 0;
    }
    
    setRelation(otherPlayerId, value) {
        this.diplomacy[otherPlayerId] = value;
    }
    
    isAlly(otherPlayerId) {
        return this.diplomacy[otherPlayerId] > 50;
    }
    
    isEnemy(otherPlayerId) {
        return this.diplomacy[otherPlayerId] < -50;
    }
    
    isNeutral(otherPlayerId) {
        const relation = this.diplomacy[otherPlayerId];
        return relation === undefined || (relation >= -50 && relation <= 50);
    }
}
