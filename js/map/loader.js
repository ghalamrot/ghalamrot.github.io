export class Loader {
    constructor() {
        this.cache = new Map();
    }
    
    load(filename) {
        // Check cache first
        if (this.cache.has(filename)) {
            return this.cache.get(filename);
        }
        
        // Try to fetch from server
        const data = this.loadFromFile(filename);
        if (data) {
            this.cache.set(filename, data);
            return data;
        }
        
        // Fallback: generate default map
        console.warn(`Map ${filename} not found, using default`);
        const defaultMap = this.generateDefaultMap();
        this.cache.set(filename, defaultMap);
        return defaultMap;
    }
    
    loadFromFile(filename) {
        // In browser, we use fetch
        try {
            const xhr = new XMLHttpRequest();
            xhr.open('GET', filename, false);
            xhr.send();
            
            if (xhr.status === 200) {
                return JSON.parse(xhr.responseText);
            }
        } catch (error) {
            console.warn(`Failed to load ${filename}:`, error);
        }
        return null;
    }
    
    async loadAsync(filename) {
        if (this.cache.has(filename)) {
            return this.cache.get(filename);
        }
        
        try {
            const response = await fetch(filename);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            const data = await response.json();
            this.cache.set(filename, data);
            return data;
        } catch (error) {
            console.warn(`Failed to load ${filename}:`, error);
            const defaultMap = this.generateDefaultMap();
            this.cache.set(filename, defaultMap);
            return defaultMap;
        }
    }
    
    generateDefaultMap() {
        const generator = new (window?.Generator || (await import('./generator.js')).Generator)();
        return generator.generate(30);
    }
    
    clearCache() {
        this.cache.clear();
    }
    
    getCached(filename) {
        return this.cache.get(filename) || null;
    }
}
