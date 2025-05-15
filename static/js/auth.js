document.addEventListener('DOMContentLoaded', () => {
    // Toast notification function
    function showToast(type, message) {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <div class="toast-content">
                <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
                <span>${message}</span>
            </div>
        `;
        document.body.appendChild(toast);
        setTimeout(() => toast.classList.add('show'), 100);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // Function to update navigation bar based on login status
    function updateNavBar() {
        const authButtons = document.querySelector('#auth-buttons');
        if (!authButtons) return;

        const token = localStorage.getItem('token');
        if (token) {
            fetch('/users/me', {
                headers: { 'Authorization': `Bearer ${token}` }
            })
                .then(response => {
                    if (!response.ok) throw new Error('Invalid token');
                    return response.json();
                })
                .then(user => {
                    authButtons.innerHTML = `
                        ${user.role === 'admin' ? '<li><a href="/admin" class="btn">Admin Portal</a></li>' : '<li><a href="/profile" class="btn">Profile</a></li>'}
                        <li><a href="#" id="logout-btn" class="btn btn-primary">Logout</a></li>
                    `;
                    const logoutBtn = document.querySelector('#logout-btn');
                    if (logoutBtn) {
                        logoutBtn.addEventListener('click', async (e) => {
                            e.preventDefault();
                            try {
                                const response = await fetch('/logout', {
                                    method: 'POST',
                                    headers: {
                                        'Authorization': `Bearer ${token}`,
                                        'Content-Type': 'application/json'
                                    }
                                });
                                const data = await response.json();
                                if (response.ok) {
                                    localStorage.removeItem('token');
                                    showToast('success', data.message || 'Logout successful!');
                                    setTimeout(() => window.location.reload(), 1000);
                                } else {
                                    showToast('error', data.detail || 'Logout failed.');
                                }
                            } catch (error) {
                                console.error('Error:', error);
                                showToast('error', 'An error occurred during logout.');
                            }
                        });
                    }
                })
                .catch(error => {
                    console.error('Error fetching user:', error);
                    localStorage.removeItem('token');
                    authButtons.innerHTML = `
                        <li><a href="/static/templates/login.html" class="btn">Login</a></li>
                        <li><a href="/static/templates/signup.html" class="btn btn-primary">Sign Up</a></li>
                    `;
                });
        } else {
            authButtons.innerHTML = `
                <li><a href="/static/templates/login.html" class="btn">Login</a></li>
                <li><a href="/static/templates/signup.html" class="btn btn-primary">Sign Up</a></li>
            `;
        }
    }

    // Run on page load
    updateNavBar();

    // Handle Login Form
    const loginForm = document.querySelector('#login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.querySelector('#name').value;
            const password = document.querySelector('#password').value;

            try {
                const response = await fetch('/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: new URLSearchParams({
                        'username': name,
                        'password': password
                    })
                });

                const data = await response.json();

                if (response.ok) {
                    const token = data.access_token;
                    localStorage.setItem('token', token);
                    const userResponse = await fetch('/users/me', {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });
                    const userData = await userResponse.json();
                    if (userResponse.ok) {
                        showToast('success', 'Login successful!');
                        if (userData.role === 'admin') {
                            window.location.href = '/admin';
                        } else {
                            window.location.href = '/profile';
                        }
                    } else {
                        showToast('error', userData.detail || 'Failed to fetch user data.');
                        localStorage.removeItem('token');
                    }
                } else {
                    showToast('error', data.detail || 'Login failed. Please check your credentials.');
                }
            } catch (error) {
                console.error('Error:', error);
                showToast('error', 'An error occurred. Please try again later.');
            }
        });
    }

    // Handle Signup Form
    const signupForm = document.querySelector('#signup-form');
    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const accountType = document.querySelector('#account-type').value;
            const name = document.querySelector('#name').value;
            const email = document.querySelector('#email').value;
            const phone = document.querySelector('#phone').value;
            const password = document.querySelector('#password').value;
            const confirmPassword = document.querySelector('#confirm-password').value;
            const terms = document.querySelector('#terms').checked;

            if (password !== confirmPassword) {
                showToast('error', 'Passwords do not match.');
                return;
            }
            if (!terms) {
                showToast('error', 'You must agree to the Terms and Conditions.');
                return;
            }

            const userData = {
                name: name,
                surname: name, // Assuming surname is same as name for simplicity
                email: email,
                password: password,
                role: accountType === 'business' ? 'business' : 'user'
            };

            if (accountType === 'business') {
                userData.business_type = document.querySelector('#business-type').value;
                userData.contact_person = document.querySelector('#contact-person').value;
                userData.address = document.querySelector('#address').value;
            }

            try {
                const response = await fetch('/signup', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(userData)
                });

                const data = await response.json();

                if (response.ok) {
                    showToast('success', 'Account created successfully! Please log in.');
                    window.location.href = '/login';
                } else {
                    showToast('error', data.detail || 'Signup failed. Please try again.');
                }
            } catch (error) {
                console.error('Error:', error);
                showToast('error', 'An error occurred. Please try again later.');
            }
        });
    }
});