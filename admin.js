class AdminPanel {
    constructor() {
        this.currentTab = 'users';
        this.users = [];
        this.gameSettings = {};
        this.logs = [];
        this.init();
    }

    async init() {
        try {
            // First check if user is authenticated
            if (!auth?.currentUser?.id) {
                window.location.href = 'login.html';
                return;
            }

            // Check if user is admin
            const { data: user, error } = await window.supabaseClient
                .from('users')
                .select('is_admin')
                .eq('id', auth.currentUser.id)
                .single();

            if (error || !user?.is_admin) {
                window.location.href = 'index.html';
                return;
            }

            this.setupEventListeners();
            this.loadUsers();
            this.loadGameSettings();
            this.loadLogs();
        } catch (error) {
            console.error('Error initializing admin panel:', error);
            Swal.fire({
                title: 'Error',
                text: 'Failed to initialize admin panel',
                icon: 'error'
            });
            window.location.href = 'index.html';
        }
    }

    setupEventListeners() {
        // Tab switching
        document.querySelectorAll('.tab-button').forEach(button => {
            button.addEventListener('click', () => this.switchTab(button.dataset.tab));
        });

        // Search functionality
        document.getElementById('user-search').addEventListener('input', (e) => {
            this.filterUsers(e.target.value);
        });

        // Log filters
        document.getElementById('log-type-filter').addEventListener('change', () => {
            this.filterLogs();
        });

        document.getElementById('log-date-filter').addEventListener('change', () => {
            this.filterLogs();
        });
    }

    async loadUsers() {
        try {
            const { data: users, error } = await window.supabaseClient
                .from('users')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            this.users = users;
            this.renderUsers();
        } catch (error) {
            console.error('Error loading users:', error);
            this.showError('Failed to load users');
        }
    }

    async loadGameSettings() {
        try {
            const { data: settings, error } = await window.supabaseClient
                .from('game_settings')
                .select('*')
                .order('game');

            if (error) throw error;

            this.gameSettings = settings.reduce((acc, setting) => {
                acc[setting.game] = setting.settings;
                return acc;
            }, {});

            this.renderGameSettings();
        } catch (error) {
            console.error('Error loading game settings:', error);
            this.showError('Failed to load game settings');
        }
    }

    async loadLogs() {
        try {
            const { data: logs, error } = await window.supabaseClient
                .from('admin_logs')
                .select(`
                    *,
                    admin:users(username)
                `)
                .order('created_at', { ascending: false })
                .limit(100);

            if (error) throw error;

            this.logs = logs;
            this.renderLogs();
        } catch (error) {
            console.error('Error loading logs:', error);
            this.showError('Failed to load admin logs');
        }
    }

    switchTab(tab) {
        document.querySelectorAll('.tab-button').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tab);
        });

        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.toggle('active', content.id === `${tab}-tab`);
        });

        this.currentTab = tab;
    }

    renderUsers() {
        const tbody = document.getElementById('users-table-body');
        tbody.innerHTML = this.users.map(user => `
            <tr>
                <td>${this.escapeHtml(user.username)}</td>
                <td>${this.escapeHtml(user.email)}</td>
                <td>${new Date(user.created_at).toLocaleDateString()}</td>
                <td>${user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never'}</td>
                <td class="action-buttons">
                    <button class="action-button edit" onclick="adminPanel.editUser('${user.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-button delete" onclick="adminPanel.deleteUser('${user.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }

    renderGameSettings() {
        const grid = document.getElementById('game-settings-grid');
        grid.innerHTML = Object.entries(this.gameSettings).map(([game, settings]) => `
            <div class="game-card">
                <h3>${this.capitalizeFirstLetter(game)}</h3>
                ${this.renderGameSettingsForm(game, settings)}
                <button class="glass-button" onclick="adminPanel.saveGameSettings('${game}')">
                    Save Changes
                </button>
            </div>
        `).join('');
    }

    renderGameSettingsForm(game, settings) {
        const defaultSettings = {
            payoutMultiplier: 1,
            winFrequency: 1,
            minBet: 1,
            maxBet: 100,
            bonusFrequency: 0.1,
            bonusMultiplier: 2
        };

        const currentSettings = { ...defaultSettings, ...settings };

        return Object.entries(currentSettings).map(([key, value]) => `
            <div class="setting-group">
                <label for="${game}-${key}">${this.formatSettingLabel(key)}</label>
                <input
                    type="number"
                    id="${game}-${key}"
                    value="${value}"
                    step="0.1"
                    min="0"
                >
            </div>
        `).join('');
    }

    renderLogs() {
        const container = document.getElementById('admin-logs-list');
        container.innerHTML = this.logs.map(log => `
            <div class="log-entry">
                <div class="log-content">
                    <strong>${this.escapeHtml(log.admin.username)}</strong>
                    ${this.escapeHtml(log.action)}
                    <div class="log-details">
                        ${this.formatLogDetails(log.details)}
                    </div>
                </div>
                <div class="timestamp">
                    ${new Date(log.created_at).toLocaleString()}
                </div>
            </div>
        `).join('');
    }

    async editUser(userId) {
        const user = this.users.find(u => u.id === userId);
        if (!user) return;

        const { value: formValues } = await Swal.fire({
            title: 'Edit User',
            html: `
                <input id="swal-username" class="swal2-input" value="${this.escapeHtml(user.username)}" placeholder="Username">
                <input id="swal-email" class="swal2-input" value="${this.escapeHtml(user.email)}" placeholder="Email">
                <input id="swal-password" type="password" class="swal2-input" placeholder="New Password (optional)">
                <div class="swal2-checkbox-container">
                    <input type="checkbox" id="swal-admin" ${user.is_admin ? 'checked' : ''}>
                    <label for="swal-admin">Admin privileges</label>
                </div>
            `,
            focusConfirm: false,
            preConfirm: () => {
                return {
                    username: document.getElementById('swal-username').value,
                    email: document.getElementById('swal-email').value,
                    password: document.getElementById('swal-password').value,
                    is_admin: document.getElementById('swal-admin').checked
                };
            }
        });

        if (formValues) {
            try {
                const updates = {
                    username: formValues.username,
                    email: formValues.email,
                    is_admin: formValues.is_admin
                };

                if (formValues.password) {
                    const { error: authError } = await window.supabaseClient.auth.admin.updateUserById(
                        userId,
                        { password: formValues.password }
                    );

                    if (authError) throw authError;
                }

                const { error } = await window.supabaseClient
                    .from('users')
                    .update(updates)
                    .eq('id', userId);

                if (error) throw error;

                await this.logAction('Updated user', { userId, updates });
                await this.loadUsers();

                Swal.fire('Success', 'User updated successfully', 'success');
            } catch (error) {
                console.error('Error updating user:', error);
                this.showError('Failed to update user');
            }
        }
    }

    async deleteUser(userId) {
        const result = await Swal.fire({
            title: 'Are you sure?',
            text: "This action cannot be undone!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete user'
        });

        if (result.isConfirmed) {
            try {
                const { error } = await window.supabaseClient
                    .from('users')
                    .delete()
                    .eq('id', userId);

                if (error) throw error;

                await this.logAction('Deleted user', { userId });
                await this.loadUsers();

                Swal.fire('Deleted!', 'User has been deleted.', 'success');
            } catch (error) {
                console.error('Error deleting user:', error);
                this.showError('Failed to delete user');
            }
        }
    }

    async saveGameSettings(game) {
        try {
            const settings = {};
            const form = document.querySelector(`.game-card:has(h3:contains('${game}'))`);
            
            form.querySelectorAll('input').forEach(input => {
                const key = input.id.replace(`${game}-`, '');
                settings[key] = parseFloat(input.value);
            });

            const { error } = await window.supabaseClient
                .from('game_settings')
                .upsert({
                    game,
                    settings,
                    updated_by: auth.currentUser.id
                });

            if (error) throw error;

            await this.logAction('Updated game settings', { game, settings });
            Swal.fire('Success', 'Game settings updated successfully', 'success');
        } catch (error) {
            console.error('Error saving game settings:', error);
            this.showError('Failed to save game settings');
        }
    }

    async logAction(action, details = {}) {
        try {
            const { error } = await window.supabaseClient
                .from('admin_logs')
                .insert({
                    admin_id: auth.currentUser.id,
                    action,
                    details
                });

            if (error) throw error;
            await this.loadLogs();
        } catch (error) {
            console.error('Error logging action:', error);
        }
    }

    filterUsers(search) {
        const searchLower = search.toLowerCase();
        const filteredUsers = this.users.filter(user =>
            user.username.toLowerCase().includes(searchLower) ||
            user.email.toLowerCase().includes(searchLower)
        );
        this.renderUsers(filteredUsers);
    }

    filterLogs() {
        const typeFilter = document.getElementById('log-type-filter').value;
        const dateFilter = document.getElementById('log-date-filter').value;

        let filtered = [...this.logs];

        if (typeFilter) {
            filtered = filtered.filter(log => log.action.toLowerCase().includes(typeFilter));
        }

        if (dateFilter) {
            const filterDate = new Date(dateFilter);
            filtered = filtered.filter(log => {
                const logDate = new Date(log.created_at);
                return logDate.toDateString() === filterDate.toDateString();
            });
        }

        this.renderLogs(filtered);
    }

    formatSettingLabel(key) {
        return key
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, str => str.toUpperCase());
    }

    formatLogDetails(details) {
        return Object.entries(details)
            .map(([key, value]) => `<div>${key}: ${JSON.stringify(value)}</div>`)
            .join('');
    }

    capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    showError(message) {
        Swal.fire({
            title: 'Error',
            text: message,
            icon: 'error'
        });
    }
}

// Initialize admin panel
window.adminPanel = new AdminPanel();