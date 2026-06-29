import { EventBus } from '../eventBus.js';

export class BattleManager {
    constructor() {
        this.battles = [];
        this.activeBattle = null;
        this.eventBus = EventBus;
    }

    initiateBattle(attacker, defender, provinceId) {
        const battle = {
            id: Date.now(),
            attacker: attacker,
            defender: defender,
            provinceId: provinceId,
            startTime: Date.now(),
            status: 'active', // 'active', 'finished', 'retreat'
            winner: null,
            casualties: {
                attacker: 0,
                defender: 0
            },
            rounds: 0
        };

        this.battles.push(battle);
        this.activeBattle = battle;
        
        this.eventBus.emit('battle:started', battle);
        return battle;
    }

    resolveBattle(battle, deltaTime) {
        if (!battle || battle.status !== 'active') return;

        battle.rounds++;
        
        // Calculate combat
        const attackerPower = this.calculatePower(battle.attacker);
        const defenderPower = this.calculatePower(battle.defender);
        
        // Attack
        const attackDamage = attackerPower * (0.5 + Math.random() * 0.5);
        const defenseDamage = defenderPower * (0.5 + Math.random() * 0.5);
        
        battle.casualties.attacker += defenseDamage * 0.1;
        battle.casualties.defender += attackDamage * 0.1;
        
        // Update troops
        battle.attacker.count -= Math.floor(defenseDamage * 0.1);
        battle.defender.count -= Math.floor(attackDamage * 0.1);
        
        // Check for winner
        if (battle.defender.count <= 0) {
            battle.status = 'finished';
            battle.winner = 'attacker';
            this.eventBus.emit('battle:won', { battle, winner: 'attacker' });
            this.handleVictory(battle);
        } else if (battle.attacker.count <= 0) {
            battle.status = 'finished';
            battle.winner = 'defender';
            this.eventBus.emit('battle:won', { battle, winner: 'defender' });
            this.handleVictory(battle);
        }
        
        this.eventBus.emit('battle:update', battle);
    }

    calculatePower(troop) {
        return troop.attack * (troop.count / 10) * (troop.health / 100) * (0.8 + Math.random() * 0.4);
    }

    handleVictory(battle) {
        // Update province ownership
        const map = window.game?.map;
        const state = window.game?.state;
        if (!map || !state) return;

        const province = map.getProvince(battle.provinceId);
        if (!province) return;

        if (battle.winner === 'attacker') {
            province.ownerId = battle.attacker.ownerId;
            // Add province to winner
            const player = state.getPlayerById(battle.attacker.ownerId);
            if (player) {
                player.addProvince(province.id);
                // Remove from defender
                const defender = state.getPlayerById(battle.defender.ownerId);
                if (defender) {
                    defender.removeProvince(province.id);
                }
            }
            
            this.eventBus.emit('province:captured', {
                provinceId: province.id,
                newOwnerId: battle.attacker.ownerId,
                oldOwnerId: battle.defender.ownerId
            });
        }

        // Remove troops
        if (battle.attacker.count <= 0) {
            const index = window.game?.state?.units?.indexOf(battle.attacker);
            if (index !== undefined && index > -1) {
                window.game.state.units.splice(index, 1);
            }
        }
    }

    retreat(attacker) {
        if (this.activeBattle && this.activeBattle.attacker === attacker) {
            this.activeBattle.status = 'retreat';
            this.eventBus.emit('battle:retreat', this.activeBattle);
        }
    }

    getBattle(provinceId) {
        return this.battles.find(b => b.provinceId === provinceId && b.status === 'active');
    }

    update(deltaTime) {
        for (const battle of this.battles) {
            if (battle.status === 'active') {
                this.resolveBattle(battle, deltaTime);
            }
        }
    }
}
