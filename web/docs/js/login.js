/**
 * login.js
 * Handles:
 * - Session validation
 * - Login flow
 * - Signup flow
 * - UI transitions
 */


import { API, checkSession, clearErrors, showError, redirect, safeJson, setLoading, convertToWebP } from "./utils.js";


// Cards
const loginCard = document.getElementById("login-card");
const signupCard = document.getElementById("signup-card");

// Buttons
const outlookButton = document.getElementById("outlook-button");
const signupSubmitButton = document.getElementById("signup-submit-button");

// Errors
const authError = document.getElementById("auth-error");
const signupError = document.getElementById("signup-error");

// Inputs
const avatarPreview = document.getElementById("avatar-preview");
const usernameInput = document.getElementById("username-input");

// Outlook
const msalConfig = {
    auth: {
        clientId: "c066d985-9f9b-45b2-b198-8c4b7147f8bb",
        authority: "https://login.microsoftonline.com/d175679b-acd3-4644-be82-af041982977a",
        redirectUri: window.location.origin + "/campus-pulse/"
    }
};

const msalInstance = new msal.PublicClientApplication(msalConfig);


// DOM ready
document.addEventListener("DOMContentLoaded", async () => {
    // Attach listeners
    init();

    // Handle Microsoft Redirect
    try {
        const response = await msalInstance.handleRedirectPromise();

        if (response) {
            await handleMicrosoftUser(response);
            return;
        }
    } catch (error) {
        console.error("Redirect error:", error);
    }

    // Normal session check
    const isLoggedIn = await checkSession();

    // Smooth exit
    if (isLoggedIn) {
        document.body.classList.add("fade-out");
        setTimeout(() => redirect("app.html"), 300);
        return;
    }

    // Show login page
    showLogin();
});

// Initialize UI
function init() {
    // Clear errors on input
    document.querySelectorAll("input").forEach(input => {
        input.addEventListener("input", () => { clearErrors(authError, signupError) });
    });

    // UI navigation
    signupSubmitButton.addEventListener("click", handleSignupSubmit);
    outlookButton.addEventListener("click", handleOutlookAuth);
    usernameInput.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
            event.preventDefault();
            handleSignupSubmit();
        }
    })

    // Add avatar interaction
    const avatarInput = document.getElementById("avatar-input");

    document.querySelector(".avatar-picker").addEventListener("click", () => {
        avatarInput.click();
    });

    avatarInput.addEventListener("change", async () => {
        const file = avatarInput.files[0];
        if (!file) return;

        const webp = await convertToWebP(file);
        avatarPreview.src = webp;
        window.selectedAvatar = webp;
    });
}

async function handleOutlookAuth(event) {
    setLoading(outlookButton, true);
    document.body.classList.add("fade-out");
    setTimeout(() => {
        msalInstance.loginRedirect({
            scopes: ["User.Read"]
        });
    }, 250);
}

async function handleMicrosoftUser(response) {
    const account = response?.account;

    if (!account || !account.username) {
        showError(authError, "Microsoft login failed");
        return;
    }

    const email = account.username;
    const name = account.name;

    if (name && !usernameInput.value) {
        usernameInput.value = name.toLowerCase().replace(/\s+/g, "").slice(0, 20);
    }
    await set_outlook_avatar(response);

    try {
        const endpoint = `${API}/login`;
        const res = await fetch(endpoint, {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, name })
        });

        const data = await safeJson(res);

        if (!res.ok) {
            showError(authError, data.error || "Login failed");
            return;
        }

        if (data.status === "complete") {
            document.body.classList.add("fade-out");
            setTimeout(() => redirect("app.html"), 300);
        } else if (data.status === "needs_username") {
            showSignup();
        }
    } catch (error) {
        console.error(error);
        showError(authError, "Authentication failed");
    }
}

async function set_outlook_avatar(response) {
    if (!response?.accessToken) return;

    try {
        const photoRes = await fetch(
            "https://graph.microsoft.com/v1.0/me/photo/$value",
            {
                headers: {
                    Authorization: `Bearer ${response.accessToken}`
                }
            }
        );

        if (!photoRes.ok) return;
        const blob = await photoRes.blob();
        const file = new File([blob], "avatar", { type: blob.type });
        const webp = await convertToWebP(file);
        avatarPreview.src = webp;
        window.selectedAvatar = webp;
    } catch (err) {
        console.warn("No profile photo found");
    }
}

async function handleSignupSubmit() {
    const username = usernameInput.value.trim();
    const avatar = window.selectedAvatar;

    clearErrors(signupError);
    setLoading(signupSubmitButton, true);

    // Validation
    if (!username) {
        setLoading(signupSubmitButton, false);
        showError(signupError, "Enter a username");
        return;
    }

    if (!avatar) {
        setLoading(signupSubmitButton, false);
        showError(signupError, "Choose a profile picture");
        return;
    }

    try {
        const endpoint = `${API}/signup`;
        const res = await fetch(endpoint, {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ avatar, username })
        });

        const data = await safeJson(res);

        if (!res.ok) {
            setLoading(signupSubmitButton, false);
            showError(signupError, data.error || "Signup failed");
            return;
        }

        // Success
        document.body.classList.add("fade-out");
        setTimeout(() => redirect("interests.html"), 300);
    } catch (error) {
        console.error(error);
        setLoading(signupSubmitButton, false);
        showError(signupError, "Network error");
    }
}

function showLogin() {
    signupCard.classList.remove("active");
    loginCard.classList.add("active");
}

function showSignup() {
    loginCard.classList.remove("active");
    signupCard.classList.add("active");
}
