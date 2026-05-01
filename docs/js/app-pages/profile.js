// Wait until page fully loads


import { API, safeJson, showError } from "../utils.js";


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
                <p class="profile-note">${interests.join(", ")}</p>
            </div>
        </div>
    `
}

