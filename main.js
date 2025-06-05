// Game management
class GameManager {
    constructor() {
        this.currentGame = null;
        this.games = {};
        this.dropdownTimeout = null;
        this.init();
    }

    init() {
        document.addEventListener('DOMContentLoaded', () => {
            this.setupGameSelection();
            this.setupWelcomeMessage();
            this.setupDropdownTimeout();
            this.setupDropdownToggle();
        });
    }

    setupGameSelection() {
        const dropdownContent = document.querySelector('.dropdown-content');

        // Setup game selection handlers
        dropdownContent.querySelectorAll('a[data-game]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const gameType = e.target.dataset.game;
                this.loadGame(gameType);
                this.closeDropdown();
            });
        });
    }

    setupDropdownToggle() {
        const dropdown = document.getElementById('game-dropdown');
        const dropbtn = dropdown.querySelector('.dropbtn');

        dropbtn.addEventListener('click', (e) => {
            e.preventDefault();
            dropdown.classList.toggle('active');
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!dropdown.contains(e.target)) {
                this.closeDropdown();
            }
        });
    }

    setupDropdownTimeout() {
        const dropdown = document.getElementById('game-dropdown');
        
        // Start timeout when dropdown opens
        dropdown.addEventListener('mouseenter', () => {
            this.clearDropdownTimeout();
        });

        dropdown.addEventListener('mouseleave', () => {
            this.startDropdownTimeout();
        });

        // Clear timeout when interacting with dropdown
        dropdown.querySelector('.dropdown-content').addEventListener('mousemove', () => {
            this.clearDropdownTimeout();
            this.startDropdownTimeout();
        });
    }

    startDropdownTimeout() {
        this.clearDropdownTimeout();
        this.dropdownTimeout = setTimeout(() => {
            this.closeDropdown();
        }, 20000); // 20 seconds
    }

    clearDropdownTimeout() {
        if (this.dropdownTimeout) {
            clearTimeout(this.dropdownTimeout);
            this.dropdownTimeout = null;
        }
    }

    closeDropdown() {
        const dropdown = document.getElementById('game-dropdown');
        dropdown.classList.remove('active');
        this.clearDropdownTimeout();
    }

    setupWelcomeMessage() {
        const welcomeMessage = document.getElementById('welcome-message');
        const gameCanvas = document.getElementById('gameCanvas');

        this.showGame = (show) => {
            if (welcomeMessage) welcomeMessage.style.display = show ? 'none' : 'block';
            if (gameCanvas) gameCanvas.style.display = show ? 'block' : 'none';
        };
    }

    loadGame(gameType) {
        if (!auth.isLoggedIn) {
            Swal.fire({
                title: 'Login Required',
                text: 'Please login or play as guest to access games',
                icon: 'info',
                showCancelButton: true,
                confirmButtonText: 'Login',
                cancelButtonText: 'Play as Guest'
            }).then((result) => {
                if (result.isConfirmed) {
                    window.location.href = 'login.html';
                } else if (result.dismiss === Swal.DismissReason.cancel) {
                    auth.loginAsGuest();
                    this.loadGame(gameType);
                }
            });
            return;
        }

        // Clear current game if exists
        if (this.currentGame) {
            this.currentGame.destroy?.();
        }

        // Show game canvas
        this.showGame(true);

        // Initialize selected game
        switch (gameType) {
            case 'fish':
                this.currentGame = new FishGame();
                break;
            case 'plinko':
                this.currentGame = new PlinkoGame();
                break;
            case 'keno':
                this.currentGame = new KenoGame();
                break;
            case 'slot':
                this.currentGame = new SlotMachine();
                break;
            case 'spin':
                this.currentGame = new SpinGame();
                break;
            case 'mancala':
                this.currentGame = new MancalaGame();
                break;
        }
    }
}

// Initialize game manager
window.gameManager = new GameManager();