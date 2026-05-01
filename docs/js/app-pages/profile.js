// Wait until page fully loads


import { API, safeJson, showError } from "../utils.js";


document.addEventListener("DOMContentLoaded", () => {
    // Listen for image uploads
    document.getElementById("pfpUpload")
        .addEventListener("change", previewImage);

    // Listen for username typing
    document.getElementById("username")
        .addEventListener("input", liveUsernameCheck);

    // Allow enter key to save
    document.getElementById("username")
        .addEventListener("keydown", event => {
            if (event.key === "Enter") {
                saveProfile();
            }
        });
});


/* Load Profile Data */
export async function loadProfilePage(userId) {
    const profileContainer = document.getElementById("profile-page-container");
    const profileError = document.getElementById("profile-page-error")
    if (!profileContainer || !userId) return;
    profileContainer.innerHTML = "";

    try {
        const endpoint = `${API}/get-user?id=${userId}`;
        const response = await fetch(endpoint, {
            credentials: "include"
        });

        if (!response.ok) {
            showError(profileError, "Failed to load profile");
            return;
        }

        const user = await safeJson(response);
        renderProfile(user);
    } catch (error) {
        console.error(error);
        showError(profileError, "Failed to load profile");
    }
}


// Render profile page
function renderProfile(user) {
    const container = document.getElementById("profile-page-container");
    if (!container) return;

    const avatar = user.avatar
        ? `https://campus-pulse-worker.vindictivity.workers.dev/assets/${user.avatar}`
        : "assets/images/default-avatar.png";

    const username = user.username || "unknown";
    const interests = user.interests || [];

    container.innerHTML = `
        <div class="profile-card">
            <!-- Avatar -->
            <div class="avatar-section">
                <img src="${avatar}" class="profile-avatar" alt="Avatar">
            </div>
            
            <!-- Header -->
            <div class="profile-header">
                <h1 class="profile-title">@${username}</h1>
                <p class="profile-note">${interests}</p>
            </div>
    `
}


/* Live Image Preview */
function previewImage(event) {
    const file = event.target.files[0];
    if (!file) return;
    // Only allow images
    if (!file.type.startsWith("image/")) {
        alert("Please upload an image file.");
        return;
    }

    // Max file size 5MB
    if (file.size > 5 * 1024 * 1024) {
        alert("Image must be under 5MB.");
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        // Show image preview
        document.getElementById("pfpPreview").src = e.target.result;
    };

    reader.readAsDataURL(file);
}


/* Reserved Usernames */
function isReservedUsername(name) {
    const reserved = [
        "admin",
        "staff",
        "support",
        "official",
        "moderator",
        "csulb",
        "beachpulse"
    ];

    return reserved.includes(
        name.toLowerCase()
    );
}


/* Username Validation */
function isValidUsername(name) {
    const regex = /^[a-zA-Z0-9_]{3,20}$/;
    return regex.test(name);
}


/* Live Username Checker */
function liveUsernameCheck() {
    const username = document.getElementById("username").value.trim();
    const status = document.getElementById("usernameStatus");
    if (!status) return;

    // Empty field
    if (username === "") {
        status.textContent = "Enter a username";
        status.style.color = "#777";
        return;
    }

    // Reserved username
    if (isReservedUsername(username)) {
        status.textContent = "Username is reserved";
        status.style.color = "#dc2626";
        return;
    }

    // Bad format
    if (!isValidUsername(username)) {
        status.textContent = "3-20 letters, numbers, underscores";
        status.style.color = "#dc2626";
        return;
    }

    // Looks good
    status.textContent = "Username available";
    status.style.color = "#16a34a";
}


/* Save Profile */
function saveProfile() {
    const usernameInput = document.getElementById("username");
    const avatar = document.getElementById("pfpPreview");
    let username = usernameInput.value.trim();
    username = username.replace(/\s+/g, "");

    // Empty username check
    if (username === "") {
        alert("Username cannot be empty.");
        return;
    }

    // Reserved username check
    if (isReservedUsername(username)) {
        alert("That username is reserved.");
        return;
    }

    // Format check
    if (!isValidUsername(username)) {
        alert("Username must be 3-20 characters and only use letters, numbers, or underscores.");
        return;
    }

    // Save username
    localStorage.setItem("publicUsername", username);

    // Save profile image
    localStorage.setItem("profilePicture", avatar.src);

    // Update status text
    const status = document.getElementById("usernameStatus");
    if (status) {
        status.textContent = "Profile saved successfully";
        status.style.color = "#16a34a";
    }

    alert("Profile updated successfully.");
}


/* Reset Profile */
function resetProfile() {
    const confirmReset = confirm("Reset profile data?");
    if (!confirmReset) return;
    localStorage.removeItem("publicUsername");
    localStorage.removeItem("profilePicture");
    location.reload();
}