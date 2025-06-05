// Move GameEngine class to a separate file
export class GameEngine {
    private readonly serverKey = 'your-server-key'; // In production, this would be on the server

    generateGameResult(gameType: string, params: any = {}): GameResult {
        // Generate a random seed
        const seed = Math.random().toString(36).substring(2);
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
    }

    private calculateResult(gameType: string, seed: string, params: any): number | number[] {
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
                throw new Error('Unsupported game type');
        }
    }

    private seededRandom(seed: string) {
        let hash = 0;
        for (let i = 0; i < seed.length; i++) {
            hash = ((hash << 5) - hash) + seed.charCodeAt(i);
            hash = hash & hash;
        }
        const x = Math.sin(hash) * 10000;
        return x - Math.floor(x);
    }

    private generateSlotResult(random: number, reels: number): number[] {
        return Array(reels).fill(0).map(() => Math.floor(random * 10));
    }

    private generateKenoResult(random: number, picks: number): number[] {
        const numbers = new Set<number>();
        while (numbers.size < picks) {
            numbers.add(Math.floor(random * 80) + 1);
        }
        return Array.from(numbers).sort((a, b) => a - b);
    }

    private generatePlinkoResult(random: number, rows: number): number {
        return Math.floor(random * (rows + 1));
    }

    private generateSpinResult(random: number): number {
        return Math.floor(random * 37);
    }

    private generateHash(result: any, seed: string, timestamp: number): string {
        const data = JSON.stringify({ result, seed, timestamp });
        let hash = 0;
        for (let i = 0; i < data.length; i++) {
            hash = ((hash << 5) - hash) + data.charCodeAt(i);
            hash = hash & hash;
        }
        return hash.toString(16);
    }

    private signResult(hash: string): string {
        return btoa(hash + this.serverKey);
    }

    verifyResult(result: GameResult): boolean {
        const calculatedHash = this.generateHash(result.result, result.seed, result.timestamp);
        if (calculatedHash !== result.hash) {
            return false;
        }

        const calculatedSignature = this.signResult(result.hash);
        return calculatedSignature === result.signature;
    }

    getVerificationData(result: GameResult): string {
        return btoa(JSON.stringify(result));
    }

    verifyFromString(verificationString: string): boolean {
        try {
            const result = JSON.parse(atob(verificationString));
            return this.verifyResult(result);
        } catch {
            return false;
        }
    }
}

interface GameResult {
    result: number | number[];
    hash: string;
    seed: string;
    timestamp: number;
    signature: string;
}