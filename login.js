// Wait for Supabase client to be available
const waitForSupabaseClient = () => {
    return new Promise((resolve) => {
        if (window.supabaseClient) {
            resolve();
            return;
        }
        
        const checkClient = () => {
            if (window.supabaseClient) {
                resolve();
            } else {
                setTimeout(checkClient, 100);
            }
        };
        
        checkClient();
    });
};

document.addEventListener('DOMContentLoaded', async () => {
    // Wait for Supabase client to be available before proceeding
    await waitForSupabaseClient();
    
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const showRegisterLink = document.getElementById('show-register');
    const showLoginLink = document.getElementById('show-login');
    const loginFormContainer = document.getElementById('login-form-container');
    const registerFormContainer = document.getElementById('register-form-container');

    // Setup password visibility toggles
    document.querySelectorAll('.toggle-password').forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            const input = button.parentElement.querySelector('input');
            const icon = button.querySelector('i');
            
            if (input.type === 'password') {
                input.type = 'text';
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
            } else {
                input.type = 'password';
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
            }
        });
    });

    const showError = (formId, message) => {
        const errorDiv = document.getElementById(`${formId}-error`);
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
    };

    const switchForm = (showForm, hideForm) => {
        hideForm.style.display = 'none';
        showForm.style.display = 'block';
    };

    // Helper function to handle network and Supabase errors
    const handleSupabaseError = (error, context = '') => {
        console.error(`${context} error:`, error);
        
        // Handle network errors
        if (error.message === 'Failed to fetch') {
            return 'Unable to connect to the service. Please check your internet connection and try again.';
        }
        
        if (error.message === 'Request timed out') {
            return 'The request took too long to complete. Please try again.';
        }
        
        // Handle specific Supabase errors
        if (error.code === 'PGRST116') {
            return context === 'Username lookup' ? 'Invalid username/email or password' : 'Username is available';
        }
        
        if (error.code === 'JWT_INVALID') {
            return 'Session expired. Please refresh the page and try again.';
        }
        
        // Handle auth errors
        if (error.message && error.message.includes('Invalid login credentials')) {
            return 'Invalid username/email or password';
        }
        
        if (error.message && error.message.includes('User already registered')) {
            return 'Email is already registered';
        }
        
        // Return the original error message if available, otherwise a generic message
        return error.message || `An error occurred during ${context.toLowerCase()}. Please try again.`;
    };

    showRegisterLink?.addEventListener('click', (e) => {
        e.preventDefault();
        switchForm(registerFormContainer, loginFormContainer);
    });

    showLoginLink?.addEventListener('click', (e) => {
        e.preventDefault();
        switchForm(loginFormContainer, registerFormContainer);
    });

    loginForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const identifier = document.getElementById('login-username').value;
        const password = document.getElementById('login-password').value;

        try {
            let email = identifier;

            // Only try username lookup if the identifier doesn't look like an email
            if (!identifier.includes('@')) {
                try {
                    // Add timeout to the fetch request
                    const timeoutPromise = new Promise((_, reject) => 
                        setTimeout(() => reject(new Error('Request timed out')), 10000)
                    );

                    const fetchPromise = window.supabaseClient
                        .from('users')
                        .select('email')
                        .eq('username', identifier)
                        .single();

                    const { data: users, error: userError } = await Promise.race([
                        fetchPromise,
                        timeoutPromise
                    ]);

                    if (userError) {
                        const errorMessage = handleSupabaseError(userError, 'Username lookup');
                        if (userError.code === 'PGRST116') {
                            throw new Error('Invalid username/email or password');
                        }
                        throw new Error(errorMessage);
                    }

                    if (users?.email) {
                        email = users.email;
                    } else {
                        throw new Error('Invalid username/email or password');
                    }
                } catch (lookupError) {
                    const errorMessage = handleSupabaseError(lookupError, 'Username lookup');
                    throw new Error(errorMessage);
                }
            }

            const { data, error } = await window.supabaseClient.auth.signInWithPassword({
                email,
                password
            });

            if (error) {
                const errorMessage = handleSupabaseError(error, 'Login');
                throw new Error(errorMessage);
            }

            window.location.href = 'index.html';
        } catch (error) {
            console.error('Login process error:', error);
            showError('login', error.message || 'An error occurred during login. Please try again.');
        }
    });

    registerForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const username = document.getElementById('register-username').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        const confirmPassword = document.getElementById('register-confirm-password').value;

        try {
            // Validate all fields are present
            if (!username || !email || !password || !confirmPassword) {
                throw new Error('All fields are required');
            }

            // Validate password length before any network requests
            if (password.length < 6) {
                throw new Error('Password must be at least 6 characters long');
            }

            // Validate passwords match
            if (password !== confirmPassword) {
                throw new Error('Passwords do not match');
            }

            // Check if username is already taken with proper error handling
            try {
                const { data: existingUser, error: checkError } = await window.supabaseClient
                    .from('users')
                    .select('id')
                    .eq('username', username)
                    .single();

                if (checkError) {
                    if (checkError.code === 'PGRST116') {
                        // No user found with this username, which is what we want
                        console.log('Username is available');
                    } else {
                        const errorMessage = handleSupabaseError(checkError, 'Username check');
                        throw new Error(errorMessage);
                    }
                } else if (existingUser) {
                    throw new Error('Username is already taken');
                }
            } catch (checkError) {
                if (checkError.message === 'Username is already taken') {
                    throw checkError;
                }
                const errorMessage = handleSupabaseError(checkError, 'Username availability check');
                throw new Error(errorMessage);
            }

            // Create auth user
            const { data: authData, error: authError } = await window.supabaseClient.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        username
                    }
                }
            });

            if (authError) {
                const errorMessage = handleSupabaseError(authError, 'Registration');
                throw new Error(errorMessage);
            }

            // Show success message
            await Swal.fire({
                title: 'Registration Successful!',
                text: 'You can now login with your credentials',
                icon: 'success',
                timer: 2000,
                showConfirmButton: false
            });

            // Switch to login form
            switchForm(loginFormContainer, registerFormContainer);
            
            // Pre-fill login form
            document.getElementById('login-username').value = username;
            document.getElementById('login-password').value = '';
        } catch (error) {
            console.error('Registration process error:', error);
            showError('register', error.message || 'An error occurred during registration. Please try again.');
        }
    });

    // Check URL hash for registration form
    if (window.location.hash === '#register') {
        switchForm(registerFormContainer, loginFormContainer);
    }
});