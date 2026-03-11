// Card elements
const loginCard = document.getElementById("login-card");
const signupCard = document.getElementById("signup-card");

// Forms
const loginForm = document.getElementById("login-form");
const signupForm = document.getElementById("signup-form");

// Buttons
const loginButton = document.getElementById("login-button");
const signupButton = document.getElementById("signup-button");
const signupSubmitButton = document.getElementById("signup-submit-button");
const backButton = document.getElementById("back-button");

// Errors
const loginError = document.getElementById("login-error");
const signupError = document.getElementById("signup-error");

// Inputs
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const signupUsername = document.getElementById("signup-username");
const signupEmail = document.getElementById("signup-email");
const signupPassword = document.getElementById("signup-password");

const API = "https://campus-pulse-worker.vindictivity.workers.dev/api"

// Clear errors when the user types
document.querySelectorAll("input").forEach(input => {
    input.addEventListener("input", () => {
        loginError.textContent = "";
        signupError.textContent = "";
    });
});

// Card switching
signupButton.addEventListener("click", () => {
    loginError.textContent = "";
    signupError.textContent = "";
    loginCard.classList.remove("active");
    signupCard.classList.add("active");
});

backButton.addEventListener("click", () => {
    loginError.textContent = "";
    signupError.textContent = "";
    signupCard.classList.remove("active");
    loginCard.classList.add("active");
});

// Check session
document.addEventListener("DOMContentLoaded", checkSession);

async function checkSession() {
    const token = localStorage.getItem("sessionToken");

    if (!token || token === "undefined") return;

    try {
        const endpoint = `${API}/user`
        const response = await fetch(endpoint, {
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (!response.ok) {
            localStorage.removeItem("sessionToken");
            return;
        }

        // If the token is valid, skip login
        window.location.assign("app.html");
    } catch (err) {
        console.error("Session validation failed:", err);
    }
}

// Login
loginForm.addEventListener("submit", login);

async function login(event) {
    event.preventDefault();

    // Disable login button to prevent spam
    loginButton.disabled = true;
    loginError.textContent = "";

    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();

    // Prevent empty logins
    if (!username || !password) {
        loginError.textContent = "Please enter a username and password";
        loginButton.disabled = false;
        return;
    }

    try {
        // Fetch users
        const endpoint = `${API}/login`
        const response = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                username,
                password
            })
        });

        // Return response
        let result = {};
        try { result = await response.json(); } catch(err) {}

        // Failed to fetch users
        if (!response.ok) {
            loginError.textContent = result.error || "Login failed";
            loginButton.disabled = false;
            return;
        }

        // Store session token
        localStorage.setItem("sessionToken", result.token);

        // Switch to feed
        window.location.assign("app.html");
    } catch(err) {
        loginError.textContent = "Failed to login";
        loginButton.disabled = false;
        console.error(err);
    }
}

// Switch to signup
signupForm.addEventListener("submit", signup);

async function signup(event) {
    event.preventDefault();

    // Disable signup button to prevent spam
    signupSubmitButton.disabled = true;
    signupError.textContent = "";

    const username = signupUsername.value.trim();
    const email = signupEmail.value.trim();
    const password = signupPassword.value.trim();

    // Prevent empty signups
    if (!username || !email || !password) {
        signupError.textContent = "Please fill out all fields";
        signupSubmitButton.disabled = false;
        return;
    }

    try {
        // Cloudflare Worker response
        const endpoint = `${API}/signup`
        const response = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, email, password })
        });

        // Return response
        let result = {};
        try { result = await response.json(); } catch(err) {}

        // Cloudflare Worker error
        if (!response.ok) {
            signupError.textContent = result.error || "Signup failed";
            signupSubmitButton.disabled = false;
            return;
        }

        // Store session token
        localStorage.setItem("sessionToken", result.token);

        // Switch to interests
        window.location.assign("interests.html");
    } catch(err) {
        signupError.textContent = "Failed to create account";
        signupSubmitButton.disabled = false;
        console.error(err);
    }
}