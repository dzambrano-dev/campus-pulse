/**
 * interests.js
 * Handles loading and saving user interests to KV database
 */


import { API, checkSession, clearErrors, showError, redirect, safeJson, setLoading } from "./utils.js";


// Data members
const interestsError = document.getElementById("interests-error");
const form = document.getElementById("interests-form");
const skipBtn = document.getElementById("skip-interests");


// DOM ready
document.addEventListener("DOMContentLoaded", async () => {
    const isLoggedIn = await checkSession();

    if (!isLoggedIn) {
        // Smooth exit
        document.body.classList.add("fade-out");

        setTimeout(() => {
            redirect("index.html");
        }, 300);
        return;
    }

    init();
    await loadInterests();
});


// Initialize UI
function init() {
    form.addEventListener("submit", submit);
    skipBtn.addEventListener("click", skip);
}

// Generate interest buttons
async function loadInterests() {
    clearErrors(interestsError);

    try {
        // Fetch list of possible interests
        const interestsEndpoint = `${API}/get-interests`
        const interestsResponse = await fetch(interestsEndpoint, {
            credentials: "include"
        });

        const interestsData = await safeJson(interestsResponse);
        const interests = interestsData.interests || [];

        // Fetch current user
        const userEndpoint = `${API}/user`
        const userResponse = await fetch(userEndpoint, {
            credentials: "include"
        });

        // If no user is found, redirect to log in
        if (!userResponse.ok) {
            // Smooth exit
            document.body.classList.add("fade-out");

            setTimeout(() => {
                redirect("index.html");
            }, 300);
            return;
        }

        // Find current user data
        const userData = await safeJson(userResponse);
        const userInterests = userData.interests || [];

        // Generate container
        const container = document.getElementById("interests-list");
        container.innerHTML = "";

        // Create interest buttons
        interests.forEach(interest => {
            const button = document.createElement("button");
            button.type = "button";
            button.textContent = `${toTitleCase(interest)}`;
            button.classList.add("interest-button");

            // Select previously saved interests
            if (userInterests.includes(interest)) {
                button.classList.add("selected");
            }

            // Add a listener to toggle each button
            button.addEventListener("click", () => {
                button.classList.toggle("selected");
            });

            // Append each button to the container
            container.appendChild(button);
        });
    } catch(err) {
        showError(interestsError, "Failed to load interests");
        console.log(err);
    }
}

// Interests form submission
async function submit(event) {
    event.preventDefault();
    clearErrors(interestsError);
    setLoading(form, true);

    // Collect pre-selected interests
    const selectedInterests = [];
    document.querySelectorAll("#interests-list .interest-button.selected").forEach(box => {
        selectedInterests.push(box.textContent.toLowerCase());
    });

    try {
        const endpoint = `${API}/update-interests`
        const response = await fetch(endpoint, {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ interests: selectedInterests })
        });

        const result = await safeJson(response);

        // Server error
        if (!response.ok) {
            showError(interestsError, result.error || "Failed to update interests");
            setLoading(form, false);
            return;
        }

        // Smooth exit
        document.body.classList.add("fade-out");

        setTimeout(() => {
            redirect("app.html");
        }, 300);
    } catch(err) {
        showError(interestsError, "Failed to save interests");
        setLoading(form, false);
        console.error(err);
    }
}

// Skip interest selection
function skip() {
    // Smooth exit
    document.body.classList.add("fade-out");

    setTimeout(() => {
        redirect("app.html");
    }, 300);
}

// Uppercase the first letter of each word
function toTitleCase(str) {
    return str.split(" ").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
}