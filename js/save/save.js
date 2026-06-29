import { EventBus } from '../eventBus.js';

export class SaveManager {
    constructor() {
        this.eventBus = EventBus;
        this.saveInterval = 60000; // 1 minute
        this.lastSave = 0;
        this.enabled = true;
        this.currentSlot = 'autosave';
        this.maxSaves = 10;
    }
    
    saveGame(state, slot = 'autosave') {
        try {
            const saveData = {
                version: '1.0',
                timestamp: Date.now(),
                gameTime: state.time,
                turn: state.turn,
                players: state.players,
                provinces: state.provinces.map(p => p.toJSON()),
                units: state.units,
                settings: state.settings,
                metadata: {
                    playerName: state.getHumanPlayer()?.name || 'بازیکن',
                    date: new Date().toLocaleString()
                }
            };
            
            const saveString = JSON.stringify(saveData);
            
            // Save to localStorage
            const key = `qalamrostan_save_${slot}`;
            localStorage.setItem(key, saveString);
            
            // Update save list
            this.updateSaveList(slot);
            
            this.eventBus.emit('game:saved', { slot, timestamp: saveData.timestamp });
            console.log(`💾 Game saved to slot: ${slot}`);
            
            return true;
        } catch (error) {
            console.error('Failed to save game:', error);
            return false;
        }
    }
    
    loadGame(slot = 'autosave') {
        try {
            const key = `qalamrostan_save_${slot}`;
            const saveString = localStorage.getItem(key);
            
            if (!saveString) {
                console.warn(`No save found for slot: ${slot}`);
                return null;
            }
            
            const saveData = JSON.parse(saveString);
            
            // Validate save data
            if (!this.validateSave(saveData)) {
                throw new Error('Invalid save data');
            }
            
            this.eventBus.emit('game:load', saveData);
            console.log(`📂 Game loaded from slot: ${slot}`);
            
            return saveData;
        } catch (error) {
            console.error('Failed to load game:', error);
            return null;
        }
    }
    
    validateSave(data) {
        return data &&
            data.version &&
            data.timestamp &&
            data.players &&
            data.provinces;
    }
    
    getSaveList() {
        try {
            const list = localStorage.getItem('qalamrostan_save_list');
            return list ? JSON.parse(list) : [];
        } catch (error) {
            return [];
        }
    }
    
    updateSaveList(slot) {
        let list = this.getSaveList();
        
        // Remove existing entry
        list = list.filter(item => item.slot !== slot);
        
        // Add new entry
        list.unshift({
            slot,
            timestamp: Date.now(),
            date: new Date().toLocaleString()
        });
        
        // Limit saves
        if (list.length > this.maxSaves) {
            list = list.slice(0, this.maxSaves);
            // Remove old saves
            for (let i = this.maxSaves; i < list.length; i++) {
                localStorage.removeItem(`qalamrostan_save_${list[i].slot}`);
            }
        }
        
        localStorage.setItem('qalamrostan_save_list', JSON.stringify(list));
    }
    
    deleteSave(slot) {
        try {
            localStorage.removeItem(`qalamrostan_save_${slot}`);
            let list = this.getSaveList();
            list = list.filter(item => item.slot !== slot);
            localStorage.setItem('qalamrostan_save_list', JSON.stringify(list));
            return true;
        } catch (error) {
            console.error('Failed to delete save:', error);
            return false;
        }
    }
    
    autoSave(state) {
        if (!this.enabled) return;
        
        const now = Date.now();
        if (now - this.lastSave >= this.saveInterval) {
            this.saveGame(state, 'autosave');
            this.lastSave = now;
        }
    }
}
