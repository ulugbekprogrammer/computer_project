document.getElementById('account-type').addEventListener('change', function() {
            const businessFields = document.querySelectorAll('.business-field');
            if (this.value === 'business') {
                businessFields.forEach(field => field.style.display = 'block');
            } else {
                businessFields.forEach(field => field.style.display = 'none');
            }
});