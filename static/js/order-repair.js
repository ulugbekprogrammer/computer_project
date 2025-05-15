document.addEventListener('DOMContentLoaded', function() {
            // Check authentication status
            const token = localStorage.getItem('token');
            console.log('Order-repair loaded, token:', token ? 'present' : 'missing');
            if (token) {
                fetch('/users/me', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                })
                    .then(response => {
                        if (!response.ok) {
                            console.log('Invalid token, redirecting to login');
                            localStorage.removeItem('token');
                            window.location.href = '/login';
                        }
                        return response.json();
                    })
                    .then(user => {
                        console.log('User authenticated:', user.name);
                    })
                    .catch(error => {
                        console.error('Error checking auth:', error);
                        localStorage.removeItem('token');
                        window.location.href = '/login';
                    });
            } else {
                console.log('No token, redirecting to login');
                window.location.href = '/login';
            }

            // Update order summary based on service type
            const serviceTypeRadios = document.querySelectorAll('input[name="service-type"]');
            const serviceFeeItem = document.getElementById('service-fee-item');
            const totalPrice = document.getElementById('total-price');
            const diagnosticFee = 49.99;
            const pickupFee = 29.99;

            function updateTotalPrice() {
                const selectedService = document.querySelector('input[name="service-type"]:checked').value;
                if (selectedService === 'service_pickup') {
                    serviceFeeItem.style.display = 'flex';
                    totalPrice.textContent = '$' + (diagnosticFee + pickupFee).toFixed(2);
                } else {
                    serviceFeeItem.style.display = 'none';
                    totalPrice.textContent = '$' + diagnosticFee.toFixed(2);
                }
            }

            serviceTypeRadios.forEach(radio => {
                radio.addEventListener('change', updateTotalPrice);
            });

            // Form submission
            document.getElementById('repairOrderForm').addEventListener('submit', async function(e) {
                e.preventDefault();

                const description = document.getElementById('device-description').value.trim();
                const quantity = parseInt(document.getElementById('quantity').value);
                const serviceType = document.querySelector('input[name="service-type"]:checked').value;

                if (!description) {
                    alert('Please provide a device description.');
                    return;
                }
                if (quantity < 1) {
                    alert('Quantity must be at least 1.');
                    return;
                }

                const repairData = {
                    repair_description: description,
                    quantity: quantity,
                    delivery_method: serviceType
                };

                try {
                    console.log('Submitting repair, token:', token ? 'present' : 'missing');
                    const response = await fetch('/repairs', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify(repairData)
                    });

                    const data = await response.json();

                    if (response.ok) {
                        console.log('Repair submitted successfully, token before redirect:', localStorage.getItem('token') ? 'present' : 'missing');
                        alert('Repair order submitted successfully! You will be contacted soon.');
                        // Delay redirect to ensure auth.js completes
                        setTimeout(() => {
                            window.location.href = '/static/templates/repair-options.html';
                        }, 100);
                    } else {
                        if (response.status === 401) {
                            console.log('401 Unauthorized, clearing token');
                            localStorage.removeItem('token');
                            window.location.href = '/login';
                        } else if (response.status === 422) {
                            const errorDetails = data.detail.map(err => err.msg).join('; ');
                            alert(`Validation error: ${errorDetails}`);
                        } else {
                            alert(data.detail || 'Failed to submit repair order.');
                        }
                    }
                } catch (error) {
                    console.error('Error submitting repair:', error);
                    alert('An error occurred while submitting your order. Please try again later.');
                }
            });
        });