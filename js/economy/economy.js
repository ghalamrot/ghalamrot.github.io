import { EventBus } from '../eventBus.js';

export class EconomyManager {
    constructor() {
        this.eventBus = EventBus;
        this.economyData = {
            totalGold: 0,
            totalPopulation: 0,
            totalArmy: 0,
            tradeRoutes: [],
            markets: [],
            resources: {}
        };
        this.tickCount = 0;
    }

    update(deltaTime) {
        this.tickCount += deltaTime;
        
        // Update economy every 2 seconds
        if (this.tickCount >= 2) {
            this.tickCount = 0;
            this.processEconomicTick();
        }
    }

    processEconomicTick() {
        const state = window.game?.state;
        const map = window.game?.map;
        if (!state || !map) return;

        for (const player of state.players) {
            this.processPlayerEconomy(player, map);
        }
        
        this.updateGlobalStats(state);
        this.eventBus.emit('economy:updated', this.economyData);
    }

    processPlayerEconomy(player, map) {
        let income = 0;
        let population = 0;
        let army = 0;

        // Process each province
        for (const provinceId of player.provinces) {
            const province = map.getProvince(provinceId);
            if (!province) continue;

            // Income from province
            income += province.goldPerTurn || 0;
            population += province.population || 0;
            army += province.army || 0;

            // Population growth
            if (province.population) {
                const growth = Math.floor(province.population * 0.001); // 0.1% growth
                province.population += growth;
            }

            // Army maintenance
            const maintenance = Math.ceil((province.army || 0) * 0.1);
            if (player.gold >= maintenance) {
                player.gold -= maintenance;
            }
        }

        // Add income
        player.gold += income;

        // Technology bonus
        if (player.technology > 1) {
            const bonus = income * (player.technology - 1) * 0.1;
            player.gold += bonus;
        }

        // Trade routes
        if (player.diplomacy) {
            for (const [otherId, relation] of Object.entries(player.diplomacy)) {
                if (relation > 50) { // Ally
                    const bonus = Math.floor(income * 0.05);
                    player.gold += bonus;
                }
            }
        }
    }

    updateGlobalStats(state) {
        this.economyData.totalGold = 0;
        this.economyData.totalPopulation = 0;
        this.economyData.totalArmy = 0;

        for (const player of state.players) {
            this.economyData.totalGold += player.gold || 0;
            this.economyData.totalPopulation += player.getTotalPopulation ? 
                player.getTotalPopulation() : 0;
            this.economyData.totalArmy += player.army || 0;
        }
    }

    buildBuilding(playerId, provinceId, buildingType) {
        const state = window.game?.state;
        const map = window.game?.map;
        if (!state || !map) return false;

        const player = state.getPlayerById(playerId);
        const province = map.getProvince(provinceId);
        
        if (!player || !province) return false;
        if (province.ownerId !== playerId) return false;

        const costs = {
            barracks: 50,
            market: 30,
            fortress: 80,
            farm: 20,
            temple: 40
        };

        const cost = costs[buildingType];
        if (!cost || player.gold < cost) return false;

        // Spend gold
        player.gold -= cost;

        // Build building
        const building = {
            id: Date.now(),
            type: buildingType,
            name: this.getBuildingName(buildingType),
            builtAt: Date.now(),
            effects: this.getBuildingEffects(buildingType)
        };

        province.buildings = province.buildings || [];
        province.buildings.push(building);

        // Apply immediate effects
        this.applyBuildingEffects(province, building);

        this.eventBus.emit('building:built', {
            playerId,
            provinceId,
            building
        });

        return true;
    }

    getBuildingName(type) {
        const names = {
            barracks: 'پادگان',
            market: 'بازار',
            fortress: 'قلعه',
            farm: 'مزرعه',
            temple: 'معبد'
        };
        return names[type] || type;
    }

    getBuildingEffects(type) {
        const effects = {
            barracks: { armyBonus: 5, armyCost: 0.8 },
            market: { goldBonus: 2, tradeBonus: 0.2 },
            fortress: { defenseBonus: 3, buildingCost: 0.9 },
            farm: { populationGrowth: 0.002, goldBonus: 1 },
            temple: { cultureBonus: 2, happinessBonus: 1 }
        };
        return effects[type] || {};
    }

    applyBuildingEffects(province, building) {
        const effects = building.effects;
        if (!effects) return;

        if (effects.armyBonus) {
            province.maxArmy = (province.maxArmy || 10) + effects.armyBonus;
        }
        if (effects.goldBonus) {
            province.goldPerTurn = (province.goldPerTurn || 1) + effects.goldBonus;
        }
        if (effects.defenseBonus) {
            province.defense = (province.defense || 1) + effects.defenseBonus;
        }
        if (effects.populationGrowth) {
            province.populationGrowth = effects.populationGrowth;
        }
    }

    destroyBuilding(playerId, provinceId, buildingId) {
        const map = window.game?.map;
        if (!map) return false;

        const province = map.getProvince(provinceId);
        if (!province || province.ownerId !== playerId) return false;

        const index = province.buildings.findIndex(b => b.id === buildingId);
        if (index === -1) return false;

        const building = province.buildings[index];
        // Refund half the cost
        const costs = {
            barracks: 25,
            market: 15,
            fortress: 40,
            farm: 10,
            temple: 20
        };

        const refund = costs[building.type] || 0;
        const player = window.game?.state?.getPlayerById(playerId);
        if (player) {
            player.gold += Math.floor(refund / 2);
        }

        province.buildings.splice(index, 1);
        this.eventBus.emit('building:destroyed', { provinceId, buildingId });
        
        return true;
    }
              }
