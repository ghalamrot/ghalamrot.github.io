import { EventBus } from '../eventBus.js';

export class AIManager {
    constructor() {
        this.eventBus = EventBus;
        this.aiPlayers = [];
        this.difficulty = 'normal';
        this.tickInterval = 5; // Seconds between AI decisions
        this.tickCounter = 0;
        this.decisionCache = new Map();
    }

    initialize() {
        const state = window.game?.state;
        if (!state) return;

        this.aiPlayers = state.players.filter(p => !p.isHuman);
        this.difficulty = state.settings?.difficulty || 'normal';
        
        console.log(`🤖 AI initialized with ${this.aiPlayers.length} players (${this.difficulty} mode)`);
    }

    update(deltaTime) {
        this.tickCounter += deltaTime;
        
        if (this.tickCounter >= this.tickInterval) {
            this.tickCounter = 0;
            this.processAI();
        }
    }

    processAI() {
        for (const player of this.aiPlayers) {
            this.processPlayerAI(player);
        }
    }

    processPlayerAI(player) {
        const state = window.game?.state;
        const map = window.game?.map;
        if (!state || !map) return;

        const provinces = map.getProvincesByOwner(player.id);
        if (provinces.length === 0) return;

        // Get decisions based on difficulty
        const decisions = this.getAIDecisions(player, provinces, state, map);
        
        // Execute decisions
        for (const decision of decisions) {
            this.executeDecision(decision, player, state, map);
        }
    }

    getAIDecisions(player, provinces, state, map) {
        const decisions = [];
        const difficultyMultiplier = this.getDifficultyMultiplier();

        // 1. Check for expansion opportunities
        const expansionTargets = this.findExpansionTargets(player, provinces, map);
        if (expansionTargets.length > 0 && Math.random() < 0.6 * difficultyMultiplier) {
            decisions.push({
                type: 'expand',
                target: expansionTargets[Math.floor(Math.random() * expansionTargets.length)]
            });
        }

        // 2. Check for attacks
        if (Math.random() < 0.4 * difficultyMultiplier) {
            const attackTarget = this.findAttackTarget(player, map);
            if (attackTarget) {
                decisions.push({
                    type: 'attack',
                    target: attackTarget
                });
            }
        }

        // 3. Build economy
        if (Math.random() < 0.3 * difficultyMultiplier) {
            const province = this.findBestProvinceForBuilding(provinces);
            if (province) {
                decisions.push({
                    type: 'build',
                    target: province.id,
                    building: this.selectBuilding(province)
                });
            }
        }

        // 4. Defend vulnerable provinces
        const vulnerableProvinces = this.findVulnerableProvinces(provinces, map);
        for (const province of vulnerableProvinces) {
            if (Math.random() < 0.3 * difficultyMultiplier) {
                decisions.push({
                    type: 'defend',
                    target: province.id
                });
            }
        }

        return decisions;
    }

    findExpansionTargets(player, provinces, map) {
        const targets = [];
        const borderProvinces = [];
        
        // Find border provinces
        for (const province of provinces) {
            for (const neighborId of province.neighbors) {
                const neighbor = map.getProvince(neighborId);
                if (neighbor && neighbor.ownerId !== player.id && neighbor.ownerId !== null) {
                    borderProvinces.push(neighbor);
                }
            }
        }

        // Filter by strength
        for (const target of borderProvinces) {
            const owner = window.game?.state?.getPlayerById(target.ownerId);
            if (!owner) continue;
            
            // Compare army strength
            const playerPower = player.army || 0;
            const targetPower = owner.army || 0;
            
            if (playerPower > targetPower * 1.5) {
                targets.push(target);
            }
        }

        return targets;
    }

    findAttackTarget(player, map) {
        const state = window.game?.state;
        if (!state) return null;

        let bestTarget = null;
        let bestScore = 0;

        for (const otherPlayer of state.players) {
            if (otherPlayer.id === player.id || otherPlayer.isHuman) continue;
            
            const score = this.evaluateAttackTarget(player, otherPlayer, map);
            if (score > bestScore) {
                bestScore = score;
                bestTarget = otherPlayer;
            }
        }

        return bestTarget;
    }

    evaluateAttackTarget(attacker, defender, map) {
        let score = 0;
        
        // Military strength
        const attackerPower = attacker.army || 0;
        const defenderPower = defender.army || 0;
        score += (attackerPower - defenderPower) / 10;

        // Province count
        const attackerProvinces = map.getProvincesByOwner(attacker.id).length;
        const defenderProvinces = map.getProvincesByOwner(defender.id).length;
        score += (defenderProvinces - attackerProvinces) * 2;

        // Relation
        const relation = attacker.getRelation(defender.id) || 0;
        score -= relation / 20;

        // Random factor
        score += (Math.random() - 0.5) * 5;

        return score;
    }

    findVulnerableProvinces(provinces, map) {
        const vulnerable = [];
        
        for (const province of provinces) {
            // Check if province has low defense
            if (province.defense < 3) {
                // Check neighboring enemies
                let enemyNeighbors = 0;
                for (const neighborId of province.neighbors) {
                    const neighbor = map.getProvince(neighborId);
                    if (neighbor && neighbor.ownerId !== province.ownerId) {
                        enemyNeighbors++;
                    }
                }
                
                if (enemyNeighbors > 1) {
                    vulnerable.push(province);
                }
            }
        }
        
        return vulnerable;
    }

    findBestProvinceForBuilding(provinces) {
        let bestProvince = null;
        let bestScore = 0;

        for (const province of provinces) {
            let score = 0;
            score += province.population / 1000;
            score += province.goldPerTurn * 2;
            score += (province.army || 0) / 10;
            
            // Prefer provinces without many buildings
            score -= (province.buildings?.length || 0) * 2;
            
            // Prefer border provinces
            if (this.isBorderProvince(province)) {
                score += 5;
            }
            
            if (score > bestScore) {
                bestScore = score;
                bestProvince = province;
            }
        }

        return bestProvince;
    }

    isBorderProvince(province) {
        const map = window.game?.map;
        if (!map) return false;
        
        for (const neighborId of province.neighbors) {
            const neighbor = map.getProvince(neighborId);
            if (neighbor && neighbor.ownerId !== province.ownerId) {
                return true;
            }
        }
        return false;
    }

    selectBuilding(province) {
        const buildings = ['barracks', 'market', 'farm'];
        
        // Prioritize based on needs
        if ((province.army || 0) < 5) {
            return 'barracks';
        }
        if (province.goldPerTurn < 3) {
            return 'market';
        }
        if (province.population < 2000) {
            return 'farm';
        }
        
        return buildings[Math.floor(Math.random() * buildings.length)];
    }

    executeDecision(decision, player, state, map) {
        switch (decision.type) {
            case 'expand':
                this.executeExpansion(decision.target, player, state, map);
                break;
            case 'attack':
                this.executeAttack(decision.target, player, state, map);
                break;
            case 'build':
                this.executeBuild(decision.target, decision.building, player, state, map);
                break;
            case 'defend':
                this.executeDefense(decision.target, player, state, map);
                break;
        }
    }

    executeExpansion(target, player, state, map) {
        // Attack a province to expand
        const troop = new Troop({
            ownerId: player.id,
            provinceId: target.id,
            type: 'infantry',
            count: Math.floor((player.army || 10) * 0.5),
            position: { x: target.center.x - 50, y: target.center.y }
        });
        
        state.units = state.units || [];
        state.units.push(troop);
        
        // Initiate battle
        const battleManager = window.game?.battleManager;
        if (battleManager) {
            const defender = state.getPlayerById(target.ownerId);
            if (defender) {
                battleManager.initiateBattle(troop, defender, target.id);
            }
        }
    }

    executeAttack(target, player, state, map) {
        // Attack a player's province
        const targetProvinces = map.getProvincesByOwner(target.id);
        if (targetProvinces.length === 0) return;
        
        const targetProvince = targetProvinces[Math.floor(Math.random() * targetProvinces.length)];
        this.executeExpansion(targetProvince, player, state, map);
    }

    executeBuild(provinceId, buildingType, player, state, map) {
        const economy = window.game?.economy;
        if (economy) {
            economy.buildBuilding(player.id, provinceId, buildingType);
        }
    }

    executeDefense(provinceId, player, state, map) {
        const province = map.getProvince(provinceId);
        if (!province) return;
        
        // Build defensive buildings
        const economy = window.game?.economy;
        if (economy && player.gold >= 40) {
            economy.buildBuilding(player.id, provinceId, 'fortress');
        }
        
        // Move troops to defend
        // (Implementation depends on movement system)
    }

    getDifficultyMultiplier() {
        const multipliers = {
            easy: 0.5,
            normal: 1.0,
            hard: 1.5,
            impossible: 2.0
        };
        return multipliers[this.difficulty] || 1.0;
    }
        }
