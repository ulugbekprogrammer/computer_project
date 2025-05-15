document.addEventListener('DOMContentLoaded', function() {
            const categoryTabs = document.querySelectorAll('.category-tab');
            const serviceItems = document.querySelectorAll('.service-item');

            categoryTabs.forEach(tab => {
                tab.addEventListener('click', function() {
                    categoryTabs.forEach(t => t.classList.remove('active'));

                    this.classList.add('active');

                    const category = this.getAttribute('data-category');

                    serviceItems.forEach(item => {
                        if (category === 'all') {
                            item.style.display = 'flex';
                        } else if (item.classList.contains(category)) {
                            item.style.display = 'flex';
                        } else {
                            item.style.display = 'none';
                        }
                    });
                });
            });
});