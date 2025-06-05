class KenoGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.selectedNumbers = new Set();
        this.currentBet = 1;
        this.minBet = 1;
        this.maxBet = 100;
        this.isAnimating = false;
        this.coins = auth.getHighScore('keno') || 100;
        this.matchCount = 0;
        this.difficulty = 'easy';
        this.animationTimeouts = new Set();
        this.winningNumbers = new Set(); // Track winning numbers
        this.rollingBalls = []; // Track rolling balls
        this.setupGame();
    }

    setupGame() {
        // Hide canvas since Keno uses DOM elements
        this.canvas.style.display = 'none';
        
        this.container = document.createElement('div');
        this.container.className = 'keno-container';
        
        // Create a more organized layout with grid system
        this.container.innerHTML = `
            <div class="keno-header">
                <div class="score-display">Coins: ${this.coins}</div>
                <div class="bet-controls">
                    <button class="glass-button" id="decrease-bet">-</button>
                    <input type="number" id="bet-amount" value="${this.currentBet}" min="${this.minBet}" max="${this.maxBet}">
                    <button class="glass-button" id="increase-bet">+</button>
                </div>
            </div>
            <div class="keno-board">
                ${this.createNumberGrid()}
            </div>
            <div class="keno-controls">
                <button id="quick-pick" class="glass-button">Quick Pick</button>
                <button id="clear-selection" class="glass-button">Clear</button>
                <button id="play-button" class="glass-button">Play</button>
            </div>
            <div class="keno-stats">
                <h3>Payouts</h3>
                <div class="payout-table">
                    ${this.createPayoutTable()}
                </div>
            </div>
        `;

        this.canvas.parentNode.insertBefore(this.container, this.canvas);
        this.setupEventListeners();
        this.addStyles();
    }

    createNumberGrid() {
        let grid = '<div class="number-grid">';
        for (let i = 1; i <= 80; i++) {
            grid += `<button class="number-button" data-number="${i}">${i}</button>`;
        }
        grid += '</div>';
        return grid;
    }

    createPayoutTable() {
        const payouts = {
            3: 2,    // 3 matches pays 2x
            4: 5,    // 4 matches pays 5x
            5: 15,   // 5 matches pays 15x
            6: 50,   // 6 matches pays 50x
            7: 150,  // 7 matches pays 150x
            8: 300,  // 8 matches pays 300x
            9: 500,  // 9 matches pays 500x
            10: 1000 // 10 matches pays 1000x
        };

        return Object.entries(payouts)
            .map(([matches, multiplier]) => `
                <div class="payout-row">
                    <span>${matches} matches</span>
                    <span>${multiplier}x</span>
                </div>
            `).join('');
    }

    setupEventListeners() {
        const betInput = this.container.querySelector('#bet-amount');
        const updateBet = (value) => {
            this.currentBet = Math.max(this.minBet, Math.min(this.maxBet, value));
            betInput.value = this.currentBet;
        };

        this.container.querySelector('#decrease-bet').addEventListener('click', () => {
            updateBet(this.currentBet - 1);
        });

        this.container.querySelector('#increase-bet').addEventListener('click', () => {
            updateBet(this.currentBet + 1);
        });

        betInput.addEventListener('change', (e) => {
            updateBet(parseInt(e.target.value) || this.minBet);
        });

        this.container.querySelectorAll('.number-button').forEach(button => {
            button.addEventListener('click', () => {
                if (this.isAnimating) return;
                
                const number = parseInt(button.dataset.number);
                if (this.selectedNumbers.has(number)) {
                    this.selectedNumbers.delete(number);
                    button.classList.remove('selected');
                } else if (this.selectedNumbers.size < 10) {
                    this.selectedNumbers.add(number);
                    button.classList.add('selected');
                    this.animateSelection(button);
                }
            });
        });

        this.container.querySelector('#quick-pick').addEventListener('click', () => {
            if (this.isAnimating) return;
            this.quickPick();
        });

        this.container.querySelector('#clear-selection').addEventListener('click', () => {
            if (this.isAnimating) return;
            this.clearSelection();
        });

        this.container.querySelector('#play-button').addEventListener('click', () => {
            if (this.isAnimating) return;
            
            if (this.selectedNumbers.size === 0) {
                this.showMessage('Please select at least one number');
                return;
            }

            if (this.coins < this.currentBet) {
                this.showMessage('Not enough coins!');
                return;
            }

            this.playGame();
        });
    }

    quickPick() {
        this.clearSelection();
        const numbers = new Set();
        while (numbers.size < 10) {
            numbers.add(Math.floor(Math.random() * 80) + 1);
        }
        
        numbers.forEach(number => {
            const button = this.container.querySelector(`[data-number="${number}"]`);
            this.selectedNumbers.add(number);
            button.classList.add('selected');
            this.animateSelection(button);
        });
    }

    clearSelection() {
        this.selectedNumbers.clear();
        this.winningNumbers.clear(); // Clear winning numbers
        this.container.querySelectorAll('.number-button').forEach(button => {
            button.classList.remove('selected', 'winning', 'matched');
        });
    }

    async playGame() {
        this.isAnimating = true;
        this.coins -= this.currentBet;
        this.updateCoins();

        // Clear previous winning numbers and their visual states
        this.container.querySelectorAll('.number-button').forEach(button => {
            button.classList.remove('winning', 'matched');
        });
        this.winningNumbers.clear();
        this.matchCount = 0;
        this.rollingBalls = [];

        // Generate winning numbers
        while (this.winningNumbers.size < 20) {
            this.winningNumbers.add(Math.floor(Math.random() * 80) + 1);
        }

        // Create rolling balls for each winning number
        const numberGrid = this.container.querySelector('.number-grid');
        const gridRect = numberGrid.getBoundingClientRect();

        for (const number of this.winningNumbers) {
            const button = this.container.querySelector(`[data-number="${number}"]`);
            const buttonRect = button.getBoundingClientRect();
            
            const ball = {
                number,
                targetX: buttonRect.left + buttonRect.width / 2,
                targetY: buttonRect.top + buttonRect.height / 2,
                matched: this.selectedNumbers.has(number)
            };
            
            this.rollingBalls.push(ball);
        }

        // Create ball container if it doesn't exist
        let ballContainer = document.querySelector('.keno-balls');
        if (!ballContainer) {
            ballContainer = document.createElement('div');
            ballContainer.className = 'keno-balls';
            this.container.appendChild(ballContainer);
        } else {
            ballContainer.innerHTML = '';
        }

        // Update ball animation to fall straight
        for (const ball of this.rollingBalls) {
            const ballElement = document.createElement('div');
            ballElement.className = 'keno-ball';
            ballElement.textContent = ball.number;
            if (ball.matched) ballElement.classList.add('matched');
            ballContainer.appendChild(ballElement);

            // Start from top of screen
            ballElement.style.cssText = `
                left: ${ball.targetX}px;
                top: -50px;
                opacity: 0;
            `;

            // Animate straight down
            await new Promise(resolve => {
                setTimeout(() => {
                    ballElement.style.cssText = `
                        left: ${ball.targetX}px;
                        top: ${ball.targetY}px;
                        opacity: 1;
                        transition: all 1s cubic-bezier(0.25, 0.46, 0.45, 0.94);
                    `;
                }, 50);

                setTimeout(() => {
                    const button = this.container.querySelector(`[data-number="${ball.number}"]`);
                    button.classList.add('winning');
                    if (ball.matched) {
                        button.classList.add('matched');
                        this.matchCount++;
                    }
                    ballElement.remove();
                    resolve();
                }, 1000);
            });

            // Small delay between balls
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        // Calculate winnings
        const winnings = this.calculateWinnings();
        if (winnings > 0) {
            this.coins += winnings;
            this.showWinnings(winnings);
        }

        this.updateCoins();
        
        // Reset for next game
        setTimeout(() => {
            this.isAnimating = false;
            const ballContainer = document.querySelector('.keno-balls');
            if (ballContainer) ballContainer.remove();
        }, 2000);
    }

    calculateWinnings() {
        const payoutTable = {
            3: 2,
            4: 5,
            5: 15,
            6: 50,
            7: 150,
            8: 300,
            9: 500,
            10: 1000
        };

        return (payoutTable[this.matchCount] || 0) * this.currentBet;
    }

    animateSelection(button) {
        button.classList.add('selecting');
        setTimeout(() => button.classList.remove('selecting'), 300);
    }

    showWinnings(amount) {
        const popup = document.createElement('div');
        popup.className = 'winnings-popup';
        popup.textContent = `+${amount}`;
        this.container.appendChild(popup);
        
        setTimeout(() => popup.remove(), 2000);
    }

    showMessage(message) {
        const popup = document.createElement('div');
        popup.className = 'message-popup';
        popup.textContent = message;
        this.container.appendChild(popup);
        
        setTimeout(() => popup.remove(), 2000);
    }

    updateCoins() {
        this.container.querySelector('.score-display').textContent = `Coins: ${this.coins}`;
        auth.saveScore('keno', this.coins);
    }

    addStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .keno-container {
                padding: 20px;
                background: var(--glass-bg);
                border-radius: 15px;
                backdrop-filter: blur(10px);
            }

            .keno-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 20px;
            }

            .bet-controls {
                display: flex;
                gap: 10px;
                align-items: center;
            }

            .bet-controls input {
                width: 80px;
                text-align: center;
                background: rgba(255, 255, 255, 0.1);
                border: 1px solid rgba(255, 255, 255, 0.2);
                color: white;
                padding: 5px;
                border-radius: 5px;
            }

            .number-grid {
                display: grid;
                grid-template-columns: repeat(10, 1fr);
                gap: 10px;
                margin: 20px 0;
            }

            .number-button {
                aspect-ratio: 1;
                background: rgba(255, 255, 255, 0.1);
                border: 1px solid rgba(255, 255, 255, 0.2);
                color: white;
                font-size: 18px;
                border-radius: 5px;
                cursor: pointer;
                transition: all 0.3s ease;
            }

            .number-button:hover {
                background: rgba(255, 255, 255, 0.2);
            }

            .number-button.selected {
                background: rgba(102, 163, 255, 0.3);
                border-color: #66a3ff;
            }

            .number-button.winning {
                background: rgba(255, 215, 0, 0.3);
                border-color: #ffd700;
            }

            .number-button.matched {
                background: rgba(81, 207, 102, 0.3);
                border-color: #51cf66;
                animation: pulse 0.5s ease-in-out infinite;
            }

            .number-button.selecting {
                animation: select 0.3s ease-in-out;
            }

            .keno-controls {
                display: flex;
                justify-content: center;
                gap: 20px;
                margin: 20px 0;
            }

            .keno-stats {
                margin-top: 20px;
                padding: 20px;
                background: rgba(255, 255, 255, 0.05);
                border-radius: 10px;
            }

            .payout-table {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                gap: 10px;
                margin-top: 10px;
            }

            .payout-row {
                display: flex;
                justify-content: space-between;
                padding: 5px;
                background: rgba(255, 255, 255, 0.05);
                border-radius: 5px;
            }

            .winnings-popup {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: rgba(81, 207, 102, 0.9);
                color: white;
                padding: 20px 40px;
                border-radius: 10px;
                font-size: 24px;
                animation: popup 2s ease-out forwards;
            }

            .message-popup {
                position: fixed;
                top: 20%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: rgba(255, 107, 107, 0.9);
                color: white;
                padding: 10px 20px;
                border-radius: 5px;
                animation: popup 2s ease-out forwards;
            }

            .keno-balls {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                pointer-events: none;
                z-index: 1000;
            }

            .keno-ball {
                position: absolute;
                width: 40px;
                height: 40px;
                background: linear-gradient(135deg, #ffd700, #ff8c00);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-weight: bold;
                font-size: 16px;
                box-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
                transition: all 1s cubic-bezier(0.25, 0.46, 0.45, 0.94);
            }

            .keno-ball.matched {
                background: linear-gradient(135deg, #51cf66, #37b24d);
                box-shadow: 0 0 10px rgba(81, 207, 102, 0.5);
            }

            @keyframes pulse {
                0% { transform: scale(1); }
                50% { transform: scale(1.1); }
                100% { transform: scale(1); }
            }

            @keyframes select {
                0% { transform: scale(1); }
                50% { transform: scale(1.1); }
                100% { transform: scale(1); }
            }

            @keyframes popup {
                0% { opacity: 0; transform: translate(-50%, -30%); }
                10% { opacity: 1; transform: translate(-50%, -50%); }
                90% { opacity: 1; transform: translate(-50%, -50%); }
                100% { opacity: 0; transform: translate(-50%, -70%); }
            }
        `;
        document.head.appendChild(style);
    }

    destroy() {
        this.animationTimeouts.forEach(timeout => clearTimeout(timeout));
        this.animationTimeouts.clear();

        if (this.container) {
            this.container.remove();
        }
    }
}