/**
 * login.js
 * Handles:
 * - Session validation
 * - Login flow
 * - Signup flow
 * - UI transitions
 */


import { API, checkSession, clearErrors, showError, redirect, safeJson, setLoading } from "./utils.js";


// Wrapper
const loginWrapper = document.querySelector(".login-wrapper");

// Forms
const loginForm = document.getElementById("login-form");
const signupForm = document.getElementById("signup-form");

// Buttons
const loginButton = document.getElementById("login-button");
const signupButton = document.getElementById("signup-button");
const signupSubmitButton = document.getElementById("signup-submit-button");
const backButton = document.getElementById("back-button");
const outlookButtons = document.querySelectorAll(".outlook-auth");

// Errors
const loginError = document.getElementById("login-error");
const signupError = document.getElementById("signup-error");

// Inputs
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const signupUsername = document.getElementById("signup-username");
const signupEmail = document.getElementById("signup-email");
const signupPassword = document.getElementById("signup-password");

// Outlook
const msalConfig = {
    auth: {
        clientId: "c066d985-9f9b-45b2-b198-8c4b7147f8bb",
        authority: "https://login.microsoftonline.com/d175679b-acd3-4644-be82-af041982977a",
        redirectUri: window.location.pathname
    }
};

const msalInstance = new msal.PublicClientApplication(msalConfig);

const loginRequest = {
    scopes: ["User.Read"]
};


// DOM ready
document.addEventListener("DOMContentLoaded", async () => {
    const isLoggedIn = await checkSession();

    if (isLoggedIn) {
        // Smooth exit
        document.body.classList.add("fade-out");

        setTimeout(() => {
            redirect("app.html");
        }, 300);
        return;
    }

    // Attach listeners
    init();
});

// Initialize UI
function init() {
    // Clear errors on input
    document.querySelectorAll("input").forEach(input => {
        input.addEventListener("input", () => { clearErrors(loginError, signupError) });
    });

    // UI navigation
    signupButton.addEventListener("click", showSignup);
    backButton.addEventListener("click", showLogin);

    // Form handlers
    loginForm.addEventListener("submit", handleLogin);
    signupForm.addEventListener("submit", handleSignup);
    outlookButtons.forEach(button => {
        button.addEventListener("click", handleOutlookAuth);
    });
}

// Handles login form submission
async function handleLogin(event) {
    event.preventDefault();
    setLoading(loginButton, true);
    clearErrors(loginError, signupError);

    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();

    // Prevent empty logins
    if (!username || !password) {
        showError(loginError, "Please enter a username and password");
        setLoading(loginButton, false);
        return;
    }

    try {
        // Fetch users
        const endpoint = `${API}/login`
        const response = await fetch(endpoint, {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password })
        });

        const result = await safeJson(response);

        // Failed to fetch users
        if (!response.ok) {
            showError(loginError, result.error || "Login failed");
            setLoading(loginButton, false);
            return;
        }

        // Smooth exit
        document.body.classList.add("fade-out");

        setTimeout(() => {
            redirect("app.html");
        }, 300);
    } catch(err) {
        showError(loginError, "Failed to login");
        setLoading(loginButton, false);
        console.error(err);
    }
}

// Handles signup form submission
async function handleSignup(event) {
    event.preventDefault();
    setLoading(signupSubmitButton, true);
    clearErrors(signupError);

    const username = signupUsername.value.trim();
    const email = signupEmail.value.trim();
    const password = signupPassword.value.trim();

    // Prevent empty signups
    if (!username || !email || !password) {
        showError(signupError, "Please fill out all fields");
        setLoading(signupSubmitButton, false);
        return;
    }

    try {
        const endpoint = `${API}/signup`
        const response = await fetch(endpoint, {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, email, password })
        });

        const result = await safeJson(response);

        // Signup failed
        if (!response.ok) {
            showError(signupError, result.error || "Signup failed");
            setLoading(signupSubmitButton, false);
            return;
        }

        // Smooth exit
        document.body.classList.add("fade-out");

        setTimeout(() => {
            redirect("interests.html");
        }, 300);
    } catch(err) {
        showError(signupError, "Failed to create account");
        setLoading(signupSubmitButton, false);
        console.error(err);
    }
}

// Handles Outlook Account Login/Signup
async function handleOutlookAuth() {
    msalInstance.loginRedirect(loginRequest);
}

// Switch UI to signup card
function showSignup() {
    clearErrors(loginError, signupError);
    clearForm(usernameInput, passwordInput);
    loginWrapper.classList.add("flipped");
}

// Switch UI to login card
function showLogin() {
    clearErrors(loginError, signupError);
    clearForm(signupUsername, signupEmail, signupPassword);
    loginWrapper.classList.remove("flipped");
}

// Clear inputs
function clearForm(...inputs) {
    inputs.forEach(input => input.value = "");
}