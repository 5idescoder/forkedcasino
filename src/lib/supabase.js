// Initialize Supabase client with proper configuration
// Get credentials from script tag data attributes
const currentScript = document.currentScript || document.querySelector('script[data-supabase-url]');
const supabaseUrl = currentScript?.getAttribute('data-supabase-url');
const supabaseAnonKey = currentScript?.getAttribute('data-supabase-key');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase environment variables are missing');
  throw new Error('Missing Supabase environment variables');
}

// Test connectivity to Supabase
const testSupabaseConnection = async () => {
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      method: 'HEAD',
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`
      }
    });
    
    if (!response.ok) {
      console.warn('Supabase connection test failed:', response.status, response.statusText);
      return false;
    }
    
    console.log('Supabase connection test successful');
    return true;
  } catch (error) {
    console.error('Supabase connection test error:', error);
    return false;
  }
};

const supabase = window.supabase.createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: {
      getItem: (key) => {
        try {
          // Try cookie first
          const cookieMatch = document.cookie.match(new RegExp(`${key}=([^;]+)`));
          if (cookieMatch) {
            return JSON.parse(decodeURIComponent(cookieMatch[1]));
          }
          // Fallback to localStorage
          const value = localStorage.getItem(key);
          return value ? JSON.parse(value) : null;
        } catch (error) {
          console.error('Error reading auth storage:', error);
          return null;
        }
      },
      setItem: (key, value) => {
        try {
          localStorage.setItem(key, JSON.stringify(value));
          // Also set a cookie for additional persistence
          document.cookie = `${key}=${encodeURIComponent(JSON.stringify(value))}; path=/; max-age=604800; SameSite=Strict`;
        } catch (error) {
          console.error('Error setting auth storage:', error);
        }
      },
      removeItem: (key) => {
        try {
          localStorage.removeItem(key);
          // Remove the cookie as well
          document.cookie = `${key}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Strict`;
        } catch (error) {
          console.error('Error removing auth storage:', error);
        }
      }
    }
  },
  db: {
    schema: 'public'
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

// Initialize auth state
supabase.auth.onAuthStateChange(async (event, session) => {
  if (event === 'SIGNED_IN') {
    console.log('User signed in:', session?.user?.id);
    
    // Ensure user profile exists
    if (session?.user) {
      try {
        const { data: profile, error: profileError } = await supabase
          .from('users')
          .select('id')
          .eq('id', session.user.id)
          .single();

        if (profileError && profileError.code !== 'PGRST116') {
          console.error('Error checking user profile:', profileError);
          return;
        }

        if (!profile) {
          // Create profile if it doesn't exist
          const { error: insertError } = await supabase
            .from('users')
            .insert([{
              id: session.user.id,
              username: session.user.user_metadata.username || session.user.email.split('@')[0],
              email: session.user.email,
              password_hash: '', // This will be managed by Supabase Auth
              is_admin: false
            }]);

          if (insertError) {
            console.error('Error creating user profile:', insertError);
            return;
          }

          // Initialize scores
          const games = ['fish', 'keno', 'mancala', 'plinko', 'slot', 'spin'];
          await Promise.all(games.map(game => 
            supabase
              .from('user_scores')
              .insert([{
                user_id: session.user.id,
                game,
                score: 100
              }])
          ));
        }
      } catch (error) {
        console.error('Error initializing user profile:', error);
      }
    }
  } else if (event === 'SIGNED_OUT') {
    console.log('User signed out');
    localStorage.removeItem('arcade-auth');
    document.cookie = 'arcade-auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Strict';
  }
});

// Test connection on initialization
testSupabaseConnection();

// Make supabase client available globally
window.supabaseClient = supabase;
window.testSupabaseConnection = testSupabaseConnection;

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = supabase;
}