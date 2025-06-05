class PlinkoGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.coins = auth.getHighScore('plinko') || 100;
        this.currentBet = 10;
        this.minBet = 1;
        this.maxBet = 100;
        this.pegs = [];
        this.balls = [];
        this.slots = [];
        this.currentBall = null;
        this.verificationData = null;
        this.dropZones = [
            { name: 'Left', multiplier: 1.5 },
            { name: 'Center', multiplier: 1 },
            { name: 'Right', multiplier: 1.5 }
        ];
        this.multipliers = [110, 40, 15, 7, 5, 3, 2, 3, 5, 7, 15, 40, 110];
        this.collisionCooldown = new Map();
        this.setupGame();
        this.reset();
    }

    reset() {
        this.balls = [];
        this.currentBall = null;
        this.verificationData = null;
        this.collisionCooldown.clear();
        this.updateCoins();
    }

    setupGame() {
        this.canvas.style.display = 'block';
        
        // Set canvas size to fit screen while maintaining aspect ratio
        const maxWidth = Math.min(800, window.innerWidth - 40);
        const maxHeight = Math.min(800, window.innerHeight - 200);
        const aspectRatio = 1;
        
        if (maxWidth / aspectRatio <= maxHeight) {
            this.canvas.width = maxWidth;
            this.canvas.height = maxWidth;
        } else {
            this.canvas.height = maxHeight;
            this.canvas.width = maxHeight;
        }

        // Create triangular peg layout
        const pegSpacing = this.canvas.width / 20;
        const startX = this.canvas.width / 2;
        const startY = pegSpacing * 2.5;
        const rows = 12;

        for (let row = 0; row < rows; row++) {
            const pegsInRow = row + 5;
            const rowWidth = pegsInRow * pegSpacing;
            const rowStartX = startX - (rowWidth / 2) + (pegSpacing / 2);

            for (let col = 0; col < pegsInRow; col++) {
                this.pegs.push({
                    x: rowStartX + (col * pegSpacing),
                    y: startY + (row * pegSpacing),
                    radius: 4,
                    color: '#66a3ff',
                    glow: 0,
                    lastHit: 0
                });
            }
        }

        // Create slots with enhanced visuals
        const slotWidth = this.canvas.width / this.multipliers.length;
        const slotY = this.canvas.height - 100;
        
        this.multipliers.forEach((mult, i) => {
            const hue = (i * 360) / this.multipliers.length;
            this.slots.push({
                x: i * slotWidth,
                y: slotY,
                width: slotWidth,
                height: 100,
                multiplier: mult,
                color: `hsl(${hue}, 70%, 50%)`,
                glow: 0
            });
        });

        // Add betting controls
        const controls = document.createElement('div');
        controls.className = 'betting-controls';
        controls.innerHTML = `
            <div class="bet-section">
                <span class="bet-label">Bet Amount:</span>
                <div class="bet-input-group">
                    <button class="bet-button" id="min-bet">Min</button>
                    <button class="bet-button" id="half-bet">1/2</button>
                    <input type="number" class="bet-input" id="bet-amount" value="${this.currentBet}" min="${this.minBet}" max="${this.maxBet}">
                    <button class="bet-button" id="double-bet">x2</button>
                    <button class="bet-button" id="max-bet">Max</button>
                </div>
            </div>
            <div class="drop-section">
                <span class="bet-label">Drop Zone:</span>
                <div class="drop-zones">
                    ${this.dropZones.map((zone, i) => `
                        <button class="drop-button" data-zone="${i}">
                            ${zone.name}
                            <span class="multiplier">${zone.multiplier}x</span>
                        </button>
                    `).join('')}
                </div>
            </div>
        `;

        this.canvas.parentNode.insertBefore(controls, this.canvas);

        // Add score display
        this.scoreDisplay = document.createElement('div');
        this.scoreDisplay.className = 'score-display';
        this.updateScoreDisplay();
        this.canvas.parentNode.insertBefore(this.scoreDisplay, this.canvas);

        // Add verification button
        const verifyButton = document.createElement('button');
        verifyButton.className = 'glass-button verify-button';
        verifyButton.innerHTML = '<i class="fas fa-shield-alt"></i> Verify';
        verifyButton.onclick = () => this.showVerification();
        this.canvas.parentNode.appendChild(verifyButton);

        this.setupControls();
        this.setupDropZones();
        this.animate();
    }

    setupControls() {
        const betInput = document.getElementById('bet-amount');
        const updateBet = (value) => {
            this.currentBet = Math.max(this.minBet, Math.min(this.maxBet, value));
            betInput.value = this.currentBet;
        };

        document.getElementById('min-bet').onclick = () => updateBet(this.minBet);
        document.getElementById('max-bet').onclick = () => updateBet(this.maxBet);
        document.getElementById('half-bet').onclick = () => updateBet(Math.floor(this.currentBet / 2));
        document.getElementById('double-bet').onclick = () => updateBet(this.currentBet * 2);
        
        betInput.onchange = (e) => updateBet(parseInt(e.target.value) || this.minBet);
    }

    setupDropZones() {
        document.querySelectorAll('.drop-button').forEach((button, i) => {
            button.onclick = () => {
                if (this.currentBall) return;
                
                const zone = this.dropZones[i];
                const x = this.canvas.width * (0.25 + (i * 0.25));
                this.dropBall(x, zone.multiplier);
            };
        });
    }

    async dropBall(x, multiplier) {
        if (this.coins < this.currentBet) {
            Swal.fire({
                title: 'Insufficient Coins',
                text: 'You need more coins to place this bet!',
                icon: 'error'
            });
            return;
        }

        this.coins -= this.currentBet;
        this.updateScoreDisplay();

        // Generate verifiable result
        const gameEngine = new GameEngine();
        const result = gameEngine.generateGameResult('plinko', {
            dropZone: x,
            multiplier,
            bet: this.currentBet
        });

        this.verificationData = gameEngine.getVerificationData(result);
        
        this.currentBall = {
            x,
            y: 50,
            radius: 8,
            velocity: { x: 0, y: 0 },
            active: true,
            color: '#ffd700',
            glow: 0,
            trail: [],
            finalSlot: result.result
        };
    }

    update() {
        if (this.currentBall && this.currentBall.active) {
            // Apply gravity with improved physics
            this.currentBall.velocity.y += 0.2;
            
            // Apply air resistance
            this.currentBall.velocity.x *= 0.99;
            this.currentBall.velocity.y *= 0.99;
            
            // Update position
            this.currentBall.x += this.currentBall.velocity.x;
            this.currentBall.y += this.currentBall.velocity.y;

            // Add trail effect
            this.currentBall.trail.push({
                x: this.currentBall.x,
                y: this.currentBall.y,
                alpha: 1
            });

            // Limit trail length
            if (this.currentBall.trail.length > 20) {
                this.currentBall.trail.shift();
            }

            // Update trail alpha
            this.currentBall.trail.forEach(point => {
                point.alpha *= 0.9;
            });

            // Check wall collisions
            if (this.currentBall.x < this.currentBall.radius) {
                this.currentBall.x = this.currentBall.radius;
                this.currentBall.velocity.x = Math.abs(this.currentBall.velocity.x) * 0.5;
            } else if (this.currentBall.x > this.canvas.width - this.currentBall.radius) {
                this.currentBall.x = this.canvas.width - this.currentBall.radius;
                this.currentBall.velocity.x = -Math.abs(this.currentBall.velocity.x) * 0.5;
            }

            // Check peg collisions
            this.pegs.forEach(peg => {
                const dx = this.currentBall.x - peg.x;
                const dy = this.currentBall.y - peg.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const minDist = this.currentBall.radius + peg.radius;

                if (distance < minDist) {
                    // Calculate collision response
                    const angle = Math.atan2(dy, dx);
                    const speed = Math.sqrt(
                        this.currentBall.velocity.x * this.currentBall.velocity.x +
                        this.currentBall.velocity.y * this.currentBall.velocity.y
                    );

                    // Add controlled randomness
                    const deflection = (Math.random() - 0.5) * 0.2;
                    const bounceAngle = angle + deflection;

                    // Update velocity
                    this.currentBall.velocity.x = Math.cos(bounceAngle) * speed * 0.7;
                    this.currentBall.velocity.y = Math.abs(Math.sin(bounceAngle) * speed * 0.7);

                    // Prevent sticking
                    const overlap = minDist - distance;
                    this.currentBall.x += overlap * Math.cos(angle);
                    this.currentBall.y += overlap * Math.sin(angle);

                    // Visual feedback
                    peg.glow = 1;
                    this.currentBall.glow = 1;
                }
            });

            // Check slot collisions
            if (this.currentBall.y > this.canvas.height - 150) {
                const slot = this.slots.find(slot =>
                    this.currentBall.x >= slot.x &&
                    this.currentBall.x <= slot.x + slot.width
                );

                if (slot) {
                    const winnings = Math.floor(slot.multiplier * this.currentBet);
                    this.coins += winnings;
                    this.updateScoreDisplay();
                    this.showWinnings(winnings);
                    this.currentBall.active = false;
                    slot.glow = 1;
                }
            }

            // Remove ball when it falls off screen
            if (this.currentBall.y > this.canvas.height + 50) {
                this.currentBall = null;
            }
        }

        // Update visual effects
        this.pegs.forEach(peg => {
            peg.glow *= 0.95;
        });

        this.slots.forEach(slot => {
            slot.glow *= 0.95;
        });
    }

    showWinnings(amount) {
        const popup = document.createElement('div');
        popup.className = 'winnings-popup';
        popup.innerHTML = `
            <div class="win-amount">+${amount}</div>
            <div class="win-particles"></div>
        `;
        this.canvas.parentNode.appendChild(popup);

        // Add particle effects
        for (let i = 0; i < 20; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.setProperty('--delay', `${Math.random() * 1}s`);
            particle.style.setProperty('--angle', `${Math.random() * 360}deg`);
            popup.querySelector('.win-particles').appendChild(particle);
        }

        setTimeout(() => popup.remove(), 3000);
    }

    showVerification() {
        if (!this.verificationData) {
            Swal.fire({
                title: 'No Result to Verify',
                text: 'Please play a round first to generate a verifiable result.',
                icon: 'info'
            });
            return;
        }

        Swal.fire({
            title: 'Game Verification',
            html: `
                <div class="verification-data">
                    <p>Your last game result can be verified using this code:</p>
                    <textarea readonly class="verification-code">${this.verificationData}</textarea>
                    <button class="glass-button" onclick="navigator.clipboard.writeText('${this.verificationData}')">
                        Copy Code
                    </button>
                </div>
            `,
            icon: 'info',
            confirmButtonText: 'Close'
        });
    }

    updateScoreDisplay() {
        this.scoreDisplay.innerHTML = `
            <div class="score-info">
                <span class="coins">Coins: ${this.coins}</span>
                <span class="bet">Current Bet: ${this.currentBet}</span>
            </div>
        `;
        auth.saveScore('plinko', this.coins);
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw background grid
        this.drawGrid();
        
        // Draw pegs with glow effect
        this.pegs.forEach(peg => {
            this.ctx.beginPath();
            this.ctx.arc(peg.x, peg.y, peg.radius, 0, Math.PI * 2);
            
            // Add glow effect
            if (peg.glow > 0) {
                this.ctx.shadowColor = '#66a3ff';
                this.ctx.shadowBlur = 15 * peg.glow;
            }
            
            this.ctx.fillStyle = peg.color;
            this.ctx.fill();
            
            this.ctx.shadowBlur = 0;
        });
        
        // Draw slots with gradient and glow
        this.slots.forEach(slot => {
            const gradient = this.ctx.createLinearGradient(
                slot.x, slot.y,
                slot.x, slot.y + slot.height
            );
            gradient.addColorStop(0, slot.color);
            gradient.addColorStop(1, this.adjustColor(slot.color, -30));
            
            // Add glow effect
            if (slot.glow > 0) {
                this.ctx.shadowColor = slot.color;
                this.ctx.shadowBlur = 30 * slot.glow;
            }
            
            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(slot.x, slot.y, slot.width, slot.height);
            
            // Draw multiplier text
            this.ctx.shadowBlur = 0;
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '24px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(
                `${slot.multiplier}x`,
                slot.x + slot.width / 2,
                slot.y + 50
            );
        });
        
        // Draw ball trail
        if (this.currentBall) {
            this.currentBall.trail.forEach(point => {
                this.ctx.beginPath();
                this.ctx.arc(point.x, point.y, this.currentBall.radius * 0.8, 0, Math.PI * 2);
                this.ctx.fillStyle = `rgba(255, 215, 0, ${point.alpha * 0.3})`;
                this.ctx.fill();
            });
        }
        
        // Draw current ball with glow
        if (this.currentBall) {
            this.ctx.beginPath();
            this.ctx.arc(
                this.currentBall.x,
                this.currentBall.y,
                this.currentBall.radius,
                0, Math.PI * 2
            );
            
            // Add glow effect
            if (this.currentBall.glow > 0) {
                this.ctx.shadowColor = '#ffd700';
                this.ctx.shadowBlur = 20 * this.currentBall.glow;
            }
            
            const gradient = this.ctx.createRadialGradient(
                this.currentBall.x, this.currentBall.y, 0,
                this.currentBall.x, this.currentBall.y, this.currentBall.radius
            );
            gradient.addColorStop(0, '#fff');
            gradient.addColorStop(1, '#ffd700');
            
            this.ctx.fillStyle = gradient;
            this.ctx.fill();
            
            this.ctx.shadowBlur = 0;
        }
    }

    drawGrid() {
        this.ctx.strokeStyle = 'rgba(102, 163, 255, 0.1)';
        this.ctx.lineWidth = 1;

        // Draw vertical lines
        for (let x = 0; x < this.canvas.width; x += 40) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }

        // Draw horizontal lines
        for (let y = 0; y < this.canvas.height; y += 40) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }
    }

    adjustColor(color, amount) {
        const hex = color.replace('#', '');
        const num = parseInt(hex, 16);
        const r = Math.min(255, Math.max(0, (num >> 16) + amount));
        const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00ff) + amount));
        const b = Math.min(255, Math.max(0, (num & 0x0000ff) + amount));
        return `#${(r << 16 | g << 8 | b).toString(16).padStart(6, '0')}`;
    }

    animate = () => {
        this.update();
        this.draw();
        this.animationFrame = requestAnimationFrame(this.animate);
    }

    destroy() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
        this.reset();
        document.querySelector('.betting-controls')?.remove();
        document.querySelector('.score-display')?.remove();
        document.querySelector('.verify-button')?.remove();
        this.canvas.style.display = 'none';
    }
}