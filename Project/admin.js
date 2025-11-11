document.addEventListener('DOMContentLoaded', function() {
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    const userRole = localStorage.getItem('userRole');

    if (!isLoggedIn || userRole !== 'admin') {
        window.location.href = 'login.html';
        return;
    }


    const broadcastChannel = new BroadcastChannel('parking-slots-updates');

    const hamburgerMenu = document.getElementById('hamburgerMenu');
    const menuOverlay = document.getElementById('menuOverlay');
    const closeMenu = document.getElementById('closeMenu');
    const dashboardLink = document.getElementById('dashboardLink');
    const preBookingsLink = document.getElementById('preBookingsLink');
    const settingsLink = document.getElementById('settingsLink');
    const logoutLink = document.getElementById('logoutLink');

    hamburgerMenu.addEventListener('click', function() {
        menuOverlay.classList.toggle('active');
        hamburgerMenu.classList.toggle('active');
    });

    closeMenu.addEventListener('click', function() {
        menuOverlay.classList.remove('active');
        hamburgerMenu.classList.remove('active');
    });

    menuOverlay.addEventListener('click', function(e) {
        if (e.target === menuOverlay) {
            menuOverlay.classList.remove('active');
            hamburgerMenu.classList.remove('active');
        }
    });

    dashboardLink.addEventListener('click', function(e) {
        e.preventDefault();
        menuOverlay.classList.remove('active');
        hamburgerMenu.classList.remove('active');
        showDashboard();
    });

    preBookingsLink.addEventListener('click', function(e) {
        e.preventDefault();
        menuOverlay.classList.remove('active');
        hamburgerMenu.classList.remove('active');
        showPreBookings();
    });

    settingsLink.addEventListener('click', function(e) {
        e.preventDefault();
        menuOverlay.classList.remove('active');
        hamburgerMenu.classList.remove('active');
        document.querySelector('.theme-toggle').scrollIntoView({ behavior: 'smooth' });
    });

    logoutLink.addEventListener('click', function(e) {
        e.preventDefault();
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('userRole');
        window.location.href = 'login.html';
    });

    let slots = [];
    let selectedSlot = null;
    const slotsContainer = document.getElementById('slotsContainer');
    const bookBtn = document.getElementById('bookBtn');
    const freeBtn = document.getElementById('freeBtn');
    const bookAllBtn = document.getElementById('bookAllBtn');
    const freeAllBtn = document.getElementById('freeAllBtn');
    const resetAllBtn = document.getElementById('resetAllBtn');
    const addSlotsBtn = document.getElementById('addSlotsBtn');
    const slotCountInput = document.getElementById('slotCount');
    const darkModeToggle = document.getElementById('darkModeToggle');
    const logoutBtn = document.getElementById('logoutBtn');

    function saveSlotStates() {
        const slotStates = {};
        slots.forEach((slot, index) => {
            slotStates[index + 1] = slot.classList.contains('occupied') ? 'occupied' : 'available';
        });
        localStorage.setItem('parkingSlots', JSON.stringify(slotStates));
        localStorage.setItem('totalSlots', slots.length.toString());
    }

    function loadSlotStates() {
        const savedStates = localStorage.getItem('parkingSlots');
        const savedTotal = localStorage.getItem('totalSlots');
        return {
            states: savedStates ? JSON.parse(savedStates) : null,
            total: savedTotal ? parseInt(savedTotal) : 10
        };
    }

    function updateStats() {
        const totalSlots = slots.length;
        const availableSlots = document.querySelectorAll('.slot.available').length;
        const occupiedSlots = document.querySelectorAll('.slot.occupied').length;
        const occupancyRate = Math.round((occupiedSlots / totalSlots) * 100);

        document.getElementById('totalSlots').textContent = totalSlots;
        document.getElementById('availableSlots').textContent = availableSlots;
        document.getElementById('occupiedSlots').textContent = occupiedSlots;
        document.getElementById('occupancyRate').textContent = occupancyRate + '%';
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

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(position) {
            const lat = position.coords.latitude;
            const long = position.coords.longitude;
            const locationText = document.querySelector('.location-text');

            fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${long}`)
                .then(response => response.json())
                .then(data => {
                    const locationName = data.display_name ? data.display_name.split(',')[0] : 'Unknown Location';
                    locationText.textContent = `${locationName} - Lat: ${lat.toFixed(4)}, Long: ${long.toFixed(4)}`;
                })
                .catch(error => {
                    console.error('Error getting location name:', error);
                    locationText.textContent = `Lat: ${lat.toFixed(4)}, Long: ${long.toFixed(4)}`;
                });
        }, function(error) {
            console.error('Error getting location:', error);
            const locationText = document.querySelector('.location-text');
            locationText.textContent = 'Location unavailable';
        });
    } else {
        console.log('Geolocation not supported');
        const locationText = document.querySelector('.location-text');
        locationText.textContent = 'Geolocation not supported';
    }

    function createSlots(count) {
        slotsContainer.innerHTML = '';
        slots = [];
        for (let i = 1; i <= count; i++) {
            const slot = document.createElement('div');
            slot.className = 'slot available';
            slot.id = `slot${i}`;
            slot.textContent = `Slot ${i}`;
            slot.addEventListener('click', function() {
                slots.forEach(s => s.classList.remove('selected'));
                this.classList.add('selected');
                selectedSlot = this;
            });
            slotsContainer.appendChild(slot);
            slots.push(slot);
        }
        updateStats();
    }

    
    const savedData = loadSlotStates();
    createSlots(savedData.total);


    if (savedData.states) {
        slots.forEach((slot, index) => {
            const slotNumber = index + 1;
            if (savedData.states[slotNumber] === 'occupied') {
                slot.classList.remove('available');
                slot.classList.add('occupied');
            }
        });
    }

    addSlotsBtn.addEventListener('click', function() {
        const count = parseInt(slotCountInput.value);
        if (count >= 1 && count <= 50) {
            createSlots(count);
            saveSlotStates();
        
            broadcastChannel.postMessage({
                type: 'slots-updated',
                data: {
                    totalSlots: count,
                    slotStates: JSON.parse(localStorage.getItem('parkingSlots') || '{}')
                }
            });
            alert(`Created ${count} parking slots successfully!`);
        } else {
            alert('Please enter a number between 1 and 50.');
        }
    });

  
    const sortSelect = document.getElementById('sortSelect');
    sortSelect.addEventListener('change', function() {
        sortSlots(this.value);
    });

    function sortSlots(sortType) {
        const slotsContainer = document.getElementById('slotsContainer');
        const slotElements = Array.from(slotsContainer.children);

        if (sortType === 'default') {
            slotElements.sort((a, b) => {
                const numA = parseInt(a.textContent.replace('Slot ', ''));
                const numB = parseInt(b.textContent.replace('Slot ', ''));
                return numA - numB;
            });
        } else if (sortType === 'available') {
            slotElements.sort((a, b) => {
                const aAvailable = a.classList.contains('available');
                const bAvailable = b.classList.contains('available');
                if (aAvailable && !bAvailable) return -1;
                if (!aAvailable && bAvailable) return 1;
                const numA = parseInt(a.textContent.replace('Slot ', ''));
                const numB = parseInt(b.textContent.replace('Slot ', ''));
                return numA - numB;
            });
        } else if (sortType === 'occupied') {
            slotElements.sort((a, b) => {
                const aOccupied = a.classList.contains('occupied');
                const bOccupied = b.classList.contains('occupied');
                if (aOccupied && !bOccupied) return -1;
                if (!aOccupied && bOccupied) return 1;
                const numA = parseInt(a.textContent.replace('Slot ', ''));
                const numB = parseInt(b.textContent.replace('Slot ', ''));
                return numA - numB;
            });
        }

        slotsContainer.innerHTML = '';
        slotElements.forEach(slot => slotsContainer.appendChild(slot));
    }

    bookBtn.addEventListener('click', function() {
        if (selectedSlot && selectedSlot.classList.contains('available')) {
            selectedSlot.classList.remove('available');
            selectedSlot.classList.add('occupied');
            selectedSlot.classList.remove('selected');
            selectedSlot = null;
            updateStats();
            saveSlotStates();
            broadcastChannel.postMessage({
                type: 'slots-updated',
                data: {
                    totalSlots: slots.length,
                    slotStates: JSON.parse(localStorage.getItem('parkingSlots') || '{}')
                }
            });
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
            updateStats();
            saveSlotStates();
            broadcastChannel.postMessage({
                type: 'slots-updated',
                data: {
                    totalSlots: slots.length,
                    slotStates: JSON.parse(localStorage.getItem('parkingSlots') || '{}')
                }
            });
            alert('Slot freed successfully!');
        } else if (selectedSlot) {
            alert('This slot is already available.');
        } else {
            alert('Please select a slot first.');
        }
    });

    bookAllBtn.addEventListener('click', function() {
        const availableSlots = document.querySelectorAll('.slot.available');
        if (availableSlots.length === 0) {
            alert('All slots are already occupied.');
            return;
        }

        availableSlots.forEach(slot => {
            slot.classList.remove('available');
            slot.classList.add('occupied');
        });
        updateStats();
        saveSlotStates();
        broadcastChannel.postMessage({
            type: 'slots-updated',
            data: {
                totalSlots: slots.length,
                slotStates: JSON.parse(localStorage.getItem('parkingSlots') || '{}')
            }
        });
        alert(`Booked ${availableSlots.length} slots successfully!`);
    });

    freeAllBtn.addEventListener('click', function() {
        const occupiedSlots = document.querySelectorAll('.slot.occupied');
        if (occupiedSlots.length === 0) {
            alert('All slots are already available.');
            return;
        }

        occupiedSlots.forEach(slot => {
            slot.classList.remove('occupied');
            slot.classList.add('available');
        });
        updateStats();
        saveSlotStates();
        broadcastChannel.postMessage({
            type: 'slots-updated',
            data: {
                totalSlots: slots.length,
                slotStates: JSON.parse(localStorage.getItem('parkingSlots') || '{}')
                }
        });
        alert(`Freed ${occupiedSlots.length} slots successfully!`);
    });

    resetAllBtn.addEventListener('click', function() {
        if (confirm('Are you sure you want to reset all slots to available?')) {
            slots.forEach(slot => {
                slot.classList.remove('occupied');
                slot.classList.add('available');
                slot.classList.remove('selected');
            });
            selectedSlot = null;
            updateStats();
            saveSlotStates();
            broadcastChannel.postMessage({
                type: 'slots-updated',
                data: {
                    totalSlots: slots.length,
                    slotStates: JSON.parse(localStorage.getItem('parkingSlots') || '{}')
                }
            });
            alert('All slots have been reset to available.');
        }
    });



    function showDashboard() {
        document.getElementById('preBookingsSection').style.display = 'none';
        document.querySelector('.stats-container').style.display = 'flex';
        document.querySelector('.bulk-controls').style.display = 'block';
        document.querySelector('.slot-management').style.display = 'block';
        document.querySelector('.individual-controls').style.display = 'block';
        document.getElementById('dashboardLink').classList.add('active');
        document.getElementById('preBookingsLink').classList.remove('active');
    }

    function showPreBookings() {
        document.getElementById('preBookingsSection').style.display = 'block';
        document.querySelector('.stats-container').style.display = 'none';
        document.querySelector('.bulk-controls').style.display = 'none';
        document.querySelector('.slot-management').style.display = 'none';
        document.querySelector('.individual-controls').style.display = 'none';
        document.getElementById('dashboardLink').classList.remove('active');
        document.getElementById('preBookingsLink').classList.add('active');
        displayPreBookings();
    }

    function displayPreBookings() {
        const preBookingsContainer = document.getElementById('preBookingsContainer');
        const preBookings = JSON.parse(localStorage.getItem('preBookings') || '[]');

        // Filter out bookings with undefined or null IDs
        const validPreBookings = preBookings.filter(booking => booking.id !== undefined && booking.id !== null);

        if (validPreBookings.length === 0) {
            preBookingsContainer.innerHTML = '<p>No pre-bookings found.</p>';
            return;
        }

        preBookingsContainer.innerHTML = '';
        validPreBookings.forEach((booking, index) => {
            const bookingCard = document.createElement('div');
            bookingCard.className = 'booking-card';
            let buttonsHTML = '';
            if (booking.status === 'pending') {
                buttonsHTML = `
                    <div class="booking-actions">
                        <button class="btn-confirm" data-index="${index}">Confirm</button>
                        <button class="btn-cancel" data-index="${index}">Cancel</button>
                    </div>
                `;
            }
            bookingCard.innerHTML = `
                <h3>Booking ID: ${booking.id}</h3>
                <p><strong>Name:</strong> ${booking.userName}</p>
                <p><strong>Phone:</strong> ${booking.userPhone}</p>
                <p><strong>Email:</strong> ${booking.userEmail || 'N/A'}</p>
                <p><strong>Slot:</strong> ${booking.slotNumber}</p>
                <p><strong>Date:</strong> ${booking.date}</p>
                <p><strong>Time:</strong> ${booking.time}</p>
                <p><strong>Duration:</strong> ${booking.duration} hours</p>
                <p><strong>Status:</strong> <span class="status-${booking.status}">${booking.status}</span></p>
                <p><strong>Created:</strong> ${new Date(booking.timestamp).toLocaleString()}</p>
                ${buttonsHTML}
            `;
            preBookingsContainer.appendChild(bookingCard);
        });

        // Add event listeners for confirm and cancel buttons
        document.querySelectorAll('.btn-confirm').forEach(btn => {
            btn.addEventListener('click', function() {
                const index = this.dataset.index;
                updateBookingStatus(index, 'confirmed');
            });
        });

        document.querySelectorAll('.btn-cancel').forEach(btn => {
            btn.addEventListener('click', function() {
                const index = this.dataset.index;
                updateBookingStatus(index, 'cancelled');
            });
        });
    }

    function updateBookingStatus(index, newStatus) {
        const preBookings = JSON.parse(localStorage.getItem('preBookings') || '[]');
        if (preBookings[index]) {
            preBookings[index].status = newStatus;
            localStorage.setItem('preBookings', JSON.stringify(preBookings));
            displayPreBookings(); // Refresh the display
            broadcastChannel.postMessage({
                type: 'pre-bookings-updated',
                data: preBookings
            });
            alert(`Booking ${newStatus} successfully!`);
        }
    }

    updateStats();
});
