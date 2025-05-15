const token = localStorage.getItem('token');
        const API_BASE_URL = '';

        // DOM Elements
        const userAvatar = document.getElementById('user-avatar');
        const userName = document.getElementById('user-name');
        const userEmail = document.getElementById('user-email');
        const userRole = document.getElementById('user-role');
        const userId = document.getElementById('user-id');
        const repairsTableBody = document.getElementById('repairs-table-body');
        const editProfileBtn = document.getElementById('edit-profile-btn');
        const modal = document.getElementById('edit-profile-modal');
        const modalClose = document.getElementById('modal-close');
        const modalCancel = document.getElementById('modal-cancel');
        const profileForm = document.getElementById('profile-form');
        const logoutBtn = document.getElementById('logout-btn');

        // Show toast notification
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

        // Fetch user info
        async function fetchUserInfo() {
            try {
                console.log('Fetching user info with token:', token);
                const response = await fetch(`${API_BASE_URL}/users/me`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.detail || 'Failed to fetch user info');
                }
                const user = await response.json();
                userAvatar.textContent = `${user.name.charAt(0)}${user.surname.charAt(0)}`;
                userName.textContent = `${user.name} ${user.surname}`;
                userEmail.textContent = user.email || 'No email';
                userRole.textContent = user.role;
                userId.textContent = user.id;
            } catch (error) {
                console.error('Error fetching user info:', error.message);
                showToast('error', error.message);
                // Only redirect if explicitly not authenticated
                if (error.message.includes('Not authenticated') || error.message.includes('Could not validate credentials')) {
                    setTimeout(() => window.location.href = '/login', 1000);
                }
            }
        }

        // Fetch user repairs
        async function fetchUserRepairs() {
            try {
                console.log('Fetching repairs with token:', token);
                const response = await fetch(`${API_BASE_URL}/user/repairs`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.detail || 'Failed to fetch repairs');
                }
                const repairs = await response.json();
                repairsTableBody.innerHTML = '';
                repairs.forEach(repair => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${repair.id}</td>
                        <td>${repair.repair_description}</td>
                        <td>${new Date(repair.submission_date).toLocaleString()}</td>
                        <td>${repair.quantity}</td>
                        <td>${repair.delivery_method === 'user_delivers' ? 'User Delivers' : 'Service Pickup'}</td>
                        <td><span class="badge badge-${repair.priority.toLowerCase()}">${repair.priority}</span></td>
                    `;
                    repairsTableBody.appendChild(row);
                });
            } catch (error) {
                console.error('Error fetching repairs:', error.message);
                showToast('error', error.message);
            }
        }

        // Edit profile
        async function editProfile() {
            try {
                const response = await fetch(`${API_BASE_URL}/users/me`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.detail || 'Failed to fetch user');
                }
                const user = await response.json();
                document.getElementById('user-id').value = user.id;
                document.getElementById('user-name').value = user.name;
                document.getElementById('user-surname').value = user.surname;
                document.getElementById('user-email').value = user.email || '';
                document.getElementById('user-password').value = '';
                modal.classList.add('show');
            } catch (error) {
                console.error('Error fetching profile:', error.message);
                showToast('error', error.message);
            }
        }

        // Save profile changes
        async function saveProfileChanges(e) {
            e.preventDefault();
            const userId = document.getElementById('user-id').value;
            const userName = document.getElementById('user-name').value;
            const userSurname = document.getElementById('user-surname').value;
            const userEmail = document.getElementById('user-email').value;
            const userPassword = document.getElementById('user-password').value;

            if (!userName || !userSurname) {
                showToast('error', 'Name and surname are required');
                return;
            }

            const userData = {
                name: userName,
                surname: userSurname,
                email: userEmail || null
            };
            if (userPassword) userData.password = userPassword;

            try {
                console.log('Updating profile for user ID:', userId);
                const response = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(userData)
                });
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.detail || 'Failed to update profile');
                }
                modal.classList.remove('show');
                await fetchUserInfo();
                showToast('success', 'Profile updated successfully');
            } catch (error) {
                console.error('Error updating profile:', error.message);
                showToast('error', error.message);
            }
        }

        // Logout
        async function logout(e) {
            e.preventDefault();
            try {
                console.log('Logging out with token:', token);
                const response = await fetch(`${API_BASE_URL}/logout`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.detail || 'Failed to logout');
                }
                localStorage.removeItem('token');
                showToast('success', 'Logged out successfully');
                setTimeout(() => window.location.href = '/login', 1000);
            } catch (error) {
                console.error('Error logging out:', error.message);
                showToast('error', error.message);
                localStorage.removeItem('token');
                window.location.href = '/login';
            }
        }

        // Event Listeners
        document.addEventListener('DOMContentLoaded', async () => {
            if (!token) {
                showToast('error', 'Please log in');
                setTimeout(() => window.location.href = '/login', 1000);
                return;
            }
            console.log('Page loaded with token:', token);
            await Promise.all([fetchUserInfo(), fetchUserRepairs()]);
            editProfileBtn.addEventListener('click', editProfile);
            modalClose.addEventListener('click', () => modal.classList.remove('show'));
            modalCancel.addEventListener('click', () => modal.classList.remove('show'));
            profileForm.addEventListener('submit', saveProfileChanges);
            logoutBtn.addEventListener('click', logout);
            modal.addEventListener('click', (e) => {
                if (e.target === modal) modal.classList.remove('show');
            });
        });