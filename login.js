document.addEventListener('DOMContentLoaded', async () => {
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
                    // Check if supabaseClient is properly initialized
                    if (!window.supabaseClient) {
                        throw new Error('Unable to connect to the service. Please refresh the page and try again.');
                    }

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
                        console.error('Username lookup error:', userError);
                        if (userError.code === 'PGRST116') {
                            throw new Error('Invalid username/email or password');
                        }
                        if (userError.code === 'JWT_INVALID') {
                            throw new Error('Session expired. Please refresh the page and try again.');
                        }
                        throw new Error('Error looking up username. Please try again.');
                    }

                    if (users?.email) {
                        email = users.email;
                    } else {
                        throw new Error('Invalid username/email or password');
                    }
                } catch (lookupError) {
                    console.error('Username lookup failed:', lookupError);
                    
                    // Handle specific network-related errors
                    if (lookupError.message === 'Failed to fetch') {
                        throw new Error('Unable to connect to the service. Please check your internet connection and try again.');
                    }
                    if (lookupError.message === 'Request timed out') {
                        throw new Error('The request took too long to complete. Please try again.');
                    }
                    
                    throw lookupError;
                }
            }

            // Check if supabaseClient is properly initialized before sign in
            if (!window.supabaseClient) {
                throw new Error('Unable to connect to the service. Please refresh the page and try again.');
            }

            const { data, error } = await window.supabaseClient.auth.signInWithPassword({
                email,
                password
            });

            if (error) {
                console.error('Login error:', error);
                if (error.message.includes('Invalid login credentials')) {
                    throw new Error('Invalid username/email or password');
                }
                if (error.message === 'Failed to fetch') {
                    throw new Error('Unable to connect to the service. Please check your internet connection and try again.');
                }
                throw error;
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

            // Check if supabaseClient is properly initialized
            if (!window.supabaseClient) {
                throw new Error('Unable to connect to the service. Please refresh the page and try again.');
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
                        console.error('Username check error:', checkError);
                        throw new Error('Error checking username availability. Please try again.');
                    }
                } else if (existingUser) {
                    throw new Error('Username is already taken');
                }
            } catch (checkError) {
                if (checkError.message === 'Username is already taken') {
                    throw checkError;
                }
                if (checkError.message === 'Failed to fetch') {
                    throw new Error('Unable to connect to the service. Please check your internet connection and try again.');
                }
                console.error('Username availability check failed:', checkError);
                throw new Error('Unable to verify username availability. Please try again later.');
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
                console.error('Registration error:', authError);
                if (authError.message.includes('User already registered')) {
                    throw new Error('Email is already registered');
                }
                if (authError.message === 'Failed to fetch') {
                    throw new Error('Unable to connect to the service. Please check your internet connection and try again.');
                }
                throw authError;
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