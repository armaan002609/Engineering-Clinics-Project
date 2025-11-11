// ParkTem PWA - Combined JavaScript for all functionality

// Global variables
let currentView = 'login';
let selectedSlot = null;
let slots = [];
let preBookings = [];

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    // Hide splash screen after a short delay
    setTimeout(() => {
        const splash = document.getElementById('splash-screen');
        if (splash) {
            splash.classList.add('fade-out');
            setTimeout(() => {
                splash.style.display = 'none';
                initializeApp();
                registerServiceWorker();
                showView('login');
            }, 1000);
        } else {
            initializeApp();
            registerServiceWorker();
            showView('login');
        }
    }, 1500);
});

function initializeApp() {
    // Load saved data
    loadSlots();
    loadPreBookings();
    loadTheme();

    // Setup event listeners
    setupLoginEvents();
    setupUserEvents();
    setupAdminEvents();
    setupNavigation();
    setupQrScanner();
}

function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('Service Worker registered successfully');
            })
            .catch(error => {
                console.log('Service Worker registration failed:', error);
            });
    }
}

// View Management
function showView(viewName) {
    // Hide all views
    document.querySelectorAll('.view').forEach(view => {
        view.style.display = 'none';
    });

    // Show selected view
    const view = document.getElementById(viewName + 'View');
    if (view) {
        view.style.display = 'block';
        currentView = viewName;
        updateNavigation();
    }

    // Update URL without page reload
    history.pushState({view: viewName}, '', '#' + viewName);

    // Dispatch viewChanged event to trigger rendering
    document.dispatchEvent(new CustomEvent('viewChanged', { detail: { view: viewName } }));
}

function updateNavigation() {
    // Update active menu items
    document.querySelectorAll('.menu-item').forEach(item => {
        item.classList.remove('active');
    });

    const activeLink = document.querySelector(`[data-view="${currentView}"]`);
    if (activeLink) {
        activeLink.classList.add('active');
    }
}

// Data Management
function loadSlots() {
    const savedSlots = localStorage.getItem('parkingSlots');
    if (savedSlots) {
        slots = JSON.parse(savedSlots);
    } else {
        // Initialize with 10 slots
        for (let i = 1; i <= 10; i++) {
            slots.push({
                id: i,
                slotNumber: i,
                isOccupied: false
            });
        }
        saveSlots();
    }
}

function saveSlots() {
    localStorage.setItem('parkingSlots', JSON.stringify(slots));
}

function loadPreBookings() {
    const savedBookings = localStorage.getItem('preBookings');
    if (savedBookings) {
        preBookings = JSON.parse(savedBookings);
    }
}

function savePreBookings() {
    localStorage.setItem('preBookings', JSON.stringify(preBookings));
}

function loadTheme() {
    const savedTheme = localStorage.getItem('darkMode');
    if (savedTheme === 'true') {
        document.body.classList.add('dark-mode');
        const toggle = document.getElementById('darkModeToggle');
        if (toggle) toggle.checked = true;
        updateThemeLabel();
    }
}

// Login Functionality
function setupLoginEvents() {
    const loginForm = document.getElementById('loginForm');
    const skipBtn = document.getElementById('skipBtn');

    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    if (skipBtn) {
        skipBtn.addEventListener('click', () => {
            localStorage.setItem('userRole', 'user');
            localStorage.setItem('isLoggedIn', 'true');
            showView('user');
        });
    }

    // Check if already logged in
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    const userRole = localStorage.getItem('userRole');
    if (isLoggedIn === 'true') {
        if (userRole === 'admin') {
            showView('admin');
        } else {
            showView('user');
        }
    }
}

function handleLogin(e) {
    e.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const role = document.getElementById('role').value;
    const errorMessage = document.getElementById('errorMessage');

    const users = {
        admin: { username: 'admin', password: 'admin123', role: 'admin' },
        user: { username: 'user', password: 'user123', role: 'user' }
    };

    let authenticated = false;
    let userRole = '';

    for (const key in users) {
        if (users[key].username === username && users[key].password === password && users[key].role === role) {
            authenticated = true;
            userRole = users[key].role;
            break;
        }
    }

    if (authenticated) {
        localStorage.setItem('userRole', userRole);
        localStorage.setItem('isLoggedIn', 'true');
        errorMessage.style.display = 'none';

        if (userRole === 'admin') {
            showView('admin');
        } else {
            showView('user');
        }
    } else {
        errorMessage.style.display = 'block';
    }
}

// User Dashboard Functionality
function setupUserEvents() {
    // Hamburger menu
    const hamburgerMenu = document.getElementById('hamburgerMenu');
    const menuOverlay = document.getElementById('menuOverlay');
    const closeMenu = document.getElementById('closeMenu');

    if (hamburgerMenu) {
        hamburgerMenu.addEventListener('click', () => {
            menuOverlay.classList.toggle('active');
            hamburgerMenu.classList.toggle('active');
        });
    }

    if (closeMenu) {
        closeMenu.addEventListener('click', () => {
            menuOverlay.classList.remove('active');
            hamburgerMenu.classList.remove('active');
        });
    }

    if (menuOverlay) {
        menuOverlay.addEventListener('click', (e) => {
            if (e.target === menuOverlay) {
                menuOverlay.classList.remove('active');
                hamburgerMenu.classList.remove('active');
            }
        });
    }

    // Menu navigation
    document.querySelectorAll('.menu-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const view = e.target.closest('.menu-item').dataset.view;
            if (view) {
                showView(view);
                menuOverlay.classList.remove('active');
                hamburgerMenu.classList.remove('active');
            }
        });
    });

    // Menu back button
    const menuBackBtn = document.getElementById('menuBackBtn');
    if (menuBackBtn) {
        menuBackBtn.addEventListener('click', () => {
            showView('user');
            menuOverlay.classList.remove('active');
            hamburgerMenu.classList.remove('active');
        });
    }

    // Search and filter
    const searchInput = document.getElementById('searchInput');
    const filterSelect = document.getElementById('filterSelect');

    if (searchInput) {
        searchInput.addEventListener('input', renderUserSlots);
    }

    if (filterSelect) {
        filterSelect.addEventListener('change', renderUserSlots);
    }

    // Pre-booking modal
    const preBookingModal = document.getElementById('preBookingModal');
    const closePreBookingModal = document.getElementById('closePreBookingModal');
    const confirmBooking = document.getElementById('confirmBooking');
    const cancelBooking = document.getElementById('cancelBooking');

    if (closePreBookingModal) {
        closePreBookingModal.addEventListener('click', () => {
            preBookingModal.style.display = 'none';
        });
    }

    if (cancelBooking) {
        cancelBooking.addEventListener('click', () => {
            preBookingModal.style.display = 'none';
        });
    }

    if (confirmBooking) {
        confirmBooking.addEventListener('click', handlePreBooking);
    }

    // Theme toggle
    const darkModeToggle = document.getElementById('darkModeToggle');
    if (darkModeToggle) {
        darkModeToggle.addEventListener('change', toggleTheme);
    }
}

function renderUserSlots() {
    const slotsContainer = document.getElementById('slotsContainer');
    const searchInput = document.getElementById('searchInput');
    const filterSelect = document.getElementById('filterSelect');

    if (!slotsContainer) return;

    const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
    const filter = filterSelect ? filterSelect.value : 'all';

    slotsContainer.innerHTML = '';

    slots.forEach(slot => {
        if (searchTerm && !slot.slotNumber.toString().includes(searchTerm)) return;

        if (filter === 'available' && slot.isOccupied) return;
        if (filter === 'occupied' && !slot.isOccupied) return;

        const slotDiv = document.createElement('div');
        slotDiv.className = `slot ${slot.isOccupied ? 'occupied' : 'available'}`;
        slotDiv.textContent = `Slot ${slot.slotNumber}`;
        slotDiv.dataset.slotId = slot.id;

        slotDiv.addEventListener('click', () => selectSlot(slot.id));

        slotsContainer.appendChild(slotDiv);
    });

    updateUserStats();
}

function selectSlot(slotId) {
    selectedSlot = slotId;

    document.querySelectorAll('.slot').forEach(slot => {
        slot.classList.remove('selected');
    });

    const slotElement = document.querySelector(`[data-slot-id="${slotId}"]`);
    if (slotElement) {
        slotElement.classList.add('selected');
    }

    updateSlotDetails();
}

function updateSlotDetails() {
    const detailsText = document.getElementById('detailsText');
    if (!detailsText) return;

    if (selectedSlot) {
        const slot = slots.find(s => s.id === selectedSlot);
        if (slot) {
            detailsText.textContent = `Slot ${slot.slotNumber} is ${slot.isOccupied ? 'occupied' : 'available'}.`;
        }
    } else {
        detailsText.textContent = 'Click on a slot to view details';
    }
}

function updateUserStats() {
    const availableCount = document.getElementById('availableCount');
    const occupiedCount = document.getElementById('occupiedCount');
    const totalCount = document.getElementById('totalCount');

    const available = slots.filter(s => !s.isOccupied).length;
    const occupied = slots.filter(s => s.isOccupied).length;

    if (availableCount) availableCount.textContent = available;
    if (occupiedCount) occupiedCount.textContent = occupied;
    if (totalCount) totalCount.textContent = slots.length;
}

function openPreBookingModal() {
    const modal = document.getElementById('preBookingModal');
    const bookingSlot = document.getElementById('bookingSlot');

    if (modal) modal.style.display = 'block';

    // Populate available slots
    if (bookingSlot) {
        bookingSlot.innerHTML = '<option value="">Choose a slot...</option>';
        slots.filter(s => !s.isOccupied).forEach(slot => {
            const option = document.createElement('option');
            option.value = slot.id;
            option.textContent = `Slot ${slot.slotNumber}`;
            bookingSlot.appendChild(option);
        });
    }
}

function handlePreBooking() {
    const bookingSlot = document.getElementById('bookingSlot').value;
    const bookingDate = document.getElementById('bookingDate').value;
    const bookingTime = document.getElementById('bookingTime').value;
    const duration = document.getElementById('duration').value;
    const userName = document.getElementById('userName').value;
    const userPhone = document.getElementById('userPhone').value;
    const userEmail = document.getElementById('userEmail').value;

    if (!bookingSlot || !bookingDate || !bookingTime || !duration || !userName || !userPhone) {
        alert('Please fill in all required fields.');
        return;
    }

    const booking = {
        id: Date.now(),
        slotNumber: parseInt(bookingSlot),
        date: bookingDate,
        time: bookingTime,
        duration: parseInt(duration),
        userName,
        userPhone,
        userEmail: userEmail || '',
        status: 'pending',
        timestamp: new Date().toISOString()
    };

    preBookings.push(booking);
    savePreBookings();

    document.getElementById('preBookingModal').style.display = 'none';
    alert('Pre-booking submitted successfully!');

    // Clear form
    document.getElementById('loginForm').reset();
}

// Admin Dashboard Functionality
function setupAdminEvents() {
    // Hamburger menu for admin
    const hamburgerMenu = document.getElementById('adminHamburgerMenu');
    const menuOverlay = document.getElementById('adminMenuOverlay');
    const closeMenu = document.getElementById('adminCloseMenu');

    if (hamburgerMenu) {
        hamburgerMenu.addEventListener('click', () => {
            menuOverlay.classList.toggle('active');
            hamburgerMenu.classList.toggle('active');
        });
    }

    if (closeMenu) {
        closeMenu.addEventListener('click', () => {
            menuOverlay.classList.remove('active');
            hamburgerMenu.classList.remove('active');
        });
    }

    if (menuOverlay) {
        menuOverlay.addEventListener('click', (e) => {
            if (e.target === menuOverlay) {
                menuOverlay.classList.remove('active');
                hamburgerMenu.classList.remove('active');
            }
        });
    }

    // Admin menu navigation
    document.querySelectorAll('.admin-menu-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const view = e.target.closest('.admin-menu-item').dataset.view;
            if (view) {
                showView(view);
                menuOverlay.classList.remove('active');
                hamburgerMenu.classList.remove('active');
            }
        });
    });

    // Bulk operations
    const bookAllBtn = document.getElementById('bookAllBtn');
    const freeAllBtn = document.getElementById('freeAllBtn');
    const resetAllBtn = document.getElementById('resetAllBtn');

    if (bookAllBtn) {
        bookAllBtn.addEventListener('click', () => {
            slots.forEach(slot => slot.isOccupied = true);
            saveSlots();
            renderAdminSlots();
            updateAdminStats();
        });
    }

    if (freeAllBtn) {
        freeAllBtn.addEventListener('click', () => {
            slots.forEach(slot => slot.isOccupied = false);
            saveSlots();
            renderAdminSlots();
            updateAdminStats();
        });
    }

    if (resetAllBtn) {
        resetAllBtn.addEventListener('click', () => {
            slots.forEach(slot => slot.isOccupied = false);
            saveSlots();
            renderAdminSlots();
            updateAdminStats();
        });
    }

    // Add slots
    const addSlotsBtn = document.getElementById('addSlotsBtn');
    if (addSlotsBtn) {
        addSlotsBtn.addEventListener('click', () => {
            const slotCount = parseInt(document.getElementById('slotCount').value);
            if (slotCount > 0) {
                const currentCount = slots.length;
                for (let i = currentCount + 1; i <= currentCount + slotCount; i++) {
                    slots.push({
                        id: i,
                        slotNumber: i,
                        isOccupied: false
                    });
                }
                saveSlots();
                renderAdminSlots();
                updateAdminStats();
            }
        });
    }

    // Sort
    const sortSelect = document.getElementById('sortSelect');
    if (sortSelect) {
        sortSelect.addEventListener('change', renderAdminSlots);
    }

    // Individual slot controls
    const bookBtn = document.getElementById('bookBtn');
    const freeBtn = document.getElementById('freeBtn');

    if (bookBtn) {
        bookBtn.addEventListener('click', () => {
            if (selectedSlot) {
                const slot = slots.find(s => s.id === selectedSlot);
                if (slot && !slot.isOccupied) {
                    slot.isOccupied = true;
                    saveSlots();
                    renderAdminSlots();
                    updateAdminStats();
                    selectedSlot = null;
                }
            }
        });
    }

    if (freeBtn) {
        freeBtn.addEventListener('click', () => {
            if (selectedSlot) {
                const slot = slots.find(s => s.id === selectedSlot);
                if (slot && slot.isOccupied) {
                    slot.isOccupied = false;
                    saveSlots();
                    renderAdminSlots();
                    updateAdminStats();
                    selectedSlot = null;
                }
            }
        });
    }

    // Theme toggle for admin
    const darkModeToggle = document.getElementById('adminDarkModeToggle');
    if (darkModeToggle) {
        darkModeToggle.addEventListener('change', toggleTheme);
    }
}

function renderAdminSlots() {
    const slotsContainer = document.getElementById('adminSlotsContainer');
    const sortSelect = document.getElementById('sortSelect');

    if (!slotsContainer) return;

    let sortedSlots = [...slots];
    const sortBy = sortSelect ? sortSelect.value : 'default';

    if (sortBy === 'available') {
        sortedSlots.sort((a, b) => a.isOccupied - b.isOccupied);
    } else if (sortBy === 'occupied') {
        sortedSlots.sort((a, b) => b.isOccupied - a.isOccupied);
    }

    slotsContainer.innerHTML = '';

    sortedSlots.forEach(slot => {
        const slotDiv = document.createElement('div');
        slotDiv.className = `slot ${slot.isOccupied ? 'occupied' : 'available'}`;
        slotDiv.textContent = `Slot ${slot.slotNumber}`;
        slotDiv.dataset.slotId = slot.id;

        slotDiv.addEventListener('click', () => {
            selectedSlot = slot.id;
            document.querySelectorAll('#adminSlotsContainer .slot').forEach(s => s.classList.remove('selected'));
            slotDiv.classList.add('selected');
        });

        slotsContainer.appendChild(slotDiv);
    });
}

function updateAdminStats() {
    const totalSlots = document.getElementById('totalSlots');
    const availableSlots = document.getElementById('availableSlots');
    const occupiedSlots = document.getElementById('occupiedSlots');
    const occupancyRate = document.getElementById('occupancyRate');

    const total = slots.length;
    const available = slots.filter(s => !s.isOccupied).length;
    const occupied = total - available;
    const rate = total > 0 ? Math.round((occupied / total) * 100) : 0;

    if (totalSlots) totalSlots.textContent = total;
    if (availableSlots) availableSlots.textContent = available;
    if (occupiedSlots) occupiedSlots.textContent = occupied;
    if (occupancyRate) occupancyRate.textContent = `${rate}%`;
}

// Navigation Setup
function setupNavigation() {
    // Handle browser back/forward buttons
    window.addEventListener('popstate', (event) => {
        if (event.state && event.state.view) {
            showView(event.state.view);
        }
    });

    // Logout functionality
    document.querySelectorAll('[data-action="logout"]').forEach(btn => {
        btn.addEventListener('click', () => {
            localStorage.removeItem('isLoggedIn');
            localStorage.removeItem('userRole');
            showView('login');
        });
    });

    // Back button functionality
    document.querySelectorAll('.back-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const view = e.target.dataset.view;
            if (view) {
                showView(view);
            }
        });
    });
}

// QR Scanner Functionality
let scanner = null;

function setupQrScanner() {
    const scanBtn = document.getElementById('scanBtn');
    const adminScanBtn = document.getElementById('adminScanBtn');
    const qrScannerModal = document.getElementById('qrScannerModal');
    const closeQrScannerModal = document.getElementById('closeQrScannerModal');
    const qrVideo = document.getElementById('qrVideo');
    const qrResult = document.getElementById('qrResult');

    if (scanBtn) {
        scanBtn.addEventListener('click', () => {
            qrScannerModal.style.display = 'block';
            startScanner('user');
        });
    }

    if (adminScanBtn) {
        adminScanBtn.addEventListener('click', () => {
            qrScannerModal.style.display = 'block';
            startScanner('admin');
        });
    }

    if (closeQrScannerModal) {
        closeQrScannerModal.addEventListener('click', () => {
            qrScannerModal.style.display = 'none';
            stopScanner();
        });
    }

    function startScanner(view) {
        scanner = new Instascan.Scanner({ video: qrVideo });
        scanner.addListener('scan', function (content) {
            qrResult.textContent = 'Scanned: ' + content;
            // Process the scanned QR code content
            processQrCode(content, view);
            stopScanner();
            setTimeout(() => {
                qrScannerModal.style.display = 'none';
            }, 2000);
        });

        Instascan.Camera.getCameras().then(function (cameras) {
            if (cameras.length > 0) {
                // Try to use the back camera first (usually cameras[1] or cameras[0])
                const backCamera = cameras.find(camera => camera.name.toLowerCase().includes('back')) ||
                                  cameras.find(camera => camera.name.toLowerCase().includes('rear')) ||
                                  cameras[cameras.length - 1]; // Usually the last camera is the back one
                scanner.start(backCamera);
            } else {
                qrResult.textContent = 'No cameras found.';
            }
        }).catch(function (e) {
            qrResult.textContent = 'Camera access denied or not available.';
            console.error(e);
        });
    }

    function stopScanner() {
        if (scanner) {
            scanner.stop();
            scanner = null;
        }
    }

    function processQrCode(content, view) {
        // Parse QR code content (assuming it contains slot information)
        try {
            const data = JSON.parse(content);
            if (data.slotNumber) {
                // Find and select the slot
                const slot = slots.find(s => s.slotNumber == data.slotNumber);
                if (slot) {
                    selectedSlot = slot.id;
                    if (view === 'user') {
                        showView('user');
                        renderUserSlots();
                        selectSlot(slot.id);
                        alert(`Slot ${slot.slotNumber} selected via QR scan!`);
                    } else if (view === 'admin') {
                        showView('admin');
                        renderAdminSlots();
                        // Select the slot in admin view
                        document.querySelectorAll('#adminSlotsContainer .slot').forEach(s => s.classList.remove('selected'));
                        const adminSlotElement = document.querySelector(`#adminSlotsContainer [data-slot-id="${slot.id}"]`);
                        if (adminSlotElement) {
                            adminSlotElement.classList.add('selected');
                        }
                        alert(`Slot ${slot.slotNumber} selected for admin management via QR scan!`);
                    }
                } else {
                    alert('Invalid slot number in QR code.');
                }
            } else {
                alert('Invalid QR code format.');
            }
        } catch (e) {
            alert('Unable to parse QR code content.');
        }
    }
}

// Theme Management
function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    const isDarkMode = document.body.classList.contains('dark-mode');
    localStorage.setItem('darkMode', isDarkMode);
    updateThemeLabel();
}

function updateThemeLabel() {
    const labels = document.querySelectorAll('#themeLabel, #adminThemeLabel');
    const isDarkMode = document.body.classList.contains('dark-mode');
    labels.forEach(label => {
        if (label) label.textContent = isDarkMode ? 'Dark Mode' : 'Light Mode';
    });
}

// Initialize views when shown
document.addEventListener('viewChanged', (e) => {
    if (e.detail.view === 'user') {
        renderUserSlots();
        renderUserPreBookings();
    } else if (e.detail.view === 'admin') {
        renderAdminSlots();
        updateAdminStats();
        renderAdminPreBookings();
    } else if (e.detail.view === 'userPreBookings') {
        renderUserPreBookings();
    } else if (e.detail.view === 'adminPreBookings') {
        renderAdminPreBookings();
    } else if (e.detail.view === 'settings') {
        // Settings view specific initialization
    } else if (e.detail.view === 'adminSettings') {
        // Admin settings view specific initialization
    }
});

function renderUserPreBookings() {
    const container = document.getElementById('preBookingsContainer');
    if (!container) return;

    container.innerHTML = '';

    preBookings.forEach(booking => {
        const card = document.createElement('div');
        card.className = 'booking-card';
        card.innerHTML = `
            <h3>Booking ID: ${booking.id}</h3>
            <p><strong>Name:</strong> ${booking.userName}</p>
            <p><strong>Phone:</strong> ${booking.userPhone}</p>
            <p><strong>Email:</strong> ${booking.userEmail || 'N/A'}</p>
            <p><strong>Slot:</strong> ${booking.slotNumber}</p>
            <p><strong>Date:</strong> ${booking.date}</p>
            <p><strong>Time:</strong> ${booking.time}</p>
            <p><strong>Duration:</strong> ${booking.duration} hours</p>
            <p><strong>Status:</strong> <span class="status-${booking.status}">${booking.status}</span></p>
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
        container.appendChild(card);
    });

    // Add event listeners
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

    document.querySelectorAll('.cancel-booking-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const bookingId = parseInt(this.dataset.bookingId);
            if (confirm('Are you sure you want to cancel this pre-booking?')) {
                preBookings = preBookings.filter(b => b.id !== bookingId);
                savePreBookings();
                renderUserPreBookings();
                alert('Pre-booking cancelled successfully.');
            }
        });
    });
}

function renderAdminPreBookings() {
    const container = document.getElementById('adminPreBookingsContainer');
    if (!container) return;

    container.innerHTML = '';

    preBookings.forEach((booking, index) => {
        const card = document.createElement('div');
        card.className = 'booking-card';
        let buttonsHTML = '';
        if (booking.status === 'pending') {
            buttonsHTML = `
                <div class="booking-actions">
                    <button class="btn-confirm" data-index="${index}">Confirm</button>
                    <button class="btn-cancel" data-index="${index}">Cancel</button>
                </div>
            `;
        }
        card.innerHTML = `
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
        container.appendChild(card);
    });

    // Add event listeners for confirm and cancel buttons
    document.querySelectorAll('.btn-confirm').forEach(btn => {
        btn.addEventListener('click', function() {
            const index = parseInt(this.dataset.index);
            preBookings[index].status = 'confirmed';
            savePreBookings();
            renderAdminPreBookings();
            alert('Booking confirmed successfully!');
        });
    });

    document.querySelectorAll('.btn-cancel').forEach(btn => {
        btn.addEventListener('click', function() {
            const index = parseInt(this.dataset.index);
            preBookings[index].status = 'cancelled';
            savePreBookings();
            renderAdminPreBookings();
            alert('Booking cancelled successfully!');
        });
    });
}
