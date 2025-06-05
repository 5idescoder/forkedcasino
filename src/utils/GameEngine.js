// GameEngine implementation for browser
class GameEngine {
    constructor() {
        if (window.gameEngineInstance) {
            return window.gameEngineInstance;
        }
        this.serverKey = 'your-server-key';
        this.initializeEngine();
        window.gameEngineInstance = this;
    }

    initializeEngine() {
        // Add initialization checks
        if (typeof window === 'undefined') {
            throw new Error('GameEngine requires a browser environment');
        }

        if (!window.crypto || !window.crypto.getRandomValues) {
            throw new Error('GameEngine requires a secure random number generator');
        }
    }

    generateGameResult(gameType, params = {}) {
        if (typeof gameType !== 'string') {
            throw new Error('Game type must be a string');
        }

        try {
            // Generate a cryptographically secure random seed
            const array = new Uint32Array(1);
            window.crypto.getRandomValues(array);
            const seed = array[0].toString(36);
            const timestamp = Date.now();

            // Generate result based on game type
            const result = this.calculateResult(gameType, seed, params);

            // Create a hash of the result
            const hash = this.generateHash(result, seed, timestamp);

            // Sign the result
            const signature = this.signResult(hash);

            return {
                result,
                hash,
                seed,
                timestamp,
                signature
            };
        } catch (error) {
            console.error('Error generating game result:', error);
            throw new Error('Failed to generate game result');
        }
    }

    calculateResult(gameType, seed, params) {
        if (typeof seed !== 'string') {
            throw new Error('Seed must be a string');
        }

        try {
            const random = this.seededRandom(seed);
            
            switch (gameType) {
                case 'slot':
                    return this.generateSlotResult(random, params.reels || 3);
                case 'keno':
                    return this.generateKenoResult(random, params.picks || 20);
                case 'plinko':
                    return this.generatePlinkoResult(random, params.rows || 8);
                case 'spin':
                    return this.generateSpinResult(random);
                default:
                    throw new Error(`Unsupported game type: ${gameType}`);
            }
        } catch (error) {
            console.error('Error calculating result:', error);
            throw new Error('Failed to calculate game result');
        }
    }

    seededRandom(seed) {
        if (typeof seed !== 'string') {
            throw new Error('Seed must be a string');
        }

        try {
            let hash = 0;
            for (let i = 0; i < seed.length; i++) {
                hash = ((hash << 5) - hash) + seed.charCodeAt(i);
                hash = hash & hash;
            }
            const x = Math.sin(hash) * 10000;
            return x - Math.floor(x);
        } catch (error) {
            console.error('Error generating seeded random:', error);
            throw new Error('Failed to generate random number');
        }
    }

    generateSlotResult(random, reels) {
        if (typeof random !== 'number' || typeof reels !== 'number') {
            throw new Error('Invalid parameters for slot result');
        }
        return Array(reels).fill(0).map(() => Math.floor(random * 10));
    }

    generateKenoResult(random, picks) {
        if (typeof random !== 'number' || typeof picks !== 'number') {
            throw new Error('Invalid parameters for keno result');
        }
        const numbers = new Set();
        while (numbers.size < picks) {
            numbers.add(Math.floor(random * 80) + 1);
        }
        return Array.from(numbers).sort((a, b) => a - b);
    }

    generatePlinkoResult(random, rows) {
        if (typeof random !== 'number' || typeof rows !== 'number') {
            throw new Error('Invalid parameters for plinko result');
        }
        return Math.floor(random * (rows + 1));
    }

    generateSpinResult(random) {
        if (typeof random !== 'number') {
            throw new Error('Invalid parameter for spin result');
        }
        return Math.floor(random * 37);
    }

    generateHash(result, seed, timestamp) {
        if (!result || typeof seed !== 'string' || typeof timestamp !== 'number') {
            throw new Error('Invalid parameters for hash generation');
        }

        try {
            const data = JSON.stringify({ result, seed, timestamp });
            let hash = 0;
            for (let i = 0; i < data.length; i++) {
                hash = ((hash << 5) - hash) + data.charCodeAt(i);
                hash = hash & hash;
            }
            return hash.toString(16);
        } catch (error) {
            console.error('Error generating hash:', error);
            throw new Error('Failed to generate result hash');
        }
    }

    signResult(hash) {
        if (typeof hash !== 'string') {
            throw new Error('Hash must be a string');
        }

        try {
            return btoa(hash + this.serverKey);
        } catch (error) {
            console.error('Error signing result:', error);
            throw new Error('Failed to sign result');
        }
    }

    verifyResult(result) {
        if (!result || typeof result !== 'object') {
            throw new Error('Invalid result object');
        }

        try {
            const calculatedHash = this.generateHash(result.result, result.seed, result.timestamp);
            if (calculatedHash !== result.hash) {
                return false;
            }

            const calculatedSignature = this.signResult(result.hash);
            return calculatedSignature === result.signature;
        } catch (error) {
            console.error('Error verifying result:', error);
            return false;
        }
    }

    getVerificationData(result) {
        if (!result || typeof result !== 'object') {
            throw new Error('Invalid result object');
        }

        try {
            return btoa(JSON.stringify(result));
        } catch (error) {
            console.error('Error getting verification data:', error);
            throw new Error('Failed to generate verification data');
        }
    }

    verifyFromString(verificationString) {
        if (typeof verificationString !== 'string') {
            throw new Error('Verification string must be a string');
        }

        try {
            const result = JSON.parse(atob(verificationString));
            return this.verifyResult(result);
        } catch (error) {
            console.error('Error verifying from string:', error);
            return false;
        }
    }
}

// Initialize GameEngine globally
window.GameEngine = GameEngine;