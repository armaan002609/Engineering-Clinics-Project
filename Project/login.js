document.addEventListener('DOMContentLoaded', function() {
    const splashScreen = document.getElementById('splash-screen');
    const loginForm = document.getElementById('loginForm');
    const errorMessage = document.getElementById('errorMessage');

    setTimeout(function() {
        splashScreen.classList.add('fade-out');
        setTimeout(function() {
            splashScreen.style.display = 'none';
        }, 1000);
    }, 3000);


    const users = {
        admin: { username: 'admin', password: 'admin123', role: 'admin' },
        user: { username: 'user', password: 'user123', role: 'user' }
    };

    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();

        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const role = document.getElementById('role').value;

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

            if (userRole === 'admin') {
                window.location.href = 'admin.html';
            } else {
                window.location.href = 'user.html';
            }
        } else {
            errorMessage.style.display = 'block';
        }
    });

    const skipBtn = document.getElementById('skipBtn');
    skipBtn.addEventListener('click', function() {
        localStorage.setItem('userRole', 'user');
        localStorage.setItem('isLoggedIn', 'true');
        window.location.href = 'user.html';
    });

    const savedDarkMode = localStorage.getItem('darkMode');
    if (savedDarkMode === 'true') {
        document.body.classList.add('dark-mode');
    }
});
