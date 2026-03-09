async function login() {
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();
    const error = document.getElementById("error");

    error.textContent = "";

    try {
        // Load JSON
        const response = await fetch("users.json");
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
                window.location.href = "interests.html";
            } else {
                // Switch to feed
                window.location.href = "app.html";
            }
        } else {
            // Deny login
            error.textContent = "Invalid username or password";
        }

    } catch(err) {
        error.textContent = "Could not connect to the server";
        console.error(err);
    }
}