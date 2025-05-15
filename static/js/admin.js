const token = localStorage.getItem('token');

        // Base URL for API (adjust if your backend is hosted elsewhere)
        const API_BASE_URL = '';

        // DOM Elements
        const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
        const sidebar = document.getElementById('sidebar');
        const navLinks = document.querySelectorAll('.nav-link');
        const navSectionLinks = document.querySelectorAll('.nav-section-link');
        const contentSections = document.querySelectorAll('.content-section');
        const pageTitle = document.querySelector('.page-title');
        const refreshBtn = document.getElementById('refresh-btn');
        const logoutBtn = document.getElementById('logout-btn');
        const userModal = document.getElementById('user-modal');
        const userModalClose = document.getElementById('user-modal-close');
        const userModalCancel = document.getElementById('user-modal-cancel');
        const userModalSave = document.getElementById('user-modal-save');
        const addUserBtn = document.getElementById('add-user-btn');
        const editProfileBtn = document.getElementById('edit-profile-btn');
        const themeSelect = document.getElementById('theme-select');
        const themeToggle = document.getElementById('theme-toggle');
        const loadingOverlay = document.getElementById('loading-overlay');
        const toast = document.getElementById('toast');
        const toastClose = document.getElementById('toast-close');
        const repairFilter = document.getElementById('repair-filter');
        const adminAvatar = document.getElementById('admin-avatar');
        const adminName = document.getElementById('admin-name');
        const adminEmail = document.getElementById('admin-email');
        const adminRole = document.getElementById('admin-role');
        const adminId = document.getElementById('admin-id');

        // Stats Elements
        const totalUsersEl = document.getElementById('total-users');
        const totalRepairsEl = document.getElementById('total-repairs');
        const pendingRepairsEl = document.getElementById('pending-repairs');
        const highPriorityEl = document.getElementById('high-priority');

        // Show loading overlay
        function showLoading() {
            loadingOverlay.classList.add('show');
        }

        // Hide loading overlay
        function hideLoading() {
            loadingOverlay.classList.remove('show');
        }

        // Show toast notification
        function showToast(type, title, message) {
            const toastIcon = document.querySelector('.toast-icon');
            toastIcon.className = 'toast-icon';

            switch (type) {
                case 'success':
                    toastIcon.classList.add('toast-icon-success');
                    toastIcon.innerHTML = '<i class="fas fa-check-circle"></i>';
                    break;
                case 'error':
                    toastIcon.classList.add('toast-icon-error');
                    toastIcon.innerHTML = '<i class="fas fa-exclamation-circle"></i>';
                    break;
                case 'warning':
                    toastIcon.classList.add('toast-icon-warning');
                    toastIcon.innerHTML = '<i class="fas fa-exclamation-triangle"></i>';
                    break;
                case 'info':
                    toastIcon.classList.add('toast-icon-info');
                    toastIcon.innerHTML = '<i class="fas fa-info-circle"></i>';
                    break;
            }

            document.querySelector('.toast-title').textContent = title;
            document.querySelector('.toast-message').textContent = message;

            toast.classList.add('show');

            // Auto hide after 5 seconds
            setTimeout(() => {
                toast.classList.remove('show');
            }, 5000);
        }

        // Fetch admin info
        async function fetchAdminInfo() {
            showLoading();
            try {
                const response = await fetch(`${API_BASE_URL}/users/me`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch admin info');
                }

                const admin = await response.json();
                adminAvatar.textContent = `${admin.name.charAt(0)}${admin.surname.charAt(0)}`;
                adminName.textContent = `${admin.name} ${admin.surname}`;
                adminEmail.textContent = admin.email || 'No email';
                adminRole.textContent = admin.role;
                adminId.textContent = admin.id;
                hideLoading();
                return admin;
            } catch (error) {
                hideLoading();
                console.error('Error fetching admin info:', error);
                showToast('error', 'Error', 'Failed to load admin info');
                return null;
            }
        }

        // Validate token
        async function validateToken() {
            if (!token) {
                showToast('error', 'Error', 'Please log in as admin');
                localStorage.removeItem('token');
                window.location.href = '/admin_login';
                return false;
            }

            try {
                const response = await fetch(`${API_BASE_URL}/users/me`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (response.status === 401) {
                    showToast('error', 'Error', 'Session expired. Please log in again.');
                    localStorage.removeItem('token');
                    window.location.href = '/admin_login';
                    return false;
                }

                if (response.status === 403) {
                    showToast('error', 'Error', 'Admin access required.');
                    localStorage.removeItem('token');
                    window.location.href = '/admin_login';
                    return false;
                }

                if (!response.ok) {
                    throw new Error('Failed to validate token');
                }

                const user = await response.json();
                if (user.role !== 'admin') {
                    showToast('error', 'Error', 'Admin access required');
                    localStorage.removeItem('token');
                    window.location.href = '/admin_login';
                    return false;
                }

                return true;
            } catch (error) {
                console.error('Token validation error:', error);
                showToast('error', 'Error', 'Error validating session. Please log in again.');
                localStorage.removeItem('token');
                window.location.href = '/admin_login';
                return false;
            }
        }

        // Fetch users
        async function fetchUsers() {
            showLoading();
            try {
                const response = await fetch(`${API_BASE_URL}/admin/users`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (response.status === 401 || response.status === 403) {
                    showToast('error', 'Error', 'Unauthorized. Please log in as admin.');
                    localStorage.removeItem('token');
                    window.location.href = '/admin_login';
                    return [];
                }

                if (!response.ok) {
                    throw new Error('Failed to fetch users');
                }

                const users = await response.json();

                // Update stats
                totalUsersEl.textContent = users.length;

                // Update users table
                const usersTable = document.getElementById('users-table').querySelector('tbody');
                usersTable.innerHTML = '';

                users.forEach(user => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${user.id}</td>
                        <td>
                            <div class="user-info">
                                <div class="user-avatar">${user.name.charAt(0)}${user.surname.charAt(0)}</div>
                                <div>
                                    <div class="user-name">${user.name} ${user.surname}</div>
                                    <div class="user-email">${user.email || 'No email'}</div>
                                </div>
                            </div>
                        </td>
                        <td>${user.email || 'No email'}</td>
                        <td><span class="badge badge-${user.role === 'admin' ? 'danger' : user.role === 'business' ? 'warning' : 'primary'}">${user.role}</span></td>
                        <td>
                            <div class="table-actions">
                                <button class="action-btn action-btn-edit" onclick="editUser(${user.id})">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="action-btn action-btn-delete" onclick="deleteUser(${user.id})">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </td>
                    `;
                    usersTable.appendChild(row);
                });

                hideLoading();
                return users;
            } catch (error) {
                hideLoading();
                showToast('error', 'Error', 'Failed to load users');
                console.error('Error fetching users:', error);
                return [];
            }
        }

        // Fetch repairs
        async function fetchRepairs(filter = 'all') {
            showLoading();
            try {
                const response = await fetch(`${API_BASE_URL}/admin/repairs`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (response.status === 401 || response.status === 403) {
                    showToast('error', 'Error', 'Unauthorized. Please log in as admin.');
                    localStorage.removeItem('token');
                    window.location.href = '/admin_login';
                    return [];
                }

                if (!response.ok) {
                    throw new Error('Failed to fetch repairs');
                }

                let repairs = await response.json();

                // Apply client-side filter
                if (filter !== 'all') {
                    repairs = repairs.filter(repair => {
                        if (filter === 'high') return repair.priority === 'HIGH';
                        if (filter === 'medium') return repair.priority === 'MEDIUM';
                        if (filter === 'low') return repair.priority === 'LOW';
                        return true;
                    });
                }

                // Update stats
                totalRepairsEl.textContent = repairs.length;
                pendingRepairsEl.textContent = repairs.filter(r => !r.completed).length;
                highPriorityEl.textContent = repairs.filter(r => r.priority === 'HIGH').length;

                // Update repairs table
                const repairsTable = document.getElementById('repairs-table').querySelector('tbody');
                repairsTable.innerHTML = '';

                repairs.forEach(repair => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${repair.id}</td>
                        <td>
                            <div class="user-info">
                                <div class="user-avatar">${repair.user_name ? repair.user_name.charAt(0) : ''}${repair.user_surname ? repair.user_surname.charAt(0) : ''}</div>
                                <div>
                                    <div class="user-name">${repair.user_name || ''} ${repair.user_surname || ''}</div>
                                </div>
                            </div>
                        </td>
                        <td>${repair.repair_description}</td>
                        <td>${new Date(repair.submission_date).toLocaleString()}</td>
                        <td>${repair.quantity}</td>
                        <td>${repair.delivery_method === 'user_delivers' ? 'User Delivers' : 'Service Pickup'}</td>
                        <td><span class="badge badge-${repair.priority === 'HIGH' ? 'danger' : repair.priority === 'MEDIUM' ? 'warning' : 'success'}">${repair.priority}</span></td>
                        <td>
                            <div class="table-actions">
                                <button class="action-btn action-btn-edit" onclick="editRepair(${repair.id})">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="action-btn action-btn-delete" onclick="deleteRepair(${repair.id})">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </td>
                    `;
                    repairsTable.appendChild(row);
                });

                // Update recent repairs table
                const recentRepairsTable = document.getElementById('recent-repairs-table').querySelector('tbody');
                recentRepairsTable.innerHTML = '';

                repairs.slice(0, 5).forEach(repair => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${repair.id}</td>
                        <td>${repair.user_name || ''} ${repair.user_surname || ''}</td>
                        <td>${repair.repair_description}</td>
                        <td>${new Date(repair.submission_date).toLocaleString()}</td>
                        <td><span class="badge badge-${repair.priority === 'HIGH' ? 'danger' : repair.priority === 'MEDIUM' ? 'warning' : 'success'}">${repair.priority}</span></td>
                        <td><span class="badge badge-${repair.completed ? 'success' : 'primary'}">${repair.completed ? 'Completed' : 'Pending'}</span></td>
                    `;
                    recentRepairsTable.appendChild(row);
                });

                hideLoading();
                return repairs;
            } catch (error) {
                hideLoading();
                showToast('error', 'Error', 'Failed to load repairs');
                console.error('Error fetching repairs:', error);
                return [];
            }
        }

        // Show user modal for editing
        window.editUser = async function(id) {
            showLoading();
            try {
                const response = await fetch(`${API_BASE_URL}/admin/users`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch user');
                }

                const users = await response.json();
                const user = users.find(u => u.id === id);

                if (user) {
                    document.getElementById('user-id').value = user.id;
                    document.getElementById('user-name').value = user.name;
                    document.getElementById('user-surname').value = user.surname;
                    document.getElementById('user-email').value = user.email || '';
                    document.getElementById('user-password').value = '';
                    document.getElementById('user-role').value = user.role;

                    document.getElementById('user-modal-title').textContent = 'Edit User';
                    userModal.classList.add('show');
                } else {
                    showToast('error', 'Error', 'User not found');
                }

                hideLoading();
            } catch (error) {
                hideLoading();
                showToast('error', 'Error', 'Failed to load user');
                console.error('Error fetching user:', error);
            }
        };

        // Edit profile
        async function editProfile() {
            showLoading();
            try {
                const response = await fetch(`${API_BASE_URL}/users/me`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch admin profile');
                }

                const user = await response.json();
                document.getElementById('user-id').value = user.id;
                document.getElementById('user-name').value = user.name;
                document.getElementById('user-surname').value = user.surname;
                document.getElementById('user-email').value = user.email || '';
                document.getElementById('user-password').value = '';
                document.getElementById('user-role').value = user.role;

                document.getElementById('user-modal-title').textContent = 'Edit Profile';
                userModal.classList.add('show');
                hideLoading();
            } catch (error) {
                hideLoading();
                showToast('error', 'Error', 'Failed to load profile');
                console.error('Error fetching profile:', error);
            }
        }

        // Delete user
        window.deleteUser = async function(id) {
            if (confirm('Are you sure you want to delete this user?')) {
                showLoading();
                try {
                    const response = await fetch(`${API_BASE_URL}/admin/users/${id}`, {
                        method: 'DELETE',
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });

                    if (!response.ok) {
                        throw new Error('Failed to delete user');
                    }

                    await fetchUsers();
                    showToast('success', 'Success', 'User deleted successfully');
                    hideLoading();
                } catch (error) {
                    hideLoading();
                    showToast('error', 'Error', 'Failed to delete user');
                    console.error('Error deleting user:', error);
                }
            }
        };

        // Edit repair (placeholder, as backend doesn't support this yet)
        window.editRepair = function(id) {
            showToast('info', 'Info', 'Repair editing functionality coming soon');
        };

        // Delete repair (not implemented in backend, placeholder)
        window.deleteRepair = function(id) {
            showToast('warning', 'Warning', 'Repair deletion not supported by backend');
        };

        // Save user changes
        async function saveUserChanges() {
            showLoading();
            const userId = document.getElementById('user-id').value;
            const userName = document.getElementById('user-name').value;
            const userSurname = document.getElementById('user-surname').value;
            const userEmail = document.getElementById('user-email').value;
            const userPassword = document.getElementById('user-password').value;
            const userRole = document.getElementById('user-role').value;

            // Validate form
            if (!userName || !userSurname || !userRole) {
                hideLoading();
                showToast('error', 'Error', 'Please fill in all required fields');
                return;
            }

            const userData = {
                name: userName,
                surname: userSurname,
                email: userEmail || null,
                role: userRole
            };

            if (userPassword) {
                userData.password = userPassword;
            }

            try {
                let response;
                if (userId) {
                    // Update existing user
                    response = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
                        method: 'PUT',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(userData)
                    });
                } else {
                    // Add new user
                    response = await fetch(`${API_BASE_URL}/signup`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(userData)
                    });
                }

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.detail || 'Failed to save user');
                }

                userModal.classList.remove('show');
                await Promise.all([fetchUsers(), fetchAdminInfo()]);
                showToast('success', 'Success', userId ? 'User updated successfully' : 'User added successfully');
                hideLoading();
            } catch (error) {
                hideLoading();
                showToast('error', 'Error', error.message || 'Failed to save user');
                console.error('Error saving user:', error);
            }
        }

        // Add new user
        function showAddUserForm() {
            document.getElementById('user-form').reset();
            document.getElementById('user-id').value = '';
            document.getElementById('user-modal-title').textContent = 'Add New User';
            userModal.classList.add('show');
        }

        // Logout function
        async function logout() {
            showLoading();
            try {
                const response = await fetch(`${API_BASE_URL}/logout`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (!response.ok) {
                    throw new Error('Failed to logout');
                }

                localStorage.removeItem('token');
                hideLoading();
                showToast('success', 'Success', 'Logged out successfully');

                setTimeout(() => {
                    window.location.href = '/admin_login';
                }, 1000);
            } catch (error) {
                hideLoading();
                showToast('error', 'Error', 'Failed to logout');
                console.error('Error logging out:', error);
                localStorage.removeItem('token');
                window.location.href = '/admin_login';
            }
        }

        // Navigation
        function showSection(sectionId) {
            contentSections.forEach(section => {
                section.classList.add('hidden');
            });
            document.getElementById(`${sectionId}-section`).classList.remove('hidden');

            navLinks.forEach(link => {
                link.classList.remove('active');
            });
            document.querySelector(`.nav-link[data-section="${sectionId}"]`).classList.add('active');

            pageTitle.textContent = sectionId.charAt(0).toUpperCase() + sectionId.slice(1);

            // Close mobile menu if open
            if (window.innerWidth < 768) {
                sidebar.classList.remove('show');
            }

            // Update URL hash
            window.location.hash = sectionId;
        }

        // Toggle dark mode
        function toggleTheme(theme) {
            const themeToggleIcon = themeToggle.querySelector('i');
            const themeToggleText = themeToggle.querySelector('span:last-child');

            if (theme === 'dark' || (theme === 'toggle' && !document.body.classList.contains('dark-mode'))) {
                document.body.classList.add('dark-mode');
                themeSelect.value = 'dark';
                themeToggleIcon.className = 'fas fa-sun';
                themeToggleText.textContent = 'Light Mode';
            } else {
                document.body.classList.remove('dark-mode');
                themeSelect.value = 'light';
                themeToggleIcon.className = 'fas fa-moon';
                themeToggleText.textContent = 'Dark Mode';
            }

            localStorage.setItem('admin-theme', document.body.classList.contains('dark-mode') ? 'dark' : 'light');
        }

        // Event Listeners
        document.addEventListener('DOMContentLoaded', async () => {
            // Show loading initially
            showLoading();

            // Check theme preference
            const savedTheme = localStorage.getItem('admin-theme') || 'light';
            toggleTheme(savedTheme);

            // Check URL hash for navigation
            const hash = window.location.hash.substring(1);
            if (hash && document.getElementById(`${hash}-section`)) {
                showSection(hash);
            }

            // Validate token and initialize
            const isValid = await validateToken();
            if (isValid) {
                await Promise.all([fetchUsers(), fetchRepairs(), fetchAdminInfo()]);
            } else {
                return;
            }

            // Navigation
            navLinks.forEach(link => {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    const section = link.getAttribute('data-section');
                    showSection(section);
                });
            });

            // Navigation from other elements
            navSectionLinks.forEach(link => {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    const section = link.getAttribute('data-section');
                    showSection(section);
                });
            });

            // Mobile menu toggle
            mobileMenuToggle.addEventListener('click', () => {
                sidebar.classList.toggle('show');
            });

            // Refresh data
            refreshBtn.addEventListener('click', async () => {
                await Promise.all([fetchUsers(), fetchRepairs(repairFilter.value), fetchAdminInfo()]);
                showToast('success', 'Success', 'Data refreshed successfully');
            });

            // Logout
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                logout();
            });

            // User modal
            userModalClose.addEventListener('click', () => {
                userModal.classList.remove('show');
            });

            userModalCancel.addEventListener('click', () => {
                userModal.classList.remove('show');
            });

            userModalSave.addEventListener('click', saveUserChanges);

            // Add user
            addUserBtn.addEventListener('click', showAddUserForm);

            // Edit profile
            editProfileBtn.addEventListener('click', editProfile);

            // Theme toggle
            themeToggle.addEventListener('click', () => {
                toggleTheme('toggle');
            });

            // Theme select
            themeSelect.addEventListener('change', (e) => {
                toggleTheme(e.target.value);
            });

            // Settings form
            document.getElementById('settings-form').addEventListener('submit', (e) => {
                e.preventDefault();
                showLoading();
                setTimeout(() => {
                    hideLoading();
                    showToast('success', 'Success', 'Settings saved successfully');
                }, 500);
            });

            // Close modal when clicking outside
            userModal.addEventListener('click', (e) => {
                if (e.target === userModal) {
                    userModal.classList.remove('show');
                }
            });

            // Close toast
            toastClose.addEventListener('click', () => {
                toast.classList.remove('show');
            });

            // Repair filter
            repairFilter.addEventListener('change', () => {
                fetchRepairs(repairFilter.value);
            });

            // Hide loading when everything is ready
            hideLoading();

            // Show welcome toast
            setTimeout(() => {
                showToast('info', 'Welcome', 'Welcome to TechFix Admin Panel');
            }, 1000);
        });

        // Handle window resize
        window.addEventListener('resize', () => {
            if (window.innerWidth >= 768) {
                sidebar.classList.remove('show');
            }
        });