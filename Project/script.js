document.addEventListener('DOMContentLoaded', function() {
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    const userRole = localStorage.getItem('userRole');

    if (!isLoggedIn) {
        window.location.href = 'login.html';
        return;
    }

    const slots = document.querySelectorAll('.slot');
    const bookBtn = document.getElementById('bookBtn');
    const freeBtn = document.getElementById('freeBtn');
    const darkModeToggle = document.getElementById('darkModeToggle');
    const logoutBtn = document.getElementById('logoutBtn');
    let selectedSlot = null;

    if (userRole === 'user') {
        bookBtn.style.display = 'none';
        freeBtn.style.display = 'none';
    }

    darkModeToggle.addEventListener('change', function() {
        document.body.classList.toggle('dark-mode');
        const themeLabel = document.getElementById('themeLabel');
        themeLabel.textContent = this.checked ? 'Dark Mode' : 'Light Mode';
        const isDarkMode = document.body.classList.contains('dark-mode');
        localStorage.setItem('darkMode', isDarkMode);
    });

    const savedDarkMode = localStorage.getItem('darkMode');
    if (savedDarkMode === 'true') {
        document.body.classList.add('dark-mode');
        darkModeToggle.checked = true;
        document.getElementById('themeLabel').textContent = 'Dark Mode';
    }

    slots.forEach(slot => {
        slot.addEventListener('click', function() {
            slots.forEach(s => s.classList.remove('selected'));
            this.classList.add('selected');
            selectedSlot = this;
        });
    });
    bookBtn.addEventListener('click', function() {
        if (selectedSlot && selectedSlot.classList.contains('available')) {
            selectedSlot.classList.remove('available');
            selectedSlot.classList.add('occupied');
            selectedSlot.classList.remove('selected');
            selectedSlot = null;
            alert('Slot booked successfully!');
        } else if (selectedSlot) {
            alert('This slot is already occupied.');
        } else {
            alert('Please select a slot first.');
        }
    });

    freeBtn.addEventListener('click', function() {
        if (selectedSlot && selectedSlot.classList.contains('occupied')) {
            selectedSlot.classList.remove('occupied');
            selectedSlot.classList.add('available');
            selectedSlot.classList.remove('selected');
            selectedSlot = null;
            alert('Slot freed successfully!');
        } else if (selectedSlot) {
            alert('This slot is already available.');
        } else {
            alert('Please select a slot first.');
        }
    });

    logoutBtn.addEventListener('click', function() {
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('userRole');
        window.location.href = 'login.html';
    });
});
