class MancalaGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.coins = auth.getHighScore('mancala') || 100;
        this.pits = Array(14).fill(4); // Initialize all pits with 4 stones
        this.pits[6] = 0; // Player's store
        this.pits[13] = 0; // AI's store
        this.currentPlayer = 0; // 0 for player, 1 for AI
        this.setupGame();
        this.animate();
    }

    setupGame() {
        this.canvas.style.display = 'block';
        // Set canvas size to fit screen while maintaining aspect ratio
        const maxWidth = Math.min(800, window.innerWidth - 40);
        const maxHeight = Math.min(600, window.innerHeight - 200);
        const aspectRatio = 4/3;
        
        if (maxWidth / aspectRatio <= maxHeight) {
            this.canvas.width = maxWidth;
            this.canvas.height = maxWidth / aspectRatio;
        } else {
            this.canvas.height = maxHeight;
            this.canvas.width = maxHeight * aspectRatio;
        }

        // Add score display
        this.scoreDisplay = document.createElement('div');
        this.scoreDisplay.className = 'score-display';
        this.updateScoreDisplay();
        this.canvas.parentNode.insertBefore(this.scoreDisplay, this.canvas);

        // Setup click handlers
        this.canvas.addEventListener('click', (e) => this.handleClick(e));
    }

    handleClick(e) {
        if (this.currentPlayer !== 0) return; // Only allow clicks during player's turn
        
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Check if clicked on player's pits (0-5)
        for (let i = 0; i < 6; i++) {
            const [pitX, pitY] = this.getPitPosition(i);
            const distance = Math.sqrt((x - pitX) ** 2 + (y - pitY) ** 2);
            
            if (distance < 40) {
                this.makeMove(i);
                break;
            }
        }
    }

    makeMove(pitIndex) {
        if (this.pits[pitIndex] === 0) return;
        
        let stones = this.pits[pitIndex];
        this.pits[pitIndex] = 0;
        let currentPit = pitIndex;
        
        while (stones > 0) {
            currentPit = (currentPit + 1) % 14;
            if ((this.currentPlayer === 0 && currentPit === 13) || 
                (this.currentPlayer === 1 && currentPit === 6)) {
                continue;
            }
            this.pits[currentPit]++;
            stones--;
        }
        
        // Check for capture
        if (this.currentPlayer === 0 && currentPit < 6 && this.pits[currentPit] === 1) {
            const oppositePit = 12 - currentPit;
            if (this.pits[oppositePit] > 0) {
                this.pits[6] += this.pits[oppositePit] + 1;
                this.pits[oppositePit] = 0;
                this.pits[currentPit] = 0;
            }
        }
        
        // Check if game is over
        if (this.isGameOver()) {
            this.endGame();
            return;
        }
        
        // Switch turns unless landed in own store
        if (!(this.currentPlayer === 0 && currentPit === 6) &&
            !(this.currentPlayer === 1 && currentPit === 13)) {
            this.currentPlayer = 1 - this.currentPlayer;
            if (this.currentPlayer === 1) {
                setTimeout(() => this.aiMove(), 1000);
            }
        }
    }

    aiMove() {
        // Simple AI: choose pit with most stones
        let bestPit = 7;
        let maxStones = 0;
        
        for (let i = 7; i < 13; i++) {
            if (this.pits[i] > maxStones) {
                maxStones = this.pits[i];
                bestPit = i;
            }
        }
        
        this.makeMove(bestPit);
    }

    isGameOver() {
        const playerEmpty = this.pits.slice(0, 6).every(stones => stones === 0);
        const aiEmpty = this.pits.slice(7, 13).every(stones => stones === 0);
        return playerEmpty || aiEmpty;
    }

    endGame() {
        // Collect remaining stones
        let playerTotal = this.pits[6];
        let aiTotal = this.pits[13];
        
        for (let i = 0; i < 6; i++) {
            playerTotal += this.pits[i];
            aiTotal += this.pits[i + 7];
            this.pits[i] = 0;
            this.pits[i + 7] = 0;
        }
        
        this.pits[6] = playerTotal;
        this.pits[13] = aiTotal;
        
        // Update score
        if (playerTotal > aiTotal) {
            this.coins += Math.floor((playerTotal - aiTotal) * 10);
        }
        this.updateScoreDisplay();
        
        // Show game over message
        Swal.fire({
            title: 'Game Over!',
            text: playerTotal > aiTotal ? 'You win!' : playerTotal < aiTotal ? 'AI wins!' : 'It\'s a tie!',
            icon: playerTotal > aiTotal ? 'success' : 'info'
        }).then(() => {
            this.setupGame();
        });
    }

    updateScoreDisplay() {
        this.scoreDisplay.textContent = `Coins: ${this.coins}`;
        auth.saveScore('mancala', this.coins);
    }

    getPitPosition(index) {
        const scale = Math.min(
            this.canvas.width / 800,
            this.canvas.height / 600
        );
        
        const pitSpacing = 100 * scale;
        const startX = 160 * scale;
        const playerY = 250 * scale;
        const aiY = 150 * scale;
        
        if (index === 6) return [this.canvas.width - 80 * scale, 200 * scale]; // Player's store
        if (index === 13) return [80 * scale, 200 * scale]; // AI's store
        
        if (index < 6) {
            return [startX + index * pitSpacing, playerY];
        } else {
            return [startX + (12 - index) * pitSpacing, aiY];
        }
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw background grid
        this.drawGrid();
        
        // Draw pits
        for (let i = 0; i < 14; i++) {
            const [x, y] = this.getPitPosition(i);
            
            // Draw pit
            this.ctx.beginPath();
            this.ctx.arc(x, y, 40, 0, Math.PI * 2);
            this.ctx.fillStyle = i === 6 || i === 13 ? '#4a1b6d' : '#2b044e';
            this.ctx.fill();
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
            this.ctx.stroke();
            
            // Draw stones
            const stones = this.pits[i];
            if (stones > 0) {
                const radius = 8;
                const maxPerCircle = Math.floor((35 - radius) / (radius * 2));
                let placed = 0;
                let ring = 0;
                
                while (placed < stones) {
                    const stonesInThisRing = Math.min(
                        stones - placed,
                        Math.floor(Math.PI * 2 * (ring + 1) * maxPerCircle / Math.PI)
                    );
                    
                    for (let j = 0; j < stonesInThisRing; j++) {
                        const angle = (j * Math.PI * 2) / stonesInThisRing;
                        const stoneX = x + Math.cos(angle) * (ring + 1) * radius * 2;
                        const stoneY = y + Math.sin(angle) * (ring + 1) * radius * 2;
                        
                        this.ctx.beginPath();
                        this.ctx.arc(stoneX, stoneY, radius, 0, Math.PI * 2);
                        this.ctx.fillStyle = `hsl(${(placed * 30) % 360}, 70%, 60%)`;
                        this.ctx.fill();
                    }
                    
                    placed += stonesInThisRing;
                    ring++;
                }
            }
            
            // Draw pit number
            this.ctx.fillStyle = 'white';
            this.ctx.font = '20px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(stones.toString(), x, y);
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

    animate = () => {
        this.draw();
        this.animationFrame = requestAnimationFrame(this.animate);
    }

    destroy() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
        if (this.scoreDisplay) {
            this.scoreDisplay.remove();
        }
        this.canvas.style.display = 'none';
    }
}