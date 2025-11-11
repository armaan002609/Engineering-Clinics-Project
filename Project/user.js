document.addEventListener('DOMContentLoaded', function() {
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    const userRole = localStorage.getItem('userRole');

    if (!isLoggedIn || userRole === 'admin') {
        window.location.href = 'login.html';
        return;
    }

    const broadcastChannel = new BroadcastChannel('parking-slots-updates');

    const hamburgerMenu = document.getElementById('hamburgerMenu');
    const menuOverlay = document.getElementById('menuOverlay');
    const closeMenu = document.getElementById('closeMenu');
    const dashboardLink = document.getElementById('dashboardLink');
    const preBookingLink = document.getElementById('preBookingLink');
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

    });

    preBookingLink.addEventListener('click', function(e) {
        e.preventDefault();
        menuOverlay.classList.remove('active');
        hamburgerMenu.classList.remove('active');
        openPreBookingModal();
    });

    preBookingsLink.addEventListener('click', function(e) {
        e.preventDefault();
        menuOverlay.classList.remove('active');
        hamburgerMenu.classList.remove('active');
        document.getElementById('preBookingsSection').scrollIntoView({ behavior: 'smooth' });
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
    const slotsContainer = document.getElementById('slotsContainer');
    const searchInput = document.getElementById('searchInput');
    const filterSelect = document.getElementById('filterSelect');
    const darkModeToggle = document.getElementById('darkModeToggle');
    const logoutBtn = document.getElementById('logoutBtn');
    const slotDetails = document.getElementById('slotDetails');
    const detailsText = document.getElementById('detailsText');

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

        document.getElementById('totalCount').textContent = totalSlots;
        document.getElementById('availableCount').textContent = availableSlots;
        document.getElementById('occupiedCount').textContent = occupiedSlots;
    }

    function filterSlots() {
        const searchTerm = searchInput.value.toLowerCase();
        const filterValue = filterSelect.value;

        slots.forEach(slot => {
            const slotNumber = slot.dataset.slot;
            const isAvailable = slot.classList.contains('available');
            const isOccupied = slot.classList.contains('occupied');

            const matchesSearch = slotNumber.includes(searchTerm);

            let matchesFilter = true;
            if (filterValue === 'available') {
                matchesFilter = isAvailable;
            } else if (filterValue === 'occupied') {
                matchesFilter = isOccupied;
            }

            if (matchesSearch && matchesFilter) {
                slot.style.display = 'flex';
            } else {
                slot.style.display = 'none';
            }
        });
    }

    searchInput.addEventListener('input', filterSlots);
    filterSelect.addEventListener('change', filterSlots);

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
            slot.dataset.slot = i;
            slot.innerHTML = `
                <div class="slot-number">${i}</div>
                <div class="slot-status">Available</div>
                <button class="book-btn" data-slot="${i}">Book</button>
            `;
            slot.addEventListener('click', function() {
                slots.forEach(s => s.classList.remove('selected'));
                this.classList.add('selected');

                const slotNumber = this.dataset.slot;
                const isAvailable = this.classList.contains('available');
                const status = isAvailable ? 'Available' : 'Occupied';
                const statusColor = status === 'Available' ? '#28a745' : '#dc3545';

                let detailsHTML = `
                    <strong>Slot ${slotNumber}</strong><br>
                    <span style="color: ${statusColor}">Status: ${status}</span><br>
                `;

                if (isAvailable) {
                    detailsHTML += `
                        <button id="bookSlotBtn" style="margin-top: 10px; padding: 8px 16px; background-color: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer;">Book Slot</button>
                    `;
                } else {
                    detailsHTML += `<small>This slot is currently occupied</small>`;
                }

                detailsText.innerHTML = detailsHTML;

                const bookBtn = document.getElementById('bookSlotBtn');
                if (bookBtn) {
                    bookBtn.addEventListener('click', function() {
                        bookSlot(slotNumber);
                    });
                }
            });

            slotsContainer.appendChild(slot);
            slots.push(slot);
        }
        updateStats();
    }

    function bookSlot(slotNumber) {
        const currentStates = JSON.parse(localStorage.getItem('parkingSlots') || '{}');

        currentStates[slotNumber] = 'occupied';

        localStorage.setItem('parkingSlots', JSON.stringify(currentStates));

        const slotElement = document.querySelector(`[data-slot="${slotNumber}"]`);
        if (slotElement) {
            slotElement.classList.remove('available');
            slotElement.classList.add('occupied');
            slotElement.querySelector('.slot-status').textContent = 'Occupied';
            slotElement.querySelector('.book-btn').style.display = 'none';
        }

        updateStats();

        const broadcastChannel = new BroadcastChannel('parking-slots-updates');
        const totalSlots = parseInt(localStorage.getItem('totalSlots') || '10');
        broadcastChannel.postMessage({
            type: 'slots-updated',
            data: {
                totalSlots: totalSlots,
                slotStates: currentStates
            }
        });

        
        detailsText.innerHTML = `
            <strong>Slot ${slotNumber}</strong><br>
            <span style="color: #dc3545">Status: Occupied</span><br>
            <small>Slot booked successfully!</small>
        `;

       
        alert(`Slot ${slotNumber} has been booked successfully!`);
    }

    
    const savedData = loadSlotStates();
    if (savedData.states) {
        createSlots(savedData.total);
        
        for (const [slotNumber, status] of Object.entries(savedData.states)) {
            const slotElement = document.querySelector(`[data-slot="${slotNumber}"]`);
            if (slotElement) {
                if (status === 'occupied') {
                    slotElement.classList.remove('available');
                    slotElement.classList.add('occupied');
                    slotElement.querySelector('.slot-status').textContent = 'Occupied';
                    slotElement.querySelector('.book-btn').style.display = 'none';
                }
            }
        }
    } else {
       
        createSlots(10);
    }

    broadcastChannel.onmessage = function(event) {
        if (event.data.type === 'slots-updated') {
            const { totalSlots, slotStates } = event.data.data;
            updateSlotsFromBroadcast(totalSlots, slotStates);
        } else if (event.data.type === 'pre-bookings-updated') {
            displayUserPreBookings();
        }
    };

    function updateSlotsFromBroadcast(totalSlots, slotStates) {
        slotsContainer.innerHTML = '';
        slots = [];

    
        for (let i = 1; i <= totalSlots; i++) {
            const slot = document.createElement('div');
            slot.className = 'slot';
            slot.id = `slot${i}`;
            slot.dataset.slot = i;
            slot.innerHTML = `
                <div class="slot-number">${i}</div>
                <div class="slot-status">${slotStates[i] === 'occupied' ? 'Occupied' : 'Available'}</div>
                ${slotStates[i] === 'occupied' ? '' : '<button class="book-btn" data-slot="' + i + '">Book</button>'}
            `;

            if (slotStates[i] === 'occupied') {
                slot.classList.add('occupied');
            } else {
                slot.classList.add('available');
            }

            slot.addEventListener('click', function() {
                slots.forEach(s => s.classList.remove('selected'));
                this.classList.add('selected');

                const slotNumber = this.dataset.slot;
                const isAvailable = this.classList.contains('available');
                const status = isAvailable ? 'Available' : 'Occupied';
                const statusColor = status === 'Available' ? '#28a745' : '#dc3545';

                let detailsHTML = `
                    <strong>Slot ${slotNumber}</strong><br>
                    <span style="color: ${statusColor}">Status: ${status}</span><br>
                `;

                if (isAvailable) {
                    detailsHTML += `
                        <button id="bookSlotBtn" style="margin-top: 10px; padding: 8px 16px; background-color: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer;">Book Slot</button>
                    `;
                } else {
                    detailsHTML += `<small>This slot is currently occupied</small>`;
                }

                detailsText.innerHTML = detailsHTML;

               
                const bookBtn = document.getElementById('bookSlotBtn');
                if (bookBtn) {
                    bookBtn.addEventListener('click', function() {
                        bookSlot(slotNumber);
                    });
                }
            });

            slotsContainer.appendChild(slot);
            slots.push(slot);
        }

        updateStats();

        document.querySelectorAll('.book-btn').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                const slotNumber = this.dataset.slot;
                bookSlot(slotNumber);
            });
        });
    }

    // Pre-Booking Modal Functions
    function openPreBookingModal() {
        const modal = document.getElementById('preBookingModal');
        const bookingSlot = document.getElementById('bookingSlot');

        // Populate available slots
        bookingSlot.innerHTML = '<option value="">Choose a slot...</option>';
        const currentStates = JSON.parse(localStorage.getItem('parkingSlots') || '{}');
        const totalSlots = parseInt(localStorage.getItem('totalSlots') || '10');

        for (let i = 1; i <= totalSlots; i++) {
            if (currentStates[i] !== 'occupied') {
                const option = document.createElement('option');
                option.value = i;
                option.textContent = `Slot ${i}`;
                bookingSlot.appendChild(option);
            }
        }

        modal.style.display = 'block';
    }

    function closePreBookingModal() {
        const modal = document.getElementById('preBookingModal');
        modal.style.display = 'none';
    }

    // Event listeners for modal
    document.getElementById('closePreBookingModal').addEventListener('click', closePreBookingModal);
    document.getElementById('cancelBooking').addEventListener('click', closePreBookingModal);

    document.getElementById('confirmBooking').addEventListener('click', function() {
        const bookingSlot = document.getElementById('bookingSlot').value;
        const bookingDate = document.getElementById('bookingDate').value;
        const bookingTime = document.getElementById('bookingTime').value;
        const duration = document.getElementById('duration').value;
        const userName = document.getElementById('userName').value;
        const userPhone = document.getElementById('userPhone').value;
        const userEmail = document.getElementById('userEmail').value;

        if (!bookingSlot || !bookingDate || !bookingTime || !userName || !userPhone) {
            alert('Please fill in all required fields.');
            return;
        }

        // Create booking object
        const booking = {
            id: Date.now().toString(),
            slotNumber: bookingSlot,
            date: bookingDate,
            time: bookingTime,
            duration: duration,
            userName: userName,
            userPhone: userPhone,
            userEmail: userEmail,
            timestamp: new Date().toISOString(),
            status: 'pending'
        };

        // Save booking to localStorage
        const existingBookings = JSON.parse(localStorage.getItem('preBookings') || '[]');
        existingBookings.push(booking);
        localStorage.setItem('preBookings', JSON.stringify(existingBookings));

        alert(`Pre-booking confirmed for Slot ${bookingSlot} on ${bookingDate} at ${bookingTime} for ${duration} hours.`);

        closePreBookingModal();

        // Clear form
        document.getElementById('bookingSlot').value = '';
        document.getElementById('bookingDate').value = '';
        document.getElementById('bookingTime').value = '';
        document.getElementById('duration').value = '1';
        document.getElementById('userName').value = '';
        document.getElementById('userPhone').value = '';
        document.getElementById('userEmail').value = '';

        // Refresh pre-bookings display
        displayUserPreBookings();
    });

    // Close modal when clicking outside
    window.addEventListener('click', function(event) {
        const modal = document.getElementById('preBookingModal');
        if (event.target === modal) {
            closePreBookingModal();
        }
    });

    // Display user's pre-bookings
    function displayUserPreBookings() {
        const preBookingsContainer = document.getElementById('preBookingsContainer');
        const preBookings = JSON.parse(localStorage.getItem('preBookings') || '[]');

        // Get current user's info (assuming stored in localStorage or from form)
        // For simplicity, we'll show all bookings, but in a real app you'd filter by user
        const userBookings = preBookings.filter(booking => booking.id !== undefined && booking.id !== null); // Filter out bookings with undefined or null IDs

        if (userBookings.length === 0) {
            preBookingsContainer.innerHTML = '<p>No pre-bookings found.</p>';
            return;
        }

        preBookingsContainer.innerHTML = '';
        userBookings.forEach((booking) => {
            const bookingCard = document.createElement('div');
            bookingCard.className = 'booking-card';
            bookingCard.innerHTML = `
                <h3>Booking ID: ${booking.id}</h3>
                <p><strong>Slot:</strong> ${booking.slotNumber}</p>
                <p><strong>Date:</strong> ${booking.date}</p>
                <p><strong>Time:</strong> ${booking.time}</p>
                <p><strong>Duration:</strong> ${booking.duration} hours</p>
                <p><strong>Status:</strong> <span class="status-${booking.status}">${booking.status}</span></p>
                <p><strong>Created:</strong> ${new Date(booking.timestamp).toLocaleString()}</p>
                <div class="booking-actions">
                    <button class="view-details-btn" data-booking-id="${booking.id}">View Details</button>
                    <button class="cancel-booking-btn" data-booking-id="${booking.id}">Cancel Booking</button>
                </div>
                <div class="booking-details" id="details-${booking.id}" style="display: none;">
                    <p><strong>Name:</strong> ${booking.userName}</p>
                    <p><strong>Phone:</strong> ${booking.userPhone}</p>
                    <p><strong>Email:</strong> ${booking.userEmail || 'N/A'}</p>
                </div>
            `;
            preBookingsContainer.appendChild(bookingCard);
        });

        // Add event listeners for view details buttons
        document.querySelectorAll('.view-details-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const bookingId = this.dataset.bookingId;
                const detailsDiv = document.getElementById(`details-${bookingId}`);
                if (detailsDiv.style.display === 'none') {
                    detailsDiv.style.display = 'block';
                    this.textContent = 'Hide Details';
                } else {
                    detailsDiv.style.display = 'none';
                    this.textContent = 'View Details';
                }
            });
        });

        // Add event listeners for cancel booking buttons
        document.querySelectorAll('.cancel-booking-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const bookingId = this.dataset.bookingId;
                if (confirm('Are you sure you want to cancel this pre-booking?')) {
                    cancelPreBooking(bookingId);
                }
            });
        });
    }

    // Function to cancel a pre-booking
    function cancelPreBooking(bookingId) {
        const existingBookings = JSON.parse(localStorage.getItem('preBookings') || '[]');
        const updatedBookings = existingBookings.filter(booking => booking.id !== bookingId);
        localStorage.setItem('preBookings', JSON.stringify(updatedBookings));
        alert('Pre-booking cancelled successfully.');
        displayUserPreBookings();
    }

    // Call displayUserPreBookings on page load
    displayUserPreBookings();

    // Update pre-bookings display after making a new booking is handled in the confirmBooking event listener above

});
