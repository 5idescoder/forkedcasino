class SlotMachine {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.coins = auth.getHighScore('slot') || 100;
        this.currentBet = 1;
        this.minBet = 1;
        this.maxBet = 100;
        this.betLines = 1;
        this.symbols = ['🍒', '🍊', '🍋', '🍇', '🍉', '💎', '7️⃣', '⭐'];
        this.symbolWeights = [30, 25, 20, 15, 10, 8, 5, 2]; // Higher numbers = more common
        this.totalWeight = this.symbolWeights.reduce((a, b) => a + b, 0);
        this.reels = Array(5).fill(null).map(() => ({
            position: 0,
            speed: 0,
            spinning: false,
            symbols: this.symbols,
            finalSymbol: null
        }));
        this.setupGame();
    }

    setupGame() {
        this.canvas.style.display = 'block';
        this.canvas.width = 800;
        this.canvas.height = 600;

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
            <button id="spin-button" class="glass-button">SPIN</button>
        `;
        this.canvas.parentNode.insertBefore(controls, this.canvas);

        // Add score display
        this.scoreDisplay = document.createElement('div');
        this.scoreDisplay.className = 'score-display';
        this.updateScoreDisplay();
        this.canvas.parentNode.insertBefore(this.scoreDisplay, this.canvas);

        // Setup controls
        this.setupControls();
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

        const spinButton = document.getElementById('spin-button');
        spinButton.onclick = () => this.spin();
    }

    getRandomSymbol() {
        const random = Math.random() * this.totalWeight;
        let weightSum = 0;
        for (let i = 0; i < this.symbols.length; i++) {
            weightSum += this.symbolWeights[i];
            if (random < weightSum) {
                return this.symbols[i];
            }
        }
        return this.symbols[0];
    }

    async spin() {
        if (this.spinning || this.coins < this.currentBet * this.betLines) {
            return;
        }

        this.spinning = true;
        this.coins -= this.currentBet * this.betLines;
        this.updateScoreDisplay();

        // Generate truly random results using crypto
        const array = new Uint32Array(this.reels.length);
        crypto.getRandomValues(array);
        
        const finalSymbols = array.map(() => this.getRandomSymbol());

        // Start spinning animation
        this.reels.forEach((reel, i) => {
            reel.spinning = true;
            reel.speed = 20 + i * 5;
            reel.targetPosition = reel.position + (50 + i * 20);
            reel.finalSymbol = finalSymbols[i];
        });

        // Stop reels sequentially
        for (let i = 0; i < this.reels.length; i++) {
            await new Promise(resolve => setTimeout(resolve, 500 + i * 300));
            this.reels[i].spinning = false;
            this.playStopSound();
        }

        // Calculate and show winnings
        setTimeout(() => {
            const winnings = this.calculateWinnings(finalSymbols);
            if (winnings > 0) {
                this.coins += winnings;
                this.showWinnings(winnings);
                this.playWinSound();
            }
            this.spinning = false;
            this.updateScoreDisplay();
        }, 500);
    }

    convertResultToSymbols(result) {
        return result.map(num => this.reels[0].symbols[num % this.reels[0].symbols.length]);
    }

    calculateWinnings(symbols) {
        // Simple winning calculation
        const uniqueSymbols = new Set(symbols);
        if (uniqueSymbols.size === 1) {
            return this.currentBet * 50; // Jackpot
        } else if (uniqueSymbols.size === 2) {
            return this.currentBet * 10; // Big win
        } else if (uniqueSymbols.size === 3) {
            return this.currentBet * 5; // Medium win
        }
        return 0;
    }

    showWinnings(amount) {
        const popup = document.createElement('div');
        popup.className = 'winnings-popup';
        popup.textContent = `+${amount}`;
        this.canvas.parentNode.appendChild(popup);
        
        setTimeout(() => popup.remove(), 2000);
    }

    updateScoreDisplay() {
        this.scoreDisplay.textContent = `Coins: ${this.coins}`;
        auth.saveScore('slot', this.coins);
    }

    playStopSound() {
        // Implement sound effects
    }

    playWinSound() {
        // Implement sound effects
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        const reelWidth = this.canvas.width / this.reels.length;
        const symbolHeight = 100;
        
        this.reels.forEach((reel, i) => {
            const x = i * reelWidth;
            const symbols = reel.symbols;
            
            // Draw visible symbols
            for (let j = -1; j < 4; j++) {
                const y = ((reel.position + j) * symbolHeight) % (symbols.length * symbolHeight);
                const symbolIndex = Math.floor(((reel.position + j) + symbols.length) % symbols.length);
                
                this.ctx.font = '64px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                this.ctx.fillStyle = 'white';
                this.ctx.fillText(
                    symbols[symbolIndex],
                    x + reelWidth / 2,
                    y + symbolHeight / 2
                );
            }
        });
    }

    update() {
        this.reels.forEach(reel => {
            if (reel.spinning) {
                reel.position += reel.speed;
                reel.speed *= 0.99;
            }
        });
    }

    animate = () => {
        this.update();
        this.draw();
        requestAnimationFrame(this.animate);
    }

    destroy() {
        const controls = document.querySelector('.betting-controls');
        if (controls) controls.remove();
        if (this.scoreDisplay) this.scoreDisplay.remove();
        this.canvas.style.display = 'none';
    }
}