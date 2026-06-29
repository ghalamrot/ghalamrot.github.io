import { EventBus } from '../eventBus.js';

export class UIManager {
    constructor() {
        this.eventBus = EventBus;
        this.topbar = null;
        this.sidebar = null;
        this.minimap = null;
        this.menu = null;
        this.notifications = [];
        this.notificationContainer = null;
        this.menuOverlay = null;
    }
    
    init() {
        // Get DOM elements
        this.topbar = document.getElementById('topbar');
        this.sidebar = document.getElementById('sidebar');
        this.minimap = document.getElementById('minimap');
        this.menuOverlay = document.getElementById('menu-overlay');
        this.notificationContainer = document.getElementById('notifications');
        
        // Setup event listeners
        this.setupEvents();
        
        // Create minimap canvas
        this.setupMinimap();
        
        console.log('🖥️ UI manager initialized');
    }
    
    setupEvents() {
        // Close sidebar on escape
        this.eventBus.on('ui:escape', () => {
            this.toggleSidebar(false);
        });
        
        // Toggle sidebar
        this.eventBus.on('ui:toggleSidebar', () => {
            this.toggleSidebar();
        });
        
        // Toggle minimap
        this.eventBus.on('ui:toggleMinimap', () => {
            this.toggleMinimap();
        });
        
        // Show notification
        this.eventBus.on('notification:add', (notification) => {
            this.addNotification(notification);
        });
    }
    
    setupMinimap() {
        const canvas = document.createElement('canvas');
        canvas.width = 150;
        canvas.height = 150;
        this.minimap.appendChild(canvas);
        this.minimapCanvas = canvas;
        this.minimapCtx = canvas.getContext('2d');
        
        // Click on minimap to move camera
        canvas.addEventListener('click', (e) => {
            const rect = canvas.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width;
            const y = (e.clientY - rect.top) / rect.height;
            
            const camera = window.game?.camera;
            const map = window.game?.map;
            if (camera && map) {
                const worldX = x * map.width;
                const worldY = y * map.height;
                camera.moveTo(worldX, worldY);
            }
        });
    }
    
    updateMinimap() {
        const ctx = this.minimapCtx;
        const canvas = this.minimapCanvas;
        const map = window.game?.map;
        
        if (!map || map.provinces.length === 0) {
            ctx.fillStyle = '#1a1a2e';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            return;
        }
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw provinces
        const scaleX = canvas.width / map.width;
        const scaleY = canvas.height / map.height;
        
        for (const province of map.provinces) {
            const color = province.getColor();
            ctx.fillStyle = color;
            
            const x = province.center.x * scaleX;
            const y = province.center.y * scaleY;
            const radius = Math.max(3, province.radius * Math.min(scaleX, scaleY));
            
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fill();
            
            // Border
            ctx.strokeStyle = 'rgba(255,255,255,0.3)';
            ctx.lineWidth = 1;
            ctx.stroke();
        }
        
        // Draw viewport rectangle
        const camera = window.game?.camera;
        if (camera) {
            const viewX = (camera.x - camera.width / (2 * camera.zoom)) * scaleX;
            const viewY = (camera.y - camera.height / (2 * camera.zoom)) * scaleY;
            const viewW = (camera.width / camera.zoom) * scaleX;
            const viewH = (camera.height / camera.zoom) * scaleY;
            
            ctx.strokeStyle = '#ffd700';
            ctx.lineWidth = 1;
            ctx.strokeRect(viewX, viewY, viewW, viewH);
        }
    }
    
    updateSidebar(province) {
        if (!this.sidebar) return;
        
        const state = window.game?.state;
        if (!state) return;
        
        this.sidebar.classList.remove('hidden');
        
        let html = `<div class="sidebar-title">${province.name}</div>`;
        html += `<div class="sidebar-info">`;
        html += `<div><span class="label">مالک:</span> ${this.getOwnerName(province.ownerId)}</div>`;
        html += `<div><span class="label">جمعیت:</span> ${province.population.toLocaleString()}</div>`;
        html += `<div><span class="label">سرباز:</span> ${province.army}</div>`;
        html += `<div><span class="label">درآمد:</span> ${province.goldPerTurn} طلا</div>`;
        html += `<div><span class="label">دفاع:</span> ${province.defense}</div>`;
        html += `<div><span class="label">تعداد همسایه:</span> ${province.neighbors.length}</div>`;
        
        if (province.buildings.length > 0) {
            html += `<div><span class="label">ساختمان‌ها:</span> ${province.buildings.map(b => b.name).join(', ')}</div>`;
        }
        
        html += `</div>`;
        html += `<div style="margin-top: 10px; display: flex; gap: 5px; flex-wrap: wrap;">`;
        
        // Action buttons
        const currentPlayer = state.getCurrentPlayer();
        if (currentPlayer && province.ownerId === currentPlayer.id) {
            html += `<button onclick="window.game.ui.buildBuilding(${province.id}, 'barracks')">ساخت پادگان</button>`;
            html += `<button onclick="window.game.ui.buildBuilding(${province.id}, 'market')">ساخت بازار</button>`;
            html += `<button onclick="window.game.ui.buildBuilding(${province.id}, 'fortress')">ساخت قلعه</button>`;
        }
        
        html += `</div>`;
        
        this.sidebar.innerHTML = html;
    }
    
    getOwnerName(playerId) {
        if (playerId === null) return 'بدون مالک';
        const state = window.game?.state;
        const player = state?.getPlayerById(playerId);
        return player ? player.name : 'ناشناس';
    }
    
    toggleSidebar(forceState) {
        if (!this.sidebar) return;
        if (forceState !== undefined) {
            this.sidebar.classList.toggle('hidden', !forceState);
        } else {
            this.sidebar.classList.toggle('hidden');
        }
    }
    
    toggleMinimap() {
        if (!this.minimap) return;
        this.minimap.style.display = this.minimap.style.display === 'none' ? 'block' : 'none';
    }
    
    addNotification(notification) {
        const { message, type = 'info', duration = 3000 } = notification;
        
        const div = document.createElement('div');
        div.className = `notification ${type}`;
        div.textContent = message;
        
        this.notificationContainer.appendChild(div);
        
        // Auto remove
        setTimeout(() => {
            div.style.opacity = '0';
            div.style.transform = 'translateX(100px)';
            setTimeout(() => {
                if (div.parentNode) {
                    div.parentNode.removeChild(div);
                }
            }, 300);
        }, duration);
        
        // Keep only last 10 notifications
        while (this.notificationContainer.children.length > 10) {
            this.notificationContainer.removeChild(this.notificationContainer.firstChild);
        }
    }
    
    buildBuilding(provinceId, buildingType) {
        const eventBus = this.eventBus;
        eventBus.emit('building:build', { provinceId, buildingType });
    }
    
    showMenu(type = 'main') {
        if (!this.menuOverlay) return;
        
        this.menuOverlay.classList.add('active');
        this.menuOverlay.innerHTML = this.getMenuHTML(type);
        
        // Setup menu events
        this.setupMenuEvents();
    }
    
    hideMenu() {
        if (!this.menuOverlay) return;
        this.menuOverlay.classList.remove('active');
    }
    
    getMenuHTML(type) {
        const menus = {
            main: `
                <div class="menu-panel">
                    <div class="menu-title">🎮 قلم‌رُستان</div>
                    <button class="menu-btn primary" data-action="start">شروع بازی</button>
                    <button class="menu-btn" data-action="load">بارگذاری</button>
                    <button class="menu-btn" data-action="settings">تنظیمات</button>
                    <button class="menu-btn" data-action="about">درباره</button>
                </div>
            `,
            settings: `
                <div class="menu-panel">
                    <div class="menu-title">⚙️ تنظیمات</div>
                    <div style="margin: 10px 0;">
                        <label>تعداد بازیکنان: <input type="range" min="2" max="8" value="${window.game?.state?.settings?.numPlayers || 4}" id="playersSlider"></label>
                        <span id="playersValue">${window.game?.state?.settings?.numPlayers || 4}</span>
                    </div>
                    <div style="margin: 10px 0;">
                        <label>دشواری: 
                            <select id="difficultySelect">
                                <option value="easy">آسان</option>
                                <option value="normal" selected>متوسط</option>
                                <option value="hard">سخت</option>
                            </select>
                        </label>
                    </div>
                    <button class="menu-btn primary" data-action="back">بازگشت</button>
                </div>
            `
        };
        
        return menus[type] || menus.main;
    }
    
    setupMenuEvents() {
        const buttons = this.menuOverlay.querySelectorAll('[data-action]');
        for (const button of buttons) {
            button.addEventListener('click', () => {
                const action = button.dataset.action;
                switch (action) {
                    case 'start':
                        this.eventBus.emit('game:start');
                        break;
                    case 'load':
                        this.eventBus.emit('game:load');
                        break;
                    case 'settings':
                        this.showMenu('settings');
                        break;
                    case 'about':
                        this.showAbout();
                        break;
                    case 'back':
                        this.showMenu('main');
                        break;
                }
            });
        }
        
        // Settings sliders
        const playersSlider = document.getElementById('playersSlider');
        if (playersSlider) {
            playersSlider.addEventListener('input', (e) => {
                const value = document.getElementById('playersValue');
                if (value) value.textContent = e.target.value;
                if (window.game?.state?.settings) {
                    window.game.state.settings.numPlayers = parseInt(e.target.value);
                }
            });
        }
    }
    
    showAbout() {
        // Simple about dialog
        alert('🎮 قلم‌رُستان\n\nیک بازی استراتژی تاریخی\nنسخه 0.1.0');
    }
    
    showError(message) {
        this.addNotification({
            message: `❌ ${message}`,
            type: 'error',
            duration: 5000
        });
    }
    
    showSuccess(message) {
        this.addNotification({
            message: `✅ ${message}`,
            type: 'success',
            duration: 3000
        });
    }
                      }
