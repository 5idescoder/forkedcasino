class Auth {
    constructor() {
        this.isLoggedIn = false;
        this.currentUser = null;
        this.lastFaucetClaim = null;
        this.loginAttempts = new Map();
        this.maxAttempts = 5;
        this.lockoutDuration = 15 * 60 * 1000; // 15 minutes
        this.init();
    }

    async init() {
        try {
            // Wait for Supabase to be available
            while (!window.supabaseClient) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }

            // Check for existing session
            const { data: { session }, error } = await window.supabaseClient.auth.getSession();
            
            if (session) {
                this.isLoggedIn = true;
                await this.fetchUserData(session.user.id);
            }

            // Setup auth state change listener
            window.supabaseClient.auth.onAuthStateChange(async (event, session) => {
                if (event === 'SIGNED_IN') {
                    this.isLoggedIn = true;
                    await this.fetchUserData(session.user.id);
                } else if (event === 'SIGNED_OUT') {
                    this.isLoggedIn = false;
                    this.currentUser = null;
                    // Clear any remaining auth data
                    localStorage.removeItem('arcade-auth');
                    document.cookie = 'arcade-auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Strict';
                }
                this.updateUI();
            });

            this.setupEventListeners();
            this.restoreSession();
        } catch (error) {
            console.error('Auth initialization error:', error);
        }
    }

    async restoreSession() {
        try {
            // Try to restore from cookie first
            const cookieMatch = document.cookie.match(new RegExp('arcade-auth=([^;]+)'));
            if (cookieMatch) {
                const sessionData = JSON.parse(decodeURIComponent(cookieMatch[1]));
                if (sessionData?.access_token) {
                    await window.supabaseClient.auth.setSession(sessionData);
                    return;
                }
            }

            // Fallback to localStorage
            const storedSession = localStorage.getItem('arcade-auth');
            if (storedSession) {
                const sessionData = JSON.parse(storedSession);
                if (sessionData?.access_token) {
                    await window.supabaseClient.auth.setSession(sessionData);
                }
            }
        } catch (error) {
            console.error('Error restoring session:', error);
        }
    }

    setupEventListeners() {
        document.addEventListener('DOMContentLoaded', () => {
            const authButton = document.getElementById('auth-button');
            const guestButton = document.getElementById('guest-button');
            
            if (authButton) {
                authButton.addEventListener('click', () => {
                    if (this.isLoggedIn) {
                        this.logout();
                    } else {
                        window.location.href = '/login.html';
                    }
                });
            }

            if (guestButton) {
                guestButton.addEventListener('click', () => this.loginAsGuest());
            }
        });
    }

    async fetchUserData(userId) {
        try {
            const { data: user, error } = await window.supabaseClient
                .from('users')
                .select('*, user_scores(*)')
                .eq('id', userId)
                .single();

            if (error) throw error;

            this.currentUser = {
                id: user.id,
                username: user.username,
                email: user.email,
                isAdmin: user.is_admin,
                scores: {},
                lastFaucetClaim: user.last_login,
                created: user.created_at
            };

            // Convert scores array to object
            if (user.user_scores) {
                user.user_scores.forEach(score => {
                    this.currentUser.scores[score.game] = score.score;
                });
            }

            this.updateUI();
        } catch (error) {
            console.error('Error fetching user data:', error);
        }
    }

    async login(username, password) {
        try {
            this.checkLoginAttempts(username);

            const { data: { user }, error } = await window.supabaseClient.auth.signInWithPassword({
                email: username,
                password
            });

            if (error) throw error;

            // Reset login attempts on successful login
            this.loginAttempts.delete(username);
            
            await this.fetchUserData(user.id);
            this.isLoggedIn = true;
            this.updateUI();

            return true;
        } catch (error) {
            console.error('Login error:', error);
            
            // Track failed attempt
            const attempts = this.loginAttempts.get(username) || { count: 0, timestamp: Date.now() };
            attempts.count++;
            this.loginAttempts.set(username, attempts);

            throw error;
        }
    }

    async logout() {
        try {
            const { error } = await window.supabaseClient.auth.signOut();
            if (error) throw error;

            this.currentUser = null;
            this.isLoggedIn = false;
            this.updateUI();

            window.location.reload();
        } catch (error) {
            console.error('Logout error:', error);
            throw error;
        }
    }

    loginAsGuest() {
        const guestId = crypto.randomUUID();
        this.currentUser = {
            username: `Guest_${guestId.slice(0, 8)}`,
            id: Date.now(),
            email: '',
            scores: {
                fish: 100,
                keno: 100,
                mancala: 100,
                plinko: 100,
                slot: 100,
                spin: 100
            },
            lastFaucetClaim: null,
            lastGame: null,
            isGuest: true,
            created: Date.now()
        };
        
        this.isLoggedIn = true;
        this.updateUI();
    }

    updateUI() {
        const authButton = document.getElementById('auth-button');
        const userDisplay = document.getElementById('user-display');
        const guestButton = document.getElementById('guest-button');

        if (this.isLoggedIn) {
            if (authButton) authButton.textContent = 'Logout';
            if (userDisplay) {
                const displayText = this.currentUser.isGuest ? 
                    this.currentUser.username : 
                    `<a href="profile.html" class="user-link">${this.escapeHtml(this.currentUser.username)}</a>`;
                userDisplay.innerHTML = `Welcome, ${displayText}!`;
            }
            if (guestButton) guestButton.style.display = 'none';
        } else {
            if (authButton) authButton.textContent = 'Login';
            if (userDisplay) userDisplay.textContent = '';
            if (guestButton) guestButton.style.display = 'inline-block';
        }
    }

    checkLoginAttempts(username) {
        if (!username) {
            throw new Error('Username is required');
        }

        const attempts = this.loginAttempts.get(username) || { count: 0, timestamp: Date.now() };
        
        if (attempts.count >= this.maxAttempts) {
            const timeElapsed = Date.now() - attempts.timestamp;
            if (timeElapsed < this.lockoutDuration) {
                const remainingTime = Math.ceil((this.lockoutDuration - timeElapsed) / 60000);
                throw new Error(`Account temporarily locked. Try again in ${remainingTime} minutes.`);
            } else {
                // Reset attempts after lockout period
                this.loginAttempts.set(username, { count: 0, timestamp: Date.now() });
            }
        }
    }

    escapeHtml(unsafe) {
        if (typeof unsafe !== 'string') {
            return '';
        }
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    async saveScore(game, score) {
        if (!this.isLoggedIn || this.currentUser.isGuest) return;

        try {
            const { data, error } = await window.supabaseClient
                .from('user_scores')
                .upsert({
                    user_id: this.currentUser.id,
                    game,
                    score: Math.max(score, this.getHighScore(game))
                }, {
                    onConflict: 'user_id,game'
                });

            if (error) throw error;

            // Update local scores
            if (!this.currentUser.scores) {
                this.currentUser.scores = {};
            }
            this.currentUser.scores[game] = Math.max(score, this.getHighScore(game));
        } catch (error) {
            console.error('Error saving score:', error);
        }
    }

    getHighScore(game) {
        if (!this.isLoggedIn || !this.currentUser || !this.currentUser.scores) {
            return 100; // Default starting amount
        }
        return this.currentUser.scores[game] || 100;
    }
}

// Initialize Auth and expose to window
window.auth = new Auth();