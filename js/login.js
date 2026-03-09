// Add listener for log in
document.getElementById("login-form").addEventListener("submit", function(event) {
    event.preventDefault();
    login();
});

async function login() {
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();
    const error = document.getElementById("error");
    error.textContent = "";

    // Prevent empty logins
    if (!username || !password) {
        error.textContent = "Please enter a username and password";
        return;
    }

    try {
        // Load users
        const response = await fetch("data/users.json");
        const data = await response.json();

        // Check user login
        const validUser = data.users.find(user =>
            user.username === username &&
            user.password === password
        );

        // Login response
        if(validUser) {
            // Check whether the user has any interests on record
            if (!validUser.interests || validUser.interests.length === 0) {
                // Switch to interests
                window.location.href = `interests.html?user=${username}`;
            } else {
                // Switch to feed
                window.location.href = `app.html?user=${username}`;
            }
        } else {
            // Deny login
            error.textContent = "Invalid username or password";
        }

    } catch(err) {
        error.textContent = "Failed to login";
        console.error(err);
    }
}
