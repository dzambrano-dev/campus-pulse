/**
 * login.js
 * Handles:
 * - Session validation
 * - Login flow
 * - Signup flow
 * - UI transitions
 */


// Cards
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

// API
const API = "https://campus-pulse-worker.vindictivity.workers.dev/api"


// Clear errors on input
document.querySelectorAll("input").forEach(input => {
    input.addEventListener("input", clearErrors);
});

// UI navigation
signupButton.addEventListener("click", showSignup);
backButton.addEventListener("click", showLogin);

// Form handlers
loginForm.addEventListener("submit", handleLogin);
signupForm.addEventListener("submit", handleSignup);

// Session check on page load
document.addEventListener("DOMContentLoaded", checkSession);


// Validates stored session token and allows app access
async function checkSession() {
    const token = localStorage.getItem("sessionToken");

    // Invalid token cleanup
    if (!token || token === "undefined" || token === "null") {
        localStorage.removeItem("sessionToken");
        return;
    }

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
        redirect("app.html")
    } catch (err) {
        console.error("Session validation failed:", err);
    }
}

// Handles login form submission
async function handleLogin(event) {
    event.preventDefault();

    // Disable login button to prevent spam
    loginButton.disabled = true;
    loginError.textContent = "";

    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();

    // Prevent empty logins
    if (!username || !password) {
        showError(loginError, "Please enter a username and password");
        loginButton.disabled = false;
        return;
    }

    try {
        // Fetch users
        const endpoint = `${API}/login`
        const response = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password })
        });

        const result = await safeJson(response);

        // Failed to fetch users
        if (!response.ok || !result.token) {
            showError(loginError, result.error || "Login failed");
            loginButton.disabled = false;
            return;
        }

        // Store session token and redirect to app
        localStorage.setItem("sessionToken", result.token);
        redirect("app.html");
    } catch(err) {
        showError(loginError, "Failed to login");
        loginButton.disabled = false;
        console.error(err);
    }
}

// Handles signup form submission
async function handleSignup(event) {
    event.preventDefault();

    // Disable signup button to prevent spam
    signupSubmitButton.disabled = true;
    signupError.textContent = "";

    const username = signupUsername.value.trim();
    const email = signupEmail.value.trim();
    const password = signupPassword.value.trim();

    // Prevent empty signups
    if (!username || !email || !password) {
        showError(signupError, "Please fill out all fields");
        signupSubmitButton.disabled = false;
        return;
    }

    try {
        const endpoint = `${API}/signup`
        const response = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, email, password })
        });

        const result = await safeJson(response);

        // Signup failed
        if (!response.ok || !result.token) {
            showError(signupError, result.error || "Signup failed");
            signupSubmitButton.disabled = false;
            return;
        }

        // Store session token
        localStorage.setItem("sessionToken", result.token);
        redirect("interests.html");
    } catch(err) {
        showError(signupError, "Failed to create account");
        signupSubmitButton.disabled = false;
        console.error(err);
    }
}

// Switch UI to signup card
function showSignup() {
    clearErrors();
    loginCard.classList.remove("active");
    signupCard.classList.add("active");
}

// Switch UI to login card
function showLogin() {
    clearErrors();
    signupCard.classList.remove("active");
    loginCard.classList.add("active");
}

// Clear all visible error messages
function clearErrors() {
    loginError.textContent = "";
    signupError.textContent = "";
}

// Display an error message using a given element
function showError(element, message) {
    element.textContent = message;
}

// Redirect user to a given page
function redirect(path) {
    window.location.assign(path);
}

// Safely parses JSON response
async function safeJson(response) {
    try {
        return await response.json();
    } catch {
        return {};
    }
}
