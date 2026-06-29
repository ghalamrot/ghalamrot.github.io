import { EventBus } from '../eventBus.js';

export class AnimationManager {
    constructor() {
        this.animations = [];
        this.eventBus = EventBus;
        this.particleSystems = [];
        this.trailEffects = [];
    }

    addAnimation(animation) {
        this.animations.push({
            ...animation,
            progress: 0,
            active: true
        });
        
        this.eventBus.emit('animation:started', animation);
        return this.animations.length - 1;
    }

    update(deltaTime) {
        // Update animations
        for (let i = this.animations.length - 1; i >= 0; i--) {
            const anim = this.animations[i];
            if (!anim.active) continue;
            
            anim.progress += deltaTime / anim.duration;
            
            if (anim.progress >= 1) {
                anim.progress = 1;
                anim.active = false;
                this.eventBus.emit('animation:completed', anim);
                this.animations.splice(i, 1);
            }
        }

        // Update particles
        for (let i = this.particleSystems.length - 1; i >= 0; i--) {
            const system = this.particleSystems[i];
            this.updateParticles(system, deltaTime);
            
            if (system.particles.every(p => p.life <= 0)) {
                this.particleSystems.splice(i, 1);
            }
        }

        // Update trails
        for (let i = this.trailEffects.length - 1; i >= 0; i--) {
            const trail = this.trailEffects[i];
            this.updateTrail(trail, deltaTime);
            
            if (trail.points.length === 0) {
                this.trailEffects.splice(i, 1);
            }
        }
    }

    // Battle animations
    animateBattle(attacker, defender, province) {
        // Attack animation
        this.addAnimation({
            type: 'battle',
            attacker: attacker,
            defender: defender,
            province: province,
            duration: 1.0,
            effects: [
                this.createExplosionEffect(province.center.x, province.center.y),
                this.createDamageFlash(province)
            ]
        });

        // Particle effects
        this.addParticleSystem({
            position: province.center,
            type: 'explosion',
            count: 50,
            duration: 1.5
        });
    }

    // Movement animations
    animateMovement(unit, path) {
        this.addAnimation({
            type: 'movement',
            unit: unit,
            path: path,
            duration: 2.0
        });

        // Trail effect
        this.addTrailEffect(unit, path, {
            color: '#ffd700',
            width: 3,
            lifetime: 1.0
        });
    }

    // Capture animation
    animateCapture(province, oldColor, newColor) {
        this.addAnimation({
            type: 'capture',
            province: province,
            oldColor: oldColor,
            newColor: newColor,
            duration: 0.8
        });

        // Flag effect
        this.addParticleSystem({
            position: province.center,
            type: 'celebration',
            count: 30,
            duration: 1.0,
            colors: [newColor, '#ffd700']
        });
    }

    // Create explosion effect
    createExplosionEffect(x, y) {
        return {
            type: 'explosion',
            position: { x, y },
            radius: 30,
            particles: 20
        };
    }

    // Create damage flash
    createDamageFlash(province) {
        return {
            type: 'flash',
            province: province,
            color: '#ff0000',
            duration: 0.3
        };
    }

    // Particle system
    addParticleSystem(config) {
        const system = {
            particles: [],
            ...config,
            elapsed: 0
        };

        // Create particles
        for (let i = 0; i < config.count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 50 + Math.random() * 100;
            const lifetime = 0.5 + Math.random() * 1;
            
            system.particles.push({
                x: config.position.x + (Math.random() - 0.5) * 20,
                y: config.position.y + (Math.random() - 0.5) * 20,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 2 + Math.random() * 4,
                life: lifetime,
                maxLife: lifetime,
                color: config.colors ? 
                    config.colors[Math.floor(Math.random() * config.colors.length)] : 
                    '#ff6b6b'
            });
        }

        this.particleSystems.push(system);
    }

    updateParticles(system, deltaTime) {
        system.elapsed += deltaTime;
        
        for (const particle of system.particles) {
            particle.x += particle.vx * deltaTime;
            particle.y += particle.vy * deltaTime;
            particle.vy += 50 * deltaTime; // Gravity
            particle.life -= deltaTime;
            particle.size *= 0.99;
        }

        system.particles = system.particles.filter(p => p.life > 0);
    }

    // Trail effect
    addTrailEffect(unit, path, config) {
        const trail = {
            unit: unit,
            points: [],
            config: config || { color: '#ffd700', width: 3, lifetime: 1.0 },
            elapsed: 0
        };

        // Sample path points
        const numPoints = Math.min(path.length, 20);
        for (let i = 0; i < numPoints; i++) {
            const index = Math.floor((i / numPoints) * path.length);
            trail.points.push({
                x: path[index]?.x || unit.position.x,
                y: path[index]?.y || unit.position.y,
                life: 1
            });
        }

        this.trailEffects.push(trail);
    }

    updateTrail(trail, deltaTime) {
        trail.elapsed += deltaTime;
        
        // Fade points
        for (const point of trail.points) {
            point.life -= deltaTime / (trail.config.lifetime || 1);
        }

        trail.points = trail.points.filter(p => p.life > 0);

        // Add new point if unit is moving
        if (trail.unit.moving) {
            trail.points.push({
                x: trail.unit.position.x,
                y: trail.unit.position.y,
                life: 1
            });
        }
    }

    // Render animations
    render(ctx) {
        // Render particles
        for (const system of this.particleSystems) {
            for (const particle of system.particles) {
                const alpha = particle.life / particle.maxLife;
                ctx.globalAlpha = alpha;
                ctx.fillStyle = particle.color;
                ctx.beginPath();
                ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.globalAlpha = 1;
        }

        // Render trails
        for (const trail of this.trailEffects) {
            const config = trail.config;
            ctx.strokeStyle = config.color || '#ffd700';
            ctx.lineWidth = config.width || 3;
            ctx.globalAlpha = 0.3;
            
            ctx.beginPath();
            for (let i = 0; i < trail.points.length; i++) {
                const point = trail.points[i];
                if (i === 0) {
                    ctx.moveTo(point.x, point.y);
                } else {
                    ctx.lineTo(point.x, point.y);
                }
            }
            ctx.stroke();
            
            ctx.globalAlpha = 1;
        }
    }
}
