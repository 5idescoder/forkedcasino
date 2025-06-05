document.addEventListener('DOMContentLoaded', async () => {
    const leaderboardBody = document.getElementById('leaderboard-body');
    
    try {
        // Fetch leaderboard data from Supabase
        const { data: scores, error } = await window.supabaseClient
            .from('user_scores')
            .select(`
                user_id,
                score,
                users (
                    username
                )
            `)
            .order('score', { ascending: false })
            .limit(10);

        if (error) throw error;

        // Process and display data
        const leaderboardData = scores.map(score => ({
            username: score.users.username,
            coins: score.score
        }));

        // Sort players by coins (highest to lowest)
        leaderboardData.sort((a, b) => b.coins - a.coins);
        
        // Populate leaderboard
        leaderboardData.forEach((player, index) => {
            const row = document.createElement('tr');
            const rankClass = index < 3 ? `rank-${index + 1}` : '';
            
            row.innerHTML = `
                <td class="rank ${rankClass}">#${index + 1}</td>
                <td>${player.username}</td>
                <td>${player.coins.toLocaleString()}</td>
            `;
            
            leaderboardBody.appendChild(row);
        });
    } catch (error) {
        console.error('Error fetching leaderboard data:', error);
        leaderboardBody.innerHTML = `
            <tr>
                <td colspan="3">Error loading leaderboard data. Please try again later.</td>
            </tr>
        `;
    }
});